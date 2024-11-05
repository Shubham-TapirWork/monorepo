import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TLiquidityPool = buildModule("TLiquidityPool", async (m) => {

    const TLiquidityPool = await m.contract("TLiquidityPool", ["0xB1A64b424ac21f1c96ff121b75A63fdfD4b3DfC2"]);
    return { TLiquidityPool };
});

export default TrainersContract;