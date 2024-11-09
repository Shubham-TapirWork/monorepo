import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TLiquidityPool = buildModule("TLiquidityPool",  (m) => {

    const TLiquidityPool = m.contract("TLiquidityPool", ["0xBf3F50076B12bFd3E379a18569861a8102eB8621"]);
    return { TLiquidityPool };
});

export default TLiquidityPool;
