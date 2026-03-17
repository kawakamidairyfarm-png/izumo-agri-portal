import { useState } from 'react';

const ActivityForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Send to Google Sheets API / Apps Script
    setTimeout(() => {
      alert("活動報告を送信しました。お疲れ様でした！");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section id="activity-report" className="py-16 bg-stone-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-base text-secondary-600 font-semibold tracking-wide uppercase">Report</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            活動報告フォーム
          </p>
          <p className="mt-4 text-lg text-gray-500">
            体験終了後、ここで活動内容と時間を報告してください。これに基づき支給額が計算されます。
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10 border-t-4 border-secondary-500">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                氏名
              </label>
              <div className="mt-1">
                <input id="name" name="name" type="text" required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="出雲 太郎"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">活動日</label>
                <div className="mt-1">
                  <input id="date" name="date" type="date" required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">開始時間</label>
                <div className="mt-1">
                  <input id="startTime" name="startTime" type="time" required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">終了時間</label>
                <div className="mt-1">
                  <input id="endTime" name="endTime" type="time" required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="learnings" className="block text-sm font-medium text-gray-700">
                本日の気づき・学んだこと
              </label>
              <div className="mt-1">
                <textarea id="learnings" name="learnings" rows={4} required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="牛のブラッシングを体験し、..."
                />
              </div>
            </div>

            <div>
              <button type="submit" disabled={isSubmitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSubmitting ? 'bg-secondary-400' : 'bg-secondary-600 hover:bg-secondary-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transition-colors`}>
                {isSubmitting ? '送信中...' : '活動を報告する'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ActivityForm;
