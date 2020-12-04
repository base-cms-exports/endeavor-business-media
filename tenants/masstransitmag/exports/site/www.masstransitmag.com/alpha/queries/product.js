const gql = require('graphql-tag');

module.exports = gql`
query InDesignExportProductsByCompany($input: AllPublishedContentQueryInput!) {
  allPublishedContent(input: $input) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        id
        published
        name
        type
        teaser(input: { mutation: Magazine })
        taxonomy {
          edges {
            node {
              id
            }
          }
        }
        company {
          id
          taxonomy {
            edges {
              node {
                id
              }
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
