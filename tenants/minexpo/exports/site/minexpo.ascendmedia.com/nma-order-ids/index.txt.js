const allPublishedCopanyContentQuery = require('./queries/company');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { formatText } = require('../utils/format-text');

module.exports = async ({ apollo }) => {
  const companies = await retrieveCompanies(apollo, allPublishedCopanyContentQuery);

  companies.sort((a, b) => a.nmaOrder.padStart(6, '0').localeCompare(b.nmaOrder.padStart(6, '0')));

  // const alphaCompanies = companiesByBooth.filter(company => /^[a-zA-Z]/.test(company.boothId));
  // const nuumberCompanies = companiesByBooth.filter(company => /^[0-9]/.test(company.boothId));

  // const orederedCompanies = alphaCompanies.concat(nuumberCompanies);


  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    text.push(`${formatText(c.nmaOrder)} \t ${c.id} \t ${formatText(c.name)}`);
    return text.join('\n');
  });

  const lines = [
    // '<ASCII-MAC>', // @todo detect and/or make query a param
    // '<ParaStyle:cLetter>123',
    ...printContent(Object.values(companies)),
  ];
  const cleanLines = lines.filter(e => e);

  // @todo port special character filter from php
  return cleanLines.join('\n');
};
