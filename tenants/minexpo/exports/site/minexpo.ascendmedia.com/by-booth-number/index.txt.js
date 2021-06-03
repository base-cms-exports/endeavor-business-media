const allPublishedCopanyContentQuery = require('./queries/company');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { formatText } = require('../utils/format-text');

module.exports = async ({ apollo }) => {
  const companies = await retrieveCompanies(apollo, allPublishedCopanyContentQuery);
  const companiesByBooth = [];
  companies.forEach((company) => {
    if (company.boothNumber) {
      const booths = company.boothNumber.split(',');
      booths.forEach((booth) => {
        companiesByBooth.push({ ...company, boothNumber: booth.trim() });
      });
    }
  });

  companiesByBooth.sort((a, b) => a.boothNumber.localeCompare(b.boothNumber));

  const alphaCompanies = companiesByBooth.filter(company => /^[a-zA-Z]/.test(company.boothNumber));
  const nuumberCompanies = companiesByBooth.filter(company => /^[0-9]/.test(company.boothNumber));

  const orederedCompanies = alphaCompanies.concat(nuumberCompanies);


  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    // const companyLetter = c.name.substr(0, 1);
    // if (currentLetter !== companyLetter) {
    //   const regex = /[^A-Z]/g;
    //   companyLetter.match(regex);
    //   if (currentLetter.toUpperCase() !== companyLetter.toUpperCase()) {
    //     if (!companyLetter.match(regex)) {
    //       currentLetter = companyLetter;
    //       text.push(`<ParaStyle:cLetter>${currentLetter}`);
    //     }
    //   }
    // }
    text.push(`<ParaStyle:cBoothNumber>${formatText(c.boothNumber)}`);
    text.push(`<ParaStyle:cName>${formatText(c.name)}`);
    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    // '<ParaStyle:cLetter>123',
    ...printContent(Object.values(orederedCompanies)),
  ];
  const cleanLines = lines.filter(e => e);

  // @todo port special character filter from php
  return cleanLines.join('\n');
};
