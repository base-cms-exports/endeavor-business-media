const { getAsArray } = require('@base-cms/object-path');

const retrieveSectionIds = (sections, sectionIds) => {
  sections.forEach((section) => {
    if (!sectionIds.includes(section.id)) sectionIds.push(section.id);
    const childNodes = getAsArray(section, 'children.edges').map(({ node }) => node);
    if (childNodes.length) retrieveSectionIds(childNodes, sectionIds);
    return sectionIds;
  });
  return sectionIds;
};
module.exports = { retrieveSectionIds };
