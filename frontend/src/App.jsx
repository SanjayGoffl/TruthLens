import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageLoader } from './components/ui/Loaders';
import PublicHeader from './components/layout/PublicHeader';
import PublicFooter from './components/layout/PublicFooter';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardGuard from './routes/DashboardGuard';
import { ScrollToTop, useSectionScroll } from './utils/scroll';
import Landing from './pages/landing/Landing';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import OtpPage from './pages/auth/OtpPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import GoogleSuccessPage from './pages/auth/GoogleSuccessPage';
import TermsPage from './pages/legal/TermsPage';
import PrivacyPage from './pages/legal/PrivacyPage';
const ComparePage = lazy(() => import('./pages/user/ComparePage'));
const SharedReportPage = lazy(() => import('./pages/SharedReportPage'));
import NotFoundPage from './pages/NotFoundPage';
import UserDashboard from './pages/user/DashboardPage';
import UserAnalyze from './pages/user/AnalyzePage';
import UserHistory from './pages/user/HistoryPage';
import UserReports from './pages/user/ReportsPage';
import UserSources from './pages/user/SourcesPage';
import UserNotifications from './pages/user/NotificationsPage';
import UserSettings from './pages/user/SettingsPage';
const ResultPage = lazy(() => import('./pages/user/ResultPage'));
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'));
const AdminUsers = lazy(() => import('./pages/admin/UsersPage'));
const AdminSources = lazy(() => import('./pages/admin/SourcesPage'));
const AdminArticles = lazy(() => import('./pages/admin/ArticlesPage'));
const AdminFlagged = lazy(() => import('./pages/admin/FlaggedPage'));
const AdminAnalytics = lazy(() => import('./pages/admin/AnalyticsPage'));
const AdminNotifications = lazy(() => import('./pages/admin/NotificationsPage'));
const AdminSettings = lazy(() => import('./pages/admin/SettingsPage'));
function PublicLayout() {
  return (
    <>
      <PublicHeader />
      <main>
        <Routes>
          <Route index element={<Landing />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <PublicFooter />
    </>
  );
}
function UserArea() {
  return (
    <DashboardGuard role="USER">
      <DashboardLayout role="USER">
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Navigate to="/user/dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="analyze" element={<UserAnalyze />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="history" element={<UserHistory />} />
          <Route path="reports" element={<UserReports />} />
          <Route path="sources" element={<UserSources />} />
          <Route path="notifications" element={<UserNotifications />} />
          <Route path="settings" element={<UserSettings />} />
          <Route path="result/:id" element={<ResultPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </DashboardLayout>
    </DashboardGuard>
  );
}
function AdminArea() {
  return (
    <DashboardGuard role="ADMIN">
      <DashboardLayout role="ADMIN">
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="sources" element={<AdminSources />} />
          <Route path="articles" element={<AdminArticles />} />
          <Route path="flagged" element={<AdminFlagged />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </DashboardLayout>
    </DashboardGuard>
  );
}
export default function App() {
  useSectionScroll();
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/*" element={<PublicLayout />} />
        <Route path="/report/:token" element={<Suspense fallback={<PageLoader />}><SharedReportPage /></Suspense>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<OtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/google-success" element={<GoogleSuccessPage />} />
        <Route path="/user/*" element={<UserArea />} />
        <Route path="/admin/*" element={<AdminArea />} />
      </Routes>
    </>
  );
}
