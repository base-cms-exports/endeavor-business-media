const { getAsArray } = require('@parameter1/base-cms-object-path');
const allPublishedContentQuery = require('./queries/content');
const { getChildSections } = require('../utils/get-child-sections');
const websiteSectionsQuery = require('./queries/sections');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveSections } = require('../utils/retrieve-sections');
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

module.exports = async ({ apollo }) => {
  // This will return the section for amt
  const directory = await retrieveSections(apollo, websiteSectionsQuery, 'directory', '60f6ec0bd28860bc3384daa1');
  const childObj = getChildSections(directory, {}, false);
  // const ids = Object.keys(childObj);
  const sections = Object.values(childObj);

  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery, '60f6ec0bd28860bc3384daa1');

  // // Get the sections and map companies into them
  const segments = await mapHierarchy(sections, allCompanies);

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    text.push(`<ParaStyle:PCat_body>${formatText(c.name)}`);
    return text.join('\n');
  });

  // The big kahuna. Expands children and content into the accumulator (arr)
  const printSection = (arr, {
    name,
    fullName,
    children,
    content,
    parent,
  }) => [
    ...arr,
    // Only include categories if they have content or children
    ...(content.length || children.length ? [
      `<ParaStyle:c${parent ? 'Subcategory' : 'Category'}>${name}(${fullName})`,
      // `<ParaStyle:PCat_head>${name}`,
      ...printContent(content),
      ...children.reduce(printSection, []),
    ] : []),
  ];

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    ...segments.reduce(printSection, []),
  ];
  const cleanLines = lines.filter(e => e);
  // @todo port special character filter from php
  return cleanLines.join('\n');
};
