import { useState, useEffect } from 'react';
import { Coins, Clock } from 'lucide-react';

const SimulatorTile = () => {
  const [hours, setHours] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const HOURLY_WAGE = 400; // 第6条に基づく支給額

  // Real-time calculation effect
  useEffect(() => {
    // 1円単位のリアルタイム可視化
    setAmount(hours * HOURLY_WAGE);
  }, [hours]);

  return (
    <div className="relative overflow-hidden bg-white p-6 sm:p-10 pop-card flex flex-col col-span-1 h-full rounded-[2.5rem] transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-coral-light/20 rounded-full  -translate-y-16 translate-x-16"></div>
      
      <div className="flex items-center mb-8 relative z-10 px-1">
        <div className="bg-coral-DEFAULT p-3.5 rounded-full mr-4 border-2 border-slate-800 shadow-pop flex-shrink-0">
          <Coins size={30} className="text-white md:w-8 md:h-8" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">活動シミュレーター</h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5">これまでの実働時間と対価</p>
        </div>
      </div>

      <div className="space-y-6 flex-grow flex flex-col justify-center relative z-10">
        {/* 実働時間 Input */}
        <div className="bg-white rounded-[1.5rem] p-5 border-2 border-slate-800 shadow-sm transition-all focus-within:border-teal-DEFAULT focus-within:ring-4 focus-within:ring-teal-light/30">
          <label className="flex items-center text-xs sm:text-sm font-black text-coral-dark mb-3 uppercase tracking-wider">
            <Clock size={16} className="mr-1.5" />
            実働時間
          </label>
          <div className="flex items-baseline justify-end">
            <input
              type="number"
              min="0"
              value={hours === 0 ? '' : hours}
              onChange={(e) => setHours(e.target.value === '' ? 0 : Number(e.target.value))}
              className="block w-full pr-2 text-right outline-none bg-transparent text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 placeholder-slate-200"
              placeholder="0"
            />
            <span className="ml-2 text-slate-500 font-bold text-lg sm:text-xl whitespace-nowrap">時間</span>
          </div>
        </div>

        {/* これまでの対価 Result */}
        <div className="bg-coral-DEFAULT rounded-[2rem] p-6 sm:p-8 border-4 border-slate-800 shadow-pop relative overflow-hidden transform md:rotate-1 hover:rotate-0 transition-transform">
          <div className="absolute top-0 right-0 -m-4 w-24 h-24 bg-white opacity-20 blob-shape"></div>
          <p className="text-sm sm:text-base font-black text-white opacity-95 mb-4 tracking-wider">これまでの対価（目安）</p>
          
          <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-800 shadow-inner flex items-baseline justify-center gap-1.5 mt-1 text-slate-900 overflow-hidden">
            <span className="text-xl sm:text-3xl font-black text-teal-dark">¥</span>
            <span className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-teal-dark drop-shadow-sm truncate">
              {amount.toLocaleString()}
            </span>
          </div>
          
          <div className="inline-block mt-6 px-4 py-1.5 bg-slate-900 text-white text-[10px] sm:text-xs font-black rounded-lg border border-slate-800 uppercase tracking-widest">
            時給400円換算
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorTile;
