"use client";

import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "@/context/SessionContext";
import { AppShell } from "./AppShell";
import { Toaster } from "sonner";

const PublicRoute = () => {
  const { session } = useSession();

  if (session) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <Toaster richColors />
    </div>
  );
};

export default PublicRoute;