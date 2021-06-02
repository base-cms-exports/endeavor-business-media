const { getAsArray } = require('@base-cms/object-path');
const allPublishedContentQuery = require('./queries/content');
const { retrieveSectionIds } = require('../utils/retrieve-section-ids');
const websiteSectionsQuery = require('./queries/sections');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveFilterdCompanies } = require('../utils/retrieve-filtered-companies');
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
      content: filteredCompanies,
    },
  ];
}, []).sort((a, b) => a.name.localeCompare(b.name));

module.exports = async ({ apollo }) => {
  // This will return the section for amt
  const directory = await retrieveSections(apollo, websiteSectionsQuery, 'directory');

  const sections = getAsArray(directory, 'children.edges').map(({ node }) => node);

  const directorySectionIds = await retrieveSectionIds(sections, []);
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);
  const companies = await retrieveFilterdCompanies(allCompanies, directorySectionIds);
  // // Get the sections and map companies into them
  const segments = await mapHierarchy(sections, companies);

  // const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);
  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    // const taxonomyIds = [3129130, 3129131, 3129132, 3129133];
    // const companyTaxonomyIds = getTaxonomyIds(c.taxonomy.edges);
    // const insert = taxonomyIds.filter(element => companyTaxonomyIds.includes(element));
    // if (insert.length === 0) return '';
    const text = [];
    text.push(`<ParaStyle:cName>${formatText(c.name)}`);
    if (c.boothNumber) text.push(`<ParaStyle:cBoothNumber>${formatText(c.boothNumber)}`);
    return text.join('\n');
  });

  // The big kahuna. Expands children and content into the accumulator (arr)
  const printSection = (arr, {
    name,
    children,
    content,
    parent,
  }) => [
    ...arr,
    // Only include categories if they have content or children
    ...(content.length || children.length ? [
      `<ParaStyle:c${parent ? 'Subcategory' : 'Category'}>${name}`,
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
