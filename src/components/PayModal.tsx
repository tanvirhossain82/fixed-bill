import { useState } from 'react';
import { fmt, todayISO } from '@/lib/format';
import { t, type Lang } from '@/lib/i18n';
import { X, Wallet } from 'lucide-react';

type Props = {
  bill: { bill_no: string; total_amount: number };
  lang: Lang;
  onClose: () => void;
  onConfirm: (date: string, amount: number) => void;
};

export default function PayModal({ bill, lang, onClose, onConfirm }: Props) {
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState(String(Math.round(Number(bill.total_amount))));

  function submit() {
    const a = parseFloat(amount);
    if (!date || !a || a <= 0) return;
    onConfirm(date, a);
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800">{t(lang, 'payTitle')}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-700">{t(lang, 'billNo')}:</span> {bill.bill_no}
            <span className="block mt-1">{t(lang, 'thTotal')}: <span className="font-semibold text-slate-800">{fmt(Number(bill.total_amount))}</span></span>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t(lang, 'payDate')}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t(lang, 'payAmount')}</label>
            <input type="number" step="0.01" min="0" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
            {t(lang, 'cancel')}
          </button>
          <button onClick={submit} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
            {t(lang, 'confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
