const gql = require('graphql-tag');

module.exports = gql`
query InDesignExportCompaniesByCategory($input: AllPublishedContentQueryInput!) {
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
        taxonomy {
          edges {
            node {
              id
            }
          }
        }
        ... on ContentCompany {
          email
          website
        }
        ... on Addressable {
          city
          state
          country
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
        websiteSchedules {
          start
          end
          section {
            id
            name
          }
        }
      }
    }
  }
}
`;
