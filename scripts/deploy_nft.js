const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const NFT = await ethers.getContractFactory("EcosystemNFT");
  const nft = await NFT.deploy();

  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("EcosystemNFT deployed to:", nftAddress);

  const uris = [
    "ipfs://QmExampleHash1/metadata.json",
    "ipfs://QmExampleHash2/metadata.json",
    "ipfs://QmExampleHash3/metadata.json",
  ];

  for (let i = 0; i < uris.length; i++) {
    const tx = await nft.mint(deployer.address, uris[i]);
    await tx.wait();
    console.log(`Minted NFT #${i} with URI: ${uris[i]}`);
  }

  for (let i = 0; i < uris.length; i++) {
    const uri = await nft.tokenURI(i);
    console.log(`tokenURI(${i}) =`, uri);
  }
  for (let i = 0; i < uris.length; i++) {
    const ownerOfToken = await nft.ownerOf(i);
    console.log(`ownerOf(${i}) =`, ownerOfToken);
  }

}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
