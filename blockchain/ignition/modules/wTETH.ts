import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WtETH = buildModule("WTETH", (m) => {
    const liquidityPoolAddress = "0x96A3b23FeeB97D22C807829491372c56Ff2e0036";
    const tETH = "0x90033B32d177AB85A365661568cfba0e04BFC5c0";

    const WtETH =  m.contract("WtETH", [liquidityPoolAddress, tETH]);
    return { WtETH };
});

export default WtETH;
