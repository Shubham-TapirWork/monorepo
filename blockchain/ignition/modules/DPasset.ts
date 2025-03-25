import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DPasset = buildModule("DPasset", (m) => {

    const DPasset =  m.contract("DPasset", ["test", "test"]);
    return { DPasset };
});

export default DPasset;
