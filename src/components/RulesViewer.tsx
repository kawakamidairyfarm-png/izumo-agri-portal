import { useState } from 'react';

const RulesViewer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="py-12 bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-6 py-5 flex items-center justify-between focus:outline-none focus:bg-gray-50 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <svg className="h-6 w-6 text-primary-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">農業体験プログラム規則（第6条等）</h3>
            </div>
            <span className="ml-6 flex items-center">
              <svg
                className={`h-5 w-5 text-gray-500 transform transition-transform duration-300 ${isOpen ? '-rotate-180' : 'rotate-0'}`}
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 border-t border-gray-200' : 'max-h-0'}`}>
            <div className="p-6 bg-gray-50 prose prose-sm sm:prose max-w-none text-gray-600">
              <h4 className="font-bold text-gray-800 mb-2">第6条（支援金の支給）</h4>
              <p className="mb-4">
                本プログラムに参加する生徒に対し、体験の実働時間に応じた支援金を支給する。
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>支給額の算定基準は、1時間あたり400円とする。</li>
                <li>活動時間は、本ポータルの活動報告フォームを通じて正確に記録・申請すること。</li>
                <li>虚偽の申告があった場合は、支援金の返還を求める場合がある。</li>
              </ul>
              <h4 className="font-bold text-gray-800 mb-2">注意事項</h4>
              <p>
                体験中は安全第一で行動し、指導者の指示に従うこと。服装は別途定める用具を着用すること。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RulesViewer;
