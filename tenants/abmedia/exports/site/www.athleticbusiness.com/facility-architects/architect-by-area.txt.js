const allPublishedCopanyContentQuery = require('./queries/company');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { formatText } = require('../utils/format-text');
const abbreviationToName = require('../utils/abbreviation-to-name');

module.exports = async ({ apollo }) => {
  const allCompanies = await retrieveCompanies(apollo, allPublishedCopanyContentQuery, '60f6ec0bd28860bc3384daa1');
  const companies = allCompanies.filter(company => company.sectionIds.includes(78225));
  companies.sort((a, b) => a.name.localeCompare(b.name));

  const printContent = arr => arr.map((c) => {
    const text = [];
    const isAdvertiser = (c.labels && (c.labels.includes('Buyers Guide Advertiser') || c.labels.includes('Buyers Guide Microsite')));
    if (isAdvertiser) {
      text.push(`<ParaStyle:BG MAN CO. BOLD>${formatText(c.name)}`);
    } else {
      text.push(`<ParaStyle:BG CO.>${formatText(c.name)}`);
    }

    const line1 = [];
    if (c.city) line1.push(c.city);
    const phone = c.tollfree ? c.tollfree : c.phone;
    if (phone) line1.push(phone);
    if (line1.length) text.push(`<ParaStyle:BG PHONE>${formatText(line1.join(' &bull; '))}`);
    return text.join('\n');
  });

  const printStates = arr => arr.map((a) => {
    const text = [];
    const { key, name } = a;
    const comps = companies.filter((company => company.state === key));
    if (comps.length) {
      text.push(`<ParaStyle:BG CATEGORY>${formatText(name)}`);
      text.push(...printContent(comps));
    }
    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>',
    ...printStates(abbreviationToName),
  ];
  const cleanLines = lines.filter(e => e);
  // @todo port special character filter from php
  return cleanLines.join('\n');
};
