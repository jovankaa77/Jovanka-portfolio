import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import Navbar from './components/Navbar';
import About from './components/About';
import Achievement from './components/Achievement';
import Projects from './components/Projects';
import Blog from './components/Blog';
import BlogDetail from './components/BlogDetail';
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminAbout from './admin/AdminAbout';
import AdminAchievement from './admin/AdminAchievement';
import AdminProjects from './admin/AdminProjects';
import AdminBlog from './admin/AdminBlog';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#F9FAFB]">
    <Navbar />
    {children}
  </div>
);

function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Portfolio Routes */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <About />
              </PublicLayout>
            }
          />
          <Route
            path="/achievement"
            element={
              <PublicLayout>
                <Achievement />
              </PublicLayout>
            }
          />
          <Route
            path="/project"
            element={
              <PublicLayout>
                <Projects />
              </PublicLayout>
            }
          />
          <Route
            path="/blog"
            element={
              <PublicLayout>
                <Blog />
              </PublicLayout>
            }
          />
          <Route
            path="/blog/:id"
            element={
              <PublicLayout>
                <BlogDetail />
              </PublicLayout>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/about"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminAbout />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/achievement"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminAchievement />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminProjects />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blog"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminBlog />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminProvider>
  );
}

export default App;
