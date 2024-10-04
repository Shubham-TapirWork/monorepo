import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  gasReporter: {
    enabled: true,
  },
  networks: {
    // sepolia: {
    //   chainId: 11155111,
    //   url: process.env.SEPOLIA_URL,
    //   accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    // },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },

};

export default config;
