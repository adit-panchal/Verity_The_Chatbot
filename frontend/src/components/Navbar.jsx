import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LogOut, Menu, TrendingUp, Activity } from "lucide-react";
import "../styles/Navbar.css";

const Navbar = ({ toggleSidebar, sidebarOpen, onOpenUpgrade }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Safe admin check, similar to Sidebar
  const localUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const isAdmin =
    user?.role?.toLowerCase() === "admin" ||
    localUser?.role?.toLowerCase() === "admin";

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {!sidebarOpen && (
          <button
            className="sidebar-logo-toggle"
            onClick={toggleSidebar}
            title={t("openSidebar") || "Open sidebar"}
          >
            <span className="logo-text">Verity The ChatBotBot</span>
          </button>
        )}
        {sidebarOpen && (
          <Link to="/" className="navbar-logo">
            <span>Verity The ChatBotBot</span>
          </Link>
        )}
      </div>

      <div className="navbar-right">
        {user ? (
          <div className="user-section">
            {isAdmin && (
              <button
                className="btn-admin-nav"
                onClick={() => navigate("/admin")}
                title={t("adminConsole")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginRight: "0.5rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  color: "#3b82f6",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                <Activity size={16} />
                <span>{t("adminConsole")}</span>
              </button>
            )}
            <button
              className="btn-upgrade-nav"
              onClick={onOpenUpgrade}
              title={t("upgradePlan") || "Upgrade Plan"}
            >
              <TrendingUp size={16} />
              <span>{t("upgrade") || "Upgrade"}</span>
            </button>
            <span className="welcome-text">
              {t("welcome")}, {user.name}
            </span>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={18} />
              <span>{t("logOut")}</span>
            </button>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="btn-login">
              {t("login")}
            </Link>
            <Link to="/register" className="btn-register">
              {t("getStarted")}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
