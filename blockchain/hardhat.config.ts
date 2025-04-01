import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as process from "node:process";

require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
          enabled: true,
          runs: 1000,
        },
    },
  },
  gasReporter: {
    enabled: true,
  },
  networks: {
    sepolia: {
      chainId: 11155111,
      url: process.env.SEPOLIA_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
    bsc: {
      chainId: 97,
      url: process.env.BSC_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },

};

export default config;
