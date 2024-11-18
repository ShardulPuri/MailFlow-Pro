import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataSourceProvider } from './context/DataSourceContext';
import { TemplateProvider } from './context/TemplateContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/profile/Profile';
import Layout from './components/Layout';
import DataSourceManager from './components/datasource/DataSourceManager';
import TemplateList from './components/templates/TemplateList';
import TemplateEditor from './components/templates/TemplateEditor';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DataSourceProvider>
          <TemplateProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/datasources" element={
                  <ProtectedRoute>
                    <Layout>
                      <DataSourceManager />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/templates" element={
                  <ProtectedRoute>
                    <Layout>
                      <TemplateList />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/templates/new" element={
                  <ProtectedRoute>
                    <Layout>
                      <TemplateEditor isNew={true} />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/templates/:id" element={
                  <ProtectedRoute>
                    <Layout>
                      <TemplateEditor />
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
          </TemplateProvider>
        </DataSourceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 