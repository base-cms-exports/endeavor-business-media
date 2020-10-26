const allPublishedContentQuery = require('./queries/content');
const { downloadImages, zipItUp, uploadToS3 } = require('../utils/image-handler');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveFilterdCompanies } = require('../utils/retrieve-filtered-companies');
const { formatText } = require('../utils/format-text');
const { fuelingSectionIds } = require('../fueling-section-ids');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

module.exports = async ({ apollo }) => {
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);

  // GSW Export: Standard || Description || Descriptiong & Logo
  // 3124773 || 3124774 || 3124775
  // Fueling Export: Standard || Description || Descriptiong & Logo
  // 3124776 || 3124777 || 3124778
  const companies = retrieveFilterdCompanies(allCompanies, fuelingSectionIds);

  companies.sort((a, b) => a.name.localeCompare(b.name));

  const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);
  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const taxonomyIds = [3124776, 3124777, 3124778];
    const companyTaxonomyIds = getTaxonomyIds(c.taxonomy.edges);
    const insert = taxonomyIds.filter(element => companyTaxonomyIds.includes(element));
    if (insert.length === 0) return '';
    const text = [];
    if (companyTaxonomyIds.includes(3124778) && c.primaryImage) {
      text.push(`<ParaStyle:cLogo>${c.primaryImage.source.name}`);
      const imgPath = `http://media.cygnus.com.s3-website-us-east-1.amazonaws.com/${c.primaryImage.filePath}/original/${c.primaryImage.source.name}`;
      if (!companyLogos.includes(imgPath)) companyLogos.push(imgPath);
    }
    text.push(`<ParaStyle:cName>${formatText(c.name)}`);
    if (c.address1) text.push(`<ParaStyle:cAddress>${c.address1}`);
    if (c.address2) text.push(`<ParaStyle:cAddress>${c.address2}`);
    if (c.cityStateZip && c.country) {
      text.push(`<ParaStyle:cAddress>${c.cityStateZip} ${c.country}`);
    } else if (c.cityStateZip) {
      text.push(`<ParaStyle:cAddress>${c.cityStateZip}`);
    }
    if (c.tollfree) text.push(`<ParaStyle:cPhoneNumbers>Phone: ${c.tollfree}`);
    if (c.fax) text.push(`<ParaStyle:cPhoneNumbers>Fax: ${c.fax}`);
    if (c.website) text.push(`<ParaStyle:cWebsite>${c.website}`);
    if (c.email) text.push(`<ParaStyle:cEmail>${c.email}`);
    if (c.body && (companyTaxonomyIds.includes(3124777) || companyTaxonomyIds.includes(3124778))) {
      text.push(`<ParaStyle:cDescription>${formatText(c.body.replace(/(<([^>]+)>)/ig, ''))}`);
    }

    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    ...printContent(companies),
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

    cleanLines.push(`<ParaStyel:LogoDownloadPath>https://base-cms-exports.s3.amazonaws.com/exports/${exportName}`);
  }

  // @todo port special character filter from php
  return cleanLines.join('\n');
};
