// const retrieveSectionsByIds = async (client, query, includeIds) => {
//   console.log(includeIds);
//   const { data: { websiteSections } } = await client.query({
//     query,
//     variables: {
//       input: { includeIds },
//       pagination: {
//         limit: 0,
//       },
//     },
//   });
//   return websiteSections;
// };
// module.exports = { retrieveSectionsByIds };


const paginateQuery = require('@endeavor-business-media/common/paginate-query');

const retrieveSectionsByIds = async (apollo, query, includeIds) => {
  const promise = await paginateQuery({
    client: apollo,
    query,
    variables: {
      input: {
        includeIds,
        pagination: { limit: 250 },
        sort: { field: 'name', order: 'asc' },
      },
    },
    cursorPath: 'input.pagination.after',
    rootValue: 'websiteSections',
  });
  return promise;
};
module.exports = { retrieveSectionsByIds };
