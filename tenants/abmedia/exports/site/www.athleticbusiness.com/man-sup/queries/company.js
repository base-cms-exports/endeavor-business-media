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
          city
          state
        }
        # primaryImage {
        #   id
        #   src
        #   alt
        #   isLogo
        #   source {
        #     name
        #   }
        #   filePath
        # }
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
      }
    }
  }
}
`;
