import { CalendarDays, ExternalLink } from 'lucide-react';

const CalendarTile = () => {
  return (
    <div className="relative overflow-hidden bg-teal-DEFAULT p-6 md:p-8 pop-card flex flex-col col-span-1 md:col-span-2 h-full text-slate-900 blob-shape hover:blob-shape">
      <div className="flex items-center mb-6">
        <div className="bg-white p-3 rounded-full mr-4 border-2 border-slate-800 shadow-pop">
          <CalendarDays size={32} className="text-teal-dark" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">体験を予約する</h2>
          <p className="text-sm font-bold text-slate-800/80">空いている日を確認して、希望の時間を教えてね！</p>
        </div>
      </div>
      
      {/* Calendar Area */}
      <div className="flex-grow bg-white border-4 border-slate-800 rounded-3xl flex flex-col p-4 shadow-inner relative overflow-hidden">
        {/* Playful background pattern inside calendar area */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#0d9488 2px, transparent 2px)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 8px 8px'}}></div>
        
        <div className="relative z-10 w-full mb-3 text-center">
            <span className="inline-block bg-yellow-300 text-slate-800 font-black px-4 py-2 rounded-full border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm md:text-base transform -rotate-1">
              👇 空いている時間を選んで、そのまま予約してね！
            </span>
        </div>

        <div className="relative z-10 w-full flex-grow bg-white rounded-2xl border-2 border-slate-800 overflow-hidden shadow-pop min-h-[600px]">
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
        <div className="relative z-10 mt-8 mb-4 flex justify-center">
          <a
             href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0dO-S5ibQ_5KbttRiQafgZv5Whu7CtI7wtAIAxXgW4yzLpevKtq5GC_PbKusETQgj9_6lJ2fZ-?gv=true"
             target="_blank"
             rel="noopener noreferrer"
             className="inline-flex items-center justify-center px-10 py-5 border-4 border-slate-800 text-xl font-black text-white bg-teal-DEFAULT hover:bg-teal-dark shadow-pop hover:shadow-pop-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all blob-shape active:translate-y-[6px]"
          >
            <ExternalLink size={28} className="mr-3" strokeWidth={3} />
            別ウィンドウで予約ページを開く
          </a>
        </div>
      </div>
    </div>
  );
};

export default CalendarTile;
