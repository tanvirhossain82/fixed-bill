import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase, type Purchase, type Bill, type LedgerEntry, type AppMeta } from '@/lib/supabase';
import { fmt, todayISO } from '@/lib/format';
import { t, type Lang } from '@/lib/i18n';
import { toast } from '@/components/Toaster';
import Toaster from '@/components/Toaster';
import Autocomplete from '@/components/Autocomplete';
import BillViewModal from '@/components/BillViewModal';
import LedgerStatementModal from '@/components/LedgerStatementModal';
import PayModal from '@/components/PayModal';
import {
  Fuel, Wallet, FileText, BookOpen, Plus, Trash2, CheckCircle2, Clock,
  TrendingUp, Languages, Search, Receipt, Printer, RotateCcw, AlertTriangle, Pencil, X,
} from 'lucide-react';

type Tab = 'purchase' | 'generate' | 'ledger' | 'nm';

export default function App() {
  const [lang, setLang] = useState<Lang>('bn');
  const [tab, setTab] = useState<Tab>('purchase');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [meta, setMeta] = useState<AppMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Data loading ----
  const loadAll = useCallback(async () => {
    const [p, b, l, m] = await Promise.all([
      supabase.from('purchases').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('bills').select('*').order('date', { ascending: false }),
      supabase.from('ledger_entries').select('*').order('date', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('app_meta').select('*').maybeSingle(),
    ]);
    if (p.data) setPurchases(p.data as Purchase[]);
    if (b.data) setBills(b.data as Bill[]);
    if (l.data) setLedger(l.data as LedgerEntry[]);
    if (m.data) setMeta(m.data as AppMeta);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ---- Derived stats ----
  const stats = useMemo(() => {
    const totalPurchase = purchases.reduce((s, p) => s + Number(p.amount), 0);
    const unbilled = purchases.filter((p) => !p.bill_id).reduce((s, p) => s + Number(p.amount), 0);
    const submittedDue = bills.filter((b) => b.status === 'submitted').reduce((s, b) => s + Number(b.total_amount), 0);
    const paid = bills.filter((b) => b.status === 'paid').reduce((s, b) => s + Number(b.payment_amount || 0), 0);
    return { totalPurchase, unbilled, submittedDue, paid };
  }, [purchases, bills]);

  // ---- Autocomplete suggestion pools ----
  const fuelSuggestions = useMemo(() => {
    const set = new Set<string>(['CNG', 'Petrol', 'Octane']);
    purchases.forEach((p) => set.add(p.fuel_type));
    return Array.from(set);
  }, [purchases]);

  const vendorSuggestions = useMemo(() => {
    const set = new Set<string>(['Modhumoti CNG Pump']);
    purchases.forEach((p) => { if (p.vendor) set.add(p.vendor); });
    return Array.from(set);
  }, [purchases]);

  const receiptSuggestions = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => { if (p.receipt_no) set.add(p.receipt_no); });
    return Array.from(set);
  }, [purchases]);

  const remarksSuggestions = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => { if (p.remarks) set.add(p.remarks); });
    return Array.from(set);
  }, [purchases]);

  // ---- Purchase form state ----
  const [fDate, setFDate] = useState(todayISO());
  const [fFuel, setFFuel] = useState('CNG');
  const [fQty, setFQty] = useState('');
  const [fUnit, setFUnit] = useState('লিটার');
  const [fRate, setFRate] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fReceipt, setFReceipt] = useState('');
  const [fVendor, setFVendor] = useState('Modhumoti CNG Pump');
  const [fRemarks, setFRemarks] = useState('');
  const [savingPurchase, setSavingPurchase] = useState(false);

  // Auto-calc amount from qty × rate
  useEffect(() => {
    const q = parseFloat(fQty);
    const r = parseFloat(fRate);
    if (q > 0 && r > 0) {
      setFAmount(String(Math.round(q * r)));
    }
  }, [fQty, fRate]);

  async function addPurchase() {
    const qty = parseFloat(fQty);
    const rate = fRate ? parseFloat(fRate) : null;
    const amount = fAmount ? parseFloat(fAmount) : (qty && rate ? qty * rate : 0);
    if (!fDate || !fFuel || !qty || qty <= 0 || !amount || amount <= 0) {
      toast(t(lang, 'toastInvalidAmt'), 'err');
      return;
    }
    setSavingPurchase(true);
    const { data, error } = await supabase.from('purchases').insert({
      date: fDate, fuel_type: fFuel, quantity: qty, unit: fUnit,
      rate, amount, receipt_no: fReceipt || null, vendor: fVendor || null,
      remarks: fRemarks || null,
    }).select().single();
    if (error || !data) {
      toast(t(lang, 'toastSaved'), 'err');
      setSavingPurchase(false);
      return;
    }
    // Auto-create ledger entry (purchase → increases payable), tagged to this station
    const { error: ledErr } = await supabase.from('ledger_entries').insert({
      type: 'purchase', date: fDate, amount, ref: fReceipt || null,
      note: `${fFuel} — ${qty} ${fUnit}`, source_purchase_id: data.id, auto: true,
      vendor: fVendor || null,
    });
    if (ledErr) { toast(t(lang, 'toastSaved'), 'err'); setSavingPurchase(false); return; }
    // Reload all data so purchase list, unbilled list, and NM ledger stay in sync
    await loadAll();
    // Reset form (keep date, fuel, vendor for convenience)
    setFQty(''); setFRate(''); setFAmount(''); setFReceipt(''); setFRemarks('');
    toast(t(lang, 'toastPurchaseAdded'));
    setSavingPurchase(false);
  }

  async function deletePurchase(id: string) {
    // Also cascades to ledger_entries via FK
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) { toast(t(lang, 'toastSaved'), 'err'); return; }
    setPurchases((prev) => prev.filter((p) => p.id !== id));
    setLedger((prev) => prev.filter((l) => l.source_purchase_id !== id));
  }

  // ---- Bill generation ----
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [billDate, setBillDate] = useState(todayISO());
  const [preparer, setPreparer] = useState(() => localStorage.getItem('billPreparer') || '');
  const [billRemarks, setBillRemarks] = useState(() => localStorage.getItem('billRemarksDraft') || '');
  useEffect(() => { localStorage.setItem('billPreparer', preparer); }, [preparer]);
  useEffect(() => { localStorage.setItem('billRemarksDraft', billRemarks); }, [billRemarks]);
  const [generating, setGenerating] = useState(false);

  const unbilledPurchases = useMemo(() => purchases.filter((p) => !p.bill_id), [purchases]);
  const unbilledVendorList = useMemo(() => {
    const set = new Set<string>();
    unbilledPurchases.forEach((p) => { if (p.vendor) set.add(p.vendor); });
    return Array.from(set);
  }, [unbilledPurchases]);
  const [genVendor, setGenVendor] = useState('');
  useEffect(() => {
    if (!genVendor && unbilledVendorList.length > 0) setGenVendor(unbilledVendorList[0]);
  }, [unbilledVendorList, genVendor]);
  const vendorUnbilledPurchases = useMemo(
    () => unbilledPurchases.filter((p) => p.vendor === genVendor),
    [unbilledPurchases, genVendor]
  );
  // ---- Bill mode: bill one station at a time, or all stations combined into one bill ----
  const [billMode, setBillMode] = useState<'single' | 'combined'>('single');
  function changeBillMode(m: 'single' | 'combined') {
    setBillMode(m);
    setSelectedIds(new Set());
  }
  function changeGenVendor(v: string) {
    setGenVendor(v);
    setSelectedIds(new Set());
  }
  // Purchases actually offered for selection, depending on the current bill mode
  const activeUnbilledPurchases = billMode === 'combined' ? unbilledPurchases : vendorUnbilledPurchases;
  const selectedTotal = useMemo(
    () => unbilledPurchases.filter((p) => selectedIds.has(p.id)).reduce((s, p) => s + Number(p.amount), 0),
    [unbilledPurchases, selectedIds]
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function selectAll() {
    setSelectedIds(new Set(activeUnbilledPurchases.map((p) => p.id)));
  }
  function clearAll() { setSelectedIds(new Set()); }

  async function generateBill() {
    if (selectedIds.size === 0) return;
    if (billMode === 'single' && !genVendor) return;
    setGenerating(true);
    const seq = (meta?.bill_seq || 1);
    const billNo = `NP-CNG-${String(seq).padStart(3, '0')}`;
    const total = selectedTotal;

    // For a combined bill, the "vendor" label lists every station included in it.
    const selectedPurchases = unbilledPurchases.filter((p) => selectedIds.has(p.id));
    const distinctVendors = Array.from(new Set(selectedPurchases.map((p) => p.vendor || t(lang, 'unassignedVendor'))));
    const vendorLabel = billMode === 'combined' ? distinctVendors.join(', ') : genVendor;

    const { data: billData, error: billErr } = await supabase.from('bills').insert({
      bill_no: billNo, date: billDate, total_amount: total,
      status: 'submitted', submitted_date: billDate,
      preparer: preparer || null, remarks: billRemarks || null,
      vendor: vendorLabel || null,
    }).select().single();
    if (billErr || !billData) {
      toast(t(lang, 'toastSaved'), 'err');
      setGenerating(false);
      return;
    }
    // Link purchases to this bill
    const ids = Array.from(selectedIds);
    await supabase.from('purchases').update({ bill_id: billData.id }).in('id', ids);
    // Increment bill sequence
    await supabase.from('app_meta').update({ bill_seq: seq + 1 }).eq('id', 1);

    setPurchases((prev) => prev.map((p) => selectedIds.has(p.id) ? { ...p, bill_id: billData.id } : p));
    setBills((prev) => [billData as Bill, ...prev]);
    setMeta((prev) => prev ? { ...prev, bill_seq: seq + 1 } : prev);
    setSelectedIds(new Set());
    toast(t(lang, 'toastBillCreated'));
    setGenerating(false);
    setTab('ledger');
  }

  // ---- Bill payment ----
  const [payTarget, setPayTarget] = useState<Bill | null>(null);

  async function confirmPayment(date: string, amount: number) {
    if (!payTarget) return;
    const { error } = await supabase.from('bills').update({
      status: 'paid', payment_date: date, payment_amount: amount,
    }).eq('id', payTarget.id);
    if (error) { toast(t(lang, 'toastSaved'), 'err'); return; }

    // A bill may cover more than one station (combined billing), so the payment must be
    // split across each station's own ledger, proportional to how much of the bill came
    // from that station — otherwise a single station's payable would absorb the whole payment.
    const billPurchases = purchases.filter((p) => p.bill_id === payTarget.id);
    const perVendorTotal = new Map<string, number>();
    billPurchases.forEach((p) => {
      const key = p.vendor || '';
      perVendorTotal.set(key, (perVendorTotal.get(key) || 0) + Number(p.amount));
    });
    if (perVendorTotal.size === 0) {
      // Fallback (e.g. source purchases were deleted): record against the bill's own vendor field.
      perVendorTotal.set(payTarget.vendor || '', Number(payTarget.total_amount) || amount);
    }
    const billTotal = Array.from(perVendorTotal.values()).reduce((s, v) => s + v, 0) || amount;
    const paymentNote = lang === 'bn' ? 'বিল পেমেন্ট' : 'Bill payment';
    const entries = Array.from(perVendorTotal.entries());
    let allocated = 0;
    const inserts = entries.map(([vendor, vendorTotal], idx) => {
      // Give the last station whatever remains, so rounding never loses or invents a few paisa.
      const share = idx === entries.length - 1
        ? Number((amount - allocated).toFixed(2))
        : Number(((amount * vendorTotal) / billTotal).toFixed(2));
      if (idx !== entries.length - 1) allocated += share;
      return {
        type: 'payment' as const, date, amount: share, ref: payTarget.bill_no,
        note: paymentNote, source_bill_id: payTarget.id, auto: true, vendor: vendor || null,
      };
    });

    const { data: ledgerData, error: ledErr } = await supabase.from('ledger_entries').insert(inserts).select();
    if (ledErr) { toast(t(lang, 'toastSaved'), 'err'); }

    setBills((prev) => prev.map((b) => b.id === payTarget.id
      ? { ...b, status: 'paid', payment_date: date, payment_amount: amount } : b));
    if (ledgerData) {
      setLedger((prev) => [...prev, ...(ledgerData as LedgerEntry[])]);
    } else {
      await loadAll();
    }
    setPayTarget(null);
    toast(t(lang, 'toastPaymentRecorded'));
  }

  // ---- Bill view modal ----
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const viewBillPurchases = useMemo(() => {
    if (!viewBill) return [];
    return purchases.filter((p) => p.bill_id === viewBill.id);
  }, [viewBill, purchases]);

  // ---- NM Ledger manual entry ----
  const [nmType, setNmType] = useState<'purchase' | 'payment'>('purchase');
  const [nmDate, setNmDate] = useState(todayISO());
  const [nmAmount, setNmAmount] = useState('');
  const [nmRef, setNmRef] = useState('');
  const [nmNote, setNmNote] = useState('');
  const [nmVendor, setNmVendor] = useState('');
  const [nmSaving, setNmSaving] = useState(false);

  async function addNmEntry() {
    const amt = parseFloat(nmAmount);
    if (!nmDate || !amt || amt <= 0) { toast(t(lang, 'toastInvalidNm'), 'err'); return; }
    setNmSaving(true);
    const { data, error } = await supabase.from('ledger_entries').insert({
      type: nmType, date: nmDate, amount: amt, ref: nmRef || null,
      note: nmNote || null, auto: false, vendor: nmVendor || null,
    }).select().single();
    if (error || !data) { toast(t(lang, 'toastSaved'), 'err'); setNmSaving(false); return; }
    setLedger((prev) => [...prev, data as LedgerEntry]);
    setNmAmount(''); setNmRef(''); setNmNote('');
    toast(nmType === 'purchase' ? t(lang, 'toastNmPurchase') : t(lang, 'toastNmPayment'));
    setNmSaving(false);
  }

  async function deleteNmEntry(id: string) {
    const { error } = await supabase.from('ledger_entries').delete().eq('id', id);
    if (error) { toast(t(lang, 'toastSaved'), 'err'); return; }
    await loadAll();
    toast(t(lang, 'toastLedgerDeleted'));
  }

  // ---- Reset all data ----
  const [confirm, setConfirm] = useState<null | { kind: 'reset' | 'bill' | 'ledger'; id?: string }>(null);

  // ---- Edit state ----
  const [editPurchase, setEditPurchase] = useState<Purchase | null>(null);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [editLedger, setEditLedger] = useState<LedgerEntry | null>(null);

  async function resetAll() {
    // Delete in FK-safe order: ledger → purchases → bills → reset meta
    await supabase.from('ledger_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('app_meta').update({ bill_seq: 1 }).eq('id', 1);
    await loadAll();
    setConfirm(null);
    toast(t(lang, 'toastResetDone'));
  }

  async function deleteBill(id: string) {
    // Unlink purchases first (set bill_id null), then delete bill + its auto ledger row
    await supabase.from('purchases').update({ bill_id: null }).eq('bill_id', id);
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) { toast(t(lang, 'toastSaved'), 'err'); return; }
    await loadAll();
    setConfirm(null);
    toast(t(lang, 'toastBillDeleted'));
  }

  // ---- Edit functions ----
  async function savePurchaseEdit(p: Purchase) {
    const { error } = await supabase.from('purchases').update({
      date: p.date, fuel_type: p.fuel_type, quantity: p.quantity, unit: p.unit,
      rate: p.rate, amount: p.amount, receipt_no: p.receipt_no, vendor: p.vendor, remarks: p.remarks,
    }).eq('id', p.id);
    if (error) { toast(t(lang, 'toastSaved'), 'err'); return; }
    await loadAll();
    setEditPurchase(null);
    toast(t(lang, 'toastPurchaseUpdated'));
  }

  async function saveBillEdit(b: Bill) {
    const { error } = await supabase.from('bills').update({
      date: b.date, preparer: b.preparer, remarks: b.remarks, vendor: b.vendor,
    }).eq('id', b.id);
    if (error) { toast(t(lang, 'toastSaved'), 'err'); return; }
    await loadAll();
    setEditBill(null);
    toast(t(lang, 'toastBillUpdated'));
  }

  async function saveLedgerEdit(l: LedgerEntry) {
    const { error } = await supabase.from('ledger_entries').update({
      date: l.date, amount: l.amount, ref: l.ref, note: l.note, vendor: l.vendor,
    }).eq('id', l.id);
    if (error) { toast(t(lang, 'toastSaved'), 'err'); return; }
    await loadAll();
    setEditLedger(null);
    toast(t(lang, 'toastLedgerUpdated'));
  }

  // ---- NM Ledger: per-station selection & running balance ----
  const ledgerVendorList = useMemo(() => {
    const set = new Set<string>();
    vendorSuggestions.forEach((v) => set.add(v));
    ledger.forEach((l) => { if (l.vendor) set.add(l.vendor); });
    return Array.from(set);
  }, [vendorSuggestions, ledger]);
  const hasUnassignedLedger = useMemo(() => ledger.some((l) => !l.vendor), [ledger]);

  const [selectedLedgerVendor, setSelectedLedgerVendor] = useState<string>('');
  useEffect(() => {
    if (!selectedLedgerVendor && ledgerVendorList.length > 0) setSelectedLedgerVendor(ledgerVendorList[0]);
  }, [ledgerVendorList, selectedLedgerVendor]);
  useEffect(() => { setNmVendor(selectedLedgerVendor); }, [selectedLedgerVendor]);

  const filteredLedger = useMemo(() => {
    if (selectedLedgerVendor === '__unassigned__') return ledger.filter((l) => !l.vendor);
    if (!selectedLedgerVendor) return [];
    return ledger.filter((l) => l.vendor === selectedLedgerVendor);
  }, [ledger, selectedLedgerVendor]);

  const ledgerRows = useMemo(() => {
    let bal = 0;
    return filteredLedger.map((l) => {
      bal += l.type === 'purchase' ? Number(l.amount) : -Number(l.amount);
      return { ...l, balance: bal };
    });
  }, [filteredLedger]);
  const outstanding = ledgerRows.length > 0 ? ledgerRows[ledgerRows.length - 1].balance : 0;

  // ---- Station ledger statement: month / date-wise filter for Print & PDF ----
  const [nmStmtMonth, setNmStmtMonth] = useState('');
  const [nmStmtFrom, setNmStmtFrom] = useState('');
  const [nmStmtTo, setNmStmtTo] = useState('');
  const [showStatement, setShowStatement] = useState(false);

  function pickMonth(m: string) {
    setNmStmtMonth(m);
    if (m) {
      const [y, mo] = m.split('-').map(Number);
      const lastDay = new Date(y, mo, 0).getDate();
      setNmStmtFrom(`${m}-01`);
      setNmStmtTo(`${m}-${String(lastDay).padStart(2, '0')}`);
    } else {
      setNmStmtFrom(''); setNmStmtTo('');
    }
  }
  function clearStmtFilter() {
    setNmStmtMonth(''); setNmStmtFrom(''); setNmStmtTo('');
  }

  const stmtStartIndex = useMemo(() => {
    if (!nmStmtFrom) return 0;
    return ledgerRows.findIndex((r) => r.date >= nmStmtFrom);
  }, [ledgerRows, nmStmtFrom]);

  const statementRows = useMemo(() => {
    if (!nmStmtFrom && !nmStmtTo) return ledgerRows;
    return ledgerRows.filter((r) => (!nmStmtFrom || r.date >= nmStmtFrom) && (!nmStmtTo || r.date <= nmStmtTo));
  }, [ledgerRows, nmStmtFrom, nmStmtTo]);

  const statementOpeningBalance = useMemo(() => {
    if (!nmStmtFrom || stmtStartIndex <= 0) return 0;
    return ledgerRows[stmtStartIndex - 1].balance;
  }, [ledgerRows, nmStmtFrom, stmtStartIndex]);

  const statementClosingBalance = statementRows.length > 0
    ? statementRows[statementRows.length - 1].balance
    : statementOpeningBalance;

  const statementPeriodLabel = useMemo(() => {
    if (!nmStmtFrom && !nmStmtTo) return t(lang, 'stmtAllTime');
    return `${nmStmtFrom || '…'} — ${nmStmtTo || '…'}`;
  }, [nmStmtFrom, nmStmtTo, lang]);

  // Outstanding balance per station, for the selector pills
  const vendorBalances = useMemo(() => {
    const map = new Map<string, number>();
    ledger.forEach((l) => {
      const key = l.vendor || '__unassigned__';
      const cur = map.get(key) || 0;
      map.set(key, cur + (l.type === 'purchase' ? Number(l.amount) : -Number(l.amount)));
    });
    return map;
  }, [ledger]);

  // ---- UI helpers ----
  const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow';
  const labelCls = 'block text-xs font-medium text-slate-500 mb-1';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">{lang === 'bn' ? 'লোড হচ্ছে…' : 'Loading…'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Toaster />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
                <Fuel className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-emerald-600 tracking-wide uppercase">{t(lang, 'eyebrow')}</p>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight">{t(lang, 'title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirm({ kind: 'reset' })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {t(lang, 'resetAll')}
              </button>
              <button
                onClick={() => setLang((p) => (p === 'bn' ? 'en' : 'bn'))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Languages className="w-4 h-4" />
                {lang === 'bn' ? 'English' : 'বাংলা'}
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">{t(lang, 'subtitle')}</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 print:hidden">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard icon={TrendingUp} label={t(lang, 'gPurchase')} value={fmt(stats.totalPurchase)} color="emerald" />
          <StatCard icon={Clock} label={t(lang, 'gUnbilled')} value={fmt(stats.unbilled)} color="amber" />
          <StatCard icon={FileText} label={t(lang, 'gDue')} value={fmt(stats.submittedDue)} color="blue" />
          <StatCard icon={CheckCircle2} label={t(lang, 'gPaid')} value={fmt(stats.paid)} color="slate" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto print:hidden">
          <TabBtn active={tab === 'purchase'} onClick={() => setTab('purchase')} icon={Plus}>{t(lang, 'tabPurchase')}</TabBtn>
          <TabBtn active={tab === 'generate'} onClick={() => setTab('generate')} icon={FileText}>{t(lang, 'tabGenerate')}</TabBtn>
          <TabBtn active={tab === 'ledger'} onClick={() => setTab('ledger')} icon={Receipt}>{t(lang, 'tabLedger')}</TabBtn>
          <TabBtn active={tab === 'nm'} onClick={() => setTab('nm')} icon={BookOpen}>{t(lang, 'tabNmLedger')}</TabBtn>
        </div>

        {/* ---- Purchase tab ---- */}
        {tab === 'purchase' && (
          <div className="grid lg:grid-cols-5 gap-5">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" /> {t(lang, 'newPurchase')}
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>{t(lang, 'date')}</label>
                    <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t(lang, 'fuelType')}</label>
                    <select value={fFuel} onChange={(e) => setFFuel(e.target.value)} className={inputCls}>
                      <option value="CNG">CNG</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Octane">Octane</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{t(lang, 'quantity')}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fQty}
                        onChange={(e) => setFQty(e.target.value)}
                        placeholder="0"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>{t(lang, 'unit')}</label>
                      <select value={fUnit} onChange={(e) => setFUnit(e.target.value)} className={inputCls}>
                        <option value={t(lang, 'unitLitre')}>{t(lang, 'unitLitre')}</option>
                        <option value={t(lang, 'unitKg')}>{t(lang, 'unitKg')}</option>
                        <option value={t(lang, 'unitCft')}>{t(lang, 'unitCft')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{t(lang, 'rate')}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fRate}
                        onChange={(e) => setFRate(e.target.value)}
                        placeholder="0.00"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>{t(lang, 'amount')}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fAmount}
                        onChange={(e) => setFAmount(e.target.value)}
                        placeholder="0.00"
                        className={inputCls + ' bg-emerald-50/50 font-semibold'}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 -mt-1">{t(lang, 'amountAuto')}</p>
                  <div>
                    <label className={labelCls}>{t(lang, 'receiptNo')}</label>
                    <Autocomplete id="f-receipt" value={fReceipt} onChange={setFReceipt}
                      suggestions={receiptSuggestions} className={inputCls} onEnter={addPurchase} />
                  </div>
                  <div>
                    <label className={labelCls}>{t(lang, 'vendor')}</label>
                    <Autocomplete id="f-vendor" value={fVendor} onChange={setFVendor}
                      suggestions={vendorSuggestions} className={inputCls} onEnter={addPurchase} />
                  </div>
                  <div>
                    <label className={labelCls}>{t(lang, 'remarks')}</label>
                    <Autocomplete id="f-remarks" value={fRemarks} onChange={setFRemarks}
                      suggestions={remarksSuggestions} placeholder={t(lang, 'remarksPh')}
                      className={inputCls} onEnter={addPurchase} />
                  </div>
                  <button
                    onClick={addPurchase}
                    disabled={savingPurchase}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> {t(lang, 'addEntry')}
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200">
                  <h2 className="font-bold text-slate-800">{t(lang, 'purchaseList')}</h2>
                </div>
                {purchases.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-slate-400">{t(lang, 'emptyPurchases')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs">
                          <th className="px-3 py-2 text-left font-medium">{t(lang, 'thDate')}</th>
                          <th className="px-3 py-2 text-left font-medium">{t(lang, 'thFuel')}</th>
                          <th className="px-3 py-2 text-right font-medium">{t(lang, 'thQty')}</th>
                          <th className="px-3 py-2 text-right font-medium">{t(lang, 'thMoney')}</th>
                          <th className="px-3 py-2 text-left font-medium">{t(lang, 'thReceipt')}</th>
                          <th className="px-3 py-2 text-left font-medium">{t(lang, 'thVendor')}</th>
                          <th className="px-3 py-2 text-center font-medium">{t(lang, 'thStatus')}</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {purchases.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3 py-2.5 whitespace-nowrap">{p.date}</td>
                            <td className="px-3 py-2.5 font-medium">{p.fuel_type}</td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap">{p.quantity} {p.unit}</td>
                            <td className="px-3 py-2.5 text-right font-semibold">{fmt(Number(p.amount))}</td>
                            <td className="px-3 py-2.5 text-slate-500">{p.receipt_no || '—'}</td>
                            <td className="px-3 py-2.5 text-slate-500">{p.vendor || '—'}</td>
                            <td className="px-3 py-2.5 text-center">
                              {p.bill_id ? (
                                <span className="inline-block px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-full">
                                  {t(lang, 'badgeBill')}
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 rounded-full">
                                  {t(lang, 'badgeUnbilled')}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap">
                              <button onClick={() => setEditPurchase(p)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                                <Pencil className="w-4 h-4" />
                              </button>
                              {!p.bill_id && (
                                <button onClick={() => deletePurchase(p.id)}
                                  className="p-1 ml-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- Generate bill tab ---- */}
        {tab === 'generate' && (
          <div className="grid lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> {t(lang, 'billDetails')}
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>{t(lang, 'billMode')}</label>
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg">
                      <button
                        onClick={() => changeBillMode('single')}
                        className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          billMode === 'single' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {t(lang, 'modeSingleStation')}
                      </button>
                      <button
                        onClick={() => changeBillMode('combined')}
                        className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          billMode === 'combined' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {t(lang, 'modeCombinedStations')}
                      </button>
                    </div>
                  </div>
                  {billMode === 'single' ? (
                    <div>
                      <label className={labelCls}>{t(lang, 'vendorFilter')}</label>
                      <select value={genVendor} onChange={(e) => changeGenVendor(e.target.value)} className={inputCls}>
                        {unbilledVendorList.length === 0 && <option value="">—</option>}
                        {unbilledVendorList.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">{t(lang, 'combinedHint')}</p>
                  )}
                  <div>
                    <label className={labelCls}>{t(lang, 'billNo')}</label>
                    <input disabled value={`NP-CNG-${String(meta?.bill_seq || 1).padStart(3, '0')}`}
                      className={inputCls + ' bg-slate-50 text-slate-500 font-mono'} />
                  </div>
                  <div>
                    <label className={labelCls}>{t(lang, 'billDate')}</label>
                    <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t(lang, 'preparer')}</label>
                    <input type="text" value={preparer} onChange={(e) => setPreparer(e.target.value)}
                      placeholder={t(lang, 'preparerPh')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t(lang, 'remarks')}</label>
                    <textarea value={billRemarks} onChange={(e) => setBillRemarks(e.target.value)}
                      placeholder={t(lang, 'billRemarksPh')} rows={2} className={inputCls + ' resize-none'} />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 rounded-lg">
                    <span className="text-sm text-slate-600">{t(lang, 'selectedTotal')}</span>
                    <span className="font-bold text-emerald-700">{fmt(selectedTotal)}</span>
                  </div>
                  <button onClick={generateBill} disabled={selectedIds.size === 0 || generating || (billMode === 'single' && !genVendor)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    <FileText className="w-4 h-4" /> {t(lang, 'generateBill')}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-800">{t(lang, 'selectUnbilled')}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{t(lang, 'selectUnbilledHint')}</p>
                  </div>
                  {activeUnbilledPurchases.length > 0 && (
                    <div className="flex gap-1.5">
                      <button onClick={selectAll} className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100">
                        {lang === 'bn' ? 'সব বাছাই' : 'Select all'}
                      </button>
                      <button onClick={clearAll} className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200">
                        {lang === 'bn' ? 'বাতিল' : 'Clear'}
                      </button>
                    </div>
                  )}
                </div>
                {unbilledPurchases.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-slate-400">{t(lang, 'emptyUnbilled')}</p>
                ) : billMode === 'single' && !genVendor ? (
                  <p className="px-5 py-10 text-center text-sm text-slate-400">{t(lang, 'pickVendorFirst')}</p>
                ) : activeUnbilledPurchases.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-slate-400">{t(lang, 'noVendorPurchases')}</p>
                ) : (
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0">
                        <tr className="bg-slate-50 text-slate-500 text-xs">
                          <th className="px-3 py-2 w-8"></th>
                          <th className="px-3 py-2 text-left font-medium">{t(lang, 'thDate')}</th>
                          {billMode === 'combined' && (
                            <th className="px-3 py-2 text-left font-medium">{t(lang, 'thVendorCol')}</th>
                          )}
                          <th className="px-3 py-2 text-left font-medium">{t(lang, 'thFuel')}</th>
                          <th className="px-3 py-2 text-right font-medium">{t(lang, 'thQty')}</th>
                          <th className="px-3 py-2 text-right font-medium">{t(lang, 'thMoney')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeUnbilledPurchases.map((p) => (
                          <tr key={p.id}
                            className={`cursor-pointer transition-colors ${selectedIds.has(p.id) ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                            onClick={() => toggleSelect(p.id)}>
                            <td className="px-3 py-2.5">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                selectedIds.has(p.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'
                              }`}>
                                {selectedIds.has(p.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">{p.date}</td>
                            {billMode === 'combined' && (
                              <td className="px-3 py-2.5 text-slate-500">{p.vendor || '—'}</td>
                            )}
                            <td className="px-3 py-2.5 font-medium">{p.fuel_type}</td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap">{p.quantity} {p.unit}</td>
                            <td className="px-3 py-2.5 text-right font-semibold">{fmt(Number(p.amount))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- Bill ledger tab ---- */}
        {tab === 'ledger' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" /> {t(lang, 'billLedger')}
              </h2>
            </div>
            {bills.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-400">{t(lang, 'emptyBills')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs">
                      <th className="px-3 py-2 text-left font-medium">{t(lang, 'thBillNo')}</th>
                      <th className="px-3 py-2 text-left font-medium">{t(lang, 'thVendorCol')}</th>
                      <th className="px-3 py-2 text-left font-medium">{t(lang, 'thDate')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t(lang, 'thTotal')}</th>
                      <th className="px-3 py-2 text-center font-medium">{t(lang, 'thStatus')}</th>
                      <th className="px-3 py-2 text-left font-medium">{t(lang, 'thPayDate')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t(lang, 'thPaidAmt')}</th>
                      <th className="px-3 py-2 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bills.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2.5 font-mono font-medium text-slate-700">{b.bill_no}</td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {b.vendor || '—'}
                          {b.vendor && b.vendor.includes(',') && (
                            <span className="ml-1.5 inline-block px-1.5 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 rounded-full align-middle">
                              {t(lang, 'combinedBadge')}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{b.date}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">{fmt(Number(b.total_amount))}</td>
                        <td className="px-3 py-2.5 text-center">
                          {b.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> {t(lang, 'badgePaid')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 rounded-full">
                              <Clock className="w-3 h-3" /> {t(lang, 'badgeSubmitted')}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{b.payment_date || '—'}</td>
                        <td className="px-3 py-2.5 text-right">{b.payment_amount != null ? fmt(Number(b.payment_amount)) : '—'}</td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <button onClick={() => setViewBill(b)}
                            className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors mr-1">
                            {t(lang, 'viewDetails')}
                          </button>
                          {b.status !== 'paid' && (
                            <button onClick={() => setPayTarget(b)}
                              className="px-2 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors">
                              {t(lang, 'recordPayment')}
                            </button>
                          )}
                          <button onClick={() => setEditBill(b)}
                            className="p-1 ml-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setConfirm({ kind: 'bill', id: b.id })}
                            className="p-1 ml-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---- NM Ledger tab ---- */}
        {tab === 'nm' && (
          <div className="grid lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> {t(lang, 'nmNewEntry')}
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>{t(lang, 'nmVendor')}</label>
                    <Autocomplete id="nm-vendor" value={nmVendor} onChange={setNmVendor}
                      suggestions={vendorSuggestions} className={inputCls} onEnter={addNmEntry} />
                  </div>
                  <div>
                    <label className={labelCls}>{t(lang, 'nmType')}</label>
                    <select value={nmType} onChange={(e) => setNmType(e.target.value as 'purchase' | 'payment')} className={inputCls}>
                      <option value="purchase">{t(lang, 'nmTypePurchase')}</option>
                      <option value="payment">{t(lang, 'nmTypePayment')}</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t(lang, 'nmDate')}</label>
                    <input type="date" value={nmDate} onChange={(e) => setNmDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t(lang, 'nmAmount')}</label>
                    <input type="text" inputMode="decimal" value={nmAmount}
                      onChange={(e) => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v)) setNmAmount(v); }}
                      placeholder="0.00" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t(lang, 'nmRef')}</label>
                    <input type="text" value={nmRef} onChange={(e) => setNmRef(e.target.value)}
                      placeholder={t(lang, 'nmRefPh')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t(lang, 'nmNote')}</label>
                    <input type="text" value={nmNote} onChange={(e) => setNmNote(e.target.value)}
                      placeholder={t(lang, 'nmNotePh')} className={inputCls} />
                  </div>
                  <button onClick={addNmEntry} disabled={nmSaving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    <Plus className="w-4 h-4" /> {t(lang, 'addEntry')}
                  </button>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{t(lang, 'nmHint')}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              {(ledgerVendorList.length > 0 || hasUnassignedLedger) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {ledgerVendorList.map((v) => {
                    const bal = vendorBalances.get(v) || 0;
                    const active = selectedLedgerVendor === v;
                    return (
                      <button key={v} onClick={() => setSelectedLedgerVendor(v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}>
                        {v} <span className={active ? 'text-emerald-100' : 'text-slate-400'}>· {fmt(bal)}</span>
                      </button>
                    );
                  })}
                  {hasUnassignedLedger && (
                    <button onClick={() => setSelectedLedgerVendor('__unassigned__')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedLedgerVendor === '__unassigned__' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}>
                      {t(lang, 'unassignedVendor')} <span className={selectedLedgerVendor === '__unassigned__' ? 'text-emerald-100' : 'text-slate-400'}>· {fmt(vendorBalances.get('__unassigned__') || 0)}</span>
                    </button>
                  )}
                </div>
              )}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-slate-800">
                        {t(lang, 'nmLedgerTitle')}
                        {selectedLedgerVendor && (
                          <span className="text-slate-400 font-normal">
                            {' — '}{selectedLedgerVendor === '__unassigned__' ? t(lang, 'unassignedVendor') : selectedLedgerVendor}
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">{t(lang, 'nmLedgerHint')}</p>
                    </div>
                    <button onClick={() => setShowStatement(true)} disabled={ledgerRows.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                      <Printer className="w-3.5 h-3.5" /> {t(lang, 'nmPrintPdf')}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-end gap-2 mt-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">{t(lang, 'nmStmtMonth')}</label>
                      <input type="month" value={nmStmtMonth} onChange={(e) => pickMonth(e.target.value)}
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">{t(lang, 'nmStmtFrom')}</label>
                      <input type="date" value={nmStmtFrom} onChange={(e) => { setNmStmtMonth(''); setNmStmtFrom(e.target.value); }}
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">{t(lang, 'nmStmtTo')}</label>
                      <input type="date" value={nmStmtTo} onChange={(e) => { setNmStmtMonth(''); setNmStmtTo(e.target.value); }}
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500" />
                    </div>
                    {(nmStmtMonth || nmStmtFrom || nmStmtTo) && (
                      <button onClick={clearStmtFilter}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                        {t(lang, 'nmStmtClear')}
                      </button>
                    )}
                  </div>
                </div>
                {ledgerRows.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-slate-400">{t(lang, 'emptyNm')}</p>
                ) : (
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0">
                        <tr className="bg-slate-50 text-slate-500 text-xs">
                          <th className="px-3 py-2 text-left font-medium">{t(lang, 'thDate')}</th>
                          <th className="px-3 py-2 text-left font-medium min-w-[240px]">{t(lang, 'thDesc')}</th>
                          <th className="px-3 py-2 text-left font-medium">{t(lang, 'thRef')}</th>
                          <th className="px-3 py-2 text-right font-medium">{t(lang, 'thPurchaseCol')}</th>
                          <th className="px-3 py-2 text-right font-medium">{t(lang, 'thPaymentCol')}</th>
                          <th className="px-3 py-2 text-right font-medium">{t(lang, 'thBalance')}</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ledgerRows.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3 py-2.5 whitespace-nowrap">{l.date}</td>
                            <td className="px-3 py-2.5">
                              <span className="flex items-center gap-1.5">
                                {l.auto && <span className="text-[10px] px-1 py-0.5 bg-slate-100 text-slate-500 rounded">{t(lang, 'autoTag')}</span>}
                                {l.note || (l.type === 'purchase' ? t(lang, 'nmDescPurchase') : t(lang, 'nmDescPayment'))}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-500">{l.ref || '—'}</td>
                            <td className="px-3 py-2.5 text-right text-emerald-700 font-medium">
                              {l.type === 'purchase' ? fmt(Number(l.amount)) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right text-blue-700 font-medium">
                              {l.type === 'payment' ? fmt(Number(l.amount)) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-slate-700">{fmt(l.balance)}</td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap">
                              <button onClick={() => setEditLedger(l)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => setConfirm({ kind: 'ledger', id: l.id })}
                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="px-5 py-3.5 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">{t(lang, 'nmOutstanding')}</span>
                  <span className={`font-bold ${outstanding > 0 ? 'text-emerald-700' : 'text-slate-700'}`}>{fmt(outstanding)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {payTarget && (
        <PayModal bill={payTarget} lang={lang} onClose={() => setPayTarget(null)} onConfirm={confirmPayment} />
      )}
      {viewBill && (
        <BillViewModal bill={viewBill} purchases={viewBillPurchases} lang={lang} onClose={() => setViewBill(null)} />
      )}
      {showStatement && (
        <LedgerStatementModal
          station={selectedLedgerVendor === '__unassigned__' ? t(lang, 'unassignedVendor') : selectedLedgerVendor || '—'}
          lang={lang}
          rows={statementRows}
          openingBalance={statementOpeningBalance}
          closingBalance={statementClosingBalance}
          periodLabel={statementPeriodLabel}
          onClose={() => setShowStatement(false)}
        />
      )}

      {/* Edit modals */}
      {editPurchase && <EditPurchaseModal data={editPurchase} lang={lang} onClose={() => setEditPurchase(null)} onSave={savePurchaseEdit} />}
      {editBill && <EditBillModal data={editBill} lang={lang} onClose={() => setEditBill(null)} onSave={saveBillEdit} />}
      {editLedger && <EditLedgerModal data={editLedger} lang={lang} onClose={() => setEditLedger(null)} onSave={saveLedgerEdit} />}

      {/* Confirm dialog for reset / delete */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800">
                  {confirm.kind === 'reset' ? t(lang, 'resetConfirmTitle')
                    : confirm.kind === 'bill' ? t(lang, 'deleteBill')
                    : t(lang, 'nmDeleteFromSourceHint')}
                </h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  {confirm.kind === 'reset' ? t(lang, 'resetConfirmBody')
                    : confirm.kind === 'bill' ? t(lang, 'deleteBillConfirm')
                    : t(lang, 'deleteLedgerConfirm')}
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                {t(lang, 'cancel')}
              </button>
              <button
                onClick={() => {
                  if (confirm.kind === 'reset') resetAll();
                  else if (confirm.kind === 'bill' && confirm.id) deleteBill(confirm.id);
                  else if (confirm.kind === 'ledger' && confirm.id) deleteNmEntry(confirm.id);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                {t(lang, 'delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Edit modals ----
function EditPurchaseModal({ data, lang, onClose, onSave }: {
  data: Purchase; lang: Lang; onClose: () => void; onSave: (p: Purchase) => void;
}) {
  const [f, setF] = useState<Purchase>(data);
  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500';
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">{t(lang, 'editPurchase')}</h3>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>{t(lang, 'date')}</label><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>{t(lang, 'fuelType')}</label>
            <select value={f.fuel_type} onChange={(e) => setF({ ...f, fuel_type: e.target.value })} className={inputCls}>
              <option value="CNG">CNG</option><option value="Petrol">Petrol</option><option value="Octane">Octane</option>
            </select>
          </div>
          <div><label className={labelCls}>{t(lang, 'quantity')}</label><input type="number" step="0.001" value={f.quantity} onChange={(e) => setF({ ...f, quantity: +e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>{t(lang, 'unit')}</label>
            <select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} className={inputCls}>
              <option value={t(lang, 'unitLitre')}>{t(lang, 'unitLitre')}</option>
              <option value={t(lang, 'unitKg')}>{t(lang, 'unitKg')}</option>
              <option value={t(lang, 'unitCft')}>{t(lang, 'unitCft')}</option>
            </select>
          </div>
          <div><label className={labelCls}>{t(lang, 'rate')}</label><input type="number" step="0.01" value={f.rate ?? ''} onChange={(e) => setF({ ...f, rate: e.target.value ? +e.target.value : null })} className={inputCls} /></div>
          <div><label className={labelCls}>{t(lang, 'amount')}</label><input type="number" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: +e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>{t(lang, 'receiptNo')}</label><input value={f.receipt_no ?? ''} onChange={(e) => setF({ ...f, receipt_no: e.target.value || null })} className={inputCls} /></div>
          <div><label className={labelCls}>{t(lang, 'vendor')}</label><input value={f.vendor ?? ''} onChange={(e) => setF({ ...f, vendor: e.target.value || null })} className={inputCls} /></div>
          <div className="col-span-2"><label className={labelCls}>{t(lang, 'remarks')}</label><input value={f.remarks ?? ''} onChange={(e) => setF({ ...f, remarks: e.target.value || null })} className={inputCls} /></div>
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">{t(lang, 'cancel')}</button>
          <button onClick={() => onSave(f)} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">{t(lang, 'save')}</button>
        </div>
      </div>
    </div>
  );
}

function EditBillModal({ data, lang, onClose, onSave }: {
  data: Bill; lang: Lang; onClose: () => void; onSave: (b: Bill) => void;
}) {
  const [f, setF] = useState<Bill>(data);
  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500';
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">{t(lang, 'editBill')} — {data.bill_no}</h3>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div><label className={labelCls}>{t(lang, 'date')}</label><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>{t(lang, 'nmVendor')}</label><input value={f.vendor ?? ''} onChange={(e) => setF({ ...f, vendor: e.target.value || null })} className={inputCls} /></div>
          <div><label className={labelCls}>{t(lang, 'preparer')}</label><input value={f.preparer ?? ''} onChange={(e) => setF({ ...f, preparer: e.target.value || null })} className={inputCls} /></div>
          <div><label className={labelCls}>{t(lang, 'remarks')}</label><input value={f.remarks ?? ''} onChange={(e) => setF({ ...f, remarks: e.target.value || null })} className={inputCls} /></div>
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">{t(lang, 'cancel')}</button>
          <button onClick={() => onSave(f)} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">{t(lang, 'save')}</button>
        </div>
      </div>
    </div>
  );
}

function EditLedgerModal({ data, lang, onClose, onSave }: {
  data: LedgerEntry; lang: Lang; onClose: () => void; onSave: (l: LedgerEntry) => void;
}) {
  const [f, setF] = useState<LedgerEntry>(data);
  const [amountStr, setAmountStr] = useState(String(data.amount ?? ''));
  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500';
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1';
  function handleSave() {
    const amt = parseFloat(amountStr);
    onSave({ ...f, amount: isNaN(amt) ? 0 : amt });
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">{t(lang, 'editLedger')}</h3>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>{t(lang, 'date')}</label><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={inputCls} /></div>
          <div>
            <label className={labelCls}>{t(lang, 'amount')}</label>
            <input type="text" inputMode="decimal" value={amountStr}
              onChange={(e) => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v)) setAmountStr(v); }}
              className={inputCls} />
          </div>
          <div className="col-span-2"><label className={labelCls}>{t(lang, 'thDesc')}</label><input value={f.note ?? ''} onChange={(e) => setF({ ...f, note: e.target.value || null })} className={inputCls} /></div>
          <div><label className={labelCls}>{t(lang, 'thRef')}</label><input value={f.ref ?? ''} onChange={(e) => setF({ ...f, ref: e.target.value || null })} className={inputCls} /></div>
          <div><label className={labelCls}>{t(lang, 'nmVendor')}</label><input value={f.vendor ?? ''} onChange={(e) => setF({ ...f, vendor: e.target.value || null })} className={inputCls} /></div>
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">{t(lang, 'cancel')}</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">{t(lang, 'save')}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Sub components ----
function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; color: 'emerald' | 'amber' | 'blue' | 'slate';
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 truncate">{label}</p>
        <p className="font-bold text-slate-800 text-sm sm:text-base truncate">{value}</p>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }: {
  active: boolean; onClick: () => void;
  icon: React.ComponentType<{ className?: string }>; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
        active ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
      }`}>
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}
