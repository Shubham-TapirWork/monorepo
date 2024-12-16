import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StableSwap = buildModule("StableSwap", (m) => {
    const tETH = "0x9a8A908A68b8a9086f3aD8035C6E7a07323FD90F";

    const StableSwap =  m.contract("StableSwap", [[tETH, tETH]]);
    return { StableSwap };
});

export default StableSwap;
