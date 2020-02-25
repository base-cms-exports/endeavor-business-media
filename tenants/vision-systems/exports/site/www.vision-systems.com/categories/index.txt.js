const { getAsArray } = require('@base-cms/object-path');
const paginateQuery = require('@endeavor-business-media/common/paginate-query');

const allPublishedContentQuery = require('./queries/content');
const websiteSectionsQuery = require('./queries/sections');
const { downloadImages, zipItUp, uploadToS3 } = require('../image-handler.js');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

const retrieveRootSection = async (client) => {
  const { data: { websiteSectionAlias } } = await client.query({
    query: websiteSectionsQuery,
    variables: { input: { alias: 'directory' } },
  });
  return websiteSectionAlias;
};

const retrieveCompanies = async (apollo) => {
  const promise = await paginateQuery({
    client: apollo,
    query: allPublishedContentQuery,
    variables: { input: { includeContentTypes: 'Company', pagination: { limit: 250 } } },
    cursorPath: 'input.pagination.after',
    rootValue: 'allPublishedContent',
  });

  const now = Date.now().valueOf();
  return promise.map((company) => {
    const sectionIds = getAsArray(company, 'websiteSchedules')
      .filter(({ start, end }) => start < now && (!end || end > now))
      .map(({ section }) => section.id);
    return { ...company, sectionIds };
  });
};

const mapHierarchy = (sections, companies) => sections.reduce((arr, section) => {
  const childNodes = getAsArray(section, 'children.edges').map(({ node }) => node);
  const children = childNodes.length ? mapHierarchy(childNodes, companies) : [];
  return [
    ...arr,
    {
      ...section,
      children,
      content: companies
        .filter(({ sectionIds }) => sectionIds.includes(section.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
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
 * <style=Catsubhead1> Father Category Name <hard return>
 * <style=Catsubhead2> Lowest Category Name <hard return>
 * <style=CatCoName> Company Name <hard return>
 *
 * If statements:
 * If no companies assigned to category, do not output category name
 * If logo assigned to company for that category only, output logo above company name <style=Logo>
 * If display ad assigned to company, output text <style=AdReference> ‘(see ad p ‘ (don’t forget
 *  extra space) <hard return>
 * If logo and display ad assigned, then output both
 * Use new style sheets for companies with ads and logos: <style=CatCoNameLogo>, <style=CatCoNameAd>
 *  , <style=CatCoNameLogoAd>, etc.
 * Entries with ads and logos should have an extra line above and below <style=WhiteSpaceStart> and
 *  <style=WhiteSpaceEnd> to designate the space as “ad space” We would then need to run a script in
 *  InDesign to measure the percentage of page space that listing occupies and calculate the ad-to
 *  -editorial ratio that is a post office requirement and can affect the cost of mailing the issue.
 *
 * Samples
 * 2019_VSD_Cats.pdf = sample PDF of complete InDesign page
 * VSD_Categories.txt = marked up/tagged texted file used for InDesign placement
 * VSD_Categories.xslt = XSLT or template file applied to XML output of data used to produce file
 *
 */
module.exports = async ({ apollo }) => {
  const rootSection = await retrieveRootSection(apollo);
  const sections = getAsArray(rootSection, 'children.edges').map(({ node }) => node);
  const companies = await retrieveCompanies(apollo);

  // Get the top-level sections and map companies into them
  const segments = await mapHierarchy(sections, companies);

  const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    const taxonomyIds = getTaxonomyIds(c.taxonomy.edges);
    let appendedStyleText = '';
    // if the Directory Export: Logo Bin is set
    if (taxonomyIds.includes(2024375)) {
      appendedStyleText = `${appendedStyleText}Logo`;
    }
    // if the Directory Export: Ad Bin is set
    if (taxonomyIds.includes(2024376)) {
      appendedStyleText = `${appendedStyleText}Ad`;
    }
    if (appendedStyleText !== '') text.push('<ParaStyle:WhiteSpaceStart>');
    text.push(`<ParaStyle:CatCoName${appendedStyleText}>${c.name}`);
    if (taxonomyIds.includes(2024375) && c.primaryImage !== null) {
      text.push(`<ParaStyle:${appendedStyleText}>${c.primaryImage.source.name}`);
      companyLogos.push(`https://cdn.baseplatform.io/${c.primaryImage.filePath}/${c.primaryImage.source.name}`);
      if (appendedStyleText !== '') text.push('<ParaStyle:WhiteSpaceEnd>');
    }
    // let { country } = c;
    // if (country.toLowerCase() === 'united states') country = '';
    // if (country.toLowerCase() !== 'united kingdom') country = 'UK';
    // text.push(`<ParaStyle:CatCoAddress>${c.city}, ${country}; ${c.website}`);
    return text.join('\n');
  });

  // The big kahuna. Expands children and content into the accumulator (arr)
  const printSection = (arr, { name, children, content }) => [
    ...arr,
    // Only include categories if they have content or children
    ...(content.length || children.length ? [
      `<ParaStyle:Catsubhead${children.length ? 1 : 2}>${name}`,
      ...printContent(content),
      ...children.reduce(printSection, []),
    ] : []),
  ];

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
