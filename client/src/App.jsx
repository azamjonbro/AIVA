import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import AIAgentPage from './pages/AIAgentPage';
import ProductsPage from './pages/ProductsPage';
import CRMPage from './pages/CRMPage';
import LeadsPage from './pages/LeadsPage';
import ConversationsPage from './pages/ConversationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import KnowledgePage from './pages/KnowledgePage';
import IntegrationsPage from './pages/IntegrationsPage';
import EmployeesPage from './pages/EmployeesPage';
import { CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

// Protected Route Guard Component
const ProtectedRoute = ({ children }) => {
  const { token, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
        <span className="text-xs">Authenticating session...</span>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Guard (Redirect logged-in users away from Login/Register)
const PublicRoute = ({ children }) => {
  const { token, isLoading } = useApp();

  if (isLoading) return null;
  if (token) return <Navigate to="/dashboard" replace />;
  
  return children;
};

export default function App() {
  const { toasts } = useApp();

  return (
    <Router>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Pages */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected Dashboard Views */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/agent"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AIAgentPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/products"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProductsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/crm"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CRMPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/leads"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LeadsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/conversations"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ConversationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/knowledge"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <KnowledgePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employees"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <EmployeesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/integrations"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <IntegrationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/analytics"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AnalyticsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback navigation */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Toast Alert Overlays */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border flex items-start gap-3 backdrop-blur-md transition-all duration-300 animate-slide-in ${
              toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' :
              toast.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-300' :
              'bg-gray-900/90 border-gray-800 text-gray-300'
            }`}
          >
            <span className="shrink-0 mt-0.5">
              {toast.type === 'success' ? <CheckCircle className="h-4.5 w-4.5 text-emerald-400" /> :
               toast.type === 'error' ? <AlertTriangle className="h-4.5 w-4.5 text-red-400" /> :
               <Info className="h-4.5 w-4.5 text-indigo-400" />}
            </span>
            <p className="text-xs font-semibold leading-relaxed text-left">{toast.message}</p>
          </div>
        ))}
      </div>
    </Router>
  );
}
