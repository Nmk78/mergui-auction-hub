export type AuctionPriceState = {
  bidCount: number;
  startingPrice: number;
  currentPrice: number;
  minimumIncrement: number;
};

export function minimumValidBid(auction: AuctionPriceState) {
  return auction.bidCount === 0
    ? auction.startingPrice
    : auction.currentPrice + auction.minimumIncrement;
}

export function availableForAuction(
  balance: number,
  reserved: number,
  existingAuctionHold = 0,
) {
  return balance - reserved + existingAuctionHold;
}

export function selectWinningBid<
  T extends { amount: number; placedAt: number },
>(bids: readonly T[]) {
  return [...bids].sort(
    (left, right) =>
      right.amount - left.amount || left.placedAt - right.placedAt,
  )[0];
}

export function settleWinningWallet(
  balance: number,
  reserved: number,
  winningAmount: number,
) {
  if (
    !isPositiveWholeMoney(winningAmount) ||
    balance < winningAmount ||
    reserved < winningAmount
  ) {
    return null;
  }
  return {
    balanceAfter: balance - winningAmount,
    reservedAfter: reserved - winningAmount,
  };
}

export function isPositiveWholeMoney(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}
