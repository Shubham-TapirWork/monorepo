import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre, {ethers, network} from "hardhat";
import {expect} from "chai";
import {bigint} from "hardhat/internal/core/params/argumentTypes";

describe("DepegPool, YB, and DP Tests", function () {
   const lpTime = 86400;
   async function deployAdditionalFixtures() {
        const [owner, otherAccount, managerAddress] = await hre.ethers.getSigners();
        const accounts = await hre.ethers.getSigners();

        const WTETH = await hre.ethers.getContractFactory("WtETHMock");
        const wTETH = await WTETH.deploy();

        const LP = await hre.ethers.getContractFactory("LPMock");
        const lp = await LP.deploy();

        let DP_wtETH_F = await hre.ethers.getContractFactory("DPwtETH");
        let YB_wtETH_F = await hre.ethers.getContractFactory("YBwtETH");
        const DP_wtETH = await DP_wtETH_F.deploy("DP", "DP");
        const YB_wtETH = await YB_wtETH_F.deploy("YB", "YB");

        // Deploy DepegPool with required arguments
        const DepegPool = await hre.ethers.getContractFactory("DepegPool");
        const depegPool = await DepegPool.deploy(lp.target, wTETH.target, DP_wtETH.target, YB_wtETH.target, lpTime, "Test Depeg Pool");

        await YB_wtETH.setContractDepegPool(depegPool.target);
        await DP_wtETH.setContractDepegPool(depegPool.target);
        return { depegPool, accounts, DP_wtETH, YB_wtETH, lp, wTETH };
    }

    it("Should correctly initialize DepegPool with provided arguments", async function () {
        const { lp, wTETH, DP_wtETH, YB_wtETH, depegPool } = await deployAdditionalFixtures();

        expect(await depegPool.liquidityPool()).to.equal(lp.target);
        expect(await depegPool.wtETH()).to.equal(wTETH.target);
        expect(await depegPool.DP_wtETH()).to.equal(DP_wtETH.target);
        expect(await depegPool.YB_wtETH()).to.equal(YB_wtETH.target);
    });

    it("Should allow splitting tokens into YB and DP tokens", async function () {
        const { accounts, depegPool, wTETH, DP_wtETH, YB_wtETH } = await deployAdditionalFixtures();
        const firstAccount = accounts[1];
        const splitAmount = ethers.parseEther("1");

        // Assume firstAccount has approved the tokens for splitting
        await wTETH.mint(firstAccount.address, splitAmount);
        await wTETH.connect(firstAccount).approve(depegPool.target, splitAmount);

        await depegPool.connect(firstAccount).splitToken(splitAmount);

        expect(await DP_wtETH.balanceOf(firstAccount.address)).to.equal(splitAmount / BigInt(2));
        expect(await YB_wtETH.balanceOf(firstAccount.address)).to.equal(splitAmount / BigInt(2));
    });

    it("Should allow unsplitting tokens back into wtETH", async function () {
        const { accounts, wTETH, depegPool, DP_wtETH, YB_wtETH } = await deployAdditionalFixtures();
        const firstAccount = accounts[1];
        const splitAmount = ethers.parseEther("1");

        // Setup: Split tokens first
        await wTETH.mint(firstAccount.address, splitAmount);
        await wTETH.connect(firstAccount).approve(depegPool.target, splitAmount);
        await depegPool.connect(firstAccount).splitToken(splitAmount);

        await DP_wtETH.connect(firstAccount).approve(depegPool.target, splitAmount / BigInt(2));
        await YB_wtETH.connect(firstAccount).approve(depegPool.target, splitAmount / BigInt(2));

        await depegPool.connect(firstAccount).unSplitToken(splitAmount);

        expect(await wTETH.balanceOf(firstAccount.address)).to.equal(splitAmount);
    });

    it("Should allow redeeming tokens for wtETH after resolving depeg", async function () {
        const { accounts, wTETH, depegPool } = await deployAdditionalFixtures();
        const firstAccount = accounts[1];
        const amount = ethers.parseEther("1");

        // Setup: Split tokens first
        await wTETH.mint(firstAccount.address, amount);
        await wTETH.connect(firstAccount).approve(depegPool.target, amount);
        await depegPool.connect(firstAccount).splitToken(amount);

        // Simulate resolving a depeg, the situation when price has not changed or >= currentShares
        await network.provider.send("evm_increaseTime", [lpTime]);
        await network.provider.send("evm_mine");

        await depegPool.resolvePriceDepeg();
        await depegPool.connect(firstAccount).redeemTokens(amount / BigInt(2), amount / BigInt(2)); // redeeming equal parts of YB and DP

        const redeemedAmount = await wTETH.balanceOf(firstAccount.address);
        // The redeemed amount will be either 1 or adjusted depending on your logic in redeemTokens
        expect(redeemedAmount).to.be.equal(amount);
    });

    it("Should revert if trying to redeem tokens before resolving depeg", async function () {
        const { accounts, wTETH, depegPool } = await deployAdditionalFixtures();
        const firstAccount = accounts[1];
        const amount = ethers.parseEther("1");

        // Setup: Split tokens first
        await wTETH.mint(firstAccount.address, amount);
        await wTETH.connect(firstAccount).approve(depegPool.target, amount);
        await depegPool.connect(firstAccount).splitToken(amount);

        await expect(
            depegPool.connect(firstAccount).redeemTokens(amount / BigInt(2), amount / BigInt(2))
        ).to.be.revertedWith("DepegPool: the depeg is not resolved");
    });

    it("Should revert while trying to minting ethers", async function () {
        const { accounts, YB_wtETH } = await deployAdditionalFixtures();
        const firstAccount = accounts[1];

        await expect(YB_wtETH.connect(firstAccount).mint(firstAccount.address, ethers.parseEther("100")))
          .to.be.revertedWith("YBwtETH: Only depeg pool contract function");
    });

    it("Should not allow DP to mint tokens", async function () {
        const { accounts, DP_wtETH } = await deployAdditionalFixtures();
        const firstAccount = accounts[1];

        await expect(DP_wtETH.connect(firstAccount).mint(firstAccount.address, ethers.parseEther("100")))
          .to.be.revertedWith("DPwtETH: Only depeg pool contract function");
    });

});


