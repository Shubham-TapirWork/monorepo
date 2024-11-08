import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TETH = buildModule("TETH", (m) => {
    const liquidityPoolAddress = "0x59ca61197b662C92247C0C739F3d0eEDF0ADbDeB";

    const TETH =  m.contract("TETH", [liquidityPoolAddress]);
    return { TETH };
});

export default TETH;
