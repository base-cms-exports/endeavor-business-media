const { getAsArray } = require('@base-cms/object-path');
const allPublishedContentQuery = require('./queries/content');
const websiteSectionsQuery = require('./queries/sections');
const { downloadImages, zipItUp, uploadToS3 } = require('../utils/image-handler');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveRootSection } = require('../utils/retrieve-root-section');
const { retrieveFilterdCompanies } = require('../utils/retrieve-filtered-companies');
const { formatText } = require('../utils/format-text');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

const mapHierarchy = (sections, companies) => sections.reduce((arr, section) => {
  const childNodes = getAsArray(section, 'children.edges').map(({ node }) => node);
  const children = childNodes.length ? mapHierarchy(childNodes, companies) : [];
  return [
    ...arr,
    {
      ...section,
      children,
      content: companies
        .filter(({ sectionIds }) => sectionIds.includes(section.id)),
    },
  ];
}, []).sort((a, b) => a.fullName.localeCompare(b.fullName));

/**
 * File 1 – Categories:
 * Sort all companies assigned to category alphabetically
 * Companies sorted by sort name field which was not imported into Base in original import
 * Spacing with hidden font stylesheets were added as needed to control output,
 *   keep settings and output in InDesign
 * Not sure how ad cross-reference will work with Base
 *
 * Output:
 * <style=CatSubhead1> Father Category Name <hard return>
 * <style=CatSubhead2> Lowest Category Name <hard return>
 * <style=Name> Company Name <hard return>
 *
 *
 */
module.exports = async ({ apollo }) => {
  // This will return the direct decents of the /directory section.
  const rootSection = await retrieveRootSection(apollo, websiteSectionsQuery, 'directory');
  const sections = getAsArray(rootSection, 'children.edges').map(({ node }) => node);

  // Get all companies scheduled to the site after Feb. 15 2018
  // Date is set in retrieveCompanies function
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);
  // Filter companies to only ones scheduled to /directory or below
  const companies = retrieveFilterdCompanies(allCompanies, rootSection);
  // Get the top-level sections and map companies into them
  const segments = await mapHierarchy(sections, companies);

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    text.push(`<ParaStyle:Name>${formatText(c.name)}`);

    return text.join('\n');
  });

  // The big kahuna. Expands children and content into the accumulator (arr)
  const printSection = (arr, {
    name,
    fullName,
    children,
    content,
  }) => {
    const level = ((fullName.match(/ > /g) || []).length > 1)
      ? `Subhead${(fullName.match(/ > /g) || []).length - 1}`
      : '';

    return [
      ...arr,
      // Only include categories if they have content or children
      ...(content.length || children.length ? [
        `<ParaStyle:Cat${level}>${name}`,
        ...printContent(content),
        ...children.reduce(printSection, []),
      ] : []),
    ];
  };

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    ...segments.reduce(printSection, []),
  ];

  if (companyLogos.length !== 0) {
    const tmpDir = `${__dirname}/tmp`;
    // Tempararly download all logs for zipping up.
    await downloadImages(`${tmpDir}/images`, companyLogos);
    // Zip up all logos required for export
    await zipItUp(`${tmpDir}/images`, tmpDir, exportName);
    // push a tmp zip file of image to the S3 server
    uploadToS3('base-cms-exports', 'exports', `${tmpDir}/${exportName}`);

    lines.push(`<ParaStyel:LogoDownloadPath>https://base-cms-exports.s3.amazonaws.com/exports/${exportName}`);
  }
  // @todo port special character filter from php
  return lines.join('\n');
};
