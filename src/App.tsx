import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TechnicianTasks from "./pages/TechnicianTasks";
import CreateAccount from "./pages/CreateAccount";
import ManageUsers from "./pages/ManageUsers";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Diagnostics from "./pages/Diagnostics";
import ProfileSettings from "./pages/ProfileSettings";
import EmailVerificationRequired from "./pages/EmailVerificationRequired";
import { SessionProvider } from "./context/SessionContext";
import { TaskProvider } from "./context/TaskContext";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { ThemeProvider } from "./components/ThemeProvider";
import StatusBarManager from "./components/StatusBarManager";
import BackButtonHandler from "./components/BackButtonHandler";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <SessionProvider>
              <TaskProvider>
                {/* <StatusBarManager /> */}
                <BackButtonHandler />
                <Routes>
                  <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                  </Route>

                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<EmailVerificationRequired />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/technician-tasks" element={<TechnicianTasks />} />
                    <Route path="/create-account" element={<CreateAccount />} />
                    <Route path="/manage-users" element={<ManageUsers />} />
                    <Route path="/diagnostics" element={<Diagnostics />} />
                    <Route path="/settings" element={<ProfileSettings />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TaskProvider>
            </SessionProvider>
          </BrowserRouter>
        </I18nextProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;