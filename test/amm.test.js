const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MiniAMM - Unit Tests", function () {
  let token, amm, owner, user1;

  const ONE_MILLION = 1_000_000;

  const toWei = (x) => ethers.parseUnits(x, 18);

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("STeamToken");
    token = await Token.deploy(ONE_MILLION);
    await token.waitForDeployment();

    const AMM = await ethers.getContractFactory("MiniAMM");
    const tokenAddr = await token.getAddress();
    amm = await AMM.deploy(tokenAddr, tokenAddr);
    await amm.waitForDeployment();
  });

  it("Starts with zero reserves", async function () {
    expect(await amm.reserveA()).to.equal(0);
    expect(await amm.reserveB()).to.equal(0);
  });

  it("Reverts getPrice when no liquidity", async function () {
    await expect(amm.getPrice()).to.be.reverted;
  });

  it("Adds liquidity and updates reserves", async function () {
    const a = toWei("1000");
    const b = toWei("1000");
    const ammAddress = await amm.getAddress();

    await (await token.approve(ammAddress, a + b)).wait();
    await (await amm.addLiquidity(a, b)).wait();

    expect(await amm.reserveA()).to.equal(a);
    expect(await amm.reserveB()).to.equal(b);
  });

  it("Reverts addLiquidity with zero amounts", async function () {
    const ammAddress = await amm.getAddress();
    await (await token.approve(ammAddress, toWei("1"))).wait();

    await expect(amm.addLiquidity(0, toWei("1"))).to.be.revertedWith("Invalid amounts");
    await expect(amm.addLiquidity(toWei("1"), 0)).to.be.revertedWith("Invalid amounts");
  });

  it("Reverts addLiquidity if allowance is not enough", async function () {
    const a = toWei("1000");
    const b = toWei("1000");
    const ammAddress = await amm.getAddress();

    // approve меньше чем нужно (нужно 2000, дадим 1500)
    await (await token.approve(ammAddress, toWei("1500"))).wait();

    await expect(amm.addLiquidity(a, b)).to.be.reverted;
  });

  it("Swap changes reserves (A increases, B decreases)", async function () {
    const ammAddress = await amm.getAddress();

    const a = toWei("1000");
    const b = toWei("1000");
    await (await token.approve(ammAddress, a + b)).wait();
    await (await amm.addLiquidity(a, b)).wait();

    const rA_before = await amm.reserveA();
    const rB_before = await amm.reserveB();

    const swapIn = toWei("100");
    await (await token.approve(ammAddress, swapIn)).wait();
    await (await amm.swapAforB(swapIn)).wait();

    const rA_after = await amm.reserveA();
    const rB_after = await amm.reserveB();

    expect(rA_after).to.equal(rA_before + swapIn);
    expect(rB_after).to.be.lt(rB_before);
  });

  it("Swap reverts on zero input", async function () {
    await expect(amm.swapAforB(0)).to.be.revertedWith("Invalid amount");
  });

  it("Price changes after swap (price impact)", async function () {
    const ammAddress = await amm.getAddress();

    const a = toWei("1000");
    const b = toWei("1000");
    await (await token.approve(ammAddress, a + b)).wait();
    await (await amm.addLiquidity(a, b)).wait();

    const priceBefore = await amm.getPrice();

    const swapIn = toWei("100");
    await (await token.approve(ammAddress, swapIn)).wait();
    await (await amm.swapAforB(swapIn)).wait();

    const priceAfter = await amm.getPrice();
    expect(priceAfter).to.not.equal(priceBefore);
  });

  it("User can swap after receiving tokens", async function () {
    const ammAddress = await amm.getAddress();

    const a = toWei("1000");
    const b = toWei("1000");
    await (await token.approve(ammAddress, a + b)).wait();
    await (await amm.addLiquidity(a, b)).wait();

    // owner переводит user1 500 токенов
    await (await token.transfer(user1.address, toWei("500"))).wait();

    // user1 делает swap 50
    const swapIn = toWei("50");
    await (await token.connect(user1).approve(ammAddress, swapIn)).wait();
    await (await amm.connect(user1).swapAforB(swapIn)).wait();

    const rA = await amm.reserveA();
    const rB = await amm.reserveB();

    expect(rA).to.be.gt(a);
    expect(rB).to.be.lt(b);
  });
});
