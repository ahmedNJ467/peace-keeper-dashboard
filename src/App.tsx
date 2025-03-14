
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Maintenance from "./pages/Maintenance";
import FuelLogs from "./pages/FuelLogs";
import Clients from "./pages/Clients";
import Quotations from "./pages/Quotations";
import Trips from "./pages/Trips";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import CostAnalytics from "./pages/CostAnalytics";
import Contracts from "./pages/Contracts";
import SpareParts from "./pages/SpareParts";
import Auth from "./pages/Auth";
import TripAnalytics from "./pages/TripAnalytics";
import Dispatch from "./pages/Dispatch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="fuel-logs" element={<FuelLogs />} />
              <Route path="clients" element={<Clients />} />
              <Route path="quotations" element={<Quotations />} />
              <Route path="trips" element={<Trips />} />
              <Route path="trip-analytics" element={<TripAnalytics />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="spare-parts" element={<SpareParts />} />
              <Route path="reports" element={<Reports />} />
              <Route path="cost-analytics" element={<CostAnalytics />} />
              <Route path="dispatch" element={<Dispatch />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
