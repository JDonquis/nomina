import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { FeedbackProvider } from "./context/FeedbackContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PermissionGate from "./components/auth/PermissionGate";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import { lazy, Suspense } from "react";
import { setLogoutCallback } from "./services/api";
import { useAuth } from "./context/AuthContext";

const FeDeVidaPage = lazy(() => import("./pages/dashboard/FeDeVidaPage"));
const MovimientosPage = lazy(() => import("./pages/dashboard/MovimientosPage"));
const PersonalActivoPage = lazy(() => import("./pages/dashboard/PersonalActivoPage"));
const ConfiguracionPage = lazy(() => import("./pages/dashboard/ConfiguracionPage"));
const SyncPage = lazy(() => import("./pages/dashboard/SyncPage"));
import UsuariosPage from "./pages/dashboard/UsuariosPage";
import ActivateAccountPage from "./pages/ActivateAccountPage";
import NotFoundPage from "./pages/NotFoundPage";

const PageLoader = () => (
  <div className="flex justify-center items-center h-screen bg-white">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
  </div>
);

function AppContent() {
  const { logout } = useAuth();

  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  return (
    <FeedbackProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/activar-cuenta" element={<ActivateAccountPage />} />
          <Route path="/olvide-contrasena" element={<ActivateAccountPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="fe_de_vida"
              element={
                <Suspense fallback={<PageLoader />}>
                  <FeDeVidaPage />
                </Suspense>
              }
            />
            <Route
              path="personal_activo"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PersonalActivoPage />
                </Suspense>
              }
            />
            <Route
              path="movimientos"
              element={
                <Suspense fallback={<PageLoader />}>
                  <MovimientosPage />
                </Suspense>
              }
            />
            <Route
              path="sincronizacion"
              element={
                <PermissionGate requiredPermission="is_admin">
                  <Suspense fallback={<PageLoader />}>
                    <SyncPage />
                  </Suspense>
                </PermissionGate>
              }
            />
            <Route
              path="usuarios"
              element={
                <PermissionGate requiredPermission="is_admin">
                  <UsuariosPage />
                </PermissionGate>
              }
            />
            <Route
              path="configuracion"
              element={
                <PermissionGate requiredPermission="is_admin">
                  <Suspense fallback={<PageLoader />}>
                    <ConfiguracionPage />
                  </Suspense>
                </PermissionGate>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </FeedbackProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
