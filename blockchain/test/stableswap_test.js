const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Stable Swap tests", function () {
  let stableSwap, tokenA, tokenB;
  let owner, addr1;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    tokenA = await Token.deploy();
    await tokenA.waitForDeployment();
    tokenB = await Token.deploy();
    await tokenB.waitForDeployment();

    const amount = 10_000_000;

    await tokenA.transfer(addr1, amount);
    await tokenB.transfer(addr1, amount);
    await tokenA.transfer(addr2, amount);
    await tokenB.transfer(addr2, amount);

    const StableSwap = await ethers.getContractFactory("StableSwap");
    stableSwap = await StableSwap.deploy([tokenA.target, tokenB.target]);
    await stableSwap.waitForDeployment();

    await tokenA.connect(owner).approve(stableSwap.target, amount);
    await tokenB.connect(owner).approve(stableSwap.target, amount);

    await tokenA.connect(addr1).approve(stableSwap.target, amount);
    await tokenB.connect(addr1).approve(stableSwap.target, amount);

    await tokenA.connect(addr2).approve(stableSwap.target, amount);
    await tokenB.connect(addr2).approve(stableSwap.target, amount);
    await stableSwap.connect(owner).addLiquidity([1_000_000, 1_000_000], 2_000_000);
  });

  describe("addLiquidity", async function () {
    it("Should add liquidity and mint shares", async function () {
      const balanceOwner = await stableSwap.balanceOf(owner);
      expect(balanceOwner).to.equal(2_000_000); 
    });

    it("Should add 2 liquidity and mint shares", async function () {
      await stableSwap.connect(owner).addLiquidity([100, 100], 200);
      const balanceOwner = await stableSwap.balanceOf(owner);
      expect(balanceOwner).to.equal(2_000_200); 
    });

    it("Not owner add liquidity", async function () {
      await stableSwap.connect(addr1).addLiquidity([100, 100], 200);
      const balanceaddr1 = await stableSwap.balanceOf(addr1);
      expect(balanceaddr1).to.equal(200); 
    });

    it("Fail to will have much more shares", async function () {
      await expect(stableSwap.connect(owner).addLiquidity([100, 100], 201)).
        to.be.revertedWith("shares < min");
    });

    it("Different inputs to add liquidity", async function () {
      await stableSwap.connect(owner).addLiquidity([50, 100], 100);
      const balanceOwner = await stableSwap.balanceOf(owner);
      expect(balanceOwner).to.be.within(2_000_149, 2_000_151);
    });

    it("Add liquidity after swap", async function () {
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);
      await stableSwap.connect(owner).addLiquidity([100_000, 100_000], 100_000);
      const balanceOwner = await stableSwap.balanceOf(owner);
      expect(balanceOwner).to.be.within(2_199_999, 2_200_001); 
    });

    it("Add liquidity after swap and remove liquidity", async function () {
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);
      await stableSwap.connect(owner).removeLiquidity(102, [50, 50]);
      await stableSwap.connect(owner).addLiquidity([100_000, 100_000], 100_000);
      const balanceOwner = await stableSwap.balanceOf(owner);
      expect(balanceOwner).to.be.within(2_199_897, 2_199_903); 
    });
  });

  describe("removeLiquidity", async function () {
    it("Should remove all liquidity and burn shares", async function () {
      await stableSwap.connect(owner).removeLiquidity(2_000_000, 
        [1_000_000, 1_000_000]);
      const balanceOwner = await stableSwap.balanceOf(owner);
      expect(balanceOwner).to.equal(0); 
    });

    it("Should remove part of liquidity and burn some shares", async function () {
      await stableSwap.connect(owner).removeLiquidity(100, [50, 50]);
      const balanceOwner = await stableSwap.balanceOf(owner);
      expect(balanceOwner).to.equal(1_999_900); 
    });

    it("Fail to remove liquidity beacuse of out < min", async function () {
      await expect(stableSwap.connect(owner).removeLiquidity(100, [60, 50])).
        to.be.revertedWith("out < min");
    });

    it("Remove liquidity after swap", async function () {
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);
      await stableSwap.connect(owner).removeLiquidity(102, [50, 50]);
      const balanceOwner = await stableSwap.balanceOf(owner);
      expect(balanceOwner).to.be.within(1_999_898, 1_999_902); 
    });

    it("Remove liquidity after swap and add liquidity", async function () {
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);
      await stableSwap.connect(owner).addLiquidity([100_000, 100_000], 100_000);
      await stableSwap.connect(owner).removeLiquidity(101, [50, 50]);
      const balanceOwner = await stableSwap.balanceOf(owner);
      expect(balanceOwner).to.be.within(2_199_898, 2_199_902); 
    });
  });

  describe("swap", async function () {
    it("Regular swap from 1 to second and opposite", async function () {
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);
      
      const balanceOwner = await tokenB.balanceOf(addr1);
      expect(balanceOwner).to.equal(10_009_997);

      const balanceOwner2 = await tokenA.balanceOf(addr1);
      expect(balanceOwner2).to.equal(9_990_000);

      await stableSwap.connect(addr1).swap(1, 0, 10_000, 9_000);

      const balanceOwner3 = await tokenB.balanceOf(addr1);
      expect(balanceOwner3).to.equal(9_999_997);

      const balanceOwner4 = await tokenA.balanceOf(addr1);
      expect(balanceOwner4).to.equal(9_999_997);
    });

    it("Swap of 2 addresses", async function () {
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);
      await stableSwap.connect(addr2).swap(0, 1, 10_000, 9_000);

      const balanceOwner = await tokenB.balanceOf(addr1);
      expect(balanceOwner).to.equal(10_009_997);

      const balanceOwner2 = await tokenA.balanceOf(addr1);
      expect(balanceOwner2).to.equal(9_990_000);

      const balanceOwner3 = await tokenB.balanceOf(addr2);
      expect(balanceOwner3).to.equal(10_009_997);

      const balanceOwner4 = await tokenA.balanceOf(addr2);
      expect(balanceOwner4).to.equal(9_990_000);
    });

    it("Swap, add liquidity, swap", async function () {
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);
      await stableSwap.connect(owner).addLiquidity([1_000_000, 1_000_000], 1_000_000);
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);

      const balanceOwner = await tokenB.balanceOf(addr1);
      expect(balanceOwner).to.equal(10_019_994);

      const balanceOwner2 = await tokenA.balanceOf(addr1);
      expect(balanceOwner2).to.equal(9_980_000);
    });

    it("Swap, remove liquidity, swap", async function () {
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);
      await stableSwap.connect(owner).removeLiquidity(300_000, [100_000, 100_000]);
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);

      const balanceOwner = await tokenB.balanceOf(addr1);
      expect(balanceOwner).to.equal(10_019_994);

      const balanceOwner2 = await tokenA.balanceOf(addr1);
      expect(balanceOwner2).to.equal(9_980_000);
    });

    it("Swap, remove liquidity, swap, add liquidity, swap", async function () {
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);
      await stableSwap.connect(owner).removeLiquidity(300_000, [100_000, 100_000]);
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);
      await stableSwap.connect(owner).addLiquidity([1_000_000, 1_000_000], 1_000_000);
      await stableSwap.connect(addr1).swap(0, 1, 10_000, 9_000);

      const balanceOwner = await tokenB.balanceOf(addr1);
      expect(balanceOwner).to.equal(10_029_991);

      const balanceOwner2 = await tokenA.balanceOf(addr1);
      expect(balanceOwner2).to.equal(9_970_000);
    });
    
    it("Amount more than liquidity", async function () {
      await expect(stableSwap.connect(addr1).swap(0, 1, 2_000_000, 9_001)).
        to.be.revertedWith("Amount more than liquidity");
    });

    it("Fail dy < min", async function () {
      await expect(stableSwap.connect(addr1).swap(0, 1, 200_000, 900_001)).
        to.be.revertedWith("dy < min");
    });
  });
});
