const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Token = await ethers.getContractFactory("STeamToken");
  const token = await Token.deploy(1_000_000);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("STeamToken deployed to:", tokenAddress);

  const AMM = await ethers.getContractFactory("MiniAMM");
  const amm = await AMM.deploy(tokenAddress, tokenAddress);
  await amm.waitForDeployment();
  const ammAddress = await amm.getAddress();

  console.log("MiniAMM deployed to:", ammAddress);

  const amountA = ethers.parseUnits("1000", 18);
  const amountB = ethers.parseUnits("1000", 18);

  const approveTx = await token.approve(ammAddress, amountA + amountB);
  await approveTx.wait();
  console.log("Approved AMM to spend:", ethers.formatUnits(amountA + amountB, 18), "STM");

  const addLiqTx = await amm.addLiquidity(amountA, amountB);
  await addLiqTx.wait();
  console.log("Liquidity added: 1000 / 1000");

  const reserveA_before = await amm.reserveA();
  const reserveB_before = await amm.reserveB();
  const price_before = await amm.getPrice();

  console.log("\n--- INITIAL STATE ---");
  console.log("ReserveA:", ethers.formatUnits(reserveA_before, 18));
  console.log("ReserveB:", ethers.formatUnits(reserveB_before, 18));
  console.log("Price (B per A):", ethers.formatUnits(price_before, 18));

  const swapAmount = ethers.parseUnits("100", 18);
  const balanceBefore = await token.balanceOf(deployer.address);

  const approveSwapTx = await token.approve(ammAddress, swapAmount);
  await approveSwapTx.wait();

  const swapTx = await amm.swapAforB(swapAmount);
  await swapTx.wait();

  const balanceAfter = await token.balanceOf(deployer.address);
  const reserveA_after = await amm.reserveA();
  const reserveB_after = await amm.reserveB();
  const price_after = await amm.getPrice();

  console.log("\n--- SWAP DEMO ---");
  console.log("Swap in (A):", ethers.formatUnits(swapAmount, 18));
  console.log("Balance before:", ethers.formatUnits(balanceBefore, 18));
  console.log("Balance after :", ethers.formatUnits(balanceAfter, 18));

  console.log("\n--- AFTER SWAP ---");
  console.log(
    "Reserves A/B:",
    ethers.formatUnits(reserveA_after, 18),
    "/",
    ethers.formatUnits(reserveB_after, 18)
  );
  console.log("Price (B per A):", ethers.formatUnits(price_after, 18));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
