import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import { checkIfBlockedCountry } from "@/lib/blockRegion";

import Inicio from "@/pages/Inicio";
import Terms from "@/pages/Terms";
import Saques from "@/pages/Saques";
import Perfil from "@/pages/Perfil";
import VideoPlayer from "@/pages/VideoPlayer";
import TikTok from "@/pages/TikTok";
import TikTokPlayer from "@/pages/TikTokPlayer";
import Conta from "@/pages/Conta";
import Bonus from "@/pages/Bonus";
import Admin from "@/pages/Admin";
import AdminPostbackLogs from "@/pages/AdminPostbackLogs";
import Blocked from "@/pages/Blocked";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [blocked, setBlocked] = useState<boolean | null>(null);

  useEffect(() => {
    checkIfBlockedCountry().then(setBlocked);
  }, []);

  if (blocked === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (blocked) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Blocked />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Navigate to="/inicio" replace />} />
            <Route path="/inicio" element={<ProtectedRoute><TikTok /></ProtectedRoute>} />
            <Route path="/saques" element={<ProtectedRoute><Saques /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/video/:id" element={<ProtectedRoute><VideoPlayer /></ProtectedRoute>} />
            <Route path="/tiktok" element={<ProtectedRoute><Inicio /></ProtectedRoute>} />
            <Route path="/tiktok/:id" element={<ProtectedRoute><TikTokPlayer /></ProtectedRoute>} />
            <Route path="/conta" element={<ProtectedRoute><Conta /></ProtectedRoute>} />
            <Route path="/bonus" element={<ProtectedRoute><Bonus /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/admin/postback-logs" element={<ProtectedRoute><AdminPostbackLogs /></ProtectedRoute>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/" element={<Navigate to="/inicio" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
