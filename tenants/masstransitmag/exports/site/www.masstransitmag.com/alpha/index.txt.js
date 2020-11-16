const allPublishedCopanyContentQuery = require('./queries/company');
const allPublishedProductContentQuery = require('./queries/product');
// const allCompanyProductContentQuery = require('./queries/company-products');
const { downloadImages, zipItUp, uploadToS3 } = require('../utils/image-handler');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveProducts } = require('../utils/retrieve-products');
// const { retrieveCompanyProducts } = require('../utils/retrieve-company-products');
const { retrieveFilterdCompanies } = require('../utils/retrieve-filtered-companies');
const { retrieveFilterdProducts } = require('../utils/retrieve-filtered-products');
const { formatText } = require('../utils/format-text');
const { massSectionIds } = require('../section-ids');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

module.exports = async ({ apollo }) => {
  const allCompanies = await retrieveCompanies(apollo, allPublishedCopanyContentQuery);
  const allProducts = await retrieveProducts(apollo, allPublishedProductContentQuery);

  const companies = retrieveFilterdCompanies(allCompanies, massSectionIds);
  const products = retrieveFilterdProducts(allProducts);

  companies.sort((a, b) => a.name.localeCompare(b.name));

  const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);
  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const companyTaxonomyIds = c.taxonomyIds;
    const text = [];
    // eslint-disable-next-line max-len
    if (companyTaxonomyIds.includes(3129131) || companyTaxonomyIds.includes(3129132) || companyTaxonomyIds.includes(3129133)) {
      if (c.primaryImage) {
        text.push(`<ParaStyle:cLogo>${c.primaryImage.source.name}`);
        const imgPath = `http://media.cygnus.com.s3-website-us-east-1.amazonaws.com/${c.primaryImage.filePath}/original/${c.primaryImage.source.name}`;
        if (!companyLogos.includes(imgPath)) companyLogos.push(imgPath);
      }
      if (c.teaser) text.push(`<ParaStyle:cDescription>${c.teaser}`);
    }
    text.push(`<ParaStyle:cName>${formatText(c.name)}`);
    if (c.address1) text.push(`<ParaStyle:cAddress>${c.address1}`);
    if (c.address2) text.push(`<ParaStyle:cAddress>${c.address2}`);
    if (c.cityStateZip && c.country) {
      text.push(`<ParaStyle:cAddress>${c.cityStateZip} ${c.country}`);
    } else if (c.cityStateZip) {
      text.push(`<ParaStyle:cAddress>${c.cityStateZip}`);
    }
    if (c.phone) text.push(`<ParaStyle:cPhoneNumbers>Phone: ${c.phone}`);
    if (c.tollfree) text.push(`<ParaStyle:cPhoneNumbers>Tollfree: ${c.tollfree}`);
    if (c.fax) text.push(`<ParaStyle:cPhoneNumbers>Fax: ${c.fax}`);
    if (c.publicEmail) text.push(`<ParaStyle:cEmail>${c.publicEmail}`);
    if (c.website) text.push(`<ParaStyle:cWebsite>${c.website}`);
    if (companyTaxonomyIds.includes(3129132) || companyTaxonomyIds.includes(3129133)) {
      products.forEach((product) => {
        console.log(c.id, product.company.id);
        if (product.company.id === c.id) {
          text.push(`<ParaStyle:cProductName>${product.name}`);
        }
      });
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
    zipItUp(`${tmpDir}/images`, tmpDir, exportName);
    // push a tmp zip file of image to the S3 server
    uploadToS3('base-cms-exports', 'exports', `${tmpDir}/${exportName}`);

    cleanLines.push(`<ParaStyel:LogoDownloadPath>https://base-cms-exports.s3.amazonaws.com/exports/${exportName}`);
  }

  // @todo port special character filter from php
  return cleanLines.join('\n');
};
