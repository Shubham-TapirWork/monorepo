import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WtETH = buildModule("WTETH", (m) => {
    const liquidityPoolAddress = "0xDf6de089f828B930B1f7eFe289DfC17Df6E1B931";
    const tETH = "0x9a8A908A68b8a9086f3aD8035C6E7a07323FD90F";

    const WtETH =  m.contract("WtETH", [liquidityPoolAddress, tETH]);
    return { WtETH };
});

export default WtETH;
