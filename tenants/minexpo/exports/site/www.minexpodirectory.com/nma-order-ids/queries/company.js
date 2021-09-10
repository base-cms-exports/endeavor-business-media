const gql = require('graphql-tag');

module.exports = gql`
query InDesignExportCompaniesByCategory($input: AllContentQueryInput!) {
  allContent(input: $input) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        id
        status
        type
        name
        boothNumber: customAttribute(input: { path: "boothNumber" })
        nmaOrder: customAttribute(input: { path: "nmaOrder" })
        taxonomy {
          edges {
            node {
              id
            }
          }
        }
        ... on ContentCompany {
          phone
          tollfree
          website
        }
        websiteSchedules {
          start
          end
          section {
            id
            name
            fullName
            alias
          }
        }
      }
    }
  }
}
`;
