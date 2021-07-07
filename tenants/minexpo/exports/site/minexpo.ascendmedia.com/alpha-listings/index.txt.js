const allPublishedCopanyContentQuery = require('./queries/company');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { formatText } = require('../utils/format-text');


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
    if (c.primarImage) text.push(`<ParaStyle:Logo>${c.primaryImage.source.name}`);
    if (c.boothNumber) {
      text.push(`<ParaStyle:Co>${formatText(c.name)} \t ${formatText(c.boothNumber)}`);
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
    if (c.phone) text.push(`<ParaStyle:PhoneWeb>P ${c.phone}`);
    if (c.tollfree) text.push(`<ParaStyle:PhoneWeb>TFP: ${c.tollfree}`);
    // if (c.fax) text.push(`<ParaStyle:PhoneWeb>Fax: ${c.fax}`);
    if (c.website) text.push(`<ParaStyle:PhoneWeb>W ${c.website}`);
    if (c.body) {
      text.push(`<ParaStyle:Desc>${formatText(c.body)}`);
    }
    if (c.publicEmail) text.push(`<ParaStyle:Desc>E ${c.publicEmail}`);
    text.push(`<ParaStyle:${accountType}>${index + 1}`);
    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    '<ParaStyle:AlphaHead>123',
    ...printContent(companies),
  ];
  const cleanLines = lines.filter(e => e);

  // @todo port special character filter from php
  return cleanLines.join('\n');
};
