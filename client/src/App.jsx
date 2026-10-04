import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LiveDataProvider } from './context/LiveDataContext';
import ProtectedRoute from './components/ProtectedRoute';
import CustomCursor from './components/CustomCursor';
import DashboardLayout from './components/layout/DashboardLayout';
import LiveIncidentToast from './components/dashboard/LiveIncidentToast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <LiveDataProvider>
        <BrowserRouter>
          <CustomCursor />
          <LiveIncidentToast />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute><DashboardLayout><Projects /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/projects/:id" element={
              <ProtectedRoute><DashboardLayout><ProjectDetail /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/incidents" element={
              <ProtectedRoute><DashboardLayout><Incidents /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/incidents/:id" element={
              <ProtectedRoute><DashboardLayout><IncidentDetail /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <DashboardLayout><Settings /></DashboardLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </LiveDataProvider>
    </AuthProvider>
  );
}

export default App;