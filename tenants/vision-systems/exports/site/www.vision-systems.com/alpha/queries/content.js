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
        type
        ... on ContentCompany {
          address1
          address2
          city
          state
          zip
          country
          phone
          website
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
