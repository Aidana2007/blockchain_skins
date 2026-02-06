const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy SteamToken (ERC-20)
  // We pass 1,000,000 as the initial supply
  const Token = await ethers.getContractFactory("STeamToken");
  const token = await Token.deploy(1000000);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("STeamToken deployed to:", tokenAddress);

  // 2. Deploy Crowdfunding Contract
  // We pass the token address so it knows which token to give as rewards
  const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy(tokenAddress);
  await crowdfunding.waitForDeployment();
  const crowdfundingAddress = await crowdfunding.getAddress();
  console.log("Crowdfunding deployed to:", crowdfundingAddress);

  // 3. IMPORTANT: Authorize Crowdfunding to mint reward tokens
  // This calls the addMinter function we added to SteamToken.sol
  const addMinterTx = await token.addMinter(crowdfundingAddress);
  await addMinterTx.wait();
  console.log("Crowdfunding contract authorized to mint tokens.");

  // 4. Optional: Send some ETH to the contracts so users can sell tokens/NFTs back
  // This is useful for testing the 'sell' functions immediately
  const amountToFund = ethers.parseEther("1.0");
  await deployer.sendTransaction({
    to: tokenAddress,
    value: amountToFund
  });
  console.log("Funded SteamToken contract with 1 ETH for liquidity.");

  console.log("\n--- DEPLOYMENT COMPLETE ---");
  console.log("Copy these addresses into your scripts/config.js:");
  console.log(`export const CONTRACT_ADDRESS = '${tokenAddress}';`);
  console.log(`export const CROWDFUNDING_ADDRESS = '${crowdfundingAddress}';`);
  console.log("---------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
