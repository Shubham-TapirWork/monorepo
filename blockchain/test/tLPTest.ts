import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import {HardhatEthersSigner} from "@nomicfoundation/hardhat-ethers/signers";
const { ethers } = require("hardhat"); // assuming commonjs

describe("TLP", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, managerAddress] = await hre.ethers.getSigners();
    const accounts = await hre.ethers.getSigners();

    const LP = await hre.ethers.getContractFactory("TLiquidityPool");

    // right now giving fake address in future we should test it with pool
    const lp = await LP.deploy(managerAddress.address);

    const TETH = await hre.ethers.getContractFactory("TETH");
    const tETH = await TETH.deploy(lp.target);

    await lp.setContractTETH(tETH.target);

    return {owner, otherAccount, lp, tETH, accounts, managerAddress};
  }


  describe("Deployment", function () {
    it("Should be the right deployment parameters",async function() {
      const {owner, lp, tETH} = await loadFixture(deployOneYearLockFixture);

      expect(await lp.owner()).to.be.equal(owner.address);
      expect(await lp.tETH()).to.be.equal(tETH.target)
    });
    it("Should fail if i try to set another tETH",async function() {
      const {owner, lp, tETH} = await loadFixture(deployOneYearLockFixture);

      await expect(lp.setContractTETH(owner.address)).to.be.revertedWithCustomError(lp, "TETHAlreadySet")
    });
  });

  describe("Deposit/Withdraw", function() {
    it("Should be share/totalShare equal when first user deposits the ether", async function() {
      const {accounts, otherAccount, lp, tETH} = await loadFixture(deployOneYearLockFixture);

      const firstAccount = accounts[1]
      await lp.connect(firstAccount).deposit({value: ethers.parseEther("1")})

      expect(await tETH.totalShares()).to.be.equal(await tETH.shares(firstAccount.address))
      expect(await tETH.balanceOf(firstAccount)).to.be.equal(ethers.parseEther("1"))
    });

    it("Should be 1/2 their shares, when two person mints same amount", async function() {
      const {managerAddress, accounts, otherAccount, lp, tETH} = await loadFixture(deployOneYearLockFixture);

      const firstAccount = accounts[1]
      const secondAccount = accounts[2]
      const thirdAccount = accounts[3]

      await lp.connect(firstAccount).deposit({value: ethers.parseEther("1")})
      await lp.connect(secondAccount).deposit({value: ethers.parseEther("1")})

      expect(await tETH.shares(secondAccount.address))
          .to.be.equal(await tETH.shares(firstAccount.address))
      expect(await tETH.balanceOf(firstAccount.address)).to.be.equal(ethers.parseEther("1"))

      // update rewards by 3 Ether, now their balance should be 2.5 and 2.5 instead of 1
      await lp.connect(managerAddress).rebase(ethers.parseEther("3"));

      expect(await tETH.balanceOf(firstAccount.address)).to.be.equal(ethers.parseEther("2.5"))
      expect(await tETH.balanceOf(secondAccount.address)).to.be.equal(ethers.parseEther("2.5"))
      expect(await tETH.balanceOf(thirdAccount.address)).to.be.equal(0)
    });

  });

});
