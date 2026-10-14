"use client";
export function broadcastAccountChange() {
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("dwellune-account");
    channel.postMessage("session-changed");
    channel.close();
  }
  try {
    localStorage.setItem("dwellune-auth-change", String(Date.now()));
  } catch {
    /* Cookie-backed requests still verify identity when browser storage is unavailable. */
  }
}
