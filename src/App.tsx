import HeroTile from './components/HeroTile';
import CalendarTile from './components/CalendarTile';
import SimulatorTile from './components/SimulatorTile';
import Footer from './components/Footer';
import { ClipboardEdit, Sparkles } from 'lucide-react';

const App = () => {
  return (
    <div className="min-h-screen font-sans relative pb-20 md:pb-0 overflow-x-hidden">
      
      {/* Pop Background Patterns */}
      <div className="fixed top-20 left-10 w-32 h-32 bg-coral-light/20 blob-shape rotate-45 pointer-events-none -z-10"></div>
      <div className="fixed bottom-40 right-10 w-48 h-48 bg-teal-light/20 blob-shape rotate-90 pointer-events-none -z-10"></div>
      <div className="fixed top-1/2 left-1/3 w-64 h-64 bg-yellow-200/20 blob-shape -rotate-12 pointer-events-none -z-10 blur-xl"></div>

      <main className="max-w-5xl mx-auto px-4 pt-8 md:pt-12 pb-8 relative z-10 w-full">
        
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(0,_auto)]">
          {/* Hero spans all columns */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <HeroTile />
          </div>

          <CalendarTile />
          <SimulatorTile />

          {/* Feature Highlight Tile: The Report Action */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center mt-10 mb-6">
            <div className="relative w-full md:w-2/3 max-w-3xl group px-2 sm:px-0">
              {/* Fun decorative element */}
              <div className="absolute -top-5 -right-3 sm:-top-6 sm:-right-6 bg-yellow-300 text-slate-800 p-2.5 sm:p-3 rounded-full border-2 border-slate-800 shadow-pop transform rotate-12 z-20 animate-bounce">
                <Sparkles size={26} className="fill-current sm:w-8 sm:h-8" />
              </div>
              
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSc8DfaiXvsatYM6Pn-fX7bmTTP_sn7_alBnQRH-XO7vBMUE0g/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full relative overflow-hidden bg-coral-DEFAULT text-white rounded-[2.5rem] sm:rounded-[3rem] px-6 py-8 sm:p-10 md:p-12 border-4 border-slate-800 shadow-pop hover:shadow-pop-hover hover:translate-x-[2.5px] hover:translate-y-[2.5px] transition-all flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 group blob-shape active:translate-y-[6px]"
              >
                <div className="absolute inset-0 w-1/4 h-full bg-white/20 skew-x-12 group-hover:translate-x-[400%] transition-transform duration-700"></div>
                
                <div className="bg-white text-coral-dark p-4 md:p-6 rounded-3xl border-2 border-slate-800 shadow-pop transform -rotate-6 group-hover:rotate-0 transition-transform flex-shrink-0">
                  <ClipboardEdit size={36} className="sm:w-12 sm:h-12 md:w-14 md:h-14" strokeWidth={2.5} />
                </div>
                
                <div className="text-center sm:text-left text-slate-900 drop-shadow-sm w-full">
                  <span className="block text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-white break-words leading-tight">活動を報告する！</span>
                  <span className="block text-sm md:text-lg font-bold mt-3 text-slate-900 bg-white/40 px-4 md:px-6 py-1.5 rounded-full inline-block backdrop-blur-sm border border-slate-900/10">体験が終わったらタップ</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
