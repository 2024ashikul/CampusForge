import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import StyleLayout from './components/StyleLayout';
import './App.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import { Club } from './pages/Club';
import Event from './pages/Event';
import { Students } from './pages/Students';
import UniversalPostFeedShowcase from './components/Posts/PostShowcase';
import Events from './pages/Events';
import ClubProfile from './pages/Clubs';
import UserProfileView from './pages/Profile';
import Projects from './pages/Projects';
import Login from './pages/Login';
import Skills from './pages/Skills';
import { Loader2 } from 'lucide-react';

// ─── App Routes ────────────────────────────────────────────────────────────────

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-primary" />;
  return isAuthenticated ? <Layout /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Campus content requires a session. */}
        <Route element={<StyleLayout />}>
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Home />} />
            <Route path="/students" element={<Students />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/skills/:skillName" element={<Skills />} />
            <Route path="/club/:clubid" element={<Club />} />
            <Route path="/event/:eventid" element={<Event />} />
            <Route path="/profile/:profileid" element={<UserProfileView />} />
            <Route path="/events/" element={<Events />} />
            <Route path="/clubs/" element={<ClubProfile />} />
            <Route path="/projects/" element={<Projects />} />
            <Route path="/test1" element={<UniversalPostFeedShowcase />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
