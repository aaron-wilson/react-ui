/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query ListTrips($first: Int!) {\n    trips(first: $first) {\n      items {\n        id\n        city\n        version\n        updatedAt\n        days {\n          id\n          date\n        }\n      }\n      nextCursor\n    }\n  }\n": typeof types.ListTripsDocument,
    "\n  query TripDetails($id: ID!) {\n    trip(id: $id) {\n      id\n      ownerId\n      city\n      version\n      updatedAt\n      preferences {\n        interests\n        pace\n      }\n      days {\n        id\n        date\n        activities {\n          id\n          title\n          pinned\n        }\n      }\n      share {\n        token\n        expiresAt\n      }\n    }\n  }\n": typeof types.TripDetailsDocument,
    "\n  mutation StartCreate($input: CreateTripInput!) {\n    startCreateGeneration(input: $input) {\n      id\n      status\n      tripId\n    }\n  }\n": typeof types.StartCreateDocument,
    "\n  mutation StartRefine($input: RefineTripInput!) {\n    startRefineGeneration(input: $input) {\n      id\n      status\n      tripId\n    }\n  }\n": typeof types.StartRefineDocument,
    "\n  mutation PinActivity($input: PinActivityInput!) {\n    pinActivity(input: $input) {\n      id\n      version\n    }\n  }\n": typeof types.PinActivityDocument,
    "\n  mutation SwapActivity($input: SwapActivityInput!) {\n    swapActivity(input: $input) {\n      id\n      version\n    }\n  }\n": typeof types.SwapActivityDocument,
    "\n  mutation ShareTrip($input: ShareTripInput!) {\n    shareTrip(input: $input) {\n      id\n      ownerId\n      version\n      share {\n        token\n        expiresAt\n      }\n    }\n  }\n": typeof types.ShareTripDocument,
    "\n  query SharedTrip($ownerId: ID!, $tripId: ID!, $token: String!) {\n    sharedTrip(ownerId: $ownerId, tripId: $tripId, token: $token) {\n      id\n      city\n      updatedAt\n      days {\n        id\n        date\n        activities {\n          id\n          title\n          pinned\n        }\n      }\n    }\n  }\n": typeof types.SharedTripDocument,
};
const documents: Documents = {
    "\n  query ListTrips($first: Int!) {\n    trips(first: $first) {\n      items {\n        id\n        city\n        version\n        updatedAt\n        days {\n          id\n          date\n        }\n      }\n      nextCursor\n    }\n  }\n": types.ListTripsDocument,
    "\n  query TripDetails($id: ID!) {\n    trip(id: $id) {\n      id\n      ownerId\n      city\n      version\n      updatedAt\n      preferences {\n        interests\n        pace\n      }\n      days {\n        id\n        date\n        activities {\n          id\n          title\n          pinned\n        }\n      }\n      share {\n        token\n        expiresAt\n      }\n    }\n  }\n": types.TripDetailsDocument,
    "\n  mutation StartCreate($input: CreateTripInput!) {\n    startCreateGeneration(input: $input) {\n      id\n      status\n      tripId\n    }\n  }\n": types.StartCreateDocument,
    "\n  mutation StartRefine($input: RefineTripInput!) {\n    startRefineGeneration(input: $input) {\n      id\n      status\n      tripId\n    }\n  }\n": types.StartRefineDocument,
    "\n  mutation PinActivity($input: PinActivityInput!) {\n    pinActivity(input: $input) {\n      id\n      version\n    }\n  }\n": types.PinActivityDocument,
    "\n  mutation SwapActivity($input: SwapActivityInput!) {\n    swapActivity(input: $input) {\n      id\n      version\n    }\n  }\n": types.SwapActivityDocument,
    "\n  mutation ShareTrip($input: ShareTripInput!) {\n    shareTrip(input: $input) {\n      id\n      ownerId\n      version\n      share {\n        token\n        expiresAt\n      }\n    }\n  }\n": types.ShareTripDocument,
    "\n  query SharedTrip($ownerId: ID!, $tripId: ID!, $token: String!) {\n    sharedTrip(ownerId: $ownerId, tripId: $tripId, token: $token) {\n      id\n      city\n      updatedAt\n      days {\n        id\n        date\n        activities {\n          id\n          title\n          pinned\n        }\n      }\n    }\n  }\n": types.SharedTripDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListTrips($first: Int!) {\n    trips(first: $first) {\n      items {\n        id\n        city\n        version\n        updatedAt\n        days {\n          id\n          date\n        }\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query ListTrips($first: Int!) {\n    trips(first: $first) {\n      items {\n        id\n        city\n        version\n        updatedAt\n        days {\n          id\n          date\n        }\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TripDetails($id: ID!) {\n    trip(id: $id) {\n      id\n      ownerId\n      city\n      version\n      updatedAt\n      preferences {\n        interests\n        pace\n      }\n      days {\n        id\n        date\n        activities {\n          id\n          title\n          pinned\n        }\n      }\n      share {\n        token\n        expiresAt\n      }\n    }\n  }\n"): (typeof documents)["\n  query TripDetails($id: ID!) {\n    trip(id: $id) {\n      id\n      ownerId\n      city\n      version\n      updatedAt\n      preferences {\n        interests\n        pace\n      }\n      days {\n        id\n        date\n        activities {\n          id\n          title\n          pinned\n        }\n      }\n      share {\n        token\n        expiresAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StartCreate($input: CreateTripInput!) {\n    startCreateGeneration(input: $input) {\n      id\n      status\n      tripId\n    }\n  }\n"): (typeof documents)["\n  mutation StartCreate($input: CreateTripInput!) {\n    startCreateGeneration(input: $input) {\n      id\n      status\n      tripId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StartRefine($input: RefineTripInput!) {\n    startRefineGeneration(input: $input) {\n      id\n      status\n      tripId\n    }\n  }\n"): (typeof documents)["\n  mutation StartRefine($input: RefineTripInput!) {\n    startRefineGeneration(input: $input) {\n      id\n      status\n      tripId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PinActivity($input: PinActivityInput!) {\n    pinActivity(input: $input) {\n      id\n      version\n    }\n  }\n"): (typeof documents)["\n  mutation PinActivity($input: PinActivityInput!) {\n    pinActivity(input: $input) {\n      id\n      version\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SwapActivity($input: SwapActivityInput!) {\n    swapActivity(input: $input) {\n      id\n      version\n    }\n  }\n"): (typeof documents)["\n  mutation SwapActivity($input: SwapActivityInput!) {\n    swapActivity(input: $input) {\n      id\n      version\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ShareTrip($input: ShareTripInput!) {\n    shareTrip(input: $input) {\n      id\n      ownerId\n      version\n      share {\n        token\n        expiresAt\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ShareTrip($input: ShareTripInput!) {\n    shareTrip(input: $input) {\n      id\n      ownerId\n      version\n      share {\n        token\n        expiresAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SharedTrip($ownerId: ID!, $tripId: ID!, $token: String!) {\n    sharedTrip(ownerId: $ownerId, tripId: $tripId, token: $token) {\n      id\n      city\n      updatedAt\n      days {\n        id\n        date\n        activities {\n          id\n          title\n          pinned\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query SharedTrip($ownerId: ID!, $tripId: ID!, $token: String!) {\n    sharedTrip(ownerId: $ownerId, tripId: $tripId, token: $token) {\n      id\n      city\n      updatedAt\n      days {\n        id\n        date\n        activities {\n          id\n          title\n          pinned\n        }\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;