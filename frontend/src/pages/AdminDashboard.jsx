import React, { useState, useEffect } from "react";
import {
  Users,
  MessageSquare,
  CreditCard,
  ShieldAlert,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { API_BASE_PATH } from "../services/api";
import "../styles/AdminDashboard.css"; // We will assume you create a CSS file for this

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const userStr = sessionStorage.getItem("user");
      const token = userStr ? JSON.parse(userStr).token : "";

      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch(`${API_BASE_PATH}/admin/stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Access Denied: You must be an Admin to view this page.",
          );
        }
        throw new Error("Failed to fetch admin statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("[AdminDashboard Error]:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract specific counts from the aggregation arrays
  const getCount = (array, targetId) => {
    if (!array) return 0;
    const item = array.find((a) => a._id === targetId);
    return item ? item.count : 0;
  };

  if (loading) {
    return (
      <div className="admin-loading-container">
        <Activity className="spinner-icon" size={48} />
        <h2>Loading Verity Core Metrics...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error-container">
        <ShieldAlert size={48} className="error-icon" />
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="back-btn"
        >
          Return to App
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container slide-in">
      <header className="admin-header">
        <div className="admin-header-left">
          <button
            onClick={() => (window.location.href = "/")}
            className="back-icon-btn"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1>Verity Admin Console</h1>
            <p>System Overview & Analytics</p>
          </div>
        </div>
      </header>

      {/* Top Metrics Grid */}
      <div className="admin-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrapper blue">
            <Users size={24} />
          </div>
          <div className="metric-data">
            <h3>Total Users</h3>
            <p className="metric-value">{stats?.totalUsers || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper green">
            <MessageSquare size={24} />
          </div>
          <div className="metric-data">
            <h3>Total Conversations</h3>
            <p className="metric-value">{stats?.totalChats || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper purple">
            <CreditCard size={24} />
          </div>
          <div className="metric-data">
            <h3>Pro Subscriptions</h3>
            <p className="metric-value">
              {getCount(stats?.usersBySubscription, "pro")}
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper orange">
            <ShieldAlert size={24} />
          </div>
          <div className="metric-data">
            <h3>Admin Accounts</h3>
            <p className="metric-value">
              {getCount(stats?.usersByRole, "admin")}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="admin-table-container">
        <h2>Recent Signups</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Plan</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {stats?.recentUsers?.map((user) => (
              <tr key={user._id}>
                <td data-label="Name">
                  <strong>{user.name}</strong>
                </td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Role">
                  <span className={`badge role-${user.role}`}>{user.role}</span>
                </td>
                <td data-label="Plan">
                  <span className={`badge plan-${user.subscription}`}>
                    {user.subscription}
                  </span>
                </td>
                <td data-label="Joined Date">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {stats?.recentUsers?.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-state">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
