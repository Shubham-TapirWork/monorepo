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

    const LiquidityPool = await ethers.getContractFactory("LiquidityPoolMock");
    const liquidityPool = await LiquidityPool.deploy();
    const TETH = await hre.ethers.getContractFactory("TETH");

    // right now giving fake address in future we should test it with pool
    const tETH = await TETH.deploy(liquidityPool);

    return {owner, otherAccount, tETH, liquidityPool};
  }


  describe("Deployment", function () {
    it("should set the correct liquidity pool address", async function () {
      const {tETH, liquidityPool} = await loadFixture(deployOneYearLockFixture);
      expect(await tETH.liquidityPool()).to.equal(liquidityPool.target);
    });

    it("should set the correct token name, symbol, and decimals", async function () {
      const {tETH} = await loadFixture(deployOneYearLockFixture);
      expect(await tETH.name()).to.equal("tapir tETH");
      expect(await tETH.symbol()).to.equal("tETH");
      expect(await tETH.decimals()).to.equal(18);
    });
  });

  describe("Minting", function () {
    it("should mint shares and increase totalShares", async function () {
      const {tETH, owner, liquidityPool} = await loadFixture(deployOneYearLockFixture);
      const shareAmount = ethers.parseUnits("100", 18);

      await liquidityPool.mintShares(tETH.target,owner.address, shareAmount);

      expect(await tETH.shares(owner.address)).to.equal(shareAmount);
      expect(await tETH.totalShares()).to.equal(shareAmount);
    });

    it("should emit Transfer and TransferShares events on mint", async function () {
      const {tETH, owner, liquidityPool} = await loadFixture(deployOneYearLockFixture);
      const shareAmount = ethers.parseUnits("100", 18);

      await expect(liquidityPool.mintShares(tETH.target,owner.address, shareAmount))
        .to.emit(tETH, "TransferShares")
        .withArgs(ethers.ZeroAddress, owner.address, shareAmount);

      await expect(liquidityPool.mintShares(tETH.target,owner.address, shareAmount))
        .to.emit(tETH, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, shareAmount);
    });
  });

  describe("Burning", function () {
    it("should burn shares and decrease totalShares", async function () {
      const {tETH, owner, liquidityPool} = await loadFixture(deployOneYearLockFixture);

      const shareAmount = ethers.parseUnits("100", 18);

      await liquidityPool.mintShares(tETH.target, owner.address, shareAmount);
      await liquidityPool.burnShares(tETH.target, owner.address, shareAmount);

      expect(await tETH.shares(owner.address)).to.equal(0);
      expect(await tETH.totalShares()).to.equal(0);
    });

    it("should revert if trying to burn more than balance", async function () {
      const {tETH, owner, liquidityPool} = await loadFixture(deployOneYearLockFixture);

      const shareAmount = ethers.parseUnits("100", 18);

      await liquidityPool.mintShares(tETH.target,owner.address, shareAmount);
      await expect(liquidityPool.burnShares(tETH.target, owner.address, ethers.parseUnits("200", 18)))
        .to.be.revertedWith("BURN_AMOUNT_EXCEEDS_BALANCE");
    });
  });

  describe("Transfers", function () {
    it("should transfer shares between users", async function () {
      const {tETH, owner, otherAccount, liquidityPool} = await loadFixture(deployOneYearLockFixture);

      const shareAmount = ethers.parseUnits("100", 18);

      await liquidityPool.mintShares(tETH.target,owner.address, shareAmount);
      await tETH.connect(owner).transfer(otherAccount.address, shareAmount);

      expect(await tETH.shares(owner.address)).to.equal(0);
      expect(await tETH.shares(otherAccount.address)).to.equal(shareAmount);
    });

    it("should emit Transfer and TransferShares events on transfer", async function () {
      const {tETH, owner, otherAccount, liquidityPool} = await loadFixture(deployOneYearLockFixture);
      const shareAmount = ethers.parseUnits("100", 18);
      await liquidityPool.mintShares(tETH.target,owner.address, shareAmount);
      await expect(tETH.connect(owner).transfer(otherAccount.address, shareAmount))
        .to.emit(tETH, "Transfer")
        .withArgs(owner.address, otherAccount.address, shareAmount);
    });
  });

  describe("Allowances", function () {
    it("should set allowance for spender", async function () {
      const {tETH, owner, otherAccount} = await loadFixture(deployOneYearLockFixture);
      const amount = ethers.parseUnits("100", 18);
      await tETH.approve(otherAccount.address, amount);

      expect(await tETH.allowance(owner.address, otherAccount.address)).to.equal(amount);
    });

    it("should allow approved spender to transfer tokens", async function () {
      const {tETH, owner, otherAccount, liquidityPool} = await loadFixture(deployOneYearLockFixture);

      const amount = ethers.parseUnits("100", 18);

      await liquidityPool.mintShares(tETH.target,owner.address, amount);
      await tETH.approve(otherAccount.address, amount);

      await tETH.connect(otherAccount).transferFrom(owner.address, otherAccount.address, amount);

      expect(await tETH.shares(otherAccount.address)).to.equal(amount);
      expect(await tETH.shares(owner.address)).to.equal(0);
    });

    it("should revert if transfer amount exceeds allowance", async function () {
      const {tETH, owner, otherAccount, liquidityPool} = await loadFixture(deployOneYearLockFixture);
      const amount = ethers.parseUnits("100", 18);

      await liquidityPool.mintShares(tETH.target,owner.address, amount);
      await tETH.approve(otherAccount.address, ethers.parseUnits("50", 18));

      await expect(
        tETH.connect(otherAccount).transferFrom(owner.address, owner.address, amount)
      ).to.be.revertedWith("TETH: TRANSFER_AMOUNT_EXCEEDS_ALLOWANCE");
    });
  });


});
