const exportTaxonomyIds = [3129130, 3129131, 3129132, 3129133];

const retrieveFilterdProducts = (allProducts) => {
  const products = allProducts.filter(({ taxonomyIds }) => {
    const insert = taxonomyIds.filter(element => exportTaxonomyIds.includes(element));
    return insert.length !== 0;
  });
  return products;
};
module.exports = { retrieveFilterdProducts };
