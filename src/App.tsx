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
import { SessionProvider } from "./context/SessionContext";
import { TaskProvider } from "./context/TaskContext";
import { I18nextProvider } from 'react-i18next'; // Import I18nextProvider
import i18n from './i18n'; // Import your i18n configuration

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <I18nextProvider i18n={i18n}> {/* Wrap with I18nextProvider */}
        <BrowserRouter>
          <SessionProvider>
            <TaskProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/technician-tasks" element={<TechnicianTasks />} />
                <Route path="/create-account" element={<CreateAccount />} />
                <Route path="/manage-users" element={<ManageUsers />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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