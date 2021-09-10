const { getAsArray } = require('@parameter1/base-cms-object-path');
const paginateQuery = require('@endeavor-business-media/common/paginate-query');

const retrieveProducts = async (apollo, query) => {
  const promise = await paginateQuery({
    client: apollo,
    query,
    variables: {
      input: {
        includeContentTypes: 'Product',
        pagination: { limit: 250 },
        sort: { field: 'name', order: 'asc' },
      },
    },
    cursorPath: 'input.pagination.after',
    rootValue: 'allPublishedContent',
  });
  return promise.map((product) => {
    const taxonomyIds = getAsArray(product, 'taxonomy.edges')
      .map(({ node }) => node.id);
    return { ...product, taxonomyIds };
  });
};
module.exports = { retrieveProducts };
