const stripTags = require('striptags');
const allPublishedCopanyContentQuery = require('./queries/company');
const { downloadImages, zipItUp } = require('../utils/image-handler');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { formatText } = require('../utils/format-text');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

let currentLetter = '#';
module.exports = async ({ apollo }) => {
  const companies = await retrieveCompanies(apollo, allPublishedCopanyContentQuery);

  companies.sort((a, b) => a.name.localeCompare(b.name));

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c, index) => {
    const text = [];
    const companyLetter = c.name.substr(0, 1);
    if (currentLetter !== companyLetter) {
      const regex = /[^A-Z]/g;
      companyLetter.match(regex);
      if (currentLetter.toUpperCase() !== companyLetter.toUpperCase()) {
        if (!companyLetter.match(regex)) {
          currentLetter = companyLetter;
          text.push(`<ParaStyle:AlphaHead>${currentLetter}`);
        }
      }
    }

    const accountType = (c.primarImage) ? 'Acct_logo' : 'Acct';
    if (c.primaryImage) {
      text.push(`@${c.primaryImage.source.name}@`);
      const imgPath = `https://cdn.base.parameter1.com/${c.primaryImage.filePath}/original/${c.primaryImage.source.name}`;
      if (!companyLogos.includes(imgPath)) companyLogos.push(imgPath);
    }
    if (c.boothNumber) {
      const strBooths = c.boothNumber.split(',');
      const cleanBooths = strBooths.map(n => n.trim());
      text.push(`<ParaStyle:Co>${formatText(c.name)}\t${cleanBooths.join(', ')}`);
    } else {
      text.push(`<ParaStyle:Co>${formatText(c.name)}`);
    }
    if (c.address1) text.push(`<ParaStyle:Add>${formatText(c.address1)}`);
    if (c.address2) text.push(`<ParaStyle:Add>${formatText(c.address2)}`);
    if (c.cityStateZip && c.country && !['us', 'united states', 'usa'].includes(c.country.toLowerCase())) {
      text.push(`<ParaStyle:Add>${formatText(c.cityStateZip)} ${formatText(c.country)}`);
    } else if (c.cityStateZip) {
      text.push(`<ParaStyle:Add>${formatText(c.cityStateZip)}`);
    }
    if (c.phone) text.push(`<ParaStyle:PhoneWeb>p ${c.phone}`);
    if (c.tollfree) text.push(`<ParaStyle:PhoneWeb>p ${c.tollfree}`);
    // if (c.fax) text.push(`<ParaStyle:PhoneWeb>Fax: ${c.fax}`);
    if (c.website) text.push(`<ParaStyle:PhoneWeb>w ${c.website.replace('https://', '').replace('http://', '')}`);
    if (c.body) {
      text.push(`<ParaStyle:Desc>${formatText(stripTags(c.body))}`);
    }
    if (c.publicEmail) text.push(`<ParaStyle:Desc>e ${c.publicEmail}`);
    text.push(`<ParaStyle:${accountType}>${index + 1}`);
    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    '<ParaStyle:AlphaHead>123',
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
    // uploadToS3('base-cms-exports', 'exports', `${tmpDir}/${exportName}`);

    // cleanLines.push(`<ParaStyel:LogoDownloadPath>https://base-cms-exports.s3.amazonaws.com/exports/${exportName}`);
  }

  // @todo port special character filter from php
  return cleanLines.join('\n');
};
