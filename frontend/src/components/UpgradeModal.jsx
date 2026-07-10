import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  X,
  Zap,
  Crown,
  Building,
  Star,
  CreditCard,
  Lock,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  User,
  Calendar,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import "../styles/UpgradeModal.css";

const UpgradeModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { updateUser, activePlan, setActivePlan, checkPlanStatus } = useAuth();
  const modalRef = useRef(null);

  // State Management
  const [step, setStep] = useState("plans"); // 'plans' or 'payment' or 'success'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // Re-check plan status on mount and periodically
  useEffect(() => {
    checkPlanStatus();
    const interval = setInterval(checkPlanStatus, 60000);
    return () => clearInterval(interval);
  }, [checkPlanStatus]);

  const getRemainingDays = (expiryDate) => {
    const now = new Date().getTime();
    const diffTime = Math.max(0, expiryDate - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleOutsideClick = (event) => {
    if (
      modalRef.current &&
      !modalRef.current.contains(event.target) &&
      !isProcessing
    ) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.body.style.overflow = "hidden";
      // Reset state when opening
      setStep("plans");
      setPaymentError("");
      setFormData({ cardHolder: "", cardNumber: "", expiry: "", cvv: "" });
      setFormErrors({});
      checkPlanStatus();
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const plans = [
    {
      id: "free",
      name: t("free") || "Free",
      price: 0,
      iconType: "Star",
      features: [
        "10 Messages / Day",
        "Basic Model (Llama 3.1)",
        "No File Uploads",
        "Standard Speed",
      ],
      color: "gray",
    },
    {
      id: "pro",
      name: t("pro") || "Pro",
      price: 19,
      iconType: "Zap",
      features: [
        "100 Messages / Day",
        "Advanced Model (Llama 3.3 70B)",
        "File Uploads Included",
        "Priority Speed",
      ],
      popular: true,
      color: "emerald",
    },
    {
      id: "enterprise",
      name: t("enterprise") || "Enterprise",
      price: 99,
      iconType: "Building",
      features: [
        "Unlimited Messages",
        "Advanced Model (Llama 3.3 70B)",
        "File Uploads Included",
        "24/7 Dedicated Support",
      ],
      color: "blue",
    },
  ];

  const getIcon = (type) => {
    switch (type) {
      case "Star":
        return <Star className="plan-icon" />;
      case "Zap":
        return <Zap className="plan-icon" />;
      case "Building":
        return <Building className="plan-icon" />;
      default:
        return null;
    }
  };

  const handleSelectPlan = (plan) => {
    if (activePlan?.id === plan.id) return;
    setSelectedPlan(plan);
    setStep("payment");
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.cardHolder.trim()) errors.cardHolder = "Name is required";
    if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, "")))
      errors.cardNumber = "Invalid card number";
    if (!/^\d{2}\/\d{2}$/.test(formData.expiry))
      errors.expiry = "Use MM/YY format";
    if (!/^\d{3}$/.test(formData.cvv)) errors.cvv = "Need 3 digits";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cardNumber") {
      formattedValue = value.replace(/\D/g, "").substring(0, 16);
      formattedValue = formattedValue.replace(/(.{4})/g, "$1 ").trim();
    } else if (name === "expiry") {
      formattedValue = value.replace(/\D/g, "").substring(0, 4);
      if (formattedValue.length > 2) {
        formattedValue =
          formattedValue.substring(0, 2) + "/" + formattedValue.substring(2);
      }
    } else if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").substring(0, 3);
    }

    setFormData({ ...formData, [name]: formattedValue });
  };

  const processPayment = async (e) => {
    e.preventDefault();
    if (!validateForm() || !selectedPlan) return;

    setIsProcessing(true);
    setPaymentError("");

    try {
      // 1. Simulate API call for the credit card payment
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 2000);
      });

      // 2. Fetch the current logged-in user to get their JWT token
      const userStr = sessionStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;

      if (!userObj || !userObj.token) {
        throw new Error("You must be logged in to upgrade.");
      }

      // 3. 👉 THE FIX: Tell the backend database about the upgrade!
      const API_BASE_URL = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userObj.token}`,
        },
        body: JSON.stringify({
          subscription: selectedPlan.id, // Sends 'pro' or 'enterprise'
          // Do NOT change role during plan upgrade. Role (user/admin) is separate from subscription (free/pro/enterprise).
        }),
      });

      if (!response.ok) {
        throw new Error("Payment processed, but failed to sync with database.");
      }

      // 4. Update local storage with the fresh data from the backend
      const updatedUser = await response.json();
      updateUser(updatedUser); // Update context state immediately

      // 5. Update activePlan in context (this updates ALL components instantly)
      const activationDate = new Date().getTime();
      const durationDays = 30; // Default 30 days
      const expiryDate = activationDate + durationDays * 24 * 60 * 60 * 1000;

      const sanitizedPlan = {
        id: selectedPlan.id,
        name: selectedPlan.name,
        price: selectedPlan.price,
        iconType: selectedPlan.iconType,
        activationDate,
        expiryDate,
        status: "active",
      };

      // Context's setActivePlan handles both state + localStorage
      setActivePlan(sanitizedPlan);
      setStep("success");
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentError(
        err.message || "Payment declined. Please check your card details.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="upgrade-overlay" aria-modal="true" role="dialog">
      <div
        className={`upgrade-modal glass ${step === "payment" ? "payment-mode" : ""}`}
        ref={modalRef}
      >
        <button
          className="close-upgrade-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {step === "plans" && (
          <>
            <div className="upgrade-header fade-in">
              <div className="crown-badge">
                <Crown size={24} />
              </div>
              <h1>{t("upgradeTitle") || "Upgrade Your Plan"}</h1>
              <p>
                {t("upgradeSubtitle") ||
                  "Unlock the full power of AI with our premium features."}
              </p>
            </div>

            <div className="pricing-grid">
              {plans.map((plan) => {
                // If activePlan is null, we are on the 'free' plan
                const isActive =
                  activePlan?.id === plan.id ||
                  (!activePlan && plan.id === "free");
                // Disable other plans ONLY if we are on a PAID plan (pro/enterprise)
                // If we are on 'free', all plans except 'free' should be enabled
                const isDisabled =
                  activePlan && activePlan.id !== "free" && !isActive;

                return (
                  <div
                    key={plan.id}
                    className={`pricing-card ${plan.popular ? "popular" : ""} ${plan.color} ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                  >
                    {plan.popular && (
                      <div className="popular-badge">
                        {t("popular") || "Most Popular"}
                      </div>
                    )}
                    {isActive && (
                      <div className="active-badge">
                        <Check size={14} />
                        {t("active") || "Active"}
                      </div>
                    )}
                    <div className="plan-header">
                      {getIcon(plan.iconType)}
                      <h3>{plan.name}</h3>
                      <div className="plan-price">
                        <span className="price-value">${plan.price}</span>
                        <span className="price-period">
                          /{t("perMonth") || "month"}
                        </span>
                      </div>
                    </div>

                    <ul className="plan-features">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex}>
                          <Check size={16} className="feature-check" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="plan-footer">
                      {isActive && activePlan && plan.id !== "free" ? (
                        <div className="plan-status-info">
                          <Clock size={14} />
                          <span>
                            {getRemainingDays(activePlan.expiryDate)} days left
                          </span>
                        </div>
                      ) : null}

                      <button
                        className={`plan-btn ${isActive ? "active-btn" : ""}`}
                        onClick={() => handleSelectPlan(plan)}
                        disabled={isDisabled || isActive}
                      >
                        {isActive
                          ? t("currentPlan") || "Current Plan"
                          : t("upgradeNow") || "Upgrade Now"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === "payment" && (
          <div className="payment-container slide-in">
            <div className="payment-header">
              <button className="back-btn" onClick={() => setStep("plans")}>
                <X size={20} className="rotate-45" />
                <span>Back to Plans</span>
              </button>
              <h2>Secure Checkout</h2>
            </div>

            <div className="payment-layout">
              <div className="payment-summary">
                <div className="summary-card">
                  <h3>Order Summary</h3>
                  <div className="summary-row">
                    <span>Plan</span>
                    <span className="summary-plan-name">
                      {selectedPlan.name}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Duration</span>
                    <span>30 Days</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-row total">
                    <span>Total Cost</span>
                    <span>${selectedPlan.price}.00</span>
                  </div>
                  <div className="trust-badges">
                    <ShieldCheck size={16} /> <span>SSL Secure Payment</span>
                  </div>
                </div>
              </div>

              <div className="payment-form-section">
                <form onSubmit={processPayment} className="payment-form">
                  <div className="input-group">
                    <label>Card Holder Name</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <input
                        type="text"
                        name="cardHolder"
                        placeholder="John Doe"
                        value={formData.cardHolder}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {formErrors.cardHolder && (
                      <span className="error-text">
                        {formErrors.cardHolder}
                      </span>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Card Number</label>
                    <div className="input-with-icon">
                      <CreditCard size={18} className="input-icon" />
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="0000 0000 0000 0000"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {formErrors.cardNumber && (
                      <span className="error-text">
                        {formErrors.cardNumber}
                      </span>
                    )}
                  </div>

                  <div className="input-row">
                    <div className="input-group">
                      <label>Expiry Date</label>
                      <div className="input-with-icon">
                        <Calendar size={18} className="input-icon" />
                        <input
                          type="text"
                          name="expiry"
                          placeholder="MM/YY"
                          value={formData.expiry}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      {formErrors.expiry && (
                        <span className="error-text">{formErrors.expiry}</span>
                      )}
                    </div>
                    <div className="input-group">
                      <label>CVV</label>
                      <div className="input-with-icon">
                        <Star size={18} className="input-icon" />
                        <input
                          type="password"
                          name="cvv"
                          placeholder="•••"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      {formErrors.cvv && (
                        <span className="error-text">{formErrors.cvv}</span>
                      )}
                    </div>
                  </div>

                  {paymentError && (
                    <div className="payment-error-banner">
                      <AlertCircle size={18} />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`pay-now-btn ${isProcessing ? "loading" : ""}`}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="spinner"></div>
                    ) : (
                      <>
                        <Lock size={18} />
                        <span>Pay ${selectedPlan.price}.00 Now</span>
                      </>
                    )}
                  </button>

                  <p className="secure-text">
                    <ShieldCheck size={14} />
                    Your payment details are encrypted and secure.
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="success-container scale-in">
            <div className="success-icon-wrapper">
              <ShieldCheck size={64} className="success-icon" />
            </div>
            <h2>Upgrade Successful!</h2>
            <p>
              Your account has been upgraded to the{" "}
              <strong>{activePlan?.name}</strong> plan.
            </p>
            <div className="success-details">
              <div className="detail-item">
                <Clock size={18} />
                <span>Valid for 30 days</span>
              </div>
              <div className="detail-item">
                <Check size={18} />
                <span>All features unlocked</span>
              </div>
            </div>
            <button className="finish-btn" onClick={onClose}>
              Get Started <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradeModal;
