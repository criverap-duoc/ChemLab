import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { ReagentList } from './components/reagents/ReagentList';
import { EquipmentList } from './components/equipment/EquipmentList';
import { Dashboard } from './components/dashboard/Dashboard';
import { UserManagement } from './components/admin/UserManagement';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getTheme, ThemeContext } from './theme';
import { PERMISSIONS } from './types';
import { RoleTester } from './components/debug/RoleTester';
import { ExperimentList } from './components/experiments/ExperimentList';


const queryClient = new QueryClient();

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const themeContextValue = React.useMemo(
    () => ({
      mode,
      toggleTheme,
    }),
    [mode]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={themeContextValue}>
        <MuiThemeProvider theme={theme}>
          <BrowserRouter>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rutas protegidas */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reagents"
                element={
                  <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_REAGENT]}>
                    <MainLayout>
                      <ReagentList />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/equipment"
                element={
                  <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_EQUIPMENT]}>
                    <MainLayout>
                      <EquipmentList />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_USERS]}>
                    <MainLayout>
                      <UserManagement />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route
                path="/debug/roles"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <RoleTester />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/experiments"
                element={
                  <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_EXPERIMENT]}>
                    <MainLayout>
                      <ExperimentList />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </MuiThemeProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
