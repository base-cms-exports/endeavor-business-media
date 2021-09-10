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
        const id = booth.trim().split('-')[0];
        companiesByBooth.push({ ...company, boothNumber: booth, boothId: id });
      });
    }
  });

  companiesByBooth.sort((a, b) => a.boothId.padStart(10, '0').localeCompare(b.boothId.padStart(10, '0')));

  // const alphaCompanies = companiesByBooth.filter(company => /^[a-zA-Z]/.test(company.boothId));
  // const nuumberCompanies = companiesByBooth.filter(company => /^[0-9]/.test(company.boothId));

  // const orederedCompanies = alphaCompanies.concat(nuumberCompanies);


  // Wrap content in paragraph style
  let boothNumberHeader = 500;
  const printContent = arr => arr.map((c) => {
    const text = [];
    if (c.boothId > boothNumberHeader) {
      text.push(`<ParaStyle:BoothHead>${boothNumberHeader}`);
      boothNumberHeader += 500;
    }
    text.push(`<ParaStyle:ByBooth>${formatText(c.boothNumber)}\t${formatText(c.name)}`);
    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    // '<ParaStyle:cLetter>123',
    ...printContent(Object.values(companiesByBooth)),
  ];
  const cleanLines = lines.filter(e => e);

  // @todo port special character filter from php
  return cleanLines.join('\n');
};
