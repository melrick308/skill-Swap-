import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../redux/slices/authSlice";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import loginImage from "../assets/bg-img.webp";
import { FiMail, FiLock } from "react-icons/fi";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { motion } from "framer-motion";
import {jwtDecode} from 'jwt-decode'; // Added this line

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    // Field validation
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    // API call
    dispatch(loginStart());
    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });


      const token = response.data.token;
      const decoded = jwtDecode(token)

      const role = decoded?.user?.role || 'user';


      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        name: response.data.name,
        email: response.data.email,
        _id: response.data.id,
        role: decoded.user.role // Save role too
      }));

      dispatch(loginSuccess(token));

      // Redirect based on role
      if (decoded.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }

    } catch (err) {
      const errorMessage = err.response?.data?.msg || "Something went wrong!";
      dispatch(loginFailure(errorMessage));
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex fixed inset-0 overflow-hidden">
      {/* Left: Login Form */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="w-1/2 h-full flex flex-col justify-center items-center bg-gradient-to-br from-gray-100 via-blue-100 to-blue-200 relative z-10"
      >
        {/* Animated Website Title */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-6 text-center"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Skill Swap
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 italic mt-1">
            Empower your skills. Connect. Grow.
          </p>
        </motion.div>

        {/* Login Box */}
        <div className="mt-12 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-[90%] max-w-md">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4 sm:mb-6">
            Welcome Back
          </h2>
          {/* Error Message */}
          {error && <p className="text-red-500 font-semibold text-center mb-3">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div className="relative">
              <FiMail className="absolute top-1/2 left-3 transform -translate-y-1/2 text-blue-500" />
              <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (
                    error === "Please enter your email address." ||
                    error === "Please enter a valid email address."
                  ) {
                    setError(""); // Clear error when user starts typing
                  }
                }}
                className="pl-10 pr-4 py-2 sm:py-3 w-full rounded-full border border-gray-300 outline-none text-sm sm:text-base md:text-lg text-gray-900 bg-gray-100 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <FiLock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-blue-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error === "Password is required.") {
                    setError(""); // Clear error when user starts typing
                  }
                }}
                className="pl-10 pr-10 py-2 sm:py-3 w-full rounded-full border border-gray-300 outline-none text-sm sm:text-base md:text-lg text-gray-900 bg-gray-100 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <div
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-blue-500 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-2/3 mx-auto flex justify-center items-center gap-2 bg-blue-500 text-white font-semibold py-2 sm:py-3 rounded-full border border-blue-700 hover:bg-blue-600 hover:text-gray-100 transition duration-300 text-sm sm:text-base md:text-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center mt-4">
            <p className="text-sm sm:text-base md:text-lg text-white">
              Don't have an account?{" "}
              <Link to="/register" className="underline hover:text-gray-200">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right: Background Image Animation */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="w-1/2 h-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${loginImage})`,
        }}
      ></motion.div>
    </div>
  );
};

export default LoginPage;
