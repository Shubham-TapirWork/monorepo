import { exchangeRate, rateAnchor } from "../helpers/calc_market_inputs";
import { log } from "mathjs";

// Test function to check if rateAnchor is the inverse of exchangeRate
const testInverseFunctions = () => {
  const proportion = 0.5; // Example proportion
  const rateScalar = 2; // Example rateScalar
  const rateAnchorValue = 1; // Example rateAnchor

  // Calculate exchange rate using the forward function
  const calculatedExchangeRate = exchangeRate(proportion, rateScalar, rateAnchorValue);

  // Calculate rateAnchor back using the inverse function
  const calculatedRateAnchor = rateAnchor(calculatedExchangeRate, proportion, rateScalar);

  // Check if the calculated rateAnchor matches the original rateAnchorValue
  const isInverse = Math.abs(calculatedRateAnchor - rateAnchorValue) < 1e-6;

  if (isInverse) {
    console.log("Test passed: rateAnchor is the inverse of exchangeRate.");
  } else {
    console.error("Test failed: rateAnchor is not the inverse of exchangeRate.");
    console.error(`Original rateAnchor: ${rateAnchorValue}, Calculated rateAnchor: ${calculatedRateAnchor}`);
  }
};

const testRateAnchorWithScalarRoot = () => {
    const proportion = 0.51;
    const scalarRoot = 2 * 6233025635000000000;
    const yearsToExpiry = 1;
  
    const result = rateAnchorWithScalarRoot(proportion, scalarRoot, yearsToExpiry);
  
    console.log("Testing rateAnchorWithScalarRoot:");
    console.log(`Input proportion: ${proportion}, scalarRoot: ${scalarRoot}, yearsToExpiry: ${yearsToExpiry}`);
    console.log(`Output rateAnchor: ${result.rateAnchor}, exchangeRate: ${result.exchangeRate}`);
  };



// Run the test
testInverseFunctions();
testRateAnchorWithScalarRoot();
