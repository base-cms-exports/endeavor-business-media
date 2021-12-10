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
        primarySite {
          id
        }
        websiteSchedules {
          start
          end
          section {
            id
            name
            site {
              id
            }
          }
        }
        ... on Contactable {
          email
        }
        hash
        name
        ... on ContentCompany {
          publicEmail
          email
        }
        ... on ContentCompany {
          listingContacts {
            edges {
              node {
                email
              }
            }
          }
        }
      }
    }
  }
}
`;
