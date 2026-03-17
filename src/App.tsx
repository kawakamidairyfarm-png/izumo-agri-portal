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
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center mt-6">
            <div className="relative w-full md:w-2/3 max-w-3xl group">
              {/* Fun decorative element */}
              <div className="absolute -top-4 -right-4 bg-yellow-300 text-slate-800 p-2 rounded-full border-2 border-slate-800 shadow-pop transform rotate-12 z-20 animate-bounce">
                <Sparkles size={24} className="fill-current" />
              </div>
              
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSc8DfaiXvsatYM6Pn-fX7bmTTP_sn7_alBnQRH-XO7vBMUE0g/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full relative overflow-hidden bg-coral-DEFAULT text-white rounded-[40px] p-6 md:p-8 border-4 border-slate-800 shadow-pop hover:shadow-pop-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-6 group blob-shape"
              >
                <div className="absolute inset-0 w-1/4 h-full bg-white/20 skew-x-12 group-hover:translate-x-[400%] transition-transform duration-700"></div>
                
                <div className="bg-white text-coral-dark p-4 rounded-full border-2 border-slate-800 shadow-pop transform -rotate-6 group-hover:rotate-0 transition-transform flex-shrink-0">
                  <ClipboardEdit size={40} strokeWidth={2.5} />
                </div>
                
                <div className="text-left text-slate-900 drop-shadow-sm">
                  <span className="block text-2xl md:text-3xl font-black tracking-tighter text-white">活動を報告する！</span>
                  <span className="block text-sm font-bold opacity-90 mt-1 text-white bg-slate-800/20 px-3 py-1 rounded-full inline-block">体験が終わったらここをタップ</span>
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
