import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DPwtETH = buildModule("DPwtETH", (m) => {

    const DPwtETH =  m.contract("DPwtETH", ["test", "test"]);
    return { DPwtETH };
});

export default DPwtETH;
