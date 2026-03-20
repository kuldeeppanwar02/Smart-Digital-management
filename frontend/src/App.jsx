import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import SchoolRegistration from './pages/SchoolRegistration';
import UserRegistration from './pages/UserRegistration';

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return <Layout>{children}</Layout>;
};

const App = () => {
  return (
    <BrowserRouter>
      <div className="font-sans antialiased text-[#e5e5e5] bg-[#121212] min-h-screen">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<SchoolRegistration />} />
          <Route path="/register-user" element={<UserRegistration />} />
          <Route
            path="/admin/*"
            element={
              <PrivateRoute allowedRoles={['superadmin', 'school_admin', 'principal']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <PrivateRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/student"
            element={
              <PrivateRoute allowedRoles={['student']}>
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <PrivateRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
