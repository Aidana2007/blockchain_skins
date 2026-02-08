const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  const SteamToken = await hre.ethers.getContractFactory("STeamToken");
  const steamToken = await SteamToken.deploy();
  await steamToken.waitForDeployment();

  console.log("SteamToken deployed to:", await steamToken.getAddress());

  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy(await steamToken.getAddress());
  await crowdfunding.waitForDeployment();

  console.log("Crowdfunding deployed to:", await crowdfunding.getAddress());

  const tx = await steamToken.setCrowdfundingContract(
    await crowdfunding.getAddress()
  );
  await tx.wait();

  console.log("Crowdfunding contract set in SteamToken");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
