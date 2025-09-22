import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

const Home: React.FC = () => {
  const [typedText, setTypedText] = useState("");
  const fullText = "Employment & Company Verification Platform";

  useEffect(() => {
    let index = 0;
    let isDeleting = false;
    
    const timer = setInterval(() => {
      if (!isDeleting && index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else if (!isDeleting && index > fullText.length) {
        // Pause at the end before starting to delete
        setTimeout(() => {
          isDeleting = true;
        }, 2000);
      } else if (isDeleting && index > 0) {
        index--;
        setTypedText(fullText.slice(0, index));
      } else if (isDeleting && index === 0) {
        // Reset for next cycle
        isDeleting = false;
        index = 0;
      }
    }, isDeleting ? 50 : 70);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      {/* Glowing Grid Background */}
      <div className="absolute inset-0 opacity-30 md:opacity-50">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:20px_20px] md:bg-[length:40px_40px] shadow-2xl"></div>
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-10 left-5 md:top-20 md:left-20 w-32 h-32 md:w-96 md:h-96 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-30 md:opacity-40 animate-pulse shadow-[0_0_50px_rgba(34,211,238,0.5)] md:shadow-[0_0_100px_rgba(34,211,238,0.7)]"></div>
      <div className="absolute bottom-10 right-5 md:bottom-20 md:right-20 w-32 h-32 md:w-96 md:h-96 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full blur-3xl opacity-30 md:opacity-40 animate-pulse shadow-[0_0_50px_rgba(219,39,119,0.5)] md:shadow-[0_0_100px_rgba(219,39,119,0.7)]"></div>

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 rounded-2xl md:rounded-3xl bg-white/15 backdrop-blur-3xl border border-white/30 shadow-[0_0_40px_rgba(168,85,247,0.4),0_0_60px_rgba(34,211,238,0.3),inset_0_0_30px_rgba(255,255,255,0.1)] md:shadow-[0_0_80px_rgba(168,85,247,0.6),0_0_120px_rgba(34,211,238,0.4),inset_0_0_60px_rgba(255,255,255,0.1)]">
        {/* Logo Badge */}
        <div className="flex items-center justify-center mb-6 md:mb-10">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_30px_rgba(168,85,247,0.6),0_0_50px_rgba(34,211,238,0.4)] md:shadow-[0_0_60px_rgba(168,85,247,0.8),0_0_100px_rgba(34,211,238,0.6)]">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div> 

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-cyan-600 via-green-300 to-black bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.7)] md:drop-shadow-[0_0_60px_rgba(255,255,255,0.9)] tracking-wide">
          ID Verification
        </h1>

        {/* Typing Effect Subtitle */}
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium text-white/90 mb-6 sm:mb-8 md:mb-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] px-2">
          {typedText}
          <span className="animate-pulse">|</span>
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 max-w-xl md:max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] px-2">
          Instantly verify employee credentials and company employment history.  
          Trusted platform for HR teams and organizations worldwide.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link
            to="/verify-result"
            className="group inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl text-base sm:text-lg hover:scale-105 sm:hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(168,85,247,0.5),0_0_40px_rgba(34,211,238,0.3)] md:shadow-[0_0_30px_rgba(168,85,247,0.7),0_0_60px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.7),0_0_50px_rgba(34,211,238,0.5)] md:hover:shadow-[0_0_50px_rgba(168,85,247,0.9),0_0_80px_rgba(34,211,238,0.7)]"
          >
            <Search className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
            Verify Employee ID
          </Link>

          <Link
            to="/about"
            className="group inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/15 backdrop-blur-md border border-white/40 text-white font-bold rounded-xl text-base sm:text-lg hover:scale-105 sm:hover:scale-110 transition-all duration-500 shadow-[0_0_15px_rgba(255,255,255,0.3),inset_0_0_15px_rgba(255,255,255,0.1)] md:shadow-[0_0_25px_rgba(255,255,255,0.4),inset_0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5),inset_0_0_20px_rgba(255,255,255,0.15)] md:hover:shadow-[0_0_40px_rgba(255,255,255,0.6),inset_0_0_30px_rgba(255,255,255,0.2)]"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            About Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
