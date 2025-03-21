import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const YBasset = buildModule("YBasset", (m) => {

    const YBasset =  m.contract("YBasset", ["test", "test"]);
    return { YBasset };
});

export default YBasset;
