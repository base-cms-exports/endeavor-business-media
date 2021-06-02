const allPublishedCopanyContentQuery = require('./queries/company');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { formatText } = require('../utils/format-text');


let currentLetter = '#';
module.exports = async ({ apollo }) => {
  const companies = await retrieveCompanies(apollo, allPublishedCopanyContentQuery);

  companies.sort((a, b) => a.name.localeCompare(b.name));

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    const companyLetter = c.name.substr(0, 1);
    if (currentLetter !== companyLetter) {
      const regex = /[^A-Z]/g;
      companyLetter.match(regex);
      if (currentLetter.toUpperCase() !== companyLetter.toUpperCase()) {
        if (!companyLetter.match(regex)) {
          currentLetter = companyLetter;
          text.push(`<ParaStyle:cLetter>${currentLetter}`);
        }
      }
    }
    text.push(`<ParaStyle:cName>${formatText(c.name)}`);
    if (c.boothNumber) text.push(`<ParaStyle:cBoothNumber>${formatText(c.boothNumber)}`);
    if (c.address1) text.push(`<ParaStyle:cAddress>${c.address1}`);
    if (c.address2) text.push(`<ParaStyle:cAddress>${c.address2}`);
    if (c.cityStateZip && c.country && !['us', 'united states', 'usa'].includes(c.country.toLowerCase())) {
      text.push(`<ParaStyle:cAddress>${c.cityStateZip} ${c.country}`);
    } else if (c.cityStateZip) {
      text.push(`<ParaStyle:cAddress>${c.cityStateZip}`);
    }
    if (c.phone) text.push(`<ParaStyle:cPhoneNumbers>P ${c.phone}`);
    if (c.tollfree) text.push(`<ParaStyle:cPhoneNumbers>TFP: ${c.tollfree}`);
    // if (c.fax) text.push(`<ParaStyle:cPhoneNumbers>Fax: ${c.fax}`);
    if (c.publicEmail) text.push(`<ParaStyle:cEmail>E ${c.publicEmail}`);
    if (c.website) text.push(`<ParaStyle:cWebsite>W ${c.website}`);
    if (c.teaser) text.push(`<ParaStyle:cDescription>${c.teaser}`);
    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    '<ParaStyle:cLetter>123',
    ...printContent(companies),
  ];
  const cleanLines = lines.filter(e => e);

  // @todo port special character filter from php
  return cleanLines.join('\n');
};
