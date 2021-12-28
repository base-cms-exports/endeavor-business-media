const allPublishedContentQuery = require('./queries/content');
const { getChildSections } = require('../utils/get-child-sections');
const websiteSectionsQuery = require('./queries/sections');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveSections } = require('../utils/retrieve-sections');
const { mapHierarchy, printContent, getCatPStyle } = require('./helpers');

module.exports = async ({ apollo }) => {
  const alias = 'directory/fitness-equipment';
  // This will return the section for amt
  const directory = await retrieveSections(apollo, websiteSectionsQuery, alias, '60f6ec0bd28860bc3384daa1');
  const childObj = getChildSections(directory, {}, false);
  // const ids = Object.keys(childObj);
  const sections = Object.values(childObj);

  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery, '60f6ec0bd28860bc3384daa1');

  // // Get the sections and map companies into them
  const segments = await mapHierarchy(sections, allCompanies);

  // The big kahuna. Expands children and content into the accumulator (arr)
  const printSection = ((arr, {
    name,
    children,
    content,
    parent,
  }) => {
    const catPStyle = getCatPStyle(parent, children, alias);
    const newArr = [
      ...arr,
      // Only include categories if they have content or children
      ...(content.length || children.length ? [
        `<ParaStyle:${catPStyle}>${name}`,
        // `<ParaStyle:PCat_head>${name}`,
        ...printContent(content),
        ...children.reduce(printSection, []),
      ] : []),
    ];
    return newArr;
  });
  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    ...segments.reduce(printSection, []),
  ];
  const cleanLines = lines.filter(e => e);
  // @todo port special character filter from php
  return cleanLines.join('\n');
};
