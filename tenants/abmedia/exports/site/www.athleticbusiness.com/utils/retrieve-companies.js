const { get, getAsArray } = require('@parameter1/base-cms-object-path');
const paginateQuery = require('@endeavor-business-media/common/paginate-query');

const retrieveCompanies = async (apollo, query, siteId) => {
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
  const siteCompanies = promise.reduce((arr, company) => {
    // Add logic to base-cms graph to handle publised after date input instead of this
    const sectionIds = (siteId)
      ? getAsArray(company, 'websiteSchedules')
        // eslint-disable-next-line max-len
        .filter(({ section, start, end }) => get(section, 'site.id') === siteId && start < now && (!end || end > now))
        .map(({ section }) => section.id)
      : getAsArray(company, 'websiteSchedules')
        .filter(({ start, end }) => start < now && (!end || end > now))
        .map(({ section }) => section.id);

    if (sectionIds.length || (siteId && get(company, 'primarySite.id') === siteId)) {
      arr.push({ ...company, sectionIds });
    }
    return arr;
  }, []);
  return siteCompanies;
};
module.exports = { retrieveCompanies };
