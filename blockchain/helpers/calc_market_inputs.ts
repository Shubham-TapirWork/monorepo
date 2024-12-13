// Pendle V2 PT AMM Basic Definitions in TypeScript

// Importing necessary mathematical functions
import { log } from "mathjs";

// Define constants (if needed)
const oneYearDuration = 365 * 24 * 60 * 60; // Seconds in a year

// Define the market state interface
interface MarketState {
  nsy: number; // Number of SY tokens in the market at time t
  npt: number; // Number of PT tokens in the market at time t
  syExchangeRate: number; // Exchange rate of SY token to asset at time t
  texpiry: number; // Expiry time of PT token
  t: number; // Current time in seconds
  scalarRoot: number; // Scalar root parameter for the market
  feeRateRoot: number; // Fee rate root parameter for the market
  initialAnchor: number; // Initial rate anchor for the market
}

// Function to calculate totalAsset
const totalAsset = (nsy: number, syExchangeRate: number): number => {
  return nsy * syExchangeRate;
};

// Function to calculate timeToExpiry
const timeToExpiry = (texpiry: number, t: number): number => {
  return texpiry - t;
};

// Function to calculate yearsToExpiry
const yearsToExpiry = (timeToExpiry: number): number => {
  return timeToExpiry / oneYearDuration;
};

// Function to calculate proportion
const proportion = (npt: number, nsy: number): number => {
  return npt / (npt + nsy);
};

// Function to calculate rateScalar
const rateScalar = (scalarRoot: number, yearsToExpiry: number): number => {
  return scalarRoot / yearsToExpiry;
};

// Function to calculate exchangeRate
const exchangeRate = (
  proportion: number,
  rateScalar: number,
  rateAnchor: number
): number => {
  return (
    log(proportion / (1 - proportion)) / rateScalar + rateAnchor
  );
};

// Function to calculate rateAnchor from exchangeRate
const rateAnchor = (
  exchangeRate: number,
  proportion: number,
  rateScalar: number
): number => {
  return exchangeRate - log(proportion / (1 - proportion)) / rateScalar;
};

// Function to calculate rateAnchor and exchangeRate using scalarRoot
const rateAnchorWithScalarRoot = (
  proportion: number,
  scalarRoot: number,
  yearsToExpiry: number
): { rateAnchor: number; exchangeRate: number } => {
  const rateScalar = scalarRoot / yearsToExpiry;
  const rateAnchor = log(proportion / (1 - proportion)) / rateScalar;
  const exchangeRate = rateAnchor + log(proportion / (1 - proportion)) / rateScalar;
  return { rateAnchor, exchangeRate };
};

// Export all functions for testing and reuse
export {
  totalAsset,
  timeToExpiry,
  yearsToExpiry,
  proportion,
  rateScalar,
  exchangeRate,
  rateAnchor,
  rateAnchorWithScalarRoot,
};
