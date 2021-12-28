const { getAsArray } = require('@parameter1/base-cms-object-path');
const paginateQuery = require('@endeavor-business-media/common/paginate-query');

const retrieveCompanies = async (apollo, query) => {
  const promise = await paginateQuery({
    client: apollo,
    query,
    variables: {
      input: {
        status: 'any',
        pagination: { limit: 250 },
        sort: { field: 'name', order: 'asc' },
      },
    },
    cursorPath: 'input.pagination.after',
    rootValue: 'allContent',
  });
  const now = Date.now().valueOf();
  return promise.map((company) => {
    const sectionIds = getAsArray(company, 'websiteSchedules')
      .filter(({ start, end }) => start < now && (!end || end > now))
      .map(({ section }) => section.name);
    const taxonomyIds = getAsArray(company, 'taxonomy.edges')
      .map(({ node }) => node.id);
    return { ...company, sectionIds, taxonomyIds };
  }).filter((company) => {
    const { type } = company;
    return type === 'company';
  });
};
module.exports = { retrieveCompanies };
