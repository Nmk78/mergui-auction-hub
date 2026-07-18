import assert from "node:assert/strict";
import test from "node:test";
import {
  availableForAuction,
  isPositiveWholeMoney,
  minimumValidBid,
  selectWinningBid,
  settleWinningWallet,
} from "../convex/lib/auctionRules.ts";

test("minimum bid uses the opening price before any bids", () => {
  assert.equal(
    minimumValidBid({
      bidCount: 0,
      startingPrice: 720_000,
      currentPrice: 720_000,
      minimumIncrement: 20_000,
    }),
    720_000,
  );
});

test("minimum bid adds the configured increment after bidding starts", () => {
  assert.equal(
    minimumValidBid({
      bidCount: 4,
      startingPrice: 720_000,
      currentPrice: 800_000,
      minimumIncrement: 20_000,
    }),
    820_000,
  );
});

test("winner is highest amount with earliest timestamp resolving a tie", () => {
  const earliestHighBid = { id: "first", amount: 900_000, placedAt: 100 };
  const winner = selectWinningBid([
    { id: "lower", amount: 880_000, placedAt: 80 },
    { id: "later", amount: 900_000, placedAt: 120 },
    earliestHighBid,
  ]);
  assert.equal(winner, earliestHighBid);
});

test("raising an own leading bid can reuse its existing reservation", () => {
  assert.equal(availableForAuction(1_000_000, 800_000, 600_000), 800_000);
});

test("settlement debits balance and releases the winning reservation", () => {
  assert.deepEqual(settleWinningWallet(1_500_000, 900_000, 900_000), {
    balanceAfter: 600_000,
    reservedAfter: 0,
  });
});

test("settlement rejects insufficient balance or reservation", () => {
  assert.equal(settleWinningWallet(800_000, 900_000, 900_000), null);
  assert.equal(settleWinningWallet(1_500_000, 850_000, 900_000), null);
});

test("money values must be positive safe integers", () => {
  assert.equal(isPositiveWholeMoney(1), true);
  assert.equal(isPositiveWholeMoney(0), false);
  assert.equal(isPositiveWholeMoney(1.5), false);
  assert.equal(isPositiveWholeMoney(Number.MAX_SAFE_INTEGER + 1), false);
});
