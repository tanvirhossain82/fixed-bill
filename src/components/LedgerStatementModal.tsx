import { fmt } from '@/lib/format';
import { t, type Lang } from '@/lib/i18n';
import { X, Printer, Fuel } from 'lucide-react';
import type { LedgerEntry } from '@/lib/supabase';

type Row = LedgerEntry & { balance: number };

type Props = {
  station: string;
  lang: Lang;
  rows: Row[];
  openingBalance: number;
  closingBalance: number;
  periodLabel: string;
  onClose: () => void;
};

export default function LedgerStatementModal({ station, lang, rows, openingBalance, closingBalance, periodLabel, onClose }: Props) {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:contents">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto print:contents">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 print:hidden">
          <h3 className="text-lg font-bold text-slate-800">{t(lang, 'stmtTitle')}</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
              <Printer className="w-4 h-4" /> {t(lang, 'print')}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable statement */}
        <div className="p-6 sm:p-8 print:p-0" id="print-area">
          {/* Company letterhead */}
          <div className="text-center border-b-2 border-emerald-700 pb-2 mb-3 print:pb-1 print:mb-2">
            <div className="flex items-center justify-center gap-2 mb-1 print:mb-0.5">
              <Fuel className="w-7 h-7 text-emerald-700 print:w-5 print:h-5" />
              <h1 className="text-xl font-bold text-emerald-800 print:text-base">Nippon Paint (Bangladesh) Pvt. Ltd.</h1>
            </div>
            <p className="text-xs text-slate-500 print:text-[10px] mb-0.5">
              {t(lang, 'companyAddress')}
            </p>
            <p className="text-sm text-slate-600 print:text-xs">{t(lang, 'stmtTitle')}</p>
          </div>

          {/* Statement meta */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm print:gap-1 print:mb-2 print:text-xs">
            <div>
              <p className="text-slate-500">{t(lang, 'stmtStation')}</p>
              <p className="font-semibold text-slate-800">{station}</p>
            </div>
            <div>
              <p className="text-slate-500">{t(lang, 'stmtPeriod')}</p>
              <p className="font-semibold text-slate-800">{periodLabel}</p>
            </div>
            <div>
              <p className="text-slate-500">{t(lang, 'stmtOpeningBal')}</p>
              <p className="font-semibold text-slate-800">{fmt(openingBalance)}</p>
            </div>
            <div>
              <p className="text-slate-500">{t(lang, 'stmtGeneratedOn')}</p>
              <p className="font-semibold text-slate-800">{new Date().toISOString().slice(0, 10)}</p>
            </div>
          </div>

          {/* Entries table */}
          <table className="w-full text-sm border border-slate-300 mb-6 print:mb-2 print:text-xs table-fixed">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[11%]" />
              <col className="w-[30%]" />
              <col className="w-[11%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="bg-emerald-50 text-slate-700">
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">#</th>
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">{t(lang, 'thDate')}</th>
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">{t(lang, 'thDesc')}</th>
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">{t(lang, 'thRef')}</th>
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">{t(lang, 'thPurchaseCol')}</th>
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">{t(lang, 'thPaymentCol')}</th>
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">{t(lang, 'thBalance')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-300 px-2 py-6 text-center text-slate-400">
                    {t(lang, 'emptyNm')}
                  </td>
                </tr>
              ) : (
                rows.map((l, i) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-center whitespace-nowrap">{i + 1}</td>
                    <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-center whitespace-nowrap">{l.date}</td>
                    <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-left leading-snug break-words">
                      {l.note || (l.type === 'purchase' ? t(lang, 'nmDescPurchase') : t(lang, 'nmDescPayment'))}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-center whitespace-nowrap">{l.ref || '—'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-center whitespace-nowrap">
                      {l.type === 'purchase' ? fmt(Number(l.amount)) : '—'}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-center whitespace-nowrap">
                      {l.type === 'payment' ? fmt(Number(l.amount)) : '—'}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-center font-medium whitespace-nowrap">{fmt(l.balance)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-100 font-bold">
                <td colSpan={6} className="border border-slate-300 px-2 py-2 print:py-1 text-right">{t(lang, 'stmtClosingBal')}</td>
                <td className="border border-slate-300 px-2 py-2 print:py-1 text-center whitespace-nowrap">{fmt(closingBalance)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Signature blocks */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-6 print:mt-6 print:pt-2">
            <div className="text-center">
              <div className="border-t border-slate-400 pt-1">
                <p className="text-sm text-slate-600">{t(lang, 'signPreparer')}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-400 pt-1">
                <p className="text-sm text-slate-600">{t(lang, 'signAccounts')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions (hidden in print) */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 print:hidden">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
            {t(lang, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
}
