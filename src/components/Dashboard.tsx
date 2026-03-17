import { useState } from 'react';

const Dashboard: React.FC = () => {
  const [hours, setHours] = useState<number>(0);
  const HOURLY_WAGE = 400; // 第6条に基づく支給額

  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-2xl overflow-hidden p-8 sm:p-12">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-extrabold text-white mb-2">
                支給額シミュレーター
              </h2>
              <p className="text-primary-100 text-lg mb-6">
                第6条の規則に基づき、これまでの実働時間から支援金の支給額（計算上の目安：時給400円換算）をシミュレーションできます。
              </p>
              
              <div className="bg-white/10 rounded-lg p-5 backdrop-blur-sm border border-white/20">
                <label className="block text-white text-sm font-medium mb-2">
                  想定する実働時間 (時間)を入力
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={hours || ''}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="block w-full bg-white text-gray-900 px-4 py-3 rounded-md shadow-inner focus:ring-2 focus:ring-secondary-400 focus:outline-none sm:text-lg font-bold"
                    placeholder="例: 10"
                  />
                  <span className="ml-3 text-white font-medium text-lg">時間</span>
                </div>
              </div>
            </div>

            <div className="mt-8 md:mt-0 md:w-5/12 flex justify-center md:justify-end">
              <div className="bg-white rounded-2xl p-6 shadow-xl text-center w-full max-w-sm transform transition-all hover:scale-105">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">
                  見込み支給額
                </p>
                <div className="flex items-baseline justify-center text-5xl font-extrabold text-secondary-600 mb-2">
                  <span>¥</span>
                  <span className="ml-1 tracking-tight">{(hours * HOURLY_WAGE).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400">
                  ※実際の支給額は学校・牧場の確認後に決定されます。
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
