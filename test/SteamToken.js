const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("STeamToken – Professional Unit Tests", function () {
  let token, owner, user1, user2;
  const INITIAL_SUPPLY = 1_000_000;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const STeamToken = await ethers.getContractFactory("STeamToken");
    token = await STeamToken.deploy(INITIAL_SUPPLY);
    await token.waitForDeployment();
  });

  //deployment test
  it("Assigns total supply to deployer", async function () {
    const ownerBalance = await token.balanceOf(owner.address);
    const totalSupply = await token.totalSupply();
    expect(ownerBalance).to.equal(totalSupply);
  });

  //basic transfer test
  it("Transfers tokens between accounts", async function () {
    await token.transfer(user1.address, 1000);
    expect(await token.balanceOf(user1.address)).to.equal(1000);
  });

  //insufficient balance transfer
  it("Reverts if sender doesn't have enough tokens", async function () {
    await expect(
      token.connect(user1).transfer(owner.address, 1)
    ).to.be.reverted;
  });

  //edge case: self transfer
  it("Allows transfer to self without changing balance", async function () {
    const balanceBefore = await token.balanceOf(owner.address);
    await token.transfer(owner.address, 1000);
    const balanceAfter = await token.balanceOf(owner.address);
    expect(balanceAfter).to.equal(balanceBefore);
  });

  //gas estimation
  it("Estimates gas for transfer", async function () {
    const gas = await token.transfer.estimateGas(user1.address, 1000);
    expect(gas).to.be.gt(0);
  });

  //event emission
  it("Emits Transfer event on successful transfer", async function () {
    await expect(token.transfer(user1.address, 500))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, user1.address, 500);
  });

  //storage verification
  it("Correctly updates storage balances", async function () {
    await token.transfer(user1.address, 2000);
    const storedBalance = await token.balanceOf(user1.address);
    expect(storedBalance).to.equal(2000);
  });

  //negative tests
  it("Reverts on transfer to zero address", async function () {
    await expect(
      token.transfer(ethers.ZeroAddress, 1000)
    ).to.be.reverted;
  });

  it("Reverts when transferring more than balance", async function () {
    const ownerBalance = await token.balanceOf(owner.address);
    await expect(
      token.transfer(user1.address, ownerBalance + 1n)
    ).to.be.reverted;
  });

});
