const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EcosystemNFTOptimized - Gas", function () {
  it("mints 3 NFTs", async function () {
    const [owner] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("EcosystemNFTOptimized");
    const nft = await NFT.deploy("ipfs://QmBaseHash/");
    await nft.waitForDeployment();

    await (await nft.mint(owner.address)).wait();
    await (await nft.mint(owner.address)).wait();
    await (await nft.mint(owner.address)).wait();

    expect(await nft.nextId()).to.equal(3n);
  });
});
