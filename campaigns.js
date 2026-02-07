import { API_BASE_URL, CROWDFUNDING_ADDRESS, CROWDFUNDING_ABI } from "./config.js";
import { BlockchainService } from "./blockchain.js";

let blockchain = null;
let account = null;

const connectWalletBtn = document.getElementById("connectWallet");
const refreshBtn = document.getElementById("refreshCampaigns");
const grid = document.getElementById("campaignsGrid");
const statusEl = document.getElementById("status");
const walletInfoEl = document.getElementById("walletInfo");

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

async function apiGetCampaigns() {
  const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
    method: "GET",
    credentials: "include"
  });
  if (!res.ok) throw new Error("GET /api/campaigns failed");
  return res.json();
}

function normalizeCampaignsResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.campaigns)) return data.campaigns;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

function getCampaignId(c) {
  return c.id ?? c._id ?? c.campaignId ?? c.onchainId ?? c.chainId ?? null;
}

function getTitle(c) {
  return c.title ?? c.name ?? "Campaign";
}

function getGoal(c) {
  return c.goal ?? c.goalEth ?? c.target ?? null;
}

function getDeadline(c) {
  return c.deadline ?? c.endsAt ?? c.endTime ?? null;
}

function getSkin(c) {
  return c.skin ?? c.skinName ?? c.skin_name ?? "";
}

function formatDeadline(v) {
  if (v == null) return "n/a";
  if (typeof v === "number") {
    if (v > 1e12) return new Date(v).toLocaleString();
    return new Date(v * 1000).toLocaleString();
  }
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toLocaleString();
  return String(v);
}

async function getCrowdfundingWriteContract() {
  if (!window.ethers) throw new Error("ethers not loaded");
  if (!window.ethereum) throw new Error("MetaMask not found");
  const provider = new window.ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new window.ethers.Contract(CROWDFUNDING_ADDRESS, CROWDFUNDING_ABI, signer);
}

function renderCampaigns(list) {
  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML = `<div class="card"><p>No campaigns from backend.</p></div>`;
    return;
  }

  for (const c of list) {
    const id = getCampaignId(c);
    const title = getTitle(c);
    const goal = getGoal(c);
    const deadline = getDeadline(c);
    const skin = getSkin(c);

    const card = document.createElement("div");
    card.className = "card";

    const h = document.createElement("h3");
    h.textContent = title;

    const meta = document.createElement("p");
    meta.style.opacity = "0.85";
    meta.textContent =
      `ID: ${id ?? "n/a"}` +
      (goal != null ? ` • Goal: ${goal}` : "") +
      (deadline != null ? ` • Deadline: ${formatDeadline(deadline)}` : "") +
      (skin ? ` • Skin: ${skin}` : "");

    const amountWrap = document.createElement("div");
    amountWrap.style.display = "flex";
    amountWrap.style.gap = "10px";
    amountWrap.style.alignItems = "center";
    amountWrap.style.flexWrap = "wrap";
    amountWrap.style.marginTop = "10px";

    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.min = "0";
    amountInput.step = "0.0001";
    amountInput.placeholder = "ETH amount";
    amountInput.style.maxWidth = "200px";

    const fundBtn = document.createElement("button");
    fundBtn.className = "btn btn-primary";
    fundBtn.textContent = "Fund";
    fundBtn.onclick = async () => {
      try {
        if (id == null) throw new Error("Campaign id missing from backend response");
        const eth = String(amountInput.value).trim();
        if (!eth || Number(eth) <= 0) throw new Error("Enter ETH amount");

        setStatus("Connecting wallet...");
        await ensureWalletConnected();

        setStatus("Sending transaction...");
        const contract = await getCrowdfundingWriteContract();

        const tx = await contract.contribute(id, {
          value: window.ethers.utils.parseEther(eth)
        });

        setStatus(`Tx sent: ${tx.hash}`);
        await tx.wait();
        setStatus("Funded successfully.");
      } catch (e) {
        setStatus(e.message);
      }
    };

    amountWrap.appendChild(amountInput);
    amountWrap.appendChild(fundBtn);

    card.appendChild(h);
    card.appendChild(meta);
    card.appendChild(amountWrap);

    grid.appendChild(card);
  }
}

async function refreshCampaigns() {
  setStatus("Loading campaigns...");
  const data = await apiGetCampaigns();
  const list = normalizeCampaignsResponse(data);
  renderCampaigns(list);
  setStatus("");
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

refreshBtn.onclick = async () => {
  try {
    await refreshCampaigns();
  } catch (e) {
    setStatus(e.message);
  }
};

refreshCampaigns().catch((e) => setStatus(e.message));
