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
    const TETH = await hre.ethers.getContractFactory("TETH");

    // right now giving fake address in future we should test it with pool
    const teth = await TETH.deploy(owner.address);

    return {owner, otherAccount, teth};
  }


  describe("Deployment", function () {
    it("Should be the right deployment parameters",async function() {
      const {owner, teth} = await loadFixture(deployOneYearLockFixture);

      expect(await teth.owner()).to.be.equal(owner.address);
      expect(await teth.liquidityPool()).to.be.equal(owner.address);
    });
  });


});
