import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Contacts from "./pages/Contacts";
import Tickets from "./pages/Tickets";
import Campaigns from "./pages/Campaigns";
import Templates from "./pages/Templates";
import Automations from "./pages/Automations";
import AIService from "./pages/AIService";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PublicRegister from "./pages/PublicRegister";
import ApiDocs from "./pages/ApiDocs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TenantProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/cadastro" element={<PublicRegister />} />
              
              {/* Protected routes */}
              <Route element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/automations" element={<Automations />} />
                <Route path="/ai-service" element={<AIService />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/api-docs" element={<ApiDocs />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TenantProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
