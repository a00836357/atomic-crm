import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router";

import { MFA_PATH, sessionNeedsMfa } from "./mfa";

/**
 * Sends sessions that still need the authenticator code to /mfa, keeping
 * them signed in. (A rejected checkAuth would make react-admin sign out.)
 * The database enforces aal2 anyway; this only routes the user to the step.
 */
export const MfaGuard = ({
  children,
  check = sessionNeedsMfa,
}: {
  children: ReactNode;
  check?: () => Promise<boolean>;
}) => {
  const [state, setState] = useState<"checking" | "ok" | "mfa">("checking");

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(check)
      .then((needed) => !cancelled && setState(needed ? "mfa" : "ok"))
      .catch(() => !cancelled && setState("ok"));
    return () => {
      cancelled = true;
    };
  }, [check]);

  if (state === "checking") return null;
  if (state === "mfa") return <Navigate to={MFA_PATH} replace />;
  return <>{children}</>;
};
