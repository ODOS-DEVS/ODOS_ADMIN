import { useState } from "react";
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
