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

    const WTETH = await hre.ethers.getContractFactory("WtETH");
    const wTETH = await WTETH.deploy(lp.target, tETH.target)

    await lp.setContractTETH(tETH.target);

    return {owner, otherAccount, lp, tETH, accounts, managerAddress, wTETH};
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

      // withdraw the 1 ETH from first user and let's see the shares
      await lp.connect(firstAccount).withdraw(firstAccount.address, ethers.parseEther("1"));
      expect(await tETH.balanceOf(firstAccount.address)).to.be.equal(ethers.parseEther("1.5"))
      expect(await tETH.shares(secondAccount.address)).to.be.equal(ethers.parseEther("1"))
      expect(await tETH.shares(firstAccount.address)).to.be.equal(ethers.parseEther("0.6"))
    });

    it("Should be 1/2 their shares, when two person mints same amount, negative rebase happened", async function() {
      const {managerAddress, accounts, otherAccount, lp, tETH} = await loadFixture(deployOneYearLockFixture);

      const firstAccount = accounts[1]
      const secondAccount = accounts[2]
      const thirdAccount = accounts[3]

      await lp.connect(firstAccount).deposit({value: ethers.parseEther("1")})
      await lp.connect(secondAccount).deposit({value: ethers.parseEther("1")})

      // 10 ETH rebase happened
      await lp.connect(managerAddress).rebase(ethers.parseEther("10"));

      expect(await tETH.shares(secondAccount.address))
          .to.be.equal(await tETH.shares(firstAccount.address))
      expect(await tETH.balanceOf(firstAccount.address)).to.be.equal(ethers.parseEther("6"))

      // -2 ETH rebased happend
      await lp.connect(managerAddress).rebase(ethers.parseEther("-2"));

      expect(await tETH.balanceOf(firstAccount.address)).to.be.equal(ethers.parseEther("5"))
      expect(await tETH.balanceOf(secondAccount.address)).to.be.equal(ethers.parseEther("5"))
    });

  });

  describe("Wrap/Unwrap", function() {
      it("After depositing, each user have 6 tETH, one of them tries to wrap 3 ETH", async function() {
        const {wTETH,managerAddress, accounts, otherAccount, lp, tETH} = await loadFixture(deployOneYearLockFixture);

        const firstAccount = accounts[1]
        const secondAccount = accounts[2]
        const thirdAccount = accounts[3]

        await lp.connect(firstAccount).deposit({value: ethers.parseEther("1")})
        await lp.connect(secondAccount).deposit({value: ethers.parseEther("1")})

        // 10 ETH rebase happened
        await lp.connect(managerAddress).rebase(ethers.parseEther("10"));
        expect(await tETH.balanceOf(firstAccount.address)).to.be.equal(ethers.parseEther("6"))

        await tETH.connect(firstAccount).approve(wTETH.target, ethers.parseEther("3"))
        await tETH.connect(secondAccount).approve(wTETH.target, ethers.parseEther("3"))

        expect(await tETH.shares(secondAccount.address))
          .to.be.equal(ethers.parseEther("1"))

        await wTETH.connect(firstAccount).wrap(ethers.parseEther("3"))
        await wTETH.connect(secondAccount).wrap(ethers.parseEther("3"))


        // after wrapping the half of their amount, both user's share should be 0.5, and wpETH shares should be 1
        expect(await tETH.shares(firstAccount.address))
          .to.be.equal(ethers.parseEther("0.5"))
        expect(await tETH.shares(secondAccount.address))
          .to.be.equal(ethers.parseEther("0.5"))
        expect(await tETH.shares(wTETH.target))
          .to.be.equal(ethers.parseEther("1"))

        // wTETH contract balance should be 6 tETH, and user's 3 tETH
        expect(await tETH.balanceOf(wTETH.target)).to.be.equal(ethers.parseEther("6"))
        expect(await tETH.balanceOf(firstAccount.address)).to.be.equal(ethers.parseEther("3"))
        expect(await tETH.balanceOf(secondAccount.address)).to.be.equal(ethers.parseEther("3"))

        expect(await wTETH.balanceOf(firstAccount.address))
            .to.be.equal(ethers.parseEther("0.5"));
        expect(await wTETH.balanceOf(secondAccount.address))
            .to.be.equal(ethers.parseEther("0.5"));
    });

      it("should fail if user didn't give allowance", async function() {
        const {wTETH,managerAddress, accounts, otherAccount, lp, tETH} = await loadFixture(deployOneYearLockFixture);

        const firstAccount = accounts[1]
        const secondAccount = accounts[2]
        const thirdAccount = accounts[3]

        await lp.connect(firstAccount).deposit({value: ethers.parseEther("1")})
        await lp.connect(secondAccount).deposit({value: ethers.parseEther("1")})

        // 10 ETH rebase happened
        await lp.connect(managerAddress).rebase(ethers.parseEther("10"));
        expect(await tETH.balanceOf(firstAccount.address)).to.be.equal(ethers.parseEther("6"))
        await expect(wTETH.connect(firstAccount).wrap(ethers.parseEther("3")))
            .to.be.revertedWith("TETH: TRANSFER_AMOUNT_EXCEEDS_ALLOWANCE")
        await expect(wTETH.connect(secondAccount).wrap(ethers.parseEther("3")))
            .to.be.revertedWith("TETH: TRANSFER_AMOUNT_EXCEEDS_ALLOWANCE")
      });

      it("After deposit 3 ETH for three users and rebasing by 100%, trying to wrap 3 tETH user, and checking wrap/unwrap giving correct amounts", async function() {
        const {wTETH,managerAddress, accounts, otherAccount, lp, tETH} = await loadFixture(deployOneYearLockFixture);

        const firstAccount = accounts[1]
        const secondAccount = accounts[2]
        const thirdAccount = accounts[3]

        await lp.connect(firstAccount).deposit({value: ethers.parseEther("3")})
        await lp.connect(secondAccount).deposit({value: ethers.parseEther("3")})
        await lp.connect(thirdAccount).deposit({value: ethers.parseEther("3")})

        // 9 ETH rebase happened now every user should have double the funds - 6 tETH, since (9 -> 18)
        await lp.connect(managerAddress).rebase(ethers.parseEther("9"));
        expect(await tETH.balanceOf(firstAccount.address)).to.be.equal(ethers.parseEther("6"))

        // 1 wtETH = 2 tETH
        await tETH.connect(firstAccount).approve(wTETH.target, ethers.parseEther("3"))
        await tETH.connect(secondAccount).approve(wTETH.target, ethers.parseEther("3"))

        expect(await tETH.shares(secondAccount.address))
          .to.be.equal(ethers.parseEther("3"))

        // wrapping should give 50% of wtETH 
        await wTETH.connect(firstAccount).wrap(ethers.parseEther("3"))
        await wTETH.connect(secondAccount).wrap(ethers.parseEther("3"))


        // after wrapping the half of their amount, both user's share should be 1.5, and wpETH shares should be 3
        expect(await tETH.shares(firstAccount.address))
          .to.be.equal(ethers.parseEther("1.5"))
        expect(await tETH.shares(secondAccount.address))
          .to.be.equal(ethers.parseEther("1.5"))
        expect(await tETH.shares(wTETH.target))
          .to.be.equal(ethers.parseEther("3"))

        // wTETH contract balance should be 6 tETH, and user's 3 tETH
        expect(await tETH.balanceOf(wTETH.target)).to.be.equal(ethers.parseEther("6"))
        expect(await tETH.balanceOf(firstAccount.address)).to.be.equal(ethers.parseEther("3"))
        expect(await tETH.balanceOf(secondAccount.address)).to.be.equal(ethers.parseEther("3"))

        expect(await wTETH.balanceOf(firstAccount.address))
            .to.be.equal(ethers.parseEther("1.5"));
        expect(await wTETH.balanceOf(secondAccount.address))
            .to.be.equal(ethers.parseEther("1.5"));

        await wTETH.connect(firstAccount).unwrap(ethers.parseEther("0.5"))

        // when unwrapping 0.5 wtETH, the balance should be 5
        expect(await tETH.balanceOf(wTETH.target))
            .to.be.equal(ethers.parseEther("5"))
        expect(await tETH.balanceOf(firstAccount.address))
            .to.be.equal(ethers.parseEther("4"))

        await wTETH.connect(secondAccount).unwrap(ethers.parseEther("0.5"))
        expect(await tETH.balanceOf(wTETH.target))
            .to.be.equal(ethers.parseEther("4"))
        expect(await tETH.balanceOf(secondAccount.address))
            .to.be.equal(ethers.parseEther("4"))
    });

  });

});
