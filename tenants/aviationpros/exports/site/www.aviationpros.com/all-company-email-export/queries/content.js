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
        ... on Contactable {
          email
        }
        hash
        name
        ... on ContentCompany {
          publicEmail
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
