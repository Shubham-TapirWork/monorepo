import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TETH = buildModule("TETH", (m) => {
    const liquidityPoolAddress = "0x96A3b23FeeB97D22C807829491372c56Ff2e0036";

    const TETH =  m.contract("TETH", [liquidityPoolAddress]);
    return { TETH };
});

export default TETH;
