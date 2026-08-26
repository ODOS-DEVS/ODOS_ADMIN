import { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-textStrong">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:pl-[280px]">
        <Topbar onMenu={() => setIsSidebarOpen(true)} />
        <main className="px-4 py-6 xl:px-8">
          {/* One boundary for every routed page. The pages behind sign-in are
              code-split, so this catches all of them while they load rather
              than each route declaring its own Suspense. */}
          <Suspense
            fallback={
              <div className="flex min-h-64 items-center justify-center p-8">
                <span
                  className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent"
                  role="status"
                  aria-label="Loading page"
                />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
