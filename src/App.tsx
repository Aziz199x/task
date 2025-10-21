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
import { SessionProvider } from "./context/SessionContext";
import { TaskProvider } from "./context/TaskContext";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <SessionProvider>
            <TaskProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/technician-tasks" element={<TechnicianTasks />} />
                <Route path="/create-account" element={<CreateAccount />} />
                <Route path="/manage-users" element={<ManageUsers />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TaskProvider>
          </SessionProvider>
        </BrowserRouter>
      </I18nextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;