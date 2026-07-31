import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { User, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import "../styles/AuthScreen.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();

  // State to toggle between signin and signup
  const [isToggled, setIsToggled] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  useEffect(() => {
    // Check if we should start in signup mode
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("mode") === "signup") {
      setIsToggled(true);
    }
  }, [location.search]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await authService.login({
        email: loginData.email.trim().toLowerCase(),
        password: loginData.password.trim(),
      });

      const userData = response.data || response;
      if (userData.role) {
        userData.role = userData.role.toLowerCase();
      }

      if (login) login(userData);

      if (userData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError(
        err.response?.data?.message || err.message || t("loginFailed"),
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterLoading(true);

    try {
      const response = await authService.register({
        name: registerData.name.trim(),
        email: registerData.email.trim().toLowerCase(),
        password: registerData.password.trim(),
      });

      const userData = response.data || response;
      if (login) login(userData);
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
      setRegisterError(err.response?.data?.message || t("registrationFailed"));
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="auth-screen-body">
      <div className={`auth-wrapper ${isToggled ? "toggled" : ""}`}>
        <div className="background-shape"></div>
        <div className="secondary-shape"></div>

        {/* SIGN IN PANEL */}
        <div className="credentials-panel signin">
          <h2 className="slide-element">{t("login")}</h2>

          {loginError && (
            <div className="error-message slide-element">
              <AlertCircle size={18} />
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="field-wrapper slide-element">
              <input
                type="email"
                required
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
              />
              <label>{t("emailAddress")}</label>
              <Mail className="input-icon" size={20} />
            </div>

            <div className="field-wrapper slide-element">
              <input
                type={showLoginPassword ? "text" : "password"}
                required
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
              />
              <label>{t("password")}</label>
              <Lock className="input-icon" size={20} />
              <button
                type="button"
                className="toggle-password-button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                aria-label={showLoginPassword ? "Hide password" : "Show password"}
              >
                {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="field-wrapper slide-element">
              <button
                className="submit-button"
                type="submit"
                disabled={loginLoading}
              >
                {loginLoading ? t("loggingIn") : t("login")}
              </button>
            </div>

            <div className="switch-link slide-element">
              <p>
                {t("noAccount")} <br />
                <a
                  href="#"
                  className="register-trigger"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsToggled(true);
                  }}
                >
                  {t("register")}
                </a>
              </p>
            </div>
          </form>
        </div>

        <div className="welcome-section signin">
          <h2 className="slide-element">{t("welcomeBack")}!</h2>
        </div>

        {/* SIGN UP PANEL */}
        <div className="credentials-panel signup">
          <h2 className="slide-element">{t("register")}</h2>

          {registerError && (
            <div className="error-message slide-element">
              <AlertCircle size={18} />
              {registerError}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit}>
            <div className="field-wrapper slide-element">
              <input
                type="text"
                required
                value={registerData.name}
                onChange={(e) =>
                  setRegisterData({ ...registerData, name: e.target.value })
                }
              />
              <label>{t("fullName")}</label>
              <User className="input-icon" size={20} />
            </div>

            <div className="field-wrapper slide-element">
              <input
                type="email"
                required
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData({ ...registerData, email: e.target.value })
                }
              />
              <label>{t("emailAddress")}</label>
              <Mail className="input-icon" size={20} />
            </div>

            <div className="field-wrapper slide-element">
              <input
                type={showRegisterPassword ? "text" : "password"}
                required
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({ ...registerData, password: e.target.value })
                }
              />
              <label>{t("password")}</label>
              <Lock className="input-icon" size={20} />
              <button
                type="button"
                className="toggle-password-button"
                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                aria-label={showRegisterPassword ? "Hide password" : "Show password"}
              >
                {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="field-wrapper slide-element">
              <button
                className="submit-button"
                type="submit"
                disabled={registerLoading}
              >
                {registerLoading ? t("creatingAccount") : t("register")}
              </button>
            </div>

            <div className="switch-link slide-element">
              <p>
                {t("alreadyAccount")} <br />
                <a
                  href="#"
                  className="login-trigger"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsToggled(false);
                  }}
                >
                  {t("login")}
                </a>
              </p>
            </div>
          </form>
        </div>

        <div className="welcome-section signup">
          <h2 className="slide-element">{t("welcome")}!</h2>
        </div>
      </div>
    </div>
  );
};

export default Login;
