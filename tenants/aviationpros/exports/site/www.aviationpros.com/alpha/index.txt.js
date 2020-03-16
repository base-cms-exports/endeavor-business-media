const allPublishedContentQuery = require('./queries/content');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveFilterdCompanies } = require('../utils/retrieve-filtered-companies');
const { formatText } = require('../utils/format-text');
const { gswSectionIds } = require('../gsw-section-ids');
const { fuelingSectionIds } = require('../fueling-section-ids');

module.exports = async ({ apollo }) => {
  const sectionsIds = gswSectionIds.concat(fuelingSectionIds);
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);
  const companies = retrieveFilterdCompanies(allCompanies, sectionsIds);

  companies.sort((a, b) => a.name.localeCompare(b.name));

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    text.push(`<ParaStyle:cName>${formatText(c.name)}`);
    text.push(`<ParaStyle:cAddress>${c.cityStateZip} ${c.country}`);
    text.push(`<ParaStyle:cPhone>${c.phone}`);
    // text.push(`<ParaStyle:cAddress>${c.fax}`);
    text.push(`<ParaStyle:cEmail>${c.email}`);
    text.push(`<ParaStyle:cWebsite>${c.website}`);
    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    ...printContent(companies),
  ];

  // @todo port special character filter from php
  return lines.join('\n');
};
