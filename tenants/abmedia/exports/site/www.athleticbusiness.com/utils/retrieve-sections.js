const retrieveSections = async (client, query, alias, siteId) => {
  const { data: { websiteSectionAlias } } = await client.query({
    query,
    variables: { input: { alias, siteId } },
  });
  return websiteSectionAlias;
};
module.exports = { retrieveSections };
