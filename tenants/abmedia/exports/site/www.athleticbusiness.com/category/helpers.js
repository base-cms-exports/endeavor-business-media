const { getAsArray } = require('@parameter1/base-cms-object-path');
const { formatText } = require('../utils/format-text');

const mapHierarchy = (sections, companies) => sections.reduce((arr, section) => {
  const childNodes = getAsArray(section, 'children.edges').map(({ node }) => node);
  const children = childNodes.length ? mapHierarchy(childNodes, companies) : [];
  const filteredCompanies = companies
    .filter(({ sectionIds }) => sectionIds.includes(section.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [
    ...arr,
    {
      ...section,
      children,
      // Ensure that only childsection have content on them.
      // Set to content: filteredCompanies if you want parent and child sections
      ...(!childNodes.length ? { content: filteredCompanies } : { content: [] }),
    },
  ];
}, []).sort((a, b) => a.fullName.localeCompare(b.fullName));

// Wrap content in paragraph style
const printContent = arr => arr.map((c) => {
  const text = [];
  const pStyle = (c.labels && (c.labels.includes('Buyers Guide Advertiser') || c.labels.includes('Buyers Guide Microsite'))) ? 'BG MAN CO. BOLD' : 'BG CO.';
  text.push(`<ParaStyle:${pStyle}>${formatText(c.name)}`);
  const phone = c.tollFree ? c.tollFree : c.phone;
  const webPhone = [];
  if (phone) webPhone.push(phone);
  if (c.website) webPhone.push(c.website.replace('https://', '').replace('http://', ''));
  if (webPhone.length) text.push(`<ParaStyle:BG PHONE>${formatText(webPhone.join(' &bull; '))}`);
  // if (c.teaser !== '...') text.push(`<ParaStyle:BG ARCH ital>${c.teaser}`);
  return text.join('\n');
});

const getCatPStyle = (parent, children, alias) => {
  const rootLevel = alias.split('/').length;
  const parentLevel = !parent ? rootLevel : parent.alias.split('/').length;
  const level = parentLevel - rootLevel;
  // eslint-disable-next-line no-nested-ternary
  return (level === 0) ? 'BG TOP HEAD' : (level === 1) ? 'BG CATEGORY' : 'BG CATEGORY SUB';
};

module.exports = { mapHierarchy, printContent, getCatPStyle };
