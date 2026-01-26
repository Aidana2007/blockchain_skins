const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Security Exercise - Reentrancy", function () {
  it("Exploit works on VulnerableVault", async function () {
    const [owner, victim] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("VulnerableVault");
    const vault = await Vault.deploy();
    await vault.waitForDeployment();

    // Victim кладёт 5 ETH в vault
    await vault.connect(victim).deposit({ value: ethers.parseEther("5") });

    // Deploy Attack
    const Attack = await ethers.getContractFactory("Attack");
    const attack = await Attack.deploy(await vault.getAddress());
    await attack.waitForDeployment();

    // Attacker кладёт 1 ETH и запускает reentrancy
    await attack.connect(owner).attack({ value: ethers.parseEther("1") });

    const vaultBal = await vault.vaultBalance();
    // vault должен быть почти пустой (или сильно уменьшиться)
    expect(vaultBal).to.be.lt(ethers.parseEther("1"));
  });

  it("Exploit fails on SafeVault", async function () {
    const [owner, victim] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("SafeVault");
    const vault = await Vault.deploy();
    await vault.waitForDeployment();

    await vault.connect(victim).deposit({ value: ethers.parseEther("5") });

    const Attack = await ethers.getContractFactory("Attack");
    const attack = await Attack.deploy(await vault.getAddress());
    await attack.waitForDeployment();

    // атака должна провалиться (revert)
    await expect(
      attack.connect(owner).attack({ value: ethers.parseEther("1") })
    ).to.be.reverted;

    // деньги vault должны остаться
    const vaultBal = await vault.vaultBalance();
    expect(vaultBal).to.equal(ethers.parseEther("5"));
  });
});
