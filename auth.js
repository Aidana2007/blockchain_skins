// frontend/auth.js
import { CONFIG } from "./config.js";

export class AuthService {
  static async register(email, password) {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error("Register failed");
    return res.json();
  }

  static async login(email, password) {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error("Login failed");
    return res.json();
  }

  static async connectWallet(address) {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/auth/connect-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ address })
    });

    if (!res.ok) throw new Error("Wallet connect failed");
    return res.json();
  }

  static async me() {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/auth/me`, {
      credentials: "include"
    });

    if (!res.ok) return null;
    return res.json();
  }
}
