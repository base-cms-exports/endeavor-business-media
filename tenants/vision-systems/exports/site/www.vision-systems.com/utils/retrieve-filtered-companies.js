const { getAsArray } = require('@base-cms/object-path');
const { retrieveSectionIds } = require('./retrieve-section-ids');

const retrieveFilterdCompanies = (allCompanies, rootSection) => {
  const primarySections = getAsArray(rootSection, 'children.edges').map(({ node }) => node);
  const primarySectionsIds = getAsArray(rootSection, 'children.edges').map(({ node }) => node.id);
  const direcotrySectionIds = retrieveSectionIds(primarySections, primarySectionsIds);
  const companies = allCompanies.filter(({ sectionIds }) => {
    const insert = sectionIds.filter(element => direcotrySectionIds.includes(element));
    return insert.length !== 0;
  });
  return companies;
};
module.exports = { retrieveFilterdCompanies };
