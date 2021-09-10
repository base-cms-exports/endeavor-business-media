const { getAsArray } = require('@parameter1/base-cms-object-path');
const allPublishedCopanyContentQuery = require('./queries/company');
const { retrieveCompanies } = require('../utils/retrieve-nma-companies');

module.exports = async ({ apollo }) => {
  const companies = await retrieveCompanies(apollo, allPublishedCopanyContentQuery);

  companies.sort((a, b) => a.name.localeCompare(b.name));

  // const alphaCompanies = companiesByBooth.filter(company => /^[a-zA-Z]/.test(company.boothId));
  // const nuumberCompanies = companiesByBooth.filter(company => /^[0-9]/.test(company.boothId));

  // const orederedCompanies = alphaCompanies.concat(nuumberCompanies);


  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    // const onAscend = c.taxonomyIds.includes(3193661) ? 'True' : '';
    const schedules = getAsArray(c, 'websiteSchedules');

    const productCats = schedules.filter((schedule) => {
      return schedule.section.alias.substring(0, 10) === 'directory/';
    });
    const productCatNames = productCats.map(cat => cat.section.name);

    const text = [];
    const companyInfo = [];
    companyInfo.push((c.nmaOrder) ? c.nmaOrder : ' ');
    companyInfo.push(c.id);
    companyInfo.push((c.name) ? c.name : ' ');
    companyInfo.push((c.boothNumber) ? c.boothNumber : ' ');
    companyInfo.push((c.phone) ? c.phone : ' ');
    companyInfo.push((c.website) ? c.website.replace('https://', '').replace('http://', '').replace('www.', '') : ' ');
    companyInfo.push((productCatNames) ? productCatNames.sort().join(' || ') : ' ');
    if (c.status === 0) companyInfo.push('Deleted');
    if (c.status === 2) companyInfo.push('Draft');
    if (c.status === 1) companyInfo.push('Published');
    text.push(companyInfo.join('\t'));
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
