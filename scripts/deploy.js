const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);

  const Token = await ethers.getContractFactory("STeamToken");
  const initialSupply = 1_000_000;
  const token = await Token.deploy(initialSupply);

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("STeamToken deployed to:", tokenAddress);

  const mintAmount = ethers.parseUnits("100", 18);
  const mintTx = await token.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("Minted 100 STM to:", deployer.address);

  const balance = await token.balanceOf(deployer.address);
  console.log("Deployer balance:", ethers.formatUnits(balance, 18), "STM");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
