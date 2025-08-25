import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "../hooks/useRegister";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useRegister();

  const [form, setForm] = useState({
    name: "",
    email: "",
    business_name: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      await mutateAsync({
        name: form.name,
        email: form.email,
        business_name: form.business_name,
        business_type: "restaurant",
        role: "owner",
        phone: form.phone,
        address: form.address,
        password: form.password,
      });

      localStorage.setItem("userEmail", form.email);
      localStorage.setItem("userPhone", form.phone);
      localStorage.setItem("businessName", form.business_name);
      toast.success("Registration successful!");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err: any) {
      // Get message from backend safely
      const backendMessage =
        err.response?.data?.message || err.response?.data?.error || err.message;

      if (
        backendMessage?.toLowerCase().includes("already exists") ||
        backendMessage?.toLowerCase().includes("duplicate") ||
        backendMessage?.toLowerCase().includes("registered")
      ) {
        toast.error("This email is already registered. Please log in.");
      } else {
        toast.error(backendMessage || "Registration failed. Please try again.");
      }
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1950&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60 z-0"></div>

      <div className="absolute top-6 right-6 z-10">
        <h1 className="text-orange-400 text-3xl font-extrabold tracking-wider">
          WILLOVATE
        </h1>
      </div>

      <div className="flex items-center justify-center min-h-screen relative z-10 px-4">
        <div className="bg-white bg-opacity-95 rounded-2xl shadow-2xl w-full max-w-md p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">
            Create Your Account
          </h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Sign up to get started
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
            <input
              type="text"
              name="business_name"
              placeholder="Restaurant Name"
              value={form.business_name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-300 disabled:opacity-50"
            >
              {isPending ? "Registering..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-orange-500 hover:underline font-medium"
            >
              Login
            </Link>
          </p>
        </div>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Register;
