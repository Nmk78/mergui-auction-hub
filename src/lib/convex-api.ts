import { makeFunctionReference } from "convex/server";

export const convexApi = {
  profiles: {
    current: makeFunctionReference<"query">("profiles:current"),
    initialize: makeFunctionReference<"mutation">("profiles:initialize"),
    ensureProfile: makeFunctionReference<"mutation">("profiles:ensureProfile"),
  },
  batches: {
    create: makeFunctionReference<"mutation">("batches:create"),
    update: makeFunctionReference<"mutation">("batches:update"),
    remove: makeFunctionReference<"mutation">("batches:remove"),
    get: makeFunctionReference<"query">("batches:get"),
    listMine: makeFunctionReference<"query">("batches:listMine"),
    generateUploadUrl:
      makeFunctionReference<"mutation">("batches:generateUploadUrl"),
    addImage: makeFunctionReference<"mutation">("batches:addImage"),
    removeImage: makeFunctionReference<"mutation">("batches:removeImage"),
  },
  assessments: {
    request: makeFunctionReference<"action">("assessments:request"),
    getForBatch: makeFunctionReference<"query">("assessments:getForBatch"),
    ask: makeFunctionReference<"action">("assistant:ask"),
  },
  auctions: {
    publish: makeFunctionReference<"mutation">("auctions:publish"),
    listPublic: makeFunctionReference<"query">("auctions:listPublic"),
    getPublic: makeFunctionReference<"query">("auctions:getPublic"),
    listMine: makeFunctionReference<"query">("auctions:listMine"),
    listMyBids: makeFunctionReference<"query">("auctions:listMyBids"),
    listPurchases: makeFunctionReference<"query">("auctions:listPurchases"),
    placeBid: makeFunctionReference<"mutation">("auctions:placeBid"),
  },
  wallets: {
    current: makeFunctionReference<"query">("wallets:current"),
    transactions: makeFunctionReference<"query">("wallets:transactions"),
  },
  analytics: {
    seller: makeFunctionReference<"query">("analytics:seller"),
  },
  debug: {
    status: makeFunctionReference<"query">("debug:status"),
    clearCurrentSession:
      makeFunctionReference<"mutation">("debug:clearCurrentSession"),
    clearAllSessions:
      makeFunctionReference<"mutation">("debug:clearAllSessions"),
    resetCurrentUserData:
      makeFunctionReference<"mutation">("debug:resetCurrentUserData"),
    deleteCurrentAccount:
      makeFunctionReference<"mutation">("debug:deleteCurrentAccount"),
    clearAuthRateLimit:
      makeFunctionReference<"mutation">("debug:clearAuthRateLimit"),
  },
} as const;
