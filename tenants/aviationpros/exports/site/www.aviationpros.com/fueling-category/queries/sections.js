const gql = require('graphql-tag');

module.exports = gql`
query InDesignExportSections($input: WebsiteSectionsQueryInput!) {
  websiteSections(input: $input) {
    edges {
      node {
        id
        name
      }
    }
  }
}
`;
