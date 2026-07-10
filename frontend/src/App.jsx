import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatDashboard from "./pages/ChatDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

// Note: Session management is handled by AuthContext (auto-syncs with backend on mount).
// Token expiration is handled server-side; the API interceptor auto-redirects to login on 401.

// 1. Basic Protected Route (Requires any logged-in user)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// 2. Guest Route (Prevents logged-in users from accessing Login/Register pages via Back button)
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (user) {
    if (user.role && user.role.toLowerCase() === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

// 3. Admin Only Route (Protects the /admin URL from regular users sneaking in)
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // Ensure case-insensitive role check
  const role = user?.role;

  // If they aren't an admin, kick them back to the normal chat
  if (role?.toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            {/* Wrap Auth pages in GuestRoute */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <Register />
                </GuestRoute>
              }
            />

            {/* Chat Dashboard is public (Guest login) */}
            <Route path="/" element={<ChatDashboard />} />

            {/* Admin Dashboard Route - Strictly locked down */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
