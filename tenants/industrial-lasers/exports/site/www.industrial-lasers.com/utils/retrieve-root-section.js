const retrieveRootSection = async (client, query, alias) => {
  const { data: { websiteSectionAlias } } = await client.query({
    query,
    variables: { input: { alias } },
  });
  return websiteSectionAlias;
};
module.exports = { retrieveRootSection };
