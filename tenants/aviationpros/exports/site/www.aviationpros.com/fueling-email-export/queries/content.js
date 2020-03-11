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
        websiteSchedules {
          start
          end
          section {
            id
            name
          }
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
