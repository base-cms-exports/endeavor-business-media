const gql = require('graphql-tag');

module.exports = gql`
fragment WebsiteSectionFragment on WebsiteSection {
  id
  alias
  name
  fullName
}
query InDesignExportSections($input: WebsiteSectionsQueryInput!) {
  websiteSections(input: $input) {
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
`;
