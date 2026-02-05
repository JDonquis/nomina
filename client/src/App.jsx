import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FeedbackProvider } from './context/FeedbackContext';
import ProtectedRoute from './components/auth/ProtectedRoute'
import PermissionGate from './components/auth/PermissionGate';
import DashboardLayout from './components/dashboard/DashboardLayout';
import LoginPage from './pages/LoginPage';
import { lazy, Suspense } from 'react';
import { setLogoutCallback } from './services/api';
import { useAuth } from './context/AuthContext';

// Lazy load heavy components
const HomePage = lazy(() => import(/* webpackChunkName: "home" */ './pages/dashboard/HomePage'));

const NominaPage = lazy(() => import(/* webpackChunkName: "examenes" */ './pages/dashboard/NominaPage'));
const CensadoPage = lazy(() => import(/* webpackChunkName: "censado" */ './pages/dashboard/CensadoPage'));
import UsuariosPage from './pages/dashboard/UsuariosPage';
import ActivateAccountPage from './pages/ActivateAccountPage';

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
              <Route index element={<HomePage />} />
              <Route path="nomina" element={
                  <Suspense fallback={<PageLoader />}>
                    <NominaPage />
                  </Suspense>
                } 
                />

                <Route path="censados" element={
                  <Suspense fallback={<PageLoader />}>
                    <CensadoPage />
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

              {/* Fallback route */}
            </Route>
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
