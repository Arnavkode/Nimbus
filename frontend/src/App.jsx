import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  ShieldCheck,
  Loader2,
  LogIn,
  Info,
  X,
  AlertTriangle,
} from "lucide-react";

const NimbusVaultLogo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-cyan-400 mr-3"
  >
    <path d="M12 10a5 5 0 0 1 0 10v-5h5a5 5 0 0 1-5-5z" />
    <path d="M16 16h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" />
    <path d="M8 8H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2" />
    <path d="M12 2v3" />
    <path d="M12 19v3" />
    <path d="m3.5 7.5 1.8 1.8" />
    <path d="m18.7 14.3 1.8 1.8" />
  </svg>
);

const AnimatedBackgroundStyles = () => (
  <style>
    {`
      @keyframes gradient-animation {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .animated-gradient-bg {
        background: linear-gradient(-45deg, #0f172a, #0b1120, #0a2f3f, #0a3a5a, #0b1120);
        background-size: 400% 400%;
        animation: gradient-animation 15s ease infinite;
      }
      .noise-overlay {
        position: relative;
        overflow: hidden;
      }
      .noise-overlay::before {
        content: "";
        position: absolute; inset: 0;
        background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxu...');
        opacity: 0.05;
        pointer-events: none;
        z-index: 0;
      }
    `}
  </style>
);

const InputField = ({
  id,
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  icon,
}) => {
  const handleChange = (e) => {
    if (!onChange) return;
    try {
      // Preferred: parent passed a setter like `setX` or a function that accepts a string
      onChange(e.target.value);
    } catch (err) {
      // Fallback: parent expects the raw event handler signature `(e) => ...`
      try {
        onChange(e);
      } catch (err2) {
        /* no-op */
      }
    }
  };

  return (
    <div className="mb-3 sm:mb-4">
      <label
        htmlFor={id}
        className="block text-xs sm:text-sm text-gray-300 mb-1 sm:mb-2"
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3">
          {React.cloneElement(icon, { size: 16 })}
        </span>
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="w-full p-2.5 sm:p-3 pl-8 sm:pl-10 text-sm sm:text-base rounded-lg bg-black/20 border border-white/20 text-white outline-none focus:ring-2 focus:ring-cyan-400"
          required
        />
      </div>
    </div>
  );
};

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const navigate = useNavigate();

  // Show instructions dialog on mount (check if user has seen it before)
  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem("hasSeenInstructions");
    if (!hasSeenInstructions) {
      setShowInstructions(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isLoginMode) {
      if (!username || !password || !confirmPassword)
        return setError("Please fill in all fields.");
      if (password !== confirmPassword)
        return setError("Passwords do not match.");
      if (password.length < 8)
        return setError("Password must be at least 8 characters.");
    } else {
      if (!username || !password)
        return setError("Please enter username and password.");
    }

    setIsLoading(true);
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
    const endpoint = isLoginMode
      ? `${API_BASE}/api/login`
      : `${API_BASE}/api/register`;
    const body = { username, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) setError(data.message || "An error occurred.");
      else {
        if (isLoginMode) {
          // Store username and uid in localStorage for the dashboard
          localStorage.setItem("username", username);
          localStorage.setItem("uid", data.uid);
          // navigate to dashboard on successful login
          try {
            navigate("/dashboard");
          } catch (e) {
            window.location.href = "/dashboard";
          }
        } else {
          setSuccess("Welcome, " + username + "! Registration successful.");
        }
        setUsername("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // InputField: supports both setter-style `onChange(value)` and event-style `onChange(event)`
  // It tries to call the setter with the new string value first; if that throws (parent expects
  // the raw event), it falls back to calling the original event handler. This keeps the API
  // flexible and prevents focus/cursor issues caused by accidental signature mismatches.

  const handleCloseInstructions = () => {
    setShowInstructions(false);
    localStorage.setItem("hasSeenInstructions", "true");
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  return (
    <div className="relative min-h-screen w-full p-2 sm:p-4 animated-gradient-bg">
      <AnimatedBackgroundStyles />

      {/* Instructions Dialog */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl mx-auto rounded-xl sm:rounded-2xl shadow-2xl bg-gradient-to-br from-purple-900/40 to-cyan-900/40 p-[2px]">
            <div className="bg-black/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-white/20">
              {/* Close Button */}
              <button
                onClick={handleCloseInstructions}
                className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 text-gray-400 hover:text-white transition-colors touch-manipulation"
                aria-label="Close instructions"
              >
                <X size={24} className="sm:w-8 sm:h-8" />
              </button>

              {/* Header */}
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 mb-3 sm:mb-4">
                  <AlertTriangle
                    size={24}
                    className="sm:w-10 sm:h-10 md:w-12 md:h-12 text-yellow-400"
                  />
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">
                  INSTRUCTIONS BEFORE USE
                </h2>
              </div>

              {/* Instructions List */}
              <div className="space-y-3 sm:space-y-4 md:space-y-6 mb-6 sm:mb-8">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-cyan-500/20 flex items-center justify-center mt-0.5">
                    <span className="text-sm sm:text-lg md:text-xl font-bold text-cyan-400">
                      1
                    </span>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-gray-300 flex-1 pt-0.5">
                    Please do not use on{" "}
                    <span className="font-semibold text-yellow-400">
                      Thapar internet
                    </span>{" "}
                    as Fortinet does not allow API calls on an ngrok tunnel
                  </p>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-cyan-500/20 flex items-center justify-center mt-0.5">
                    <span className="text-sm sm:text-lg md:text-xl font-bold text-cyan-400">
                      2
                    </span>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-gray-300 flex-1 pt-0.5">
                    If the server is not running please call{" "}
                    <a
                      href="mailto:agupta29_be23@thapar.edu"
                      className="font-semibold text-cyan-400 hover:underline"
                    >
                      Arnav
                    </a>{" "}
                    once, to turn on the machine
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCloseInstructions}
                className="w-full px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-semibold rounded-lg sm:rounded-xl touch-manipulation
                         bg-gradient-to-r from-cyan-600 to-blue-700 text-white
                         hover:from-cyan-500 hover:to-blue-600 
                         transition-all transform active:scale-95 flex items-center justify-center gap-2 sm:gap-3"
              >
                <ShieldCheck size={18} className="sm:w-5 sm:h-5" />
                Got it, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center min-h-screen relative z-10 py-4 sm:py-0">
        <div className="w-full sm:w-3/4 max-w-4xl rounded-xl sm:rounded-2xl shadow-2xl animated-gradient-bg p-[2px] mx-auto">
          <main
            className="w-full p-4 sm:p-8 md:p-12 bg-black/20 backdrop-blur-lg rounded-[18px] sm:rounded-[22px] noise-overlay"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          >
            <div className="text-center mb-4 sm:mb-8 relative z-10">
              <div className="flex justify-center items-center mb-2 sm:mb-4">
                <NimbusVaultLogo />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white ml-2">
                  NimbusVault
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-400">
                Unleashing the Power of Your Data
              </p>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10">
              {error && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 text-xs sm:text-sm bg-red-500/20 text-red-300 rounded-lg border border-red-500/30">
                  <div className="font-semibold mb-2">{error}</div>
                  {error === "Failed to connect to the server." && (
                    <div className="mt-3 pt-3 border-t border-red-500/30 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-red-400 font-bold flex-shrink-0">
                          1.
                        </span>
                        <p className="text-xs sm:text-sm">
                          Please do not use on{" "}
                          <span className="font-semibold">Thapar internet</span>{" "}
                          as Fortinet does not allow API calls on an ngrok
                          tunnel
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-400 font-bold flex-shrink-0">
                          2.
                        </span>
                        <p className="text-xs sm:text-sm">
                          If the server is not running please call{" "}
                          <span className="font-semibold">Arnav</span> once, to
                          turn on the machine
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {success && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 text-xs sm:text-sm bg-green-500/20 text-green-300 rounded-lg border border-green-500/30">
                  {success}
                </div>
              )}

              <InputField
                id="username"
                label="Username"
                type="text"
                placeholder="e.g., data_guardian"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={<User size={18} />}
              />

              <InputField
                id="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={18} />}
              />

              {!isLoginMode && (
                <>
                  <InputField
                    id="confirmPassword"
                    label="Re-enter Password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock size={18} />}
                  />
                  <div
                    className="text-base text-yellow-300/95 mb-4"
                    aria-live="polite"
                  >
                    {confirmPassword && password !== confirmPassword
                      ? "Passwords do not match."
                      : ""}
                  </div>
                </>
              )}

              <div className="mt-4 sm:mt-6">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-lg font-semibold text-base sm:text-lg text-white touch-manipulation
                    bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 active:scale-95 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : isLoginMode ? (
                    <LogIn size={18} />
                  ) : (
                    <ShieldCheck size={18} />
                  )}
                  {isLoading
                    ? "Processing..."
                    : isLoginMode
                    ? "Login"
                    : "Sign Up"}
                </button>
              </div>

              <div className="text-center mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
                <button
                  type="button"
                  onClick={handleShowInstructions}
                  className="text-xs sm:text-sm text-cyan-400 hover:underline flex items-center justify-center gap-1 sm:gap-2"
                >
                  <Info size={14} className="sm:w-4 sm:h-4" />
                  View Instructions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-xs sm:text-sm text-cyan-400 hover:underline"
                >
                  {isLoginMode
                    ? "Don't have an account?"
                    : "Already have an account?"}
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
