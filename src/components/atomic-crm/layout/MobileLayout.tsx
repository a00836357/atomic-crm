import { Error } from "@/components/admin/error";
import { Notification } from "@/components/admin/notification";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { DataImportProvider } from "../dataImport/DataImportProvider";
import { MfaGuard } from "../login/MfaGuard";
import { useConfigurationLoader } from "../root/useConfigurationLoader";
import { MobileNavigation } from "./MobileNavigation";
import { PullToRefresh } from "./PullToRefresh";
import { UpdateNotice } from "./UpdateNotice";

export const MobileLayout = ({ children }: { children: ReactNode }) => {
  useConfigurationLoader();
  return (
    <MfaGuard>
      <DataImportProvider>
        <PullToRefresh />
        <ErrorBoundary FallbackComponent={Error}>
          <Suspense fallback={<Skeleton className="h-12 w-12 rounded-full" />}>
            {children}
          </Suspense>
        </ErrorBoundary>
        <MobileNavigation />
        <Notification mobileOffset={{ bottom: "72px" }} />
        {/* above the bottom navigation bar */}
        <UpdateNotice className="bottom-20" />
      </DataImportProvider>
    </MfaGuard>
  );
};
