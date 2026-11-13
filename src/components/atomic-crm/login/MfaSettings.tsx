import type { Factor } from "@supabase/supabase-js";
import { useNotify, useTranslate } from "ra-core";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

import { getSupabaseClient } from "../providers/supabase/supabase";
import { MFA_PATH } from "./mfa";

/** Two-step verification status, with links to enroll and remove devices */
export const MfaSettings = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const [factors, setFactors] = useState<Factor[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await getSupabaseClient().auth.mfa.listFactors();
    setFactors(data?.totp.filter((f) => f.status === "verified") ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (factorId: string) => {
    const { error } = await getSupabaseClient().auth.mfa.unenroll({
      factorId,
    });
    if (error) {
      notify("crm.mfa.remove_error", { type: "error" });
      return;
    }
    // Drop the aal2 claim tied to the removed factor
    await getSupabaseClient().auth.refreshSession();
    notify("crm.mfa.removed");
    load();
  };

  if (factors == null) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {factors.length
          ? translate("crm.mfa.status_on", { smart_count: factors.length })
          : translate("crm.mfa.status_off")}
      </p>
      {factors.map((factor) => (
        <div
          key={factor.id}
          className="flex items-center justify-between gap-2 text-sm"
        >
          <span className="truncate">{factor.friendly_name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(factor.id)}
          >
            {translate("crm.mfa.remove")}
          </Button>
        </div>
      ))}
      <Button asChild variant="outline" size="sm">
        <Link to={factors.length ? `${MFA_PATH}?add=1` : MFA_PATH}>
          {translate(factors.length ? "crm.mfa.add_device" : "crm.mfa.setup")}
        </Link>
      </Button>
    </div>
  );
};
