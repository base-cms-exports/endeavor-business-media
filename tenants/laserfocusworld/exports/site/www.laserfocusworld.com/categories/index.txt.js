const { getAsArray } = require('@base-cms/object-path');
const allPublishedContentQuery = require('./queries/content');
const websiteSectionsQuery = require('./queries/sections');
const { downloadImages, zipItUp, uploadToS3 } = require('../utils/image-handler');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveRootSection } = require('../utils/retrieve-root-section');
const { retrieveFilterdCompanies } = require('../utils/retrieve-filtered-companies');
const { formatText } = require('../utils/format-text');
// const { formatText } = require('../utils/format-text');

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
        .filter(({ sectionIds }) => sectionIds.includes(section.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    },
  ];
}, []).sort((a, b) => a.name.localeCompare(b.name));

module.exports = async ({ apollo }) => {
  // This will return the direct decents of the /directory section.
  const rootSection = await retrieveRootSection(apollo, websiteSectionsQuery, 'directory');
  const fatherSections = getAsArray(rootSection, 'children.edges').map(({ node }) => node);
  const sections = [];
  fatherSections.forEach((s) => {
    const tempSection = getAsArray(s, 'children.edges').map(({ node }) => node);
    sections.push(...tempSection);
  });
  // const sections = getAsArray(rootSection, 'children.edges').map(({ node }) => node);
  const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);
  // Date is set in retrieveCompanies function
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);
  // filter out “Bin: legacyStatus:inactive” or “Bin: legacyState:notApproved”
  const excludedNonActiveCompanies = allCompanies.filter(({ taxonomy }) => {
    const taxonomyIds = getTaxonomyIds(taxonomy.edges);
    return !taxonomyIds.includes(2023946) && !taxonomyIds.includes(2023952);
  });
  // Filter companies to only ones scheduled to /directory or below
  const companies = retrieveFilterdCompanies(excludedNonActiveCompanies, rootSection);
  // Get the top-level sections and map companies into them
  const segments = await mapHierarchy(sections, companies);

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    const taxonomyIds = getTaxonomyIds(c.taxonomy.edges);

    let appendedStyleText = '';
    // if the Directory Export: Logo Bin is set
    if (taxonomyIds.includes(2024381)) appendedStyleText = `${appendedStyleText}Logo`;
    // if the Directory Export: Ad Bin is set
    if (taxonomyIds.includes(2024382)) appendedStyleText = `${appendedStyleText}Ad`;
    if (taxonomyIds.includes(2024381) && c.primaryImage !== null) {
      text.push(`<ParaStyle:Cat${appendedStyleText}>${c.primaryImage.source.name}`);
      const imgPath = `http://media.cygnus.com.s3-website-us-east-1.amazonaws.com/${c.primaryImage.filePath}/original/${c.primaryImage.source.name}`;
      if (!companyLogos.includes(imgPath)) companyLogos.push(imgPath);
    }
    // text.push(`<ParaStyle:CatCoName${appendedStyleText}>${c.name}`);
    let info = '';
    if (c.city) info = formatText(c.city);
    if (c.state) {
      if (info !== '') {
        info = `${info}, ${formatText(c.state)}`;
      } else info = formatText(c.state);
    }
    if (c.country) {
      switch (c.country) {
        case 'United States':
          info = `${info.trim()}, USA`;
          break;
        case 'United Kingdom':
          info = `${info.trim()}, UK`;
          break;
        default:
          info = `${info.trim()}, ${formatText(c.country)}`;
          break;
      }
    }
    if (c.email && taxonomyIds.includes(2024382)) info = `${info.trim()}, ${c.email}`;
    if (c.website && taxonomyIds.includes(2024382)) info = `${info.trim()}, ${c.website.replace('https://', '').replace('http://', '')}`;
    text.push(`<ParaStyle:CatCoName${appendedStyleText}>${formatText(c.name)}`);
    text.push(`<ParaStyle:CatCoAddress${appendedStyleText}>${info.trimEnd(', ').trimEnd(',')}`);
    if (taxonomyIds.includes(2024382)) text.push(`<ParaStyle:AdReference>See ad pAd_Ref_${c.id}`);
    return (text.length !== 0) ? text.join('\n') : '';
  });

  // The big kahuna. Expands children and content into the accumulator (arr)
  const printSection = (arr, {
    name,
    children,
    content,
    parent,
  }) => [
    ...arr,
    // Only include categories if they have content or children
    ...(content.length || children.length ? [
      `<ParaStyle:Catsubhead${parent ? 2 : 1}>${name}`,
      ...printContent(content),
      ...children.reduce(printSection, []),
    ] : []),
  ];

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    ...segments.reduce(printSection, []),
  ];
  const cleanLines = lines.filter(e => e);
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
  return cleanLines.join('\n');
};
