import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const YBwtETH = buildModule("YBwtETH", (m) => {

    const YBwtETH =  m.contract("YBwtETH", ["test", "test"]);
    return { YBwtETH };
});

export default YBwtETH;
