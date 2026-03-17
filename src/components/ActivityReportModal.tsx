import { useState } from 'react';
import { X, Send } from 'lucide-react';

interface ActivityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityReportModal = ({ isOpen, onClose }: ActivityReportModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert("活動報告を送信しました。お疲れ様でした！");
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white border-4 border-slate-800 shadow-pop w-full max-w-lg rounded-3xl overflow-hidden transform transition-all flex flex-col max-h-[90vh] relative"
      >
        {/* Blob decoration top corner */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-DEFAULT/20 blob-shape blur-md"></div>
        
        <div className="p-6 border-b-4 border-slate-800 flex justify-between items-center bg-coral-light/30 relative z-10">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">活動の報告</h2>
            <p className="text-sm font-bold text-coral-dark mt-1">今日の体験を記録しよう！</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white border-2 border-slate-800 rounded-full text-slate-800 hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto relative z-10 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-black text-slate-800 mb-2">氏名</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 bg-white border-2 border-slate-400 rounded-xl focus:ring-0 focus:border-coral-DEFAULT focus:outline-none transition-all font-bold text-slate-800 shadow-[2px_2px_0px_0px_rgba(148,163,184,1)] focus:shadow-[4px_4px_0px_0px_rgba(251,113,133,1)]"
                placeholder="出雲 太郎"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-800 mb-2">活動日</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-3 bg-white border-2 border-slate-400 rounded-xl focus:ring-0 focus:border-coral-DEFAULT focus:outline-none transition-all font-bold text-slate-800 shadow-[2px_2px_0px_0px_rgba(148,163,184,1)] focus:shadow-[4px_4px_0px_0px_rgba(251,113,133,1)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-slate-800 mb-2">開始時間</label>
                <input 
                  type="time" 
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-slate-400 rounded-xl focus:ring-0 focus:border-coral-DEFAULT focus:outline-none transition-all font-bold text-slate-800 shadow-[2px_2px_0px_0px_rgba(148,163,184,1)] focus:shadow-[4px_4px_0px_0px_rgba(251,113,133,1)]"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-800 mb-2">終了時間</label>
                <input 
                  type="time" 
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-slate-400 rounded-xl focus:ring-0 focus:border-coral-DEFAULT focus:outline-none transition-all font-bold text-slate-800 shadow-[2px_2px_0px_0px_rgba(148,163,184,1)] focus:shadow-[4px_4px_0px_0px_rgba(251,113,133,1)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-800 mb-2">気づき・学んだこと</label>
              <textarea 
                rows={3} 
                required
                className="w-full px-4 py-3 bg-white border-2 border-slate-400 rounded-xl focus:ring-0 focus:border-coral-DEFAULT focus:outline-none transition-all font-bold text-slate-800 shadow-[2px_2px_0px_0px_rgba(148,163,184,1)] focus:shadow-[4px_4px_0px_0px_rgba(251,113,133,1)] resize-none"
                placeholder="今日は牛のブラッシングを体験し..."
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 mt-6 border-2 border-slate-800 bg-teal-DEFAULT hover:bg-teal-dark text-slate-900 font-black text-xl rounded-full shadow-pop hover:shadow-pop-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center blob-shape active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={24} className="mr-2" strokeWidth={3} />
              {isSubmitting ? '報告を送信中...' : '報告する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ActivityReportModal;
