import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import {
  AdminBriefHeader,
  AdminCallout,
  AdminPageSkeleton,
} from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { BriefSectionConfig } from "@/utils/adminSections";

type BriefSectionPageProps<T> = {
  config: BriefSectionConfig;
  load: (token: string) => Promise<T>;
  children: (data: T) => ReactNode;
  getMeta?: (data: T) => string;
};

export function BriefSectionPage<T>({ config, load, children, getMeta }: BriefSectionPageProps<T>) {
  const { token } = useAdminAuth();
  const loadRef = useRef(load);
  loadRef.current = load;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  async function loadData(background = false) {
    if (!token) {
      return;
    }

    if (background) {
      setIsRefreshing(true);
    } else if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const nextData = await loadRef.current(token);
      setData(nextData);
      hasLoadedOnceRef.current = true;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadData();
  }, [token]);

  if (isLoading && !data) {
    return <AdminPageSkeleton />;
  }

  if (error || !data) {
    return <ErrorState description={error ?? "Unavailable."} onRetry={() => void loadData()} />;
  }

  return (
    <div className="space-y-4">
      <AdminBriefHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        fullRoute={config.fullRoute}
        fullLabel={config.fullLabel}
        onRefresh={() => void loadData(true)}
        refreshing={isRefreshing}
      />
      {children(data)}
      <AdminCallout
        title={config.calloutTitle}
        description={config.calloutDescription}
        fullRoute={config.fullRoute}
        ctaLabel={config.calloutCta}
        meta={getMeta?.(data)}
      />
    </div>
  );
}
