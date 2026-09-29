import { graphql } from "../gql";

export const ListTrips = graphql(/* GraphQL */ `
  query ListTrips($first: Int!) {
    trips(first: $first) {
      items {
        id
        city
        version
        updatedAt
      }
      nextCursor
    }
  }
`);
