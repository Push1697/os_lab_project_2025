import React, { useEffect, useState } from 'react';
import { Building, Users, CheckCircle, Check,  Globe } from 'lucide-react';

const About: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const companyExamples = [
    { name: 'Google', logo: '🔍', industry: 'Technology' },
    { name: 'Microsoft', logo: '🪟', industry: 'Software' },
    { name: 'Amazon', logo: '📦', industry: 'E-commerce' },
    { name: 'Apple', logo: '🍎', industry: 'Technology' },
    { name: 'Meta', logo: '📘', industry: 'Social Media' },
    { name: 'Netflix', logo: '🎬', industry: 'Entertainment' },
    { name: 'Tesla', logo: '⚡', industry: 'Automotive' },
    { name: 'IBM', logo: '💻', industry: 'Technology' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/50 to-slate-900"></div>
      <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 py-8 md:py-20">


        {/* Features Section with Enhanced Shadows */}
        <div 
          className="grid lg:grid-cols-2 gap-6 md:gap-12 mb-12 md:mb-20"
          style={{
            transform: `translateY(${scrollY * -0.1}px)`,
          }}
        >
          <div className="bg-white/15 backdrop-blur-xl rounded-xl md:rounded-[2rem] p-6 md:p-12 border border-white/30 hover:bg-white/20 transition-all duration-500 group relative overflow-hidden shadow-2xl hover:shadow-[0_25px_50px_rgba(168,85,247,0.3)] transform hover:scale-105">
            <div className="absolute top-4 right-4 md:top-6 md:right-6">
              <CheckCircle className="w-6 h-6 md:w-10 md:h-10 text-green-400 animate-pulse drop-shadow-lg" />
            </div>
            <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-10 group-hover:scale-125 transition-transform duration-500 shadow-2xl">
              <Building className="w-8 h-8 md:w-12 md:h-12 text-white drop-shadow-lg" />
            </div>
            <h3 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 md:mb-8 flex items-center drop-shadow-lg">
              Company Verification
              <Check className="w-5 h-5 md:w-8 md:h-8 ml-2 md:ml-4 text-green-400 drop-shadow-lg" />
            </h3>
            <p className="text-white/85 leading-relaxed text-sm md:text-lg lg:text-xl drop-shadow-sm">
              ✅ Verify if an employee has worked at your company. Upload employee ID or certificate 
              to instantly check employment history and credentials.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-xl rounded-xl md:rounded-[2rem] p-6 md:p-12 border border-white/30 hover:bg-white/20 transition-all duration-500 group relative overflow-hidden shadow-2xl hover:shadow-[0_25px_50px_rgba(168,85,247,0.3)] transform hover:scale-105">
            <div className="absolute top-4 right-4 md:top-6 md:right-6">
              <CheckCircle className="w-6 h-6 md:w-10 md:h-10 text-green-400 animate-pulse drop-shadow-lg" style={{animationDelay: '1s'}} />
            </div>
            <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-10 group-hover:scale-125 transition-transform duration-500 shadow-2xl">
              <Users className="w-8 h-8 md:w-12 md:h-12 text-white drop-shadow-lg" />
            </div>
            <h3 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 md:mb-8 flex items-center drop-shadow-lg">
              Employee Background Check
              <Check className="w-5 h-5 md:w-8 md:h-8 ml-2 md:ml-4 text-green-400 drop-shadow-lg" />
            </h3>
            <p className="text-white/85 leading-relaxed text-sm md:text-lg lg:text-xl drop-shadow-sm">
              ✅ HR departments can quickly verify candidate employment history and validate 
              certificates before making hiring decisions.
            </p>
          </div>
        </div>

        {/* Company Examples Section */}
        <div className="mb-12 md:mb-20">

          <div 
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6"
            style={{
              transform: `translateY(${scrollY * -0.05}px)`,
            }}
          >
            {companyExamples.map((company, index) => (
              <div 
                key={company.name}
                className="bg-white/10 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group hover:scale-105 shadow-xl hover:shadow-2xl"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="text-center">
                  <div className="text-2xl md:text-4xl mb-2 md:mb-3 group-hover:scale-125 transition-transform duration-300">
                    {company.logo}
                  </div>
                  <h4 className="text-white font-bold text-sm md:text-lg mb-1 md:mb-2 drop-shadow-sm">
                    {company.name}
                  </h4>
                  <p className="text-white/70 text-xs md:text-sm drop-shadow-sm">
                    {company.industry}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 md:mt-12">
            <div className="inline-flex items-center space-x-2 md:space-x-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-xl rounded-full px-4 md:px-8 py-3 md:py-4 border border-white/20 shadow-xl">
              <Globe className="w-4 h-4 md:w-6 md:h-6 text-cyan-400" />
              <span className="text-white/90 font-semibold text-sm md:text-lg">
                And 10,000+ more companies worldwide
              </span>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg">
              How It Works
            </h2>
          </div>

          <div 
            className="grid md:grid-cols-3 gap-6 md:gap-8"
            style={{
              transform: `translateY(${scrollY * -0.03}px)`,
            }}
          >
            <div className="text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <span className="text-white font-bold text-lg md:text-2xl">1</span>
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-3 md:mb-4 drop-shadow-lg">Upload Documents</h3>
              <p className="text-white/80 text-sm md:text-base lg:text-lg drop-shadow-sm px-2">
                Upload employee ID, certificate, or any employment document you want to verify.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <span className="text-white font-bold text-lg md:text-2xl">2</span>
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-3 md:mb-4 drop-shadow-lg">AI Analysis</h3>
              <p className="text-white/80 text-sm md:text-base lg:text-lg drop-shadow-sm px-2">
                Our AI system analyzes the document and cross-references with company databases.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <span className="text-white font-bold text-lg md:text-2xl">3</span>
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-3 md:mb-4 drop-shadow-lg">Get Results</h3>
              <p className="text-white/80 text-sm md:text-base lg:text-lg drop-shadow-sm px-2">
                Receive instant verification results with detailed employment history and credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators with Enhanced Design */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center space-x-6 md:space-x-12 bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-3xl px-8 md:px-16 py-4 md:py-8 border border-white/20 shadow-2xl hover:shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all duration-500">
            <div className="flex items-center space-x-2 md:space-x-3">
              <CheckCircle className="w-5 h-5 md:w-8 md:h-8 text-green-400 drop-shadow-lg" />
              <span className="text-white/90 font-bold text-sm md:text-xl drop-shadow-sm">Secure</span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3">
              <CheckCircle className="w-5 h-5 md:w-8 md:h-8 text-green-400 drop-shadow-lg" />
              <span className="text-white/90 font-bold text-sm md:text-xl drop-shadow-sm">Verified</span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3">
              <CheckCircle className="w-5 h-5 md:w-8 md:h-8 text-green-400 drop-shadow-lg" />
              <span className="text-white/90 font-bold text-sm md:text-xl drop-shadow-sm">Trusted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
