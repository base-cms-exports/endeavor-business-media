const gql = require('graphql-tag');

module.exports = gql`
fragment WebsiteSectionFragment on WebsiteSection {
  id
  alias
  name
  fullName
}
fragment WebsiteSectionHierarchyFragment on WebsiteSection {
  ...WebsiteSectionFragment
  children(input: { pagination: { limit: 0 } }) {
    edges {
      node {
        ...WebsiteSectionFragment
        children(input: { pagination: { limit: 0 } }) {
          edges {
            node {
              ...WebsiteSectionFragment
              children(input: { pagination: { limit: 0 } }) {
                edges {
                  node {
                    ...WebsiteSectionFragment
                    children(input: { pagination: { limit: 0 } }) {
                      edges {
                        node {
                          ...WebsiteSectionFragment
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

query InDesignExportSectionHierarchy($input: WebsiteSectionAliasQueryInput!) {
  websiteSectionAlias(input: $input) {
    ...WebsiteSectionHierarchyFragment
  }
}
`;
