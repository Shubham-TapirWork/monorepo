import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TLiquidityPool = buildModule("TLiquidityPool",  (m) => {

    const TLiquidityPool = m.contract("TLiquidityPool", ["0xB1A64b424ac21f1c96ff121b75A63fdfD4b3DfC2"]);
    return { TLiquidityPool };
});

export default TLiquidityPool;
