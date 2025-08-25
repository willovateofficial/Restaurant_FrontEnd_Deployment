import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { baseUrl } from "../config";
import { Eye, EyeOff } from "lucide-react";

const baseURL = baseUrl;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${baseURL}/api/password-reset`, { email });
      toast.success(res.data.message || "OTP sent to your email", {
        position: "top-center",
        autoClose: 3000,
      });
      setShowOtpInput(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send OTP", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${baseURL}/api/password-reset/verify`, {
        email,
        otp,
      });
      toast.success(res.data.message || "OTP verified successfully", {
        position: "top-center",
        autoClose: 3000,
      });
      setOtpVerified(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid OTP", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${baseURL}/api/password-reset/change`, {
        email,
        newPassword,
      });
      toast.success("Password changed successfully! Redirecting to login...", {
        position: "top-center",
        autoClose: 2000,
      });
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reset password", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage:
          "url('https://b.zmtcdn.com/data/pictures/7/18692257/e8cc9f07aad58148ba093ba7c9eb9a01.jpg')",
      }}
    >
      <div className="absolute top-6 right-6 z-10">
        <h1 className="text-orange-400 text-3xl font-extrabold tracking-wider">
          WILLOVATE
        </h1>
      </div>

      <div className="absolute inset-0 bg-black opacity-70 z-0" />
      <div className="relative z-10 max-w-md w-full bg-white shadow-lg p-8 rounded-xl">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Forgot Password
        </h2>

        {!showOtpInput ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-1">
                Enter your email
              </label>
              <input
                type="email"
                id="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-300 disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : !otpVerified ? (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label htmlFor="otp" className="block text-gray-700 mb-1">
                Enter OTP
              </label>
              <input
                type="text"
                id="otp"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-300 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                placeholder="New Password"
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {otpVerified && (
              <div className="text-center mt-4">
                <button
                  onClick={() => navigate("/login")}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Go to Login
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-300 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default ForgotPassword;
