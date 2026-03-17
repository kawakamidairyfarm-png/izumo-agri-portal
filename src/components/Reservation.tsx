

const Reservation: React.FC = () => {
  return (
    <section id="reservation" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Schedule</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            体験予約カレンダー
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            空き状況を確認し、希望の日時で予約を入れてください。活動時間は各自のスケジュールに合わせて決定できます。
          </p>
        </div>

        <div className="bg-stone-50 rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
          {/* Calendar Placeholder */}
          <div className="flex-1 p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-gray-200">
            <div className="aspect-[4/3] bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 font-medium">Googleカレンダー埋め込みエリア</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96 p-6 lg:p-10 bg-primary-50 flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">予約手続き</h3>
            <p className="text-gray-600 mb-8">
              カレンダーで「〇」または空いている枠を確認し、以下のボタンから予約フォームに進んでください。
            </p>
            <button className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
              体験を予約する
            </button>
            <p className="mt-4 text-xs text-gray-500 text-center">
              ※キャンセルや変更の場合は前日までにご連絡ください。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reservation;
