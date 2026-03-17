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
    <footer className="mt-16 w-full max-w-5xl mx-auto px-4 pb-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 border-t-4 border-slate-800 border-dashed pt-8">
      
      <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto items-start md:items-center">
        
        {/* Contact Email Area */}
        <div className="relative flex flex-col w-full sm:w-auto">
          {/* Main Copy Button */}
          <button 
            onClick={handleCopy}
            className="relative flex items-center justify-center px-6 py-4 bg-coral-DEFAULT hover:bg-coral-dark text-white text-base font-black border-4 border-slate-800 shadow-pop hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pop-hover transition-all blob-shape active:translate-y-[4px] min-w-[220px]"
          >
            {copied ? <Check size={20} className="mr-2" strokeWidth={4} /> : <Mail size={20} className="mr-2" strokeWidth={3} />}
            {copied ? 'コピー完了！' : 'メールでお問合せ'}
          </button>

          {/* Direct Address & Mail Client Fallback Link */}
          <div className="mt-3 flex items-center justify-between bg-white border-2 border-slate-800 rounded-xl px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-800 shadow-sm max-w-full overflow-hidden">
            <span className="truncate mr-2">kawakami.dairy.farm@gmail.com</span>
            <a 
              href="mailto:kawakami.dairy.farm@gmail.com" 
              className="bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-800 p-1 rounded-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all flex-shrink-0"
              title="メールソフトを開く"
            >
              <Mail size={14} strokeWidth={3} />
            </a>
          </div>

          {/* Toast Notification */}
          {copied && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max bg-slate-800 text-white text-xs font-black px-4 py-3 rounded-xl z-20 shadow-pop animate-bounce">
              メールアドレスをコピーしました！
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45"></div>
            </div>
          )}
        </div>
        <a 
          href="/image_0.png" 
          target="_blank"
          className="flex-1 md:flex-none flex items-center justify-center h-[56px] px-6 bg-white text-slate-800 hover:bg-slate-50 text-base font-black rounded-full border-4 border-slate-800 shadow-pop hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pop-hover transition-all mt-0 sm:mt-1"
        >
          <FileText size={20} className="mr-2" strokeWidth={3} />
          プログラム規則
        </a>
      </div>

      <div className="text-center md:text-right bg-white p-4 rounded-2xl border-2 border-slate-800 transform rotate-1">
        <p className="text-xs text-slate-800 font-bold tracking-wider uppercase">
          &copy; {new Date().getFullYear()} Izumo Norin High School<br/>
          Kawakami Dairy Farm
        </p>
      </div>

    </footer>
  );
};

export default Footer;
