import { API_BASE_URL, CONTRACT_ADDRESS, CONTRACT_ABI } from "./config.js";
import { BlockchainService } from "./blockchain.js";

let blockchain = null;
let account = null;

const connectWalletBtn = document.getElementById("connectWallet");
const refreshSkinsBtn = document.getElementById("refreshSkins");
const skinsGrid = document.getElementById("skinsGrid");
const statusEl = document.getElementById("status");
const walletInfoEl = document.getElementById("walletInfo");
const stmInfoEl = document.getElementById("stmInfo");

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function shortAddr(a) {
  if (!a) return "";
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

async function apiGetSkins() {
  const res = await fetch(`${API_BASE_URL}/api/skins`, {
    method: "GET",
    credentials: "include"
  });
  if (!res.ok) throw new Error("GET /api/skins failed");
  return res.json();
}

async function apiBuySkin(payload) {
  const res = await fetch(`${API_BASE_URL}/api/skins/buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("POST /api/skins/buy failed");
  return res.json();
}

async function ensureWalletConnected() {
  if (account) return account;
  blockchain = new BlockchainService();
  await blockchain.connectWallet();
  account = blockchain.account;
  walletInfoEl.textContent = `Wallet: ${shortAddr(account)}`;
  return account;
}

async function getStmContractRead() {
  if (!window.ethers) throw new Error("ethers not loaded");
  if (!window.ethereum) throw new Error("MetaMask not found");
  const provider = new window.ethers.providers.Web3Provider(window.ethereum);
  return new window.ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

async function getStmBalanceAndDecimals(addr) {
  const token = await getStmContractRead();
  const [bal, dec] = await Promise.all([
    token.balanceOf(addr),
    token.decimals().catch(() => 18)
  ]);
  const formatted = window.ethers.utils.formatUnits(bal, dec);
  return { bal, dec, formatted };
}

function normalizeSkinsResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.skins)) return data.skins;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

function getSkinId(skin) {
  return skin.id ?? skin._id ?? skin.skinId ?? skin.tokenId ?? skin.name ?? null;
}

function getSkinName(skin) {
  return skin.name ?? skin.skinName ?? skin.title ?? "Skin";
}

function getSkinPriceStm(skin) {
  const p =
    skin.priceStm ??
    skin.priceSTM ??
    skin.price_stm ??
    skin.stmPrice ??
    skin.price ??
    null;
  return p;
}

function renderSkins(list) {
  skinsGrid.innerHTML = "";

  if (!list.length) {
    skinsGrid.innerHTML = `<div class="card"><p>No skins from backend.</p></div>`;
    return;
  }

  for (const skin of list) {
    const name = getSkinName(skin);
    const id = getSkinId(skin);
    const priceStm = getSkinPriceStm(skin);

    const card = document.createElement("div");
    card.className = "card";

    const h = document.createElement("h3");
    h.textContent = name;

    const meta = document.createElement("p");
    meta.style.opacity = "0.85";
    meta.textContent = `ID: ${id ?? "n/a"}${priceStm != null ? ` • Price: ${priceStm} STM` : ""}`;

    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = "Buy skin";
    btn.onclick = async () => {
      await buySkinFlow(skin);
    };

    card.appendChild(h);
    card.appendChild(meta);
    card.appendChild(btn);
    skinsGrid.appendChild(card);
  }
}

async function buySkinFlow(skin) {
  setStatus("Connecting wallet...");
  const addr = await ensureWalletConnected();

  setStatus("Checking STM balance...");
  const { bal, dec, formatted } = await getStmBalanceAndDecimals(addr);
  stmInfoEl.textContent = `STM: ${formatted}`;

  const priceStm = getSkinPriceStm(skin);
  if (priceStm == null) throw new Error("Skin price (STM) missing from backend response");

  const need = window.ethers.utils.parseUnits(String(priceStm), dec);
  if (bal.lt(need)) {
    throw new Error(`Not enough STM. Need ${priceStm}, have ${formatted}`);
  }

  setStatus("Calling backend buy...");
  const payload = {
    skinId: getSkinId(skin),
    skinName: getSkinName(skin)
  };

  await apiBuySkin(payload);

  setStatus("Buy request sent. Refreshing balance...");
  const updated = await getStmBalanceAndDecimals(addr);
  stmInfoEl.textContent = `STM: ${updated.formatted}`;
  setStatus("Done.");
}

async function refreshSkins() {
  setStatus("Loading skins...");
  const data = await apiGetSkins();
  const list = normalizeSkinsResponse(data);
  renderSkins(list);
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

refreshSkinsBtn.onclick = async () => {
  try {
    await refreshSkins();
  } catch (e) {
    setStatus(e.message);
  }
};

refreshSkins().catch((e) => setStatus(e.message));
