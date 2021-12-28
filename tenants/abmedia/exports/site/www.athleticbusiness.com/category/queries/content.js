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
        teaser(input: { mutation: Magazine })
        labels
        ... on ContentCompany {
          phone
          tollfree
          publicEmail
          website
        }
        ... on Addressable {
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
        labels
        websiteSchedules {
          start
          end
          section {
            id
            site {
              id
            }
            name
            fullName
          }
        }
      }
    }
  }
}
`;
