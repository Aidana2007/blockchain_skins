import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./config.js";
import { BlockchainService } from "./blockchain.js";

let blockchain = null;
let account = null;

const connectWalletBtn = document.getElementById("connectWallet");
const refreshBtn = document.getElementById("refreshBalance");
const buyBtn = document.getElementById("buyBtn");

const walletInfoEl = document.getElementById("walletInfo");
const stmInfoEl = document.getElementById("stmInfo");
const statusEl = document.getElementById("status");
const ethAmountEl = document.getElementById("ethAmount");

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

async function getTokenReadContract() {
  if (!window.ethers) throw new Error("ethers not loaded");
  if (!window.ethereum) throw new Error("MetaMask not found");
  const provider = new window.ethers.providers.Web3Provider(window.ethereum);
  return new window.ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

async function getTokenWriteContract() {
  if (!window.ethers) throw new Error("ethers not loaded");
  if (!window.ethereum) throw new Error("MetaMask not found");
  const provider = new window.ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new window.ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

async function refreshBalance() {
  await ensureWalletConnected();
  setStatus("Loading STM balance...");

  const token = await getTokenReadContract();
  const [bal, dec] = await Promise.all([
    token.balanceOf(account),
    token.decimals().catch(() => 18)
  ]);

  const formatted = window.ethers.utils.formatUnits(bal, dec);
  stmInfoEl.textContent = `STM: ${formatted}`;
  setStatus("");
}

async function buyViaFunction(valueWei) {
  const token = await getTokenWriteContract();
  if (!token.buyTokens) throw new Error("buyTokens not available");
  const tx = await token.buyTokens({ value: valueWei });
  return tx;
}

async function buyViaSend(valueWei) {
  const provider = new window.ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const tx = await signer.sendTransaction({
    to: CONTRACT_ADDRESS,
    value: valueWei
  });
  return tx;
}

connectWalletBtn.onclick = async () => {
  try {
    setStatus("Connecting wallet...");
    await ensureWalletConnected();
    await refreshBalance();
  } catch (e) {
    setStatus(e.message);
  }
};

refreshBtn.onclick = async () => {
  try {
    await refreshBalance();
  } catch (e) {
    setStatus(e.message);
  }
};

buyBtn.onclick = async () => {
  try {
    await ensureWalletConnected();

    const ethStr = String(ethAmountEl.value).trim();
    if (!ethStr || Number(ethStr) <= 0) throw new Error("Enter ETH amount");

    const valueWei = window.ethers.utils.parseEther(ethStr);

    setStatus("Sending buy transaction...");

    let tx;
    try {
      tx = await buyViaFunction(valueWei);
    } catch {
      tx = await buyViaSend(valueWei);
    }

    setStatus(`Tx sent: ${tx.hash}`);
    await tx.wait();

    setStatus("Bought. Refreshing balance...");
    await refreshBalance();
    setStatus("Done.");
  } catch (e) {
    setStatus(e.message);
  }
};
