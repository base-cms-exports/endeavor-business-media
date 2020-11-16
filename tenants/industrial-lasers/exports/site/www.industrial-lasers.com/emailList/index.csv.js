const { getAsArray } = require('@base-cms/object-path');
const allPublishedContentQuery = require('./queries/content');
const { replaceCharacters } = require('../utils/replace-characters');
const { retrieveCompanies } = require('../utils/retrieve-companies');

module.exports = async ({ apollo }) => {
  // Date is set in retrieveCompanies function
  const companies = await retrieveCompanies(apollo, allPublishedContentQuery);
  // Sort them alpha numerically
  companies.sort((a, b) => a.name.localeCompare(b.name));

  let listingCount = 0;
  let salesCount = 0;
  let marketingCount = 0;
  companies.forEach((c) => {
    if (listingCount < getAsArray(c, 'listingContacts.edges').length) listingCount = getAsArray(c, 'listingContacts.edges').length;
    if (salesCount < getAsArray(c, 'salesContacts.edges').length) salesCount = getAsArray(c, 'salesContacts.edges').length;
    if (marketingCount < getAsArray(c, 'marketingContacts.edges').length) marketingCount = getAsArray(c, 'marketingContacts.edges').length;
  });
  const labelsArray = ['Id', 'Name', 'Website', 'Published'];
  let i = 0;
  for (i = 0; i < listingCount; i += 1) {
    labelsArray.push(`listingPhone(${i + 1})`);
    labelsArray.push(`listingEmail(${i + 1})`);
  }
  for (i = 0; i < salesCount; i += 1) {
    labelsArray.push(`salesPhone(${i + 1})`);
    labelsArray.push(`salesEmail(${i + 1})`);
  }
  for (i = 0; i < marketingCount; i += 1) {
    labelsArray.push(`marketingPhone(${i + 1})`);
    labelsArray.push(`marketingEmail(${i + 1})`);
  }
  labelsArray.push('sections');
  const lines = [labelsArray];

  companies.forEach((c) => {
    const company = [c.id, replaceCharacters(c.name, ',', ''), c.website, new Date(c.published).toLocaleDateString('en-US')];

    const listingContacts = getAsArray(c, 'listingContacts.edges');
    for (i = 0; i < listingCount; i += 1) {
      if (listingContacts[i]) {
        company.push(listingContacts[i].node.phone);
        company.push(listingContacts[i].node.email);
      } else {
        company.push('');
        company.push('');
      }
    }
    const marketingContacts = getAsArray(c, 'marketingContacts.edges');
    for (i = 0; i < marketingCount; i += 1) {
      if (marketingContacts[i]) {
        company.push(marketingContacts[i].node.phone);
        company.push(marketingContacts[i].node.email);
      } else {
        company.push('');
        company.push('');
      }
    }
    const salesContacts = getAsArray(c, 'salesContacts.edges');
    for (i = 0; i < salesCount; i += 1) {
      if (salesContacts[i]) {
        company.push(salesContacts[i].node.phone);
        company.push(salesContacts[i].node.email);
      } else {
        company.push('');
        company.push('');
      }
    }
    const sections = getAsArray(c, 'websiteSchedules').map(({ section }) => section.name);

    company.push(sections.join(' || '));

    lines.push(company);
  });

  // @todo port special character filter from php
  return lines.join('\n');
};
