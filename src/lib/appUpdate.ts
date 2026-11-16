/**
 * State of a pending app update (a new service worker waiting), shared by
 * src/registerPwa.ts, which detects it, and the UpdateNotice banner.
 * Kept free of `virtual:pwa-register` so components using it stay testable.
 */
type Listener = () => void;

let available = false;
let apply: () => void = () => window.location.reload();
const listeners = new Set<Listener>();

export const isUpdateAvailable = () => available;

export const subscribeToUpdate = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const setUpdateAvailable = (applyUpdate: () => void) => {
  apply = applyUpdate;
  available = true;
  listeners.forEach((listener) => listener());
};

export const applyUpdate = () => apply();

/** For tests */
export const resetUpdateState = () => {
  available = false;
  apply = () => window.location.reload();
  listeners.clear();
};
