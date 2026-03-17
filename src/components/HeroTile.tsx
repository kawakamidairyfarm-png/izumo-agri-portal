import { Leaf } from 'lucide-react';

const HeroTile = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-coral-light/20 p-8 pop-card flex flex-col items-center justify-center text-center col-span-1 md:col-span-2 lg:col-span-3 min-h-[400px]">
      
      {/* Organic blob decorations */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-teal-DEFAULT/20 blob-shape blur-xl mix-blend-multiply"></div>
      <div className="absolute bottom-10 -left-10 w-56 h-56 bg-coral-DEFAULT/20 blob-shape blur-xl mix-blend-multiply border-radius-blob-2"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-200/30 blob-shape blur-2xl -z-10"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Playful Logo area */}
        <div className="w-24 h-24 mb-6 bg-white blob-shape flex items-center justify-center border-4 border-slate-800 shadow-pop text-teal-dark transform -rotate-6 hover:rotate-6 transition-transform duration-300">
          <Leaf size={48} className="fill-current" />
        </div>
        
        <p className="font-black text-slate-800 tracking-widest text-sm mb-3 uppercase bg-white px-4 py-1 rounded-full border-2 border-slate-800 shadow-pop transform rotate-2">
          川上牧場 × 出雲農林高校
        </p>
        
        <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight drop-shadow-sm mb-2">
          農業体験<br className="md:hidden"/>
          <span className="text-coral-dark inline-block transform hover:scale-105 transition-transform cursor-default">プログラム</span>
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-teal-dark mt-2 mb-6">
          ポータルサイト
        </h2>
        
        <p className="max-w-md mx-auto font-bold text-slate-600 bg-white/60 p-4 rounded-2xl backdrop-blur-sm border-2 border-slate-200/50">
          スマート農業 ✕ 酪農の温もり！<br/>
          最新のテクノロジーで農業をもっと楽しく。
        </p>
      </div>
    </div>
  );
};

export default HeroTile;
