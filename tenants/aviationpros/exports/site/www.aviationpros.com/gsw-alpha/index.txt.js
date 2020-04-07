const allPublishedContentQuery = require('./queries/content');
const { downloadImages, zipItUp, uploadToS3 } = require('../utils/image-handler');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveFilterdCompanies } = require('../utils/retrieve-filtered-companies');
const { formatText } = require('../utils/format-text');
const { gswSectionIds } = require('../gsw-section-ids');
const { fuelingSectionIds } = require('../fueling-section-ids');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

module.exports = async ({ apollo }) => {
  const sectionsIds = gswSectionIds.concat(fuelingSectionIds);
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);

  // GSW Export: Standard || Description || Descriptiong & Logo
  // 3124773 || 3124774 || 3124775
  // Fueling Export: Standard || Description || Descriptiong & Logo
  // 3124776 || 3124777 || 3124778
  const companies = retrieveFilterdCompanies(allCompanies, sectionsIds);

  companies.sort((a, b) => a.name.localeCompare(b.name));

  const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);
  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const taxonomyIds = [3124773, 3124774, 3124775, 3124776, 3124777, 3124778];
    const companyTaxonomyIds = getTaxonomyIds(c.taxonomy.edges);
    const insert = taxonomyIds.filter(element => companyTaxonomyIds.includes(element));
    if (insert.length === 0) return '';
    const text = [];
    if (
      (companyTaxonomyIds.includes(3124775) || companyTaxonomyIds.includes(3124778))
      && c.primaryImage
    ) {
      text.push(`<ParaStyle:cLogo>${c.primaryImage.source.name}`);
      const imgPath = `https://cdn.baseplatform.io/${c.primaryImage.filePath}/${c.primaryImage.source.name}`;
      if (!companyLogos.includes(imgPath)) companyLogos.push(imgPath);
      text.push(`<ParaStyle:cDescription>${formatText(c.body)}`);
    }
    if (companyTaxonomyIds.includes(3124774) || companyTaxonomyIds.includes(3124777)) {
      text.push(`<ParaStyle:cDescription>${formatText(c.body)}`);
    }
    text.push(`<ParaStyle:cName>${formatText(c.name)}`);
    if (c.cityStateZip) text.push(`<ParaStyle:cAddress>${c.cityStateZip} ${c.country}`);
    if (c.phone) text.push(`<ParaStyle:cPhone>${c.phone}`);
    // text.push(`<ParaStyle:cAddress>${c.fax}`);
    if (c.email) text.push(`<ParaStyle:cEmail>${c.email}`);
    if (c.website) text.push(`<ParaStyle:cWebsite>${c.website}`);

    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    ...printContent(companies),
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
