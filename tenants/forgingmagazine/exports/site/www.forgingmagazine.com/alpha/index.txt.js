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

  const getFormatedAddressInfo = (c) => {
    const paraStyle = '<ParaStyle:Address>';
    let info = paraStyle;
    if (c.address1) info = `${info}${c.address1}`;
    if (c.address2) info = `${info}, ${c.address2}`;
    if (c.cityStateZip && info !== paraStyle) {
      info = `${info}, ${c.cityStateZip}`;
    } else if (c.cityStateZip) {
      info = `${info}${c.cityStateZip}`;
    }
    return formatText(info.trim().trim(','));
  };

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];

    text.push(`<ParaStyle:Name>${formatText(c.name)}`);
    const info = getFormatedAddressInfo(c);
    if (info) text.push(info);
    let contactInfo = '';
    if (c.phone) contactInfo = `<ParaStyle:ContactInfo>Tel: ${c.phone}`;
    if (c.fax) {
      contactInfo = (contactInfo === '') ? `<ParaStyle:ContactInfo>Fax: ${c.fax}` : `${contactInfo} , Fax: ${c.fax}`;
    }
    if (contactInfo !== '') text.push(contactInfo);

    contactInfo = '';
    if (c.email) contactInfo = `<ParaStyle:ContactInfo>${c.email}`;
    if (c.website) {
      contactInfo = (contactInfo === '') ? `<ParaStyle:ContactInfo> ${c.website.replace('https://', '').replace('http://', '')}` : `${contactInfo} , ${c.website.replace('https://', '').replace('http://', '')}`;
    }
    if (contactInfo !== '') text.push(contactInfo);
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
