const { getAsArray } = require('@parameter1/base-cms-object-path');
const allPublishedContentQuery = require('./queries/content');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { replaceCharacters } = require('../utils/replace-characters');

module.exports = async ({ apollo }) => {
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);

  allCompanies.sort((a, b) => a.name.localeCompare(b.name));

  const lines = [['id', 'ComapnyName', 'email', 'CompanyUpdateLink']];

  allCompanies.forEach((c) => {
    const listingEmail = getAsArray(c, 'listingContacts').reduce((arr, contact) => {
      const { email } = contact;
      return email ? arr.push(email) : arr;
    }, []);
    const compEmail = (c.publicEmail) ? c.publicEmail : c.email;
    if (listingEmail.length === 0 && compEmail) listingEmail.push(compEmail);
    if (listingEmail.length !== 0) lines.push([c.id, replaceCharacters(c.name, ',', ''), listingEmail.join(' '), `https://update.athleticbusiness.com/portal/${c.hash}`]);
  });
  return lines.join('\n');
};
