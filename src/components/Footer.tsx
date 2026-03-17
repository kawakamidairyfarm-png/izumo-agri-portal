import { useState } from 'react';
import { Mail, FileText, Check } from 'lucide-react';

const Footer = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('kawakami.dairy.farm@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <footer className="mt-20 w-full max-w-5xl mx-auto px-4 pb-16 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10 border-t-4 border-slate-800 border-dashed pt-12">
      
      <div className="flex flex-col sm:flex-row gap-8 w-full md:w-auto items-stretch sm:items-center">
        
        {/* Contact Email Area */}
        <div className="relative flex flex-col w-full sm:w-auto">
          {/* Main Copy Button */}
          <button 
            onClick={handleCopy}
            className="w-full relative flex items-center justify-center px-8 py-5 bg-coral-DEFAULT hover:bg-coral-dark text-white text-lg font-black border-4 border-slate-800 shadow-pop hover:translate-x-[2.5px] hover:translate-y-[2.5px] hover:shadow-pop-hover transition-all blob-shape active:translate-y-[5px] sm:min-w-[240px]"
          >
            {copied ? <Check size={22} className="mr-3" strokeWidth={4} /> : <Mail size={22} className="mr-3" strokeWidth={3} />}
            {copied ? 'コピー完了！' : 'メールでお問合せ'}
          </button>

          {/* Direct Address & Mail Client Fallback Link */}
          <div className="mt-4 flex items-center justify-between bg-white border-2 border-slate-800 rounded-[1.25rem] px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-sm max-w-full overflow-hidden">
            <span className="truncate mr-3 font-mono">kawakami.dairy.farm@gmail.com</span>
            <a 
              href="mailto:kawakami.dairy.farm@gmail.com" 
              className="bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-800 p-2 rounded-[0.75rem] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all flex-shrink-0"
              title="メールソフトを開く"
            >
              <Mail size={16} strokeWidth={3} />
            </a>
          </div>

          {/* Toast Notification */}
          {copied && (
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-max bg-slate-900 text-white text-[11px] font-black px-5 py-3.5 rounded-2xl z-20 shadow-pop animate-pop-in">
              メールアドレスをコピーしました！
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
            </div>
          )}
        </div>
        <a 
          href="/image_0.png" 
          target="_blank"
          className="w-full sm:w-auto flex items-center justify-center h-[68px] px-10 bg-white text-slate-800 hover:bg-slate-50 text-lg font-black rounded-full border-4 border-slate-800 shadow-pop hover:translate-x-[2.5px] hover:translate-y-[2.5px] hover:shadow-pop-hover transition-all mt-2 sm:mt-1"
        >
          <FileText size={22} className="mr-3" strokeWidth={3} />
          プログラム規則
        </a>
      </div>

      <div className="text-center md:text-right bg-white p-6 rounded-[2rem] border-2 border-slate-800 transform md:rotate-1 shadow-sm w-full md:w-auto mt-6 md:mt-0">
        <p className="text-xs text-slate-800 font-bold tracking-widest uppercase leading-relaxed">
          &copy; {new Date().getFullYear()} Izumo Norin High School<br/>
          Kawakami Dairy Farm
        </p>
      </div>

    </footer>
  );
};

export default Footer;
