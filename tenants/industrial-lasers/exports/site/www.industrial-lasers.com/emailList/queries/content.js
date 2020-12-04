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
          listingContacts(input: { status: any }) {
            edges {
              node {
                email
                phone
              }
            }
          }
          marketingContacts {
            edges {
              node {
                email
                phone
              }
            }
          }
          salesContacts {
            edges {
              node {
                email
                phone
              }
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
