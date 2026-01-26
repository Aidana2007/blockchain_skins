const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EcosystemNFT - Unit Tests", function () {
  let nft, owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("EcosystemNFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();
  });

  it("Owner can mint NFT", async function () {
    const uri = "ipfs://QmTest/1.json";
    await nft.mint(user1.address, uri);

    expect(await nft.ownerOf(0)).to.equal(user1.address);
    expect(await nft.tokenURI(0)).to.equal(uri);
  });

  it("Non-owner cannot mint (should revert)", async function () {
    const uri = "ipfs://QmTest/2.json";
    await expect(
      nft.connect(user1).mint(user1.address, uri)
    ).to.be.reverted;
  });

  it("Reverts tokenURI for non-existing token", async function () {
    await expect(nft.tokenURI(999)).to.be.reverted;
  });
});
