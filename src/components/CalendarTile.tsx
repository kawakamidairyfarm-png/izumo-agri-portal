import { CalendarDays, ExternalLink } from 'lucide-react';

const CalendarTile = () => {
  return (
    <div className="relative overflow-hidden bg-teal-DEFAULT p-5 sm:p-8 pop-card flex flex-col col-span-1 md:col-span-2 h-full text-slate-900 rounded-[2.5rem] hover:blob-shape transition-all duration-500">
      <div className="flex items-center mb-6 px-2">
        <div className="bg-white p-3 rounded-full mr-4 border-2 border-slate-800 shadow-pop flex-shrink-0">
          <CalendarDays size={30} className="text-teal-dark md:w-8 md:h-8" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">体験を予約する</h2>
          <p className="text-xs sm:text-sm font-bold text-slate-800/80 mt-0.5">空いている日を確認して、希望の時間を教えてね！</p>
        </div>
      </div>
      
      {/* Calendar Area */}
      <div className="flex-grow bg-white border-4 border-slate-800 rounded-[2rem] flex flex-col p-3 sm:p-5 shadow-inner relative overflow-hidden">
        {/* Playful background pattern inside calendar area */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#0d9488 2px, transparent 2px)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 8px 8px'}}></div>
        
        <div className="relative z-10 w-full mb-4 text-center">
            <span className="inline-block bg-yellow-300 text-slate-800 font-black px-4 py-2.5 rounded-full border-2 border-slate-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-[11px] sm:text-sm md:text-base transform -rotate-1 leading-tight">
              👇 空いている時間を選んで、そのまま予約してね！
            </span>
        </div>

        <div className="relative z-10 w-full flex-grow bg-white rounded-2xl border-2 border-slate-800 overflow-hidden shadow-pop h-[450px] md:h-[600px] min-h-[400px]">
          <iframe 
            src="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0dO-S5ibQ_5KbttRiQafgZv5Whu7CtI7wtAIAxXgW4yzLpevKtq5GC_PbKusETQgj9_6lJ2fZ-?gv=true" 
            style={{border: 0}} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            scrolling="no"
            title="農業体験予約カレンダー"
            className="w-full h-full"
          ></iframe>
        </div>
        
        {/* External Link Button */}
        <div className="relative z-10 mt-6 sm:mt-8 mb-2 sm:mb-4 flex justify-center">
          <a
             href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0dO-S5ibQ_5KbttRiQafgZv5Whu7CtI7wtAIAxXgW4yzLpevKtq5GC_PbKusETQgj9_6lJ2fZ-?gv=true"
             target="_blank"
             rel="noopener noreferrer"
             className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 md:px-10 md:py-5 text-center border-4 border-slate-800 text-base md:text-xl font-black text-white bg-teal-dark hover:bg-slate-900 shadow-pop hover:shadow-pop-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-shape active:translate-y-[6px]"
          >
            <ExternalLink size={22} className="mr-3 flex-shrink-0 md:w-8 md:h-8" strokeWidth={3} />
            <span className="leading-tight">別ウィンドウで<br className="sm:hidden"/>予約ページを開く</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CalendarTile;
