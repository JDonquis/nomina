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

// Lazy load heavy components

const FeDeVidaPage = lazy(
  () =>
    import(/* webpackChunkName: "examenes" */ "./pages/dashboard/FeDeVidaPage"),
);
const MovimientosPage = lazy(
  () =>
    import(
      /* webpackChunkName: "movimientos" */ "./pages/dashboard/MovimientosPage"
    ),
);
const PersonalActivoPage = lazy(
  () =>
    import(
      /* webpackChunkName: "movimientos" */ "./pages/dashboard/PersonalActivoPage"
    ),
);
const ConfiguracionPage = lazy(
  () =>
    import(
      /* webpackChunkName: "configuracion" */ "./pages/dashboard/ConfiguracionPage"
    ),
);
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
          {/* Public routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/activar-cuenta" element={<ActivateAccountPage />} />
          <Route path="/olvide-contrasena" element={<ActivateAccountPage />} />

          {/* Protected dashboard routes */}
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
            {/* Only show "usuarios" if user has permission */}
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

            {/* Fallback route */}
          </Route>

          {/* Catch-all 404 route */}
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
