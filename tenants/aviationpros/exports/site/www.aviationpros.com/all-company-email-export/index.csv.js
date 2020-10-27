const { getAsArray } = require('@base-cms/object-path');
const allPublishedContentQuery = require('./queries/content');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { replaceCharacters } = require('../utils/replace-characters');

module.exports = async ({ apollo }) => {
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);

  allCompanies.sort((a, b) => a.name.localeCompare(b.name));

  const lines = [['id', 'ComapnyName', 'email', 'CompanyUpdateLink']];

  allCompanies.forEach((c) => {
    const listingEmail = [];
    const listingContacts = getAsArray(c, 'listingContacts');
    listingContacts.forEach((contact) => {
      const { email } = contact;
      if (email && listingEmail.length === 0) listingEmail.push(email);
    });
    if (listingEmail.length === 0 && c.email) listingEmail.push(c.email);
    if (listingEmail.length !== 0) lines.push([c.id, replaceCharacters(c.name, ',', ''), listingEmail.join(' '), `https://update.aviationpros.com/portal/${c.hash}`]);
  });

  // @todo port special character filter from php
  return lines.join('\n');
};
