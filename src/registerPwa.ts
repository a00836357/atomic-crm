import { registerSW } from "virtual:pwa-register";

import { setUpdateAvailable } from "./lib/appUpdate";

// A new version found this soon after opening the app is applied right away
// (one quick reload, nothing typed yet). Later it waits for the user's click
// so a half-written form is never lost.
const RELOAD_WINDOW_MS = 30_000;
// The CRM stays open for days on a phone: look for new versions every hour.
const CHECK_EVERY_MS = 60 * 60 * 1000;

export const registerPwa = () => {
  const openedAt = Date.now();
  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (Date.now() - openedAt < RELOAD_WINDOW_MS) {
        updateServiceWorker(true);
        return;
      }
      setUpdateAvailable(() => updateServiceWorker(true));
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => registration.update(), CHECK_EVERY_MS);
    },
  });
};
