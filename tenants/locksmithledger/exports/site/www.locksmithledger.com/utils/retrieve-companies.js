const { getAsArray } = require('@base-cms/object-path');
const paginateQuery = require('@endeavor-business-media/common/paginate-query');

const retrieveCompanies = async (apollo, query) => {
  const promise = await paginateQuery({
    client: apollo,
    query,
    variables: {
      input: {
        issueId: 27560,
        pagination: { limit: 250 },
      },
    },
    cursorPath: 'input.pagination.after',
    rootValue: 'magazineScheduledContent',
  });
  const now = Date.now().valueOf();
  return promise.map((company) => {
    // Add logic to base-cms graph to handle publised after date input instead of this
    const sectionIds = getAsArray(company, 'websiteSchedules')
      .filter(({ start, end }) => start < now && (!end || end > now))
      .map(({ section }) => section.id);
    return { ...company, sectionIds };
  });
};
module.exports = { retrieveCompanies };
