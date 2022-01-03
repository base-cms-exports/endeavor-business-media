const allPublishedCopanyContentQuery = require('./queries/company');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { formatText } = require('../utils/format-text');

module.exports = async ({ apollo }) => {
  const companies = await retrieveCompanies(apollo, allPublishedCopanyContentQuery, '60f6ec0bd28860bc3384daa1');

  companies.sort((a, b) => a.name.localeCompare(b.name));

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    const isAdvertiser = (c.labels && (c.labels.includes('Buyers Guide Advertiser') || c.labels.includes('Buyers Guide Microsite')));
    const pStyle = isAdvertiser ? 'BGRedAdvertiser' : 'BG MAN CO. BOLD';
    if (isAdvertiser) {
      text.push(`<ParaStyle:${pStyle}>${formatText(`8${c.name}`)}`);
      text.push('<ParaStyle:BGRedAdPage>See ad page');
    } else {
      text.push(`<ParaStyle:BG MAN CO. BOLD>${formatText(c.name)}`);
    }
    const cityState = [];
    if (c.city) cityState.push(c.city);
    if (c.state) cityState.push(c.state);
    const line1 = [];
    if (cityState.length) line1.push(cityState.join(', '));
    const phone = c.tollfree ? c.tollfree : c.phone;
    if (phone) line1.push(phone);
    if (line1.length) text.push(`<ParaStyle:BG MAN BODY>${formatText(line1.join(' &bull; '))}`);
    if (c.website) text.push(`<ParaStyle:BG MAN BODY>${c.website.replace('https://', '').replace('http://', '')}`);
    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>',
    ...printContent(companies),
  ];
  const cleanLines = lines.filter(e => e);
  // @todo port special character filter from php
  return cleanLines.join('\n');
};
