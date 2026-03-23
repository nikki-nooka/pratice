
import React from 'react';
import { GlobeIcon, LockClosedIcon, HeartPulseIcon, ShieldCheckIcon, ScanIcon, ActivityIcon } from './icons';
import { WaveBackground } from './WaveBackground';
import { LanguageSelector } from './LanguageSelector';
import { useI18n } from './I18n';
import { LiveHealthAlerts } from './LiveHealthAlerts';

interface HomePageProps {
  onLoginClick: () => void;
  onAboutClick: () => void;
  onContactClick: () => void;
  onExploreClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLoginClick, onAboutClick, onContactClick, onExploreClick }) => {
  const { t } = useI18n();

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center animate-fade-in overflow-x-hidden bg-slate-50/50">
      <WaveBackground />

      <div className="relative z-10 w-full flex flex-col items-center flex-grow">
          {/* Symmetrical Header */}
          <header className="w-full max-w-7xl mx-auto py-6 px-6 sm:px-12 flex justify-between items-center bg-white/40 backdrop-blur-xl sticky top-0 z-50 border-b border-white/40">
              <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-100 transition-all group-hover:scale-110 duration-500">
                    <GlobeIcon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">GeoSick<span className="text-blue-600">.</span></span>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-12">
                  <nav className="hidden lg:flex items-center space-x-12">
                      <button onClick={onAboutClick} className="text-sm font-black text-slate-500 hover:text-blue-600 transition-all uppercase tracking-[0.2em]">{t('about')}</button>
                      <button onClick={onContactClick} className="text-sm font-black text-slate-500 hover:text-blue-600 transition-all uppercase tracking-[0.2em]">{t('contact')}</button>
                  </nav>
                  <div className="w-44">
                    <LanguageSelector />
                  </div>
                  <button 
                    onClick={onLoginClick} 
                    className="bg-slate-900 hover:bg-blue-700 text-white font-black py-3 px-10 rounded-2xl transition-all duration-300 text-sm shadow-xl hover:shadow-blue-200 active:scale-95"
                  >
                    {t('login')}
                  </button>
              </div>
          </header>

          {/* Perfectly Balanced Hero Section */}
          <main className="w-full flex-grow flex flex-col items-center">
            <div className="w-full max-w-7xl mx-auto px-6 py-16 sm:py-28 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                
                {/* Hero Text: Fixed Alignment */}
                <div className="text-left space-y-12 animate-fade-in-up">
                    <div className="inline-flex items-center gap-3 bg-blue-50 text-blue-800 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                        Global Health Surveillance Active
                    </div>
                    
                    <h1 className="text-7xl sm:text-9xl font-black text-slate-900 leading-[0.82] tracking-tighter">
                        Wellness <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Revealed.</span>
                    </h1>
                    
                    <p className="max-w-xl text-2xl text-slate-600 leading-relaxed font-medium">
                        Bridging the gap between environmental data and human life. GeoSick uses world-class AI to detect community risks before they become crises.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                        <button
                            onClick={onLoginClick}
                            className="group w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black py-7 px-14 rounded-3xl flex items-center justify-center transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-blue-200"
                        >
                            <LockClosedIcon className="w-7 h-7 mr-4 transition-transform group-hover:rotate-12" />
                            {t('get_started')}
                        </button>
                        <button
                            onClick={onExploreClick}
                            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-900 font-black py-7 px-14 rounded-3xl border-2 border-slate-200 flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-xl active:scale-95"
                        >
                            <GlobeIcon className="w-7 h-7 mr-4 text-blue-600" />
                            {t('explore_globe')}
                        </button>
                    </div>
                    
                    {/* User Proof Section */}
                    <div className="pt-12 flex items-center gap-6 border-t border-slate-100 max-w-sm">
                        <div className="flex -space-x-4">
                            {[12, 18, 25, 33].map(i => (
                                <img key={i} src={`https://i.pravatar.cc/150?u=${i}`} className="w-16 h-16 rounded-full border-4 border-white shadow-xl" alt="Global User" />
                            ))}
                            <div className="w-16 h-16 rounded-full border-4 border-white bg-indigo-600 flex items-center justify-center text-white text-[12px] font-black shadow-xl">
                                20K+
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] leading-snug">
                            Communities <br/> Protected.
                        </p>
                    </div>
                </div>

                {/* ADVANCED ANIMATED VISUAL: No Crookedness, Pure High-End Aesthetic */}
                <div className="relative group animate-fade-in flex justify-center lg:justify-end">
                    <div className="relative z-10 rounded-[5rem] overflow-hidden shadow-[0_100px_200px_-40px_rgba(59,130,246,0.4)] border-[20px] border-white transition-all duration-1000 group-hover:scale-[1.01] bg-slate-100 max-w-[550px]">
                        <img 
                            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200" 
                            alt="Professional Medical Research Interface" 
                            className="w-full aspect-[4/5] object-cover transition-transform duration-[4000ms] group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent opacity-70"></div>
                        
                        {/* HIGH-TECH HUD SCANNING OVERLAY */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                             {/* The Primary Laser Scan */}
                             <div className="absolute w-full h-[6px] bg-blue-400 shadow-[0_0_40px_10px_rgba(59,130,246,0.9)] animate-[scan_6s_ease-in-out_infinite]"></div>
                             
                             {/* Corner HUD Framework */}
                             <div className="absolute top-12 left-12 p-6 border-l-4 border-t-4 border-white/40 w-32 h-32"></div>
                             <div className="absolute bottom-12 right-12 p-6 border-r-4 border-b-4 border-white/40 w-32 h-32"></div>
                             
                             {/* AI Analysis Circles */}
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-white/10 rounded-full animate-[spin_60s_linear_infinite]">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-400 rounded-full shadow-[0_0_20px_#3b82f6]"></div>
                             </div>
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-blue-500/20 rounded-full animate-[spin_30s_linear_infinite_reverse]">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500 rounded-full"></div>
                             </div>
                        </div>
                    </div>

                    {/* INTERACTIVE DATA BADGES */}
                    <div className="absolute -top-16 -right-12 z-20 bg-white/95 backdrop-blur-3xl p-8 rounded-[3rem] shadow-2xl border border-white/50 animate-bounce-slow max-w-[260px]">
                        <div className="flex items-center gap-5 mb-4">
                            <div className="p-4 bg-green-50 rounded-3xl">
                                <ActivityIcon className="w-8 h-8 text-green-600" />
                            </div>
                            <span className="text-[12px] font-black uppercase text-slate-400 tracking-[0.2em]">Biometric Precision</span>
                        </div>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">99.9%<span className="text-green-500 text-sm ml-2 uppercase tracking-widest font-bold">Real</span></p>
                    </div>

                    <div className="absolute -bottom-12 -left-16 z-20 bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl animate-float-slow hidden sm:block border border-slate-800">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center animate-pulse shadow-2xl shadow-blue-500/40">
                                <ScanIcon className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Engaging AI Engine</p>
                                <p className="text-3xl font-black tracking-tight">GeoScanner V5</p>
                            </div>
                        </div>
                    </div>

                    {/* Atmospheric Glow Components */}
                    <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px] -z-10 animate-pulse"></div>
                    <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[160px] -z-10"></div>
                </div>
            </div>

            {/* Sub-Hero Content Section */}
            <div className="w-full bg-white border-y border-slate-200/60 py-24 shadow-inner">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Live Intelligence Stream</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">Real-time alerts aggregated from global health networks and satellite monitoring.</p>
                    </div>
                    <LiveHealthAlerts />
                </div>
            </div>

          </main>
          
          <footer className="w-full border-t border-slate-100 py-20 px-8 mt-auto bg-white">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
                  <div className="flex flex-col items-center md:items-start gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-2xl">
                            <GlobeIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">GeoSick<span className="text-blue-600">.</span></span>
                    </div>
                    <p className="text-base text-slate-400 font-bold max-w-sm text-center md:text-left leading-relaxed">
                        Pioneering the future of global wellness through autonomous environmental surveillance and predictive modeling.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-[12px] font-black uppercase tracking-[0.3em] text-slate-500 text-center md:text-left">
                      <div className="space-y-4 flex flex-col">
                        <a href="#" className="hover:text-blue-600 transition-colors">Privacy Cloud</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">GDPR / HIPAA Compliance</a>
                      </div>
                      <div className="space-y-4 flex flex-col">
                        <a href="#" className="hover:text-blue-600 transition-colors">Surveillance API</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Satellite Data License</a>
                      </div>
                  </div>
              </div>
          </footer>
      </div>
      <style>{`
          @keyframes scan {
              0% { top: -10%; opacity: 0; }
              15% { opacity: 1; }
              85% { opacity: 1; }
              100% { top: 110%; opacity: 0; }
          }
          @keyframes bounce-slow {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-40px); }
          }
          @keyframes float-slow {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(30px, -30px); }
          }
          .animate-bounce-slow { animation: bounce-slow 8s infinite ease-in-out; }
          .animate-float-slow { animation: float-slow 12s infinite ease-in-out; }
      `}</style>
    </div>
  );
};
