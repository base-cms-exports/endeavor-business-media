const gql = require('graphql-tag');

module.exports = gql`
query InDesignExportCompaniesByCategory($input: MagazineScheduledContentQueryInput!) {
  magazineScheduledContent(input: $input) {
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
        taxonomy {
          edges {
            node {
              id
            }
          }
        }
        ... on ContentCompany {
          city
          country
          website
          companyType
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
