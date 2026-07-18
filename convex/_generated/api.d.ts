/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as assessments from "../assessments.js";
import type * as assistant from "../assistant.js";
import type * as auctions from "../auctions.js";
import type * as auth from "../auth.js";
import type * as autoBidding from "../autoBidding.js";
import type * as batches from "../batches.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as http from "../http.js";
import type * as lib_auctionRules from "../lib/auctionRules.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_batchValidation from "../lib/batchValidation.js";
import type * as lib_bidding from "../lib/bidding.js";
import type * as lib_openrouter from "../lib/openrouter.js";
import type * as lib_server from "../lib/server.js";
import type * as profiles from "../profiles.js";
import type * as wallets from "../wallets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  assessments: typeof assessments;
  assistant: typeof assistant;
  auctions: typeof auctions;
  auth: typeof auth;
  autoBidding: typeof autoBidding;
  batches: typeof batches;
  crons: typeof crons;
  debug: typeof debug;
  http: typeof http;
  "lib/auctionRules": typeof lib_auctionRules;
  "lib/auth": typeof lib_auth;
  "lib/batchValidation": typeof lib_batchValidation;
  "lib/bidding": typeof lib_bidding;
  "lib/openrouter": typeof lib_openrouter;
  "lib/server": typeof lib_server;
  profiles: typeof profiles;
  wallets: typeof wallets;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
