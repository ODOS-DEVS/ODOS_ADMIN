import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import { warmBackendIfNeeded } from "@/api/client";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { AdminRealtimeProvider } from "@/hooks/useAdminRealtime";
import { ToastProvider } from "@/hooks/useToast";
import "@/index.css";

void warmBackendIfNeeded().catch(() => {
  // Dashboard and auth flows retry on their own if warmup fails here.
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AdminAuthProvider>
          <AdminRealtimeProvider>
            <App />
          </AdminRealtimeProvider>
        </AdminAuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
