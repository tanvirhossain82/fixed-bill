import { supabase, type Purchase, type Bill, type LedgerEntry } from '@/lib/supabase';
import { fmt, todayISO, amountInWordsBn, amountInWordsEn } from '@/lib/format';
import { t, type Lang } from '@/lib/i18n';
import { toast } from '@/components/Toaster';
import { X, Printer, Fuel, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

type Props = {
  bill: Bill;
  purchases: Purchase[];
  lang: Lang;
  onClose: () => void;
};

export default function BillViewModal({ bill, purchases, lang, onClose }: Props) {
  const total = Number(bill.total_amount) || 0;
  const words = lang === 'bn' ? amountInWordsBn(total) : amountInWordsEn(total);
  const distinctVendors = Array.from(new Set(purchases.map((p) => p.vendor || '—')));
  const isCombined = distinctVendors.length > 1;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:contents">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto print:contents">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 print:hidden">
          <h3 className="text-lg font-bold text-slate-800">{t(lang, 'billViewTitle')}</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
              <Printer className="w-4 h-4" /> {t(lang, 'print')}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable bill */}
        <div className="p-6 sm:p-8 print:p-0" id="print-area">
          {/* Company letterhead */}
          <div className="text-center border-b-2 border-emerald-700 pb-2 mb-3 print:pb-1 print:mb-2">
            <div className="flex items-center justify-center gap-2 mb-1 print:mb-0.5">
              <Fuel className="w-7 h-7 text-emerald-700 print:w-5 print:h-5" />
              <h1 className="text-xl font-bold text-emerald-800 print:text-base">Nippon Paint (Bangladesh) Pvt. Ltd.</h1>
            </div>
            <p className="text-xs text-slate-500 print:text-[10px] mb-0.5">
              আর.এস. প্লট নং: ৩৩৩-৩৩৭, ৬৪-৬৭, বরংগাইল, শিবালয়, মানিকগঞ্জ।
            </p>
            <p className="text-sm text-slate-600 print:text-xs">
              {lang === 'bn' ? 'জ্বালানি বিল বিবরণী' : 'Fuel Bill Statement'}
            </p>
          </div>

          {/* Bill meta */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm print:gap-1 print:mb-2 print:text-xs">
            <div>
              <p className="text-slate-500">{t(lang, 'billNo')}</p>
              <p className="font-semibold text-slate-800">{bill.bill_no}</p>
            </div>
            <div>
              <p className="text-slate-500">{t(lang, 'billDate')}</p>
              <p className="font-semibold text-slate-800">{bill.date}</p>
            </div>
            <div>
              <p className="text-slate-500">{t(lang, 'billVehicle')}</p>
              <p className="font-semibold text-slate-800">Toyota Hi-Ace</p>
            </div>
            <div>
              <p className="text-slate-500">{t(lang, 'billSupplier')}</p>
              <p className="font-semibold text-slate-800">{bill.vendor || '—'}</p>
            </div>
            {bill.preparer && (
              <div>
                <p className="text-slate-500">{t(lang, 'billPreparedBy')}</p>
                <p className="font-semibold text-slate-800">{bill.preparer}</p>
              </div>
            )}
            <div>
              <p className="text-slate-500">{t(lang, 'billStatus')}</p>
              <p className="font-semibold text-slate-800">
                {bill.status === 'paid' ? t(lang, 'badgePaid') : t(lang, 'badgeSubmitted')}
              </p>
            </div>
          </div>

          {/* Purchases table */}
          <table className="w-full text-sm border border-slate-300 mb-6 print:mb-2 print:text-xs">
            <thead>
              <tr className="bg-emerald-50 text-slate-700">
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">#</th>
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">{t(lang, 'thDate')}</th>
                {isCombined && (
                  <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">{t(lang, 'thVendorCol')}</th>
                )}
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">{t(lang, 'thFuel')}</th>
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">{t(lang, 'thQty')}</th>
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-center">{t(lang, 'thRate')}</th>
                <th className="border border-slate-300 px-2 py-2 print:py-1 text-right">{t(lang, 'thMoney')}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p, i) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-center">{i + 1}</td>
                  <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-center">{p.date}</td>
                  {isCombined && (
                    <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-center">{p.vendor || '—'}</td>
                  )}
                  <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-center">{p.fuel_type}</td>
                  <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-center">
                    {p.quantity} {p.unit}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-center">
                    {p.rate ? '৳ ' + Number(p.rate).toFixed(2) : '—'}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 print:py-0.5 text-right font-medium">
                    {fmt(Number(p.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-100 font-bold">
                <td colSpan={isCombined ? 6 : 5} className="border border-slate-300 px-2 py-2 print:py-1 text-right">{t(lang, 'billTotal')}</td>
                <td className="border border-slate-300 px-2 py-2 print:py-1 text-right">{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Amount in words */}
          <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200 print:mb-2 print:p-1.5">
            <p className="text-xs text-slate-500 mb-0.5">{t(lang, 'amountInWords')}:</p>
            <p className="text-sm font-semibold text-slate-800 print:text-xs">{words}</p>
          </div>

          {/* Payment info if paid */}
          {bill.status === 'paid' && (
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm print:gap-1 print:mb-2 print:text-xs">
              <div>
                <p className="text-slate-500">{t(lang, 'billPayDate')}</p>
                <p className="font-semibold text-slate-800">{bill.payment_date || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500">{t(lang, 'billPaidAmt')}</p>
                <p className="font-semibold text-slate-800">{bill.payment_amount != null ? fmt(Number(bill.payment_amount)) : '—'}</p>
              </div>
            </div>
          )}

          {/* Remarks */}
          {bill.remarks && (
            <div className="mb-6 text-sm print:mb-2 print:text-xs">
              <p className="text-slate-500">{t(lang, 'billRemarks')}:</p>
              <p className="text-slate-700 mt-0.5">{bill.remarks}</p>
            </div>
          )}

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
