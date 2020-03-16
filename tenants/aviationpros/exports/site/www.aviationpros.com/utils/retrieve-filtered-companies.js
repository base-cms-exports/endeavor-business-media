const retrieveFilterdCompanies = (allCompanies, direcotrySectionIds) => {
  const companies = allCompanies.filter(({ sectionIds }) => {
    const insert = sectionIds.filter(element => direcotrySectionIds.includes(element));
    return insert.length !== 0;
  });
  return companies;
};
module.exports = { retrieveFilterdCompanies };
