const { getAsArray } = require('@parameter1/base-cms-object-path');
const { getChildSections } = require('../utils/get-child-sections');
const websiteSectionsQuery = require('./queries/sections');
const { retrieveSections } = require('../utils/retrieve-sections');
const { formatText } = require('../utils/format-text');

const getKids = (section, decendents = []) => {
  const children = getAsArray(section, 'children.edges').map(({ node }) => node);
  if (children.length) {
    decendents.push(...children);
    const childDecendents = children.reduce((arr, child) => getKids(child), []);
    decendents.push(...childDecendents);
  }
  return decendents;
};

let currentLetter = 'A';

const printContent = arr => arr.map((s) => {
  const text = [];
  const sectionLetter = s.name.substr(0, 1);
  if (currentLetter !== sectionLetter) {
    const regex = /[^A-Z]/g;
    sectionLetter.match(regex);
    if (currentLetter.toUpperCase() !== sectionLetter.toUpperCase()) {
      if (!sectionLetter.match(regex)) {
        currentLetter = sectionLetter;
        text.push(`<ParaStyle:BG CATEGORY>${currentLetter}`);
      }
    }
  }
  text.push(`<ParaStyle:BG INDEX COPY>${formatText(s.name)}`);
  return text.join('\n');
});


module.exports = async ({ apollo }) => {
  const alias = 'directory';
  // This will return the section for amt
  const directory = await retrieveSections(apollo, websiteSectionsQuery, alias, '60f6ec0bd28860bc3384daa1');
  const children = getAsArray(directory, 'children.edges').map(({ node }) => node);
  const sections = children.reduce((arr, section) => {
    const grandChildren = getAsArray(section, 'children.edges').reduce((c, { node: child }) => {
      const decendents = getKids(child, []);
      if (decendents.length) c.push(...decendents);
      return c;
    }, []);
    arr.push(...grandChildren);
    return arr;
  }, []);

  sections.sort((a, b) => a.name.localeCompare(b.name));
  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    '<ParaStyle:BG CATEGORY>A',
    ...printContent(sections),
  ];
  const cleanLines = lines.filter(e => e);
  // @todo port special character filter from php
  return cleanLines.join('\n');
};
