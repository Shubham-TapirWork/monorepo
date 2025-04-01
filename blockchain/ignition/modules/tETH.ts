import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TETH = buildModule("TETH", (m) => {
    const liquidityPoolAddress = "0xcfFEdb8E09a7029ae3181c93541000823A366337";

    const TETH =  m.contract("TETH", [liquidityPoolAddress]);
    return { TETH };
});

export default TETH;
