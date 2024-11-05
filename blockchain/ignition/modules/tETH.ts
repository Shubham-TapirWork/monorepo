import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TETH = buildModule("TETH", (m) => {
    const liquidityPoolAddress = "0x46991C7b9Cc23561F513dF5d8bd5045B37c51AC6";

    const TETH =  m.contract("TETH", [liquidityPoolAddress]);
    return { TETH };
});

export default TETH;
