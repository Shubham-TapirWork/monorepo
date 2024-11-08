import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WtETH = buildModule("WTETH", (m) => {
    const liquidityPoolAddress = "0x59ca61197b662C92247C0C739F3d0eEDF0ADbDeB";
    const tETH = "0xA7175B14f711a9Dfd7486f28F410A4992f837959";

    const WtETH =  m.contract("WtETH", [liquidityPoolAddress, tETH]);
    return { WtETH };
});

export default WtETH;
