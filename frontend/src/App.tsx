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
import ChatWorkspace from './pages/Chat';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';

// ─── Protected Route Wrapper ──────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-subText text-sm font-mono">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ─── App Routes ───────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route — login page */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes — wrapped in StyleLayout + Layout */}
        <Route
          element={
            <ProtectedRoute>
              <StyleLayout />
            </ProtectedRoute>
          }
        >
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/students" element={<Students />} />
            <Route path="/club/:clubid" element={<Club />} />
            <Route path="/event/:eventid" element={<Event />} />
            <Route path="/profile/:profileid" element={<UserProfileView />} />
            <Route path="/events/" element={<Events />} />
            <Route path="/clubs/" element={<ClubProfile />} />
            <Route path="/projects/" element={<Projects />} />
            <Route path="/test1" element={<UniversalPostFeedShowcase />} />
            <Route path="/chat" element={<ChatWorkspace />} />
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
