import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WtETH = buildModule("WTETH", (m) => {
    const liquidityPoolAddress = "0x46991C7b9Cc23561F513dF5d8bd5045B37c51AC6";
    const tETH = "0xf5E26358675655e6055f1A79902C8941FbECFbA6";

    const WtETH =  m.contract("WtETH", [liquidityPoolAddress, tETH]);
    return { WtETH };
});

export default WtETH;
