import { useState } from 'react';

const Dashboard: React.FC = () => {
  const [hours, setHours] = useState<number>(0);
  const HOURLY_WAGE = 400;

  return (
    <section className="py-8 sm:py-12 bg-transparent">
      <div className="max-w-4xl mx-auto px-4">
        {/* カード全体：スマホでは縦並び、PCでは横並び */}
        <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] pop-shadow overflow-hidden p-6 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">

            <div className="w-full md:w-1/2">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2 tracking-tighter">
                活動シミュレーター
              </h2>
              <p className="text-slate-600 text-base sm:text-lg mb-8 font-bold leading-relaxed">
                時給400円換算で支給額の目安を計算できます。
              </p>

              <div className="bg-slate-100 rounded-2xl p-5 border-2 border-slate-900">
                <label className="block text-slate-900 text-sm font-black uppercase mb-3">
                  実働時間を入力（時間）
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={hours || ''}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="block w-full bg-white border-2 border-slate-900 text-slate-900 px-4 py-4 rounded-xl focus:outline-none text-2xl font-black shadow-inner"
                    placeholder="0"
                  />
                  <span className="ml-4 text-slate-900 font-black text-xl">時間</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-5/12">
              <div className="bg-teal-400 border-4 border-slate-900 rounded-[2.5rem] p-8 text-center shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] transform md:rotate-2">
                <p className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-2">
                  見込み支給額
                </p>
                <div className="flex items-baseline justify-center text-4xl sm:text-5xl font-black text-slate-900 mb-6 bg-white/50 rounded-2xl py-4 px-6 border-2 border-slate-900/10 shadow-inner mx-auto w-fit min-w-[140px] whitespace-nowrap">
                  <span className="text-xl sm:text-2xl mr-1.5 flex-shrink-0">¥</span>
                  <span className="tracking-tighter">{(hours * HOURLY_WAGE).toLocaleString()}</span>
                </div>
                <div className="inline-block mb-4 px-4 py-1.5 bg-slate-900 text-white text-[10px] sm:text-xs font-black rounded-lg border-2 border-slate-700 shadow-pop uppercase tracking-widest transform -rotate-1">
                  時給400円換算
                </div>
                <p className="text-[10px] sm:text-xs leading-normal text-slate-800 font-bold bg-white/30 py-2 px-3 rounded-lg mx-2">
                  ※実際の支給額は牧場の確認後に決定されます。
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;