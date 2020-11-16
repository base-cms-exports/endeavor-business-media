const paginateQuery = require('@endeavor-business-media/common/paginate-query');

const retrieveCompanyProducts = async (apollo, query, companyId) => {
  const promise = await paginateQuery({
    client: apollo,
    query,
    variables: {
      input: {
        includeContentTypes: 'Prodcut',
        companyId,
        pagination: { limit: 250 },
        sort: { field: 'name', order: 'asc' },
      },
    },
    cursorPath: 'input.pagination.after',
    rootValue: 'allCompanyContent',
  });
  return promise.map(product => ({ ...product }));
};
module.exports = { retrieveCompanyProducts };
