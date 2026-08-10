import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { API_BASE_PATH } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        sessionStorage.removeItem("user");
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // ===== CENTRALIZED PLAN STATE =====
  // Single source of truth for the active plan across the entire app
  const [activePlan, setActivePlanState] = useState(null);

  // Check and validate the plan from sessionStorage
  const checkPlanStatus = useCallback(() => {
    try {
      const savedPlan = sessionStorage.getItem("activePlan");
      if (savedPlan && savedPlan !== "null" && savedPlan !== "undefined") {
        const planData = JSON.parse(savedPlan);
        if (planData && planData.expiryDate) {
          const now = new Date().getTime();
          if (now < planData.expiryDate) {
            setActivePlanState(planData);
            return;
          }
          // Plan expired
          sessionStorage.removeItem("activePlan");
        }
      }
      setActivePlanState(null);
    } catch (e) {
      console.error("[AuthContext] Plan parsing error:", e);
      sessionStorage.removeItem("activePlan");
      setActivePlanState(null);
    }
  }, []);

  // Wrapper that also persists to sessionStorage
  const setActivePlan = useCallback((plan) => {
    if (plan) {
      sessionStorage.setItem("activePlan", JSON.stringify(plan));
    } else {
      sessionStorage.removeItem("activePlan");
    }
    setActivePlanState(plan);
  }, []);

  // Helper to sync plan state based on the user's subscription data
  const syncPlanFromUser = useCallback((userData) => {
    const subscription = userData?.subscription;

    // If subscription is free or missing, clear any active plan
    if (!subscription || subscription === "free") {
      sessionStorage.removeItem("activePlan");
      setActivePlanState(null);
      return;
    }

    // User has a paid subscription — check if activePlan exists in sessionStorage
    const savedPlan = sessionStorage.getItem("activePlan");
    if (savedPlan && savedPlan !== "null" && savedPlan !== "undefined") {
      try {
        const planData = JSON.parse(savedPlan);
        if (planData && planData.expiryDate) {
          const now = new Date().getTime();
          if (now < planData.expiryDate) {
            // Valid, non-expired plan
            setActivePlanState(planData);
            return;
          }
        }
        // Plan expired — clear it
        sessionStorage.removeItem("activePlan");
        setActivePlanState(null);
      } catch {
        sessionStorage.removeItem("activePlan");
        setActivePlanState(null);
      }
    } else {
      // Backend says paid subscription but no activePlan in sessionStorage
      // This happens after DB changes or fresh login — create a plan entry
      const newPlan = {
        id: subscription,
        name: subscription.charAt(0).toUpperCase() + subscription.slice(1),
        activationDate: new Date().getTime(),
        expiryDate: new Date().getTime() + 30 * 24 * 60 * 60 * 1000, // 30 days
        status: "active",
      };
      sessionStorage.setItem("activePlan", JSON.stringify(newPlan));
      setActivePlanState(newPlan);
    }
  }, []);

  // Auto-sync user profile from backend on mount, then sync plan
  useEffect(() => {
    const syncUserProfile = async () => {
      try {
        // Clear legacy local storage to force session-only behavior
        localStorage.removeItem("user");
        localStorage.removeItem("activePlan");

        const storedUser = sessionStorage.getItem("user");
        if (!storedUser) {
          setLoading(false);
          return;
        }

        const cachedUser = JSON.parse(storedUser);
        if (!cachedUser?.token) {
          setLoading(false);
          return;
        }

        // Fetch latest user data from backend
        const response = await fetch(`${API_BASE_PATH}/auth/me`, {
          headers: {
            Authorization: `Bearer ${cachedUser.token}`,
          },
        });

        if (response.ok) {
          const freshData = await response.json();
          const merged = {
            ...cachedUser,
            ...freshData,
            token: cachedUser.token,
          };
          sessionStorage.setItem("user", JSON.stringify(merged));
          setUser(merged);

          // After syncing user, sync plan status based on fresh subscription data
          syncPlanFromUser(merged);
        } else {
          // Even if backend sync fails, still load plan from sessionStorage
          checkPlanStatus();
        }
      } catch (err) {
        console.error("[AuthContext] Profile sync error:", err);
        checkPlanStatus();
      } finally {
        setLoading(false);
      }
    };

    syncUserProfile();
  }, [checkPlanStatus, syncPlanFromUser]);

  const login = (userData) => {
    sessionStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    syncPlanFromUser(userData);
  };

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData };
      sessionStorage.setItem("user", JSON.stringify(updated));
      syncPlanFromUser(updated);
      return updated;
    });
  };

  const logout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("activePlan");
    setUser(null);
    setActivePlanState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        loading,
        activePlan,
        setActivePlan,
        checkPlanStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
