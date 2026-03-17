import { useState } from 'react';

const Dashboard: React.FC = () => {
  const [hours, setHours] = useState<number>(0);
  const HOURLY_WAGE = 400;

  return (
    <section className="py-6 sm:py-12 bg-transparent">
      <div className="max-w-4xl mx-auto px-4">
        {/* カード全体：スマホでは縦並び、PCでは横並び */}
        <div className="bg-white border-4 border-slate-900 rounded-[2rem] pop-shadow overflow-hidden p-6 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

            <div className="w-full md:w-1/2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                活動シミュレーター
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mb-6 font-bold">
                時給400円換算で支給額の目安を計算できます。
              </p>

              <div className="bg-slate-100 rounded-2xl p-4 border-2 border-slate-900">
                <label className="block text-slate-900 text-xs font-black uppercase mb-2">
                  実働時間を入力（時間）
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={hours || ''}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="block w-full bg-white border-2 border-slate-900 text-slate-900 px-4 py-3 rounded-xl focus:outline-none text-xl font-black"
                    placeholder="0"
                  />
                  <span className="ml-3 text-slate-900 font-black text-lg">時間</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-5/12">
              <div className="bg-teal-400 border-4 border-slate-900 rounded-[2rem] p-6 text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <p className="text-xs font-black text-slate-900 uppercase tracking-tighter mb-1">
                  見込み支給額
                </p>
                <div className="flex items-baseline justify-center text-5xl font-black text-slate-900 mb-2">
                  <span className="text-2xl mr-1">¥</span>
                  <span className="tracking-tighter">{(hours * HOURLY_WAGE).toLocaleString()}</span>
                </div>
                <p className="text-[10px] leading-tight text-slate-800 font-bold">
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