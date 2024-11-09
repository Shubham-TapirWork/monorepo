import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TETH = buildModule("TETH", (m) => {
    const liquidityPoolAddress = "0xDf6de089f828B930B1f7eFe289DfC17Df6E1B931";

    const TETH =  m.contract("TETH", [liquidityPoolAddress]);
    return { TETH };
});

export default TETH;
