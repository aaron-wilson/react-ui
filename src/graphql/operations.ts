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

export const TripDetails = graphql(/* GraphQL */ `
  query TripDetails($id: ID!) {
    trip(id: $id) {
      id
      ownerId
      city
      version
      updatedAt
      preferences {
        interests
        pace
      }
      days {
        id
        date
        activities {
          id
          title
          pinned
        }
      }
      share {
        token
        expiresAt
      }
    }
  }
`);

export const StartCreate = graphql(/* GraphQL */ `
  mutation StartCreate($input: CreateTripInput!) {
    startCreateGeneration(input: $input) {
      id
      status
      tripId
    }
  }
`);

export const StartRefine = graphql(/* GraphQL */ `
  mutation StartRefine($input: RefineTripInput!) {
    startRefineGeneration(input: $input) {
      id
      status
      tripId
    }
  }
`);

export const PinActivity = graphql(/* GraphQL */ `
  mutation PinActivity($input: PinActivityInput!) {
    pinActivity(input: $input) {
      id
      version
    }
  }
`);

export const SwapActivity = graphql(/* GraphQL */ `
  mutation SwapActivity($input: SwapActivityInput!) {
    swapActivity(input: $input) {
      id
      version
    }
  }
`);

export const ShareTrip = graphql(/* GraphQL */ `
  mutation ShareTrip($input: ShareTripInput!) {
    shareTrip(input: $input) {
      id
      ownerId
      version
      share {
        token
        expiresAt
      }
    }
  }
`);

export const SharedTrip = graphql(/* GraphQL */ `
  query SharedTrip($ownerId: ID!, $tripId: ID!, $token: String!) {
    sharedTrip(ownerId: $ownerId, tripId: $tripId, token: $token) {
      id
      city
      updatedAt
      days {
        id
        date
        activities {
          id
          title
          pinned
        }
      }
    }
  }
`);
