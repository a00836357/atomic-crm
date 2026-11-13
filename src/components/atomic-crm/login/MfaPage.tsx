import { useEffect, useState, type FormEvent } from "react";
import { useLogout, useTranslate } from "ra-core";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notification } from "@/components/admin/notification";
import { useConfigurationContext } from "@/components/atomic-crm/root/ConfigurationContext.tsx";

import { getSupabaseClient } from "../providers/supabase/supabase";
import { MFA_PATH, cleanTotpCode } from "./mfa";

type Enrollment = { factorId: string; qrCode: string; secret: string };

type State =
  | { mode: "loading" }
  | { mode: "verify"; factorId: string }
  | { mode: "enroll"; enrollment: Enrollment }
  | { mode: "done" }
  | { mode: "error" };

/**
 * Two-step verification (TOTP). Without a verified factor it enrolls one
 * (QR code, then a code to confirm); with one, it asks for the code that
 * upgrades the session to aal2. `?add=1` enrolls an extra device.
 *
 * It only talks to Supabase Auth, never to CRM tables, so it keeps working
 * while the database requires aal2 and the session is still aal1.
 */
export const MfaPage = () => {
  const { darkModeLogo, title } = useConfigurationContext();
  const translate = useTranslate();
  const navigate = useNavigate();
  const logout = useLogout();
  const [searchParams] = useSearchParams();
  const addDevice = searchParams.get("add") === "1";
  const [state, setState] = useState<State>({ mode: "loading" });
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      const auth = getSupabaseClient().auth;
      const { data: session } = await auth.getSession();
      if (!session.session) {
        navigate("/login", { replace: true });
        return;
      }
      const [{ data: aal }, { data: factors, error }] = await Promise.all([
        auth.mfa.getAuthenticatorAssuranceLevel(),
        auth.mfa.listFactors(),
      ]);
      if (error || !factors || !aal) throw error ?? new Error("mfa");

      const verified = factors.totp.filter((f) => f.status === "verified");
      if (verified.length && !addDevice) {
        if (!cancelled) {
          setState(
            aal.currentLevel === "aal2"
              ? { mode: "done" }
              : { mode: "verify", factorId: verified[0].id },
          );
        }
        return;
      }
      if (verified.length && aal.currentLevel !== "aal2") {
        // Adding a device requires a verified session first
        if (!cancelled) setState({ mode: "verify", factorId: verified[0].id });
        return;
      }

      // Leftovers from an enrollment that was never confirmed
      for (const factor of factors.all) {
        if (factor.factor_type === "totp" && factor.status === "unverified") {
          await auth.mfa.unenroll({ factorId: factor.id });
        }
      }
      const { data: enrolled, error: enrollError } = await auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Autenticador ${new Date().toISOString().slice(0, 16)}`,
      });
      if (enrollError || !enrolled) throw enrollError ?? new Error("enroll");
      if (!cancelled) {
        setState({
          mode: "enroll",
          enrollment: {
            factorId: enrolled.id,
            qrCode: enrolled.totp.qr_code,
            secret: enrolled.totp.secret,
          },
        });
      }
    };
    start().catch(() => !cancelled && setState({ mode: "error" }));
    return () => {
      cancelled = true;
    };
  }, [addDevice, navigate]);

  const factorId =
    state.mode === "verify"
      ? state.factorId
      : state.mode === "enroll"
        ? state.enrollment.factorId
        : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!factorId || code.length !== 6) return;
    setSubmitting(true);
    setCodeError(false);
    const { error } = await getSupabaseClient().auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    setSubmitting(false);
    if (error) {
      setCodeError(true);
      setCode("");
      return;
    }
    navigate(state.mode === "enroll" ? "/profile" : "/", { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      <div className="relative grid w-full lg:grid-cols-2">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <img className="h-6 mr-2" src={darkModeLogo} alt={title} />
            {title}
          </div>
        </div>
        <div className="flex flex-col justify-center w-full p-4 lg:p-8">
          <div className="w-full space-y-6 lg:mx-auto lg:w-[350px]">
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {translate(
                  state.mode === "enroll"
                    ? "crm.mfa.title_enroll"
                    : "crm.mfa.title_verify",
                )}
              </h1>
            </div>

            {state.mode === "loading" ? (
              <p className="text-center text-sm text-muted-foreground">
                {translate("crm.common.loading")}
              </p>
            ) : null}

            {state.mode === "error" ? (
              <p className="text-center text-sm text-destructive">
                {translate("crm.mfa.error")}
              </p>
            ) : null}

            {state.mode === "done" ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {translate("crm.mfa.already")}
                </p>
                <Button className="w-full" onClick={() => navigate("/")}>
                  {translate("crm.mfa.back")}
                </Button>
              </div>
            ) : null}

            {state.mode === "enroll" ? (
              <div className="space-y-3 text-sm">
                <p>{translate("crm.mfa.enroll_step1")}</p>
                <img
                  src={state.enrollment.qrCode}
                  alt={translate("crm.mfa.qr_alt")}
                  className="mx-auto h-48 w-48 rounded-md bg-white p-2"
                />
                <p className="text-muted-foreground">
                  {translate("crm.mfa.enroll_manual")}
                </p>
                <code className="block break-all rounded-md bg-muted p-2 text-center font-mono">
                  {state.enrollment.secret}
                </code>
                <p>{translate("crm.mfa.enroll_step2")}</p>
              </div>
            ) : null}

            {state.mode === "verify" ? (
              <p className="text-center text-sm text-muted-foreground">
                {translate("crm.mfa.verify_hint")}
              </p>
            ) : null}

            {factorId ? (
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">{translate("crm.mfa.code")}</Label>
                  <Input
                    id="mfa-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(cleanTotpCode(e.target.value))}
                    className="text-center text-lg tracking-[0.4em]"
                    aria-invalid={codeError}
                  />
                  {codeError ? (
                    <p className="text-sm text-destructive">
                      {translate("crm.mfa.invalid_code")}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={submitting || code.length !== 6}
                >
                  {translate(
                    state.mode === "enroll"
                      ? "crm.mfa.activate"
                      : "crm.mfa.verify",
                  )}
                </Button>
              </form>
            ) : null}

            <button
              type="button"
              onClick={() => logout()}
              className="block w-full text-center text-sm hover:underline"
            >
              {translate("ra.auth.logout")}
            </button>
          </div>
        </div>
      </div>
      <Notification />
    </div>
  );
};

MfaPage.path = MFA_PATH;
