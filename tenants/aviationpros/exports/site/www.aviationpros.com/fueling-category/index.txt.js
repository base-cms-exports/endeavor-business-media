const allPublishedContentQuery = require('./queries/content');
const websiteSectionsQuery = require('./queries/sections');
const { retrieveSectionsByIds } = require('../utils/retrieve-sections-by-ids');
const { downloadImages, zipItUp, uploadToS3 } = require('../utils/image-handler');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { formatText } = require('../utils/format-text');
const { fuelingSectionIds } = require('../fueling-section-ids');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

const mapHierarchy = (sections, companies) => sections.reduce((arr, section) => [
  ...arr,
  {
    ...section,
    content: companies
      .filter(({ sectionIds }) => sectionIds.includes(section.id))
      .sort((a, b) => a.name.localeCompare(b.name)),
  },
], []).sort((a, b) => a.name.localeCompare(b.name));

module.exports = async ({ apollo }) => {
  // This will return the section for Fueling
  const fuelSections = await retrieveSectionsByIds(apollo, websiteSectionsQuery, fuelingSectionIds);
  // Get all companies scheduled to the site
  const companies = await retrieveCompanies(apollo, allPublishedContentQuery);

  // // Get the sections and map companies into them
  const fuelingSegments = await mapHierarchy(fuelSections, companies);

  const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);
  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const taxonomyIds = [3124776, 3124777, 3124778];
    const companyTaxonomyIds = getTaxonomyIds(c.taxonomy.edges);
    const insert = taxonomyIds.filter(element => companyTaxonomyIds.includes(element));
    if (insert.length === 0) return '';
    const text = [];
    text.push(`<ParaStyle:cName>${formatText(c.name)}`);
    return text.join('\n');
  });

  // The big kahuna. Loop over Sections and content into the accumulator (arr)
  const printSection = (arr, { name, content }) => [
    ...arr,
    // Only include categories if they have content
    ...(content.length ? [
      `<ParaStyle:cCategoryName>${name}`,
      ...printContent(content),
    ] : []),
  ];

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    ...fuelingSegments.reduce(printSection, []),
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
