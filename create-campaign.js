import { CROWDFUNDING_ADDRESS, CROWDFUNDING_ABI } from "./config.js";
import { BlockchainService } from "./blockchain.js";

let blockchain = null;
let account = null;

const connectWalletBtn = document.getElementById("connectWallet");
const walletInfoEl = document.getElementById("walletInfo");
const statusEl = document.getElementById("status");
const form = document.getElementById("createCampaignForm");

const titleEl = document.getElementById("title");
const skinNameEl = document.getElementById("skinName");
const goalEl = document.getElementById("goal");
const durationDaysEl = document.getElementById("durationDays");

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function shortAddr(a) {
  if (!a) return "";
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

async function ensureWalletConnected() {
  if (account) return account;
  blockchain = new BlockchainService();
  await blockchain.connectWallet();
  account = blockchain.account;
  walletInfoEl.textContent = `Wallet: ${shortAddr(account)}`;
  return account;
}

async function getCrowdfundingWriteContract() {
  if (!window.ethers) throw new Error("ethers not loaded");
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new window.ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  return new window.ethers.Contract(CROWDFUNDING_ADDRESS, CROWDFUNDING_ABI, signer);
}

connectWalletBtn.onclick = async () => {
  try {
    setStatus("Connecting wallet...");
    await ensureWalletConnected();
    setStatus("");
  } catch (e) {
    setStatus(e.message);
  }
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    setStatus("Connecting wallet...");
    await ensureWalletConnected();

    const title = titleEl.value.trim();
    const skinName = skinNameEl.value.trim();
    const goalEth = String(goalEl.value).trim();
    const durationDays = parseInt(String(durationDaysEl.value).trim(), 10);

    if (!title || !skinName || !goalEth || !durationDays) {
      throw new Error("Fill all fields");
    }
    if (durationDays <= 0) throw new Error("Duration must be > 0");

    const goalWei = window.ethers.utils.parseEther(goalEth);

    setStatus("Sending transaction...");
    const contract = await getCrowdfundingWriteContract();

    const tx = await contract.createCampaign(title, goalWei, durationDays);
    setStatus(`Tx sent: ${tx.hash}`);

    const receipt = await tx.wait();
    setStatus(`Campaign created. Block: ${receipt.blockNumber}`);
  } catch (err) {
    setStatus(err.message);
  }
});
