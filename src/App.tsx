import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import LandingPage from './pages/LandingPage';
import NavigationLayout from './components/NavigationLayout';
import DashboardPage from './pages/DashboardPage';
import ReportIssuePage from './pages/ReportIssuePage';
import MyReportsPage from './pages/MyReportsPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected Navigation Shell Routes */}
          <Route element={<NavigationLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/report" element={<ReportIssuePage />} />
            <Route path="/my-reports" element={<MyReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Catch All Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
