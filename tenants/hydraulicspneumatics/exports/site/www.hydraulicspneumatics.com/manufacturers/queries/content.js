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
        ... on ContentCompany {
          phone
          publicEmail
          email
          website
        }
        ... on Addressable {
          state
          country
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
