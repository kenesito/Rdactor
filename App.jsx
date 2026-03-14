import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ContentEditor from './pages/ContentEditor';
import ReviewQueue from './pages/ReviewQueue';
import UserManagement from './pages/UserManagement';
import Published from './pages/Published';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/editor/:id?" element={<ContentEditor />} />
            <Route path="/published"  element={<Published />} />
            <Route element={<ProtectedRoute roles={['editor', 'admin']} />}>
              <Route path="/review" element={<ReviewQueue />} />
            </Route>
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/users" element={<UserManagement />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}