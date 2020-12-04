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
        taxonomy {
          edges {
            node {
              id
            }
          }
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
