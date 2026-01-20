const hre = require("hardhat");

async function main() {
  const STeamToken = await hre.ethers.getContractFactory("STeamToken");
  
  const initialSupply = 1000000;
  const token = await STeamToken.deploy(initialSupply);

  await token.waitForDeployment();

  console.log("STeamToken deployed to:", await token.getAddress());
  console.log("Total supply:", initialSupply, "tokens");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});