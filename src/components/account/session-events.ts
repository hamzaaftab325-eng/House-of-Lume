"use client";
export function broadcastAccountChange() {
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("dwellune-account");
      channel.postMessage("session-changed");
      channel.close();
    }
  } catch {
    /* Optional cross-tab messaging must not prevent account navigation. */
  }
  try {
    localStorage.setItem("dwellune-auth-change", String(Date.now()));
  } catch {
    /* Cookie-backed requests still verify identity when browser storage is unavailable. */
  }
}
