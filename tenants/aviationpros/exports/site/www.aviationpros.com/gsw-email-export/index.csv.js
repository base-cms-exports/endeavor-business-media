const { getAsArray } = require('@base-cms/object-path');
const allPublishedContentQuery = require('./queries/content');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { replaceCharacters } = require('../utils/replace-characters');
const { gswSectionIds } = require('../gsw-section-ids');

module.exports = async ({ apollo }) => {
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);

  allCompanies.sort((a, b) => a.name.localeCompare(b.name));

  const companies = allCompanies.filter(({ sectionIds }) => {
    const insert = sectionIds.filter(element => gswSectionIds.includes(element));
    return insert.length !== 0;
  });

  const lines = [['id', 'ComapnyName', 'email', 'CompanyUpdateLink']];

  companies.forEach((c) => {
    let listingEmail;
    const listingContacts = getAsArray(c, 'listingContacts');
    listingContacts.forEach((contact) => {
      const { email } = contact;
      if (!listingEmail && email) listingEmail = email;
    });
    if (!listingEmail && c.email) listingEmail = c.email;
    if (listingEmail) lines.push([c.id, replaceCharacters(c.name, ',', ''), listingEmail, `https://update.aviationpros.com/portal/${c.hash}`]);
  });

  // @todo port special character filter from php
  return lines.join('\n');
};
