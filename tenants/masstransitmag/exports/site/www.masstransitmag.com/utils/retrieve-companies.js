const { getAsArray } = require('@base-cms/object-path');
const paginateQuery = require('@endeavor-business-media/common/paginate-query');

const retrieveCompanies = async (apollo, query) => {
  const promise = await paginateQuery({
    client: apollo,
    query,
    variables: {
      input: {
        includeContentTypes: 'Company',
        pagination: { limit: 250 },
        sort: { field: 'name', order: 'asc' },
      },
    },
    cursorPath: 'input.pagination.after',
    rootValue: 'allPublishedContent',
  });
  const now = Date.now().valueOf();
  return promise.map((company) => {
    // Add logic to base-cms graph to handle publised after date input instead of this
    const sectionIds = getAsArray(company, 'websiteSchedules')
      .filter(({ start, end }) => start < now && (!end || end > now))
      .map(({ section }) => section.id);
    // taxonomy {
    //   edges {
    //     node {
    //       id
    //     }
    //   }
    // }
    const taxonomyIds = getAsArray(company, 'taxonomy.edges')
      .map(({ node }) => node.id);
    return { ...company, sectionIds, taxonomyIds };
  });
};
module.exports = { retrieveCompanies };
