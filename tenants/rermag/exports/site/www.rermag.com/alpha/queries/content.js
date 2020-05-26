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
        body(input: { mutation: Magazine })
        taxonomy {
          edges {
            node {
              id
            }
          }
        }
        ... on ContentCompany {
          phone
          email
          website
          salesContacts(input: { pagination: { limit: 10 } }) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
        ... on Addressable {
          address1
          address2
          city
          state
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
        notes
      }
    }
  }
}
`;
