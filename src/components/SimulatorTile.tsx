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
    <div className="relative overflow-hidden bg-white p-6 md:p-8 pop-card flex flex-col col-span-1 h-full rounded-3xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-coral-light/30 rounded-full  -translate-y-16 translate-x-16"></div>
      
      <div className="flex items-center mb-6 relative z-10">
        <div className="bg-coral-DEFAULT p-3 rounded-full mr-4 border-2 border-slate-800 shadow-pop">
          <Coins size={32} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">活動シミュレーター</h2>
          <p className="text-sm font-bold text-slate-500">これまでの実働時間と対価</p>
        </div>
      </div>

      <div className="space-y-6 flex-grow flex flex-col justify-center relative z-10">
        {/* 実働時間 Input */}
        <div className="bg-white rounded-2xl p-4 border-2 border-slate-800 shadow-sm transition-transform focus-within:-translate-y-1 focus-within:shadow-pop">
          <label className="flex items-center text-sm font-black text-coral-dark mb-2">
            <Clock size={16} className="mr-1" />
            実働時間
          </label>
          <div className="flex items-center">
            <input
              type="number"
              min="0"
              value={hours === 0 ? '' : hours}
              onChange={(e) => setHours(e.target.value === '' ? 0 : Number(e.target.value))}
              className="block w-full pr-2 text-right outline-none bg-transparent text-3xl md:text-4xl font-black text-slate-800 placeholder-slate-200"
              placeholder="0"
            />
            <span className="ml-1 text-slate-500 font-bold whitespace-nowrap">時間</span>
          </div>
        </div>

        {/* これまでの対価 Result */}
        <div className="bg-coral-DEFAULT rounded-2xl p-6 border-2 border-slate-800 shadow-pop relative overflow-hidden transform rotate-1 hover:rotate-0 transition-transform">
          <div className="absolute top-0 right-0 -m-4 w-24 h-24 bg-white opacity-20 blob-shape"></div>
          <p className="text-sm md:text-base font-black text-white opacity-90 mb-2 tracking-wider">これまでの対価（目安）</p>
          
          <div className="bg-white rounded-xl p-3 md:p-4 border-2 border-slate-800 shadow-inner flex items-baseline gap-1 mt-1 text-slate-900 overflow-hidden">
            <span className="text-2xl md:text-3xl font-black text-teal-dark">¥</span>
            <span className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-teal-dark drop-shadow-sm truncate">
              {amount.toLocaleString()}
            </span>
          </div>
          
          <div className="inline-block mt-4 px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg border border-slate-900">
            時給400円換算
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorTile;
