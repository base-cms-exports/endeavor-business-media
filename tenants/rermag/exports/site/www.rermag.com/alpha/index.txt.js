const allPublishedContentQuery = require('./queries/content');
const websiteSectionsQuery = require('./queries/sections');
const { downloadImages, zipItUp, uploadToS3 } = require('../utils/image-handler');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveRootSection } = require('../utils/retrieve-root-section');
const { retrieveFilterdCompanies } = require('../utils/retrieve-filtered-companies');
const { formatText } = require('../utils/format-text');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

module.exports = async ({ apollo }) => {
  // This will return the direct decents of the /directory section.
  const rootSection = await retrieveRootSection(apollo, websiteSectionsQuery, 'directory');
  // Get all companies scheduled to the site after Feb. 15 2018
  // Date is set in retrieveCompanies function
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);
  // Filter companies to only ones scheduled to /directory or below
  const companies = retrieveFilterdCompanies(allCompanies, rootSection);
  // Sort them alpha numerically
  companies.sort((a, b) => a.name.localeCompare(b.name));

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    if (c.primaryImage) {
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
    if (c.phone) text.push(`<ParaStyle:cPhone>Phone: ${c.phone}`);
    if (c.fax) text.push(`<ParaStyle:cFax>Fax: ${c.fax}`);
    if (c.website) text.push(`<ParaStyle:cWebsite>${c.website}`);
    if (c.email) text.push(`<ParaStyle:cEmail>${c.email}`);
    if (c.salesContacts.length) {
      c.salesContacts.forEach((contacts) => {
        text.push(`<ParaStyle:cSalesContacts>${contacts.name}`);
      });
    }
    if (c.body) text.push(`<ParaStyle:cDescription>${formatText(c.body.replace(/(<([^>]+)>)/ig, ''))}`);
    if (c.notes) text.push(`<ParaStyle:cNotes>${formatText(c.notes.replace(/(<([^>]+)>)/ig, ''))}`);

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
