"use client";

import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "@/context/SessionContext";
import { AppShell } from "./AppShell";

const ProtectedRoute = () => {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return session ? (
    <AppShell>
      <Outlet />
    </AppShell>
  ) : (
    <Navigate to="/login" />
  );
};

export default ProtectedRoute;