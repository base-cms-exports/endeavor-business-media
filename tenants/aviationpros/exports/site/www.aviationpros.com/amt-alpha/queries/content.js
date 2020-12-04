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
        body
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
          fax
          publicEmail
          website
        }
        ... on Addressable {
          address1
          address2
          cityStateZip
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
