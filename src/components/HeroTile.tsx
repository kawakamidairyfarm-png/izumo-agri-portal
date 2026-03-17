import { Leaf } from 'lucide-react';

const HeroTile = () => {
  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-coral-light/20 p-6 sm:p-10 md:p-12 pop-card flex flex-col items-center justify-center text-center col-span-1 md:col-span-2 lg:col-span-3 min-h-[360px] md:min-h-[450px]">
      
      {/* Organic blob decorations */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-teal-DEFAULT/20 blob-shape blur-xl mix-blend-multiply"></div>
      <div className="absolute bottom-10 -left-10 w-56 h-56 bg-coral-DEFAULT/20 blob-shape blur-xl mix-blend-multiply border-radius-blob-2"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-200/30 blob-shape blur-2xl -z-10"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Playful Logo area */}
        <div className="w-20 h-20 md:w-28 md:h-28 mb-6 bg-white blob-shape flex items-center justify-center border-4 border-slate-800 shadow-pop text-teal-dark transform -rotate-6 hover:rotate-6 transition-transform duration-300">
          <Leaf size={40} className="md:w-14 md:h-14 fill-current" />
        </div>
        
        <p className="font-black text-slate-800 tracking-widest text-[10px] sm:text-xs md:text-sm mb-4 uppercase bg-white px-4 py-1.5 rounded-full border-2 border-slate-800 shadow-pop transform rotate-1">
          川上牧場 × 出雲農林高校
        </p>
        
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-slate-800 tracking-tighter leading-[1.1] drop-shadow-sm mb-3">
          農業体験<br className="sm:hidden"/>
          <span className="text-coral-dark inline-block transform hover:scale-105 transition-transform cursor-default">プログラム</span>
        </h1>
        <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-teal-dark mt-1 mb-8">
          ポータルサイト
        </h2>
        
        <p className="max-w-md mx-auto font-bold text-slate-600 bg-white/70 p-5 rounded-2xl backdrop-blur-md border-2 border-slate-200/50 text-sm sm:text-base leading-relaxed">
          スマート農業 ✕ 酪農の温もり！<br/>
          最新のテクノロジーで農業をもっと楽しく。
        </p>
      </div>
    </div>
  );
};

export default HeroTile;
