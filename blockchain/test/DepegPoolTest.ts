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

        let DP_asset_F = await hre.ethers.getContractFactory("DPasset");
        let YB_asset_F = await hre.ethers.getContractFactory("YBasset");
        const DP_asset = await DP_asset_F.deploy("DP", "DP");
        const YB_asset = await YB_asset_F.deploy("YB", "YB");

        // Deploy DepegPool with required arguments
        const DepegPool = await hre.ethers.getContractFactory("DepegPool");
        const depegPool = await DepegPool.deploy(lp.target, wTETH.target, DP_asset.target, YB_asset.target, lpTime, "Test Depeg Pool");

        await YB_asset.setContractDepegPool(depegPool.target);
        await DP_asset.setContractDepegPool(depegPool.target);

        const Manager = await hre.ethers.getContractFactory("Manager")
        const manager = await Manager.deploy()

        return { depegPool, accounts, DP_asset, YB_asset, lp, wTETH, manager };
    }

    it("Should correctly initialize DepegPool with provided arguments", async function () {
        const { lp, wTETH, DP_asset, YB_asset, depegPool } = await deployAdditionalFixtures();

        expect(await depegPool.liquidityPool()).to.equal(lp.target);
        expect(await depegPool.asset()).to.equal(wTETH.target);
        expect(await depegPool.DP_asset()).to.equal(DP_asset.target);
        expect(await depegPool.YB_asset()).to.equal(YB_asset.target);
    });

    it("Should allow splitting tokens into YB and DP tokens", async function () {
        const { accounts, depegPool, wTETH, DP_asset, YB_asset } = await deployAdditionalFixtures();
        const firstAccount = accounts[1];
        const splitAmount = ethers.parseEther("1");

        // Assume firstAccount has approved the tokens for splitting
        await wTETH.mint(firstAccount.address, splitAmount);
        await wTETH.connect(firstAccount).approve(depegPool.target, splitAmount);

        await depegPool.connect(firstAccount).splitToken(splitAmount);

        expect(await DP_asset.balanceOf(firstAccount.address)).to.equal(splitAmount / BigInt(2));
        expect(await YB_asset.balanceOf(firstAccount.address)).to.equal(splitAmount / BigInt(2));
    });

    it("Should allow unsplitting tokens back into asset", async function () {
        const { accounts, wTETH, depegPool, DP_asset, YB_asset } = await deployAdditionalFixtures();
        const firstAccount = accounts[1];
        const splitAmount = ethers.parseEther("1");

        // Setup: Split tokens first
        await wTETH.mint(firstAccount.address, splitAmount);
        await wTETH.connect(firstAccount).approve(depegPool.target, splitAmount);
        await depegPool.connect(firstAccount).splitToken(splitAmount);

        await DP_asset.connect(firstAccount).approve(depegPool.target, splitAmount / BigInt(2));
        await YB_asset.connect(firstAccount).approve(depegPool.target, splitAmount / BigInt(2));

        await depegPool.connect(firstAccount).unSplitToken(splitAmount);

        expect(await wTETH.balanceOf(firstAccount.address)).to.equal(splitAmount);
    });

    it("Should allow redeeming tokens for asset after resolving depeg, depeg isn't happening", async function () {
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
        const { accounts, YB_asset } = await deployAdditionalFixtures();
        const firstAccount = accounts[1];

        await expect(YB_asset.connect(firstAccount).mint(firstAccount.address, ethers.parseEther("100")))
          .to.be.revertedWith("YBasset: Only depeg pool contract function");
    });

    it("Should not allow DP to mint tokens", async function () {
        const { accounts, DP_asset } = await deployAdditionalFixtures();
        const firstAccount = accounts[1];

        await expect(DP_asset.connect(firstAccount).mint(firstAccount.address, ethers.parseEther("100")))
          .to.be.revertedWith("DPasset: Only depeg pool contract function");
    });

    it("Should allow redeeming tokens for asset after resolving depeg, 20% depeg is happening", async function () {
        const { accounts, wTETH, depegPool, lp, YB_asset, DP_asset } = await deployAdditionalFixtures();
        const [firstAccount, secondAccount, thirdAccount] = accounts;
        const amount = ethers.parseEther("1");

        // start share is 1
        await lp.setShare(ethers.parseEther("1"));

        // giving 3 of them 1 asset and then splitting
        await wTETH.mint(firstAccount.address, amount);
        await wTETH.mint(secondAccount.address, amount);
        await wTETH.mint(thirdAccount.address, amount);
        await wTETH.connect(firstAccount).approve(depegPool.target, amount);
        await wTETH.connect(secondAccount).approve(depegPool.target, amount);
        await wTETH.connect(thirdAccount).approve(depegPool.target, amount);
        await depegPool.connect(firstAccount).splitToken(amount);
        await depegPool.connect(secondAccount).splitToken(amount);
        await depegPool.connect(thirdAccount).splitToken(amount);
        // splitting happened all have 0.5, 0.5

        // transferring correctly
        // we have 3 user 1 - will have (1DP, 0YB), 2 - (0 DP, 1 YB), 3 - (0.5 DP, 0.5 YB)
        await YB_asset.connect(firstAccount).transfer(secondAccount.address, amount / BigInt(2));
        await DP_asset.connect(secondAccount).transfer(firstAccount.address, amount / BigInt(2))

        // 10 % depeg is going
        await lp.setShare(ethers.parseEther("0.9"));

        // Simulate resolving a depeg, the situation when price has not changed or >= currentShares
        await network.provider.send("evm_increaseTime", [lpTime]);
        await network.provider.send("evm_mine");

        await depegPool.resolvePriceDepeg();

        // should revert if someone tries to redeem more amount, than he have
        await expect(depegPool.connect(firstAccount).redeemTokens(amount, amount))
          .to.be.revertedWithCustomError(YB_asset, "ERC20InsufficientBalance")
        await expect(depegPool.connect(firstAccount).redeemTokens(0, amount + BigInt(1)))
          .to.be.revertedWithCustomError(DP_asset, "ERC20InsufficientBalance")

        await depegPool.connect(firstAccount).redeemTokens(0, amount); // redeeming 1 DP
        await depegPool.connect(secondAccount).redeemTokens(amount, 0); // redeeming equal parts 1 YB
        await depegPool.connect(thirdAccount).redeemTokens(amount / BigInt(2), amount / BigInt(2)); // redeeming equal parts of YB and DP

        // The first accounts redeem should be 1.1 asset
        expect(await wTETH.balanceOf(firstAccount.address))
          .to.be.equal(amount + amount * BigInt(10) / BigInt(100));

        // The second accounts redeem should be 0.9 asset
        expect(await wTETH.balanceOf(secondAccount.address))
          .to.be.equal(amount - amount * BigInt(10) / BigInt(100));

        // The third accounts redeem should be 1 asset
        expect(await wTETH.balanceOf(thirdAccount.address))
          .to.be.equal(amount);

    });

    it("Should allow manager to deploy contracts", async function () {
      const { manager, lp, wTETH} = await deployAdditionalFixtures();
      await manager.deployDepeg(
        lp.target,
        wTETH.target,
        "test 1",
        "test 2",
        "test 1",
        "test 2",
        "test pool",
        1455
      )

      const module = await manager.depegModule(0)

      const DepegPool = await hre.ethers.getContractFactory("DepegPool")
      const depegPool = DepegPool.attach(module.depegPool)
      const YB = await hre.ethers.getContractFactory("YBasset")
      const yb = YB.attach(module.yb_asset)
      const DP = await hre.ethers.getContractFactory("DPasset")
      const dp = DP.attach(module.dp_asset)

      expect(await depegPool.DP_asset()).to.be.equal(module.dp_asset)
      expect(await depegPool.YB_asset()).to.be.equal(module.yb_asset)

      expect(await dp.depegPool()).to.be.equal(depegPool.target);
      expect(await yb.depegPool()).to.be.equal(depegPool.target);

    });

    it("Should fail if someone else tries to deploy", async function () {
      const { manager, lp, wTETH, accounts} = await deployAdditionalFixtures();

      const firstAccount = accounts[1];

      await expect(manager.connect(firstAccount).deployDepeg(
        lp.target,
        wTETH.target,
        "test 1",
        "test 2",
        "test 1",
        "test 2",
        "test pool",
        1455
      )).to.be.revertedWithCustomError(manager, "OwnableUnauthorizedAccount", )


    });

});


