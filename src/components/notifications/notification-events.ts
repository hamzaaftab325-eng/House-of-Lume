"use client";
export function broadcastNotificationRead() {
  window.dispatchEvent(new Event("dwellune-notifications-changed"));
  try {
    localStorage.setItem("dwellune-notifications-change", String(Date.now()));
  } catch {
    /* Optional cross-tab refresh. */
  }
  try {
    const channel = new BroadcastChannel("dwellune-notifications");
    channel.postMessage("changed");
    channel.close();
  } catch {
    /* Polling still refreshes counts. */
  }
}
