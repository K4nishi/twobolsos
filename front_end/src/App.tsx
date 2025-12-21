import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WalletDetails from './pages/WalletDetails';
import { ToastProvider } from './context/ToastContext';

// Simple protected route
function PrivateRoute({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem('access_token');
    return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
    return (
        <ToastProvider>
            <Routes>
                <Route path="/login" element={<Layout><Login /></Layout>} />
                <Route path="/register" element={<Layout><Register /></Layout>} />
                <Route path="/dashboard" element={
                    <PrivateRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </PrivateRoute>
                } />
                <Route path="/wallet/:id" element={
                    <PrivateRoute>
                        <Layout>
                            <WalletDetails />
                        </Layout>
                    </PrivateRoute>
                } />
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </ToastProvider>
    );
}

export default App;
