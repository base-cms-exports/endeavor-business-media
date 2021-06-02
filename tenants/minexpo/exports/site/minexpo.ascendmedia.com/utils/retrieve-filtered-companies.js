// const exportTaxonomyIds = [3129130, 3129131, 3129132, 3129133];

// const retrieveFilterdCompanies = (allCompanies, direcotrySectionIds) => {
//   const companies = allCompanies.filter(({ sectionIds, taxonomyIds }) => {
//     const insert = sectionIds.filter(element => direcotrySectionIds.includes(element));
//     const taxonomyInsert = taxonomyIds.filter(element => exportTaxonomyIds.includes(element));
//     return insert.length !== 0 && taxonomyInsert.length !== 0;
//   });
//   return companies;
// };

const retrieveFilterdCompanies = (allCompanies, direcotrySectionIds) => {
  const companies = allCompanies.filter(({ sectionIds }) => {
    const insert = sectionIds.filter(element => direcotrySectionIds.includes(element));
    return insert.length !== 0;
  });
  return companies;
};
module.exports = { retrieveFilterdCompanies };
