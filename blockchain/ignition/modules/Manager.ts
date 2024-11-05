import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Manager = buildModule("Manager", (m) => {
    const Manager =  m.contract("Manager");
    return { Manager };
});

export default Manager;
