import React, { useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { FaLinkedin, FaGithub } from "react-icons/fa";

// Importing components
import Navbar from "../components/navbar/Navbar"; // Import the Navbar component
import Footer from "../components/footer/Footer";
import Background from "../components/background/Background";
import "../components/background/Background.css";

// Importing images
import ahmadImg from "../assets/gaurav.jpeg";
import wahajImg from "../assets/gaurav.jpeg";
import miraalImg from "../assets/gaurav.jpeg";
import muneebImg from "../assets/gaurav.jpeg";
import hashimImg from "../assets/gaurav.jpeg";

// Team data with images
const team = [
  {
    name: "Gaurav Tribhuwan",
    role: "Backend Developer",
    image: ahmadImg,
    linkedin: "",
    github: "",
  },
  {
    name: "Roshan bhende",
    role: "Frontend Developer",
    image: wahajImg,
    linkedin: "",
    github: "",
  },
  {
    name: "Om Nagpure",
    role: "Frontend Developer",
    image: miraalImg,
    linkedin: "",
    github: "",
  },
  {
    name: "Sanand Sabne",
    role: "Backend Developer",
    image: muneebImg,
    linkedin: "",
    github: "",
  },
  {
    name: "",
    role: "Database Manager",
    image: hashimImg,
    linkedin: "",
    github: "",
  },
];

const AboutUsPage = () => {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="text-white">
      {/* Navbar */}
      <Navbar />

      <div
        className="home-hero"
        style={{
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Hero Section */}
        <Background />

        <div />
        <section className="h-1/4 flex flex-col justify-center text-center py-8 px-4 ">
          <motion.h1
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-3"
          >
            About SkillSwap
          </motion.h1>
          <motion.p
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-lg font-semibold italic font-light max-w-xl mx-auto"
          >
            A futuristic peer-to-peer skill exchange platform, connecting
            learners and experts worldwide.
          </motion.p>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 px-6 grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Mission Block */}
          <div>
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20"
            >
              <h2 className="text-2xl font-semibold mb-2">Our Mission</h2>
              <p className="text-white ">
                To empower individuals to grow through collaborative learning
                and skill-sharing communities.
              </p>
            </motion.div>
          </div>

          {/* Vision Block */}
          <div>
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20"
            >
              <h2 className="text-2xl font-semibold mb-2">Our Vision</h2>
              <p className="text-white">
                A global network where anyone can teach and learn any
                skill—seamlessly, affordably, and quickly.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section
          id="team"
          className="py-16 px-6 bg-transparent"
        >
          <h2 className="text-3xl font-bold text-center mb-10 text-white">
            Meet the Team
          </h2>
          <div className="flex justify-center gap-10 max-w-full mx-auto flex-wrap">
            {team.map((member, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-lg p-6 rounded-xl text-center shadow-xl border border-white/20 text-white w-full sm:w-1/2 md:w-1/5"
              >
                <div className="h-40 w-40 mx-auto rounded-full overflow-hidden mb-4 border-2 border-white/30 shadow-lg">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                <p className="text-sm text-blue-300">{member.role}</p>
                <div className="flex justify-center gap-4 mt-3">
                  <a href={member.linkedin} target="_blank" rel="noreferrer">
                    <FaLinkedin
                      className="text-blue-400 hover:text-blue-300 transition"
                      size={20}
                    />
                  </a>
                  <a href={member.github} target="_blank" rel="noreferrer">
                    <FaGithub
                      className="text-gray-300 hover:text-white transition"
                      size={20}
                    />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-white/5 backdrop-blur-md border-t border-white/10 text-center text-white">
          <h2 className="text-4xl font-extrabold mb-4">
            Join the Skill Revolution
          </h2>
          <p className="mb-6 text-lg italic">
            Start teaching, learning, and growing with the global SkillSwap
            community.
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            Explore Skills
          </button>
        </section>
        <Footer />
      </div>
    </div>
  );
};

export default AboutUsPage;
