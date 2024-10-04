import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import {HardhatEthersSigner} from "@nomicfoundation/hardhat-ethers/signers";
const { ethers } = require("hardhat"); // assuming commonjs

describe("TrainersContract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const LP = await hre.ethers.getContractFactory("TLiquidityPool");

    // right now giving fake address in future we should test it with pool
    const lp = await LP.deploy(owner.address);

    return {owner, otherAccount, lp};
  }


  describe("Deployment", function () {
    it("Should be the right deployment parameters",async function() {
      const {owner, lp} = await loadFixture(deployOneYearLockFixture);

      expect(await lp.owner()).to.be.equal(owner.address);
    });
  });


});
