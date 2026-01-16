const hre = require("hardhat");

async function main() {
  const STeamToken = await hre.ethers.getContractFactory("STeamToken");
  const token = await STeamToken.deploy();

  await token.waitForDeployment();

  console.log("STeamToken deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
