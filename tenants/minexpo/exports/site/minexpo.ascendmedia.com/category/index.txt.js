const { getAsArray } = require('@parameter1/base-cms-object-path');
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
      // Ensure that only childsection have content on them.
      // Set to content: filteredCompanies if you want parent and child sections
      ...(!childNodes.length ? { content: filteredCompanies } : { content: [] }),
    },
  ];
}, []).sort((a, b) => a.name.localeCompare(b.name));

module.exports = async ({ apollo }) => {
  // This will return the section for amt
  const directory = await retrieveSections(apollo, websiteSectionsQuery, 'directory');
  let childSections = [];
  const sections = getAsArray(directory, 'children.edges').map(({ node }) => node);
  sections.forEach((section) => {
    const children = getAsArray(section, 'children.edges').map(({ node }) => node);
    childSections = childSections.concat(children);
  });

  const directorySectionIds = await retrieveSectionIds(childSections, []);
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);
  const companies = await retrieveFilterdCompanies(allCompanies, directorySectionIds);
  // // Get the sections and map companies into them
  const segments = await mapHierarchy(childSections, companies);

  // const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);
  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    // const taxonomyIds = [3129130, 3129131, 3129132, 3129133];
    // const companyTaxonomyIds = getTaxonomyIds(c.taxonomy.edges);
    // const insert = taxonomyIds.filter(element => companyTaxonomyIds.includes(element));
    // if (insert.length === 0) return '';
    const text = [];
    if (c.boothNumber) {
      const strBooths = c.boothNumber.split(',');
      const cleanBooths = strBooths.map(n => n.trim());
      text.push(`<ParaStyle:PCatBody>${formatText(c.name)} \t ${formatText(cleanBooths.join(', '))}`);
    } else {
      text.push(`<ParaStyle:PCatBody>${formatText(c.name)}`);
    }
    return text.join('\n');
  });

  // The big kahuna. Expands children and content into the accumulator (arr)
  const printSection = (arr, {
    name,
    children,
    content,
    // parent,
  }) => [
    ...arr,
    // Only include categories if they have content or children
    ...(content.length || children.length ? [
      // `<ParaStyle:c${parent ? 'Subcategory' : 'Category'}>${name}`,
      `<ParaStyle:PCatHead>${name}`,
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
