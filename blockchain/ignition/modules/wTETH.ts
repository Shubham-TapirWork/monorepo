import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WtETH = buildModule("WTETH", (m) => {
    const liquidityPoolAddress = "0xcfFEdb8E09a7029ae3181c93541000823A366337";
    const tETH = "0x6d87012eF7De41aC25D24a1962bB2Cb6E70879E9";

    const WtETH =  m.contract("WtETH", [liquidityPoolAddress, tETH]);
    return { WtETH };
});

export default WtETH;
