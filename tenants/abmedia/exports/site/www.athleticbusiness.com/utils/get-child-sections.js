const { getAsArray } = require('@parameter1/base-cms-object-path');

const getChildSections = (section, sections = {}, includeSelf = true) => {
  const { id } = section;
  const children = getAsArray(section, 'children.edges').map(({ node }) => node);
  return {
    ...children.reduce((obj, child) => getChildSections(child, obj), sections),
    ...(includeSelf && !section[id] && { [id]: section }),
  };
};
module.exports = { getChildSections };
