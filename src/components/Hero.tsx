

const Hero: React.FC = () => {
  return (
    <div className="relative bg-primary-800 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 to-primary-900 mix-blend-multiply" />
      </div>
      
      <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            {/* Logo placeholder */}
            <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center p-2 shadow-lg ring-4 ring-primary-400">
              <span className="text-secondary-700 font-bold block text-sm">川上牧場<br/>Logo</span>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-md">
            出雲農林高校
            <span className="block text-primary-200 mt-2">農業体験プログラム</span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-xl text-primary-100 italic">
            自然と共に学び、地域と共に育つ。川上牧場で、生きた農業を体験しよう。
          </p>
          <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center gap-4">
            <a href="#reservation" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all transform hover:scale-105">
              予約カレンダーを見る
            </a>
            <a href="#activity-report" className="mt-3 sm:mt-0 flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transition-all transform hover:scale-105">
              活動報告を書く
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
