import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { errorReporter, ErrorBoundary } from "@brain-feed/frontend-error-reporter";

import AppLayout from "./layouts/AppLayout";
import AuthProvider from "./contexts/AuthContext";
import ToastProvider, { useToast } from "./contexts/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ToastContainer from "./components/ToastContainer";

// Auth pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ConfirmEmail from "./pages/auth/ConfirmEmail";

// App pages
import Library from "./pages/Library";
import SpaceView from "./pages/SpaceView";
import AllSpaces from "./pages/AllSpaces";
import SpaceSettings from "./pages/SpaceSettings";
import PublicSpace from "./pages/PublicSpace";
import Onboarding from "./pages/Onboarding";
import UserSettings from "./pages/UserSettings";
import DigestPage from "./pages/DigestPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ---------------------------------------------------------------------------
// Inner shell: wires errorReporter to toast context (must be inside ToastProvider)
// ---------------------------------------------------------------------------

function AppShell({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();

  useEffect(() => {
    errorReporter.init({
      onError: (error) => {
        showToast(error.message || "An unexpected error occurred", "error");
      },
    });
    return () => errorReporter.reset();
  }, [showToast]);

  return (
    <ErrorBoundary>
      {children}
      <ToastContainer />
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function App() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("bf-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("bf-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AppShell>
            <AuthProvider>
              <Routes>
                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/confirm-email" element={<ConfirmEmail />} />

                {/* Onboarding */}
                <Route path="/onboarding" element={<Onboarding />} />

                {/* Public share view — no auth, no sidebar */}
                <Route path="/p/:shareToken" element={<PublicSpace />} />

                {/* Authenticated app shell */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout dark={dark} onToggleDark={() => setDark((v) => !v)} />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/library" replace />} />
                  <Route path="library" element={<Library />} />
                  <Route path="digest" element={<DigestPage />} />
                  <Route path="spaces" element={<AllSpaces />} />
                  <Route path="spaces/:id" element={<SpaceView />} />
                  <Route path="spaces/:id/settings" element={<SpaceSettings />} />
                  <Route path="settings" element={<UserSettings />} />
                </Route>
              </Routes>
            </AuthProvider>
          </AppShell>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
