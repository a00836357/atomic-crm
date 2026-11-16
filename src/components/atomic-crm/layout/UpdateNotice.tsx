import { RefreshCw } from "lucide-react";
import { useTranslate } from "ra-core";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  applyUpdate,
  isUpdateAvailable,
  subscribeToUpdate,
} from "@/lib/appUpdate";

/**
 * Banner shown when a new version was published while the CRM was open.
 * It never reloads on its own, so nothing being typed is lost.
 */
export const UpdateNotice = ({
  className = "bottom-4",
}: {
  className?: string;
}) => {
  const translate = useTranslate();
  const available = useSyncExternalStore(subscribeToUpdate, isUpdateAvailable);
  if (!available) return null;

  return (
    <div
      role="status"
      className={`fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-card px-4 py-2 text-sm shadow-lg ${className}`}
    >
      <span>{translate("ra.notification.application_update_available")}</span>
      <Button size="sm" onClick={applyUpdate}>
        <RefreshCw className="h-4 w-4" />
        {translate("ra.action.update_application")}
      </Button>
    </div>
  );
};
