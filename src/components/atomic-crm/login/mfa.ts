import type { AuthenticatorAssuranceLevels } from "@supabase/supabase-js";

import { getSupabaseClient } from "../providers/supabase/supabase";

/**
 * When true, every session must reach aal2 (password + authenticator code)
 * before using the CRM, even if no factor is enrolled yet (the user is then
 * sent to enroll one). Turned on once the database policies require aal2.
 */
export const MFA_REQUIRED = true;

export const MFA_PATH = "/mfa";

export type AssuranceLevel = {
  currentLevel: AuthenticatorAssuranceLevels | null;
  nextLevel: AuthenticatorAssuranceLevels | null;
};

/** Whether the session must go through the code screen before the CRM */
export const needsMfaStep = (
  { currentLevel, nextLevel }: AssuranceLevel,
  required: boolean = MFA_REQUIRED,
) => {
  if (currentLevel === "aal2") return false;
  // A verified factor exists but this session has not used it yet
  if (nextLevel === "aal2") return true;
  return required;
};

/** Keeps digits only, at most 6, as typed or pasted from an authenticator */
export const cleanTotpCode = (value: string) =>
  value.replace(/\D/g, "").slice(0, 6);

/** Whether the current Supabase session still needs the authenticator code */
export const sessionNeedsMfa = async () => {
  const auth = getSupabaseClient().auth;
  const { data: session } = await auth.getSession();
  // No Supabase session (demo mode, or signed out): checkAuth handles it
  if (!session.session) return false;
  const { data } = await auth.mfa.getAuthenticatorAssuranceLevel();
  return !!data && needsMfaStep(data);
};
