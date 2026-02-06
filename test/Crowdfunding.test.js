const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crowdfunding Requirements Test", function () {
  let token, crowdfunding, owner, user1, user2;
  const INITIAL_SUPPLY = 1_000_000;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const STeamToken = await ethers.getContractFactory("STeamToken");
    token = await STeamToken.deploy(INITIAL_SUPPLY);
    await token.waitForDeployment();

    const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    crowdfunding = await Crowdfunding.deploy(await token.getAddress());
    await crowdfunding.waitForDeployment();

    await token.addMinter(await crowdfunding.getAddress());
  });

  it("Should create a campaign and issue reward tokens with 1% fee", async function () {
    await crowdfunding.connect(user1).createCampaign("Test", ethers.parseEther("10"), 7);
    const contribution = ethers.parseEther("1.0");
    const fee = ethers.parseEther("0.01");
    
    const balanceBefore = await ethers.provider.getBalance(owner.address);
    await crowdfunding.connect(user2).contribute(0, { value: contribution });
    const balanceAfter = await ethers.provider.getBalance(owner.address);
    
    expect(balanceAfter - balanceBefore).to.equal(fee);
    expect(await token.balanceOf(user2.address)).to.be.gt(0);
  });
});
