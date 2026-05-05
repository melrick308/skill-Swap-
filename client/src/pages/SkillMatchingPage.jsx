// src/pages/SkillMatchingPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import Background from "../components/background/Background";
import "../components/background/Background.css";
import { FaPaperPlane, FaSearch, FaCompass, FaUser } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import Footer from "../components/footer/Footer";

const SkillMatchingPage = () => {
  const [matches, setMatches] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [ratings, setRatings] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showExplore, setShowExplore] = useState(false);
  const [sessionDetails, setSessionDetails] = useState({});
  const navigate = useNavigate();

  // 🎯 Skill categories for Explore section
  const skillCategories = [
    "Web Development",
    "App Development",
    "Data Science",
    "Machine Learning",
    "UI/UX Design",
    "Cyber Security",
  ];

  useEffect(() => {
    const fetchMatches = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/matches`,
          { headers: { "x-auth-token": token } }
        );

        setMatches(response.data);

        // Fetch ratings
        const ratingPromises = response.data.map(async (match) => {
          try {
            const res = await axios.get(
              `${import.meta.env.VITE_API_BASE_URL}/api/sessions/ratings/${match.user._id}`,
              { headers: { "x-auth-token": token } }
            );
            return { id: match.user._id, rating: res.data.averageRating };
          } catch {
            return { id: match.user._id, rating: "N/A" };
          }
        });

        const ratingsData = await Promise.all(ratingPromises);

        const ratingMap = {};
        ratingsData.forEach((r) => {
          ratingMap[r.id] = r.rating;
        });

        setRatings(ratingMap);
      } catch (err) {
        console.error("Error fetching matches:", err);
      }
    };

    const fetchAllUsers = async () => {
      const token = localStorage.getItem("token");
      try {
        const responseAll = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/matches/all`,
          { headers: { "x-auth-token": token } }
        );
        setAllUsers(responseAll.data);
      } catch (err) {
        console.error("Error fetching all users:", err);
        // Optional: toast.error("Could not fetch all users for explore");
      }
    };

    fetchMatches();
    fetchAllUsers();
  }, [navigate]);

  // 🔎 Normalize function
  const normalize = (value) =>
    value?.toString().toLowerCase().trim();

  // 🔍 Combined filter (Search + Explore)
  const sourceUsers = showExplore ? (allUsers.length > 0 ? allUsers : matches) : matches;

  const filteredMatches = sourceUsers.filter((match) => {
    const search = normalize(searchQuery);

    const name = normalize(match.user?.name);
    const teachSkill = normalize(match.teachSkill);
    const learnSkill = normalize(match.learnSkill); // Added learnSkill check

    const matchesSearch =
      !search ||
      name?.includes(search) ||
      teachSkill?.includes(search) ||
      learnSkill?.includes(search);

    const normalizedSelectedSkills = selectedSkills.map(s => normalize(s));

    const matchesExplore =
      selectedSkills.length === 0 ||
      normalizedSelectedSkills.some(skill =>
        teachSkill?.includes(skill) || learnSkill?.includes(skill)
      );

    return matchesSearch && matchesExplore;
  });

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const sendSessionRequest = async (userId) => {
    const token = localStorage.getItem("token");
    const { date, time } = sessionDetails[userId] || {};
    const targetMatch = sourceUsers.find((m) => m.user._id === userId);
    const skill = targetMatch?.teachSkill || targetMatch?.learnSkill || "Skill Swap";

    if (!date || !time) {
      toast.error("Please select date and time");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/sessions/request`,
        { userId2: userId, sessionDate: date, sessionTime: time, skill },
        { headers: { "x-auth-token": token } }
      );

      toast.success("Session request sent!");
    } catch {
      toast.error("Error sending request");
    }
  };

  return (
    <div className="min-h-screen relative">
      <Background />
      <div className="relative z-10">
        <Navbar />

        <div className="container mx-auto px-4 py-10">
          <h1 className="text-4xl font-bold text-center text-white mb-6">
            Skill Matching
          </h1>

          {/* 🔍 Search */}
          <div className="relative max-w-md mx-auto mb-8">
            <input
              type="text"
              placeholder="Search by name or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-12 pr-4 rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/30 focus:outline-none"
            />
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-700" />
          </div>

          {/* 🚀 Explore Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowExplore(!showExplore)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <FaCompass /> Explore Skills
            </button>
          </div>

          {/* 🚀 Explore Skills Selection */}
          {showExplore && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-10 border border-white/20 animate-fade-in">
              <h3 className="text-white text-xl font-semibold mb-4 text-center">Select Skills to Explore</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {skillCategories.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-4 py-2 rounded-full font-semibold transition-all ${selectedSkills.includes(skill)
                      ? "bg-white text-blue-600 shadow-md transform scale-105"
                      : "bg-blue-500/50 text-white hover:bg-blue-500"
                      }`}
                  >
                    {skill} {selectedSkills.includes(skill) && "✓"}
                  </button>
                ))}
              </div>

              {/* Clear filter */}
              {selectedSkills.length > 0 && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setSelectedSkills([])}
                    className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-md"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 🧑‍💻 Cards */}
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {filteredMatches.length > 0 ? (
              filteredMatches.map((match) => (
                <div
                  key={match.user._id}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 text-white"
                >
                  {/* Profile */}
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={
                        match.user?.profilePicture
                          ? `${import.meta.env.VITE_API_BASE_URL}/uploads/profile-pictures/${match.user.profilePicture}`
                          : "/default-avatar.png"
                      }
                      alt="profile"
                      className="w-16 h-16 rounded-full object-cover border"
                      onError={(e) => {
                        e.target.src = "/default-avatar.png";
                      }}
                    />

                    <div>
                      <h3 className="font-bold text-lg">
                        {match.user.name}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {match.user.email}
                      </p>
                      <p className="text-yellow-500 font-semibold">
                        ⭐ {ratings[match.user._id] || "N/A"}
                      </p>
                    </div>
                  </div>

                  <p className="font-semibold text-blue-400 mb-1">
                    Teaches: {match.teachSkill}
                  </p>
                  {showExplore && match.learnSkill && (
                    <p className="font-semibold text-green-400 mb-3">
                      Wants to Learn: {match.learnSkill}
                    </p>
                  )}

                  <input
                    type="date"
                    className="w-full mb-2 p-2 !bg-white/10 text-white border border-white/30 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) =>
                      setSessionDetails((prev) => ({
                        ...prev,
                        [match.user._id]: {
                          ...prev[match.user._id],
                          date: e.target.value,
                        },
                      }))
                    }
                  />

                  <input
                    type="time"
                    className="w-full mb-3 p-2 !bg-white/10 text-white border border-white/30 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) =>
                      setSessionDetails((prev) => ({
                        ...prev,
                        [match.user._id]: {
                          ...prev[match.user._id],
                          time: e.target.value,
                        },
                      }))
                    }
                  />

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        sendSessionRequest(match.user._id)
                      }
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                    >
                      <FaPaperPlane className="inline mr-2" />
                      Send Request
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/profile/${match.user._id}`)
                      }
                      className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white py-2 rounded-lg transition font-semibold"
                    >
                      <FaUser className="inline mr-2 text-gray-600" />
                      View Profile
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-white font-bold">
                No users found
              </div>
            )}
          </div>

          <ToastContainer />
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default SkillMatchingPage;
