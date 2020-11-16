const gql = require('graphql-tag');

module.exports = gql`
query InDesignExportCompanyProductContent($input: AllCompanyContentQueryInput!) {
  allCompanyContent(input: $input) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        id
        name
        teaser(input: { mutation: Magazine })
        taxonomy {
          edges {
            node {
              id
            }
          }
        }
        primaryImage {
          id
          src
          alt
          isLogo
          source {
            name
          }
          filePath
        }
      }
    }
  }
}
`;
