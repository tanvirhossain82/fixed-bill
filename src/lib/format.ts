export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmt(n: number): string {
  return '৳ ' + Number(n || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function uid(): string {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

const BN_0_99 = [
  'শূন্য','এক','দুই','তিন','চার','পাঁচ','ছয়','সাত','আট','নয়','দশ',
  'এগারো','বারো','তেরো','চৌদ্দ','পনেরো','ষোলো','সতেরো','আঠারো','ঊনিশ','বিশ',
  'একুশ','বাইশ','তেইশ','চব্বিশ','পঁচিশ','ছাব্বিশ','সাতাশ','আটাশ','ঊনত্রিশ','ত্রিশ',
  'একত্রিশ','বত্রিশ','তেত্রিশ','চৌত্রিশ','পঁয়ত্রিশ','ছত্রিশ','সাঁইত্রিশ','আটত্রিশ','ঊনচল্লিশ','চল্লিশ',
  'একচল্লিশ','বিয়াল্লিশ','তেতাল্লিশ','চুয়াল্লিশ','পঁয়তাল্লিশ','ছেচল্লিশ','সাতচল্লিশ','আটচল্লিশ','ঊনপঞ্চাশ','পঞ্চাশ',
  'একান্ন','বায়ান্ন','তিপ্পান্ন','চুয়ান্ন','পঞ্চান্ন','ছাপ্পান্ন','সাতান্ন','আটান্ন','ঊনষাট','ষাট',
  'একষট্টি','বাষট্টি','তেষট্টি','চৌষট্টি','পঁয়ষট্টি','ছেষট্টি','সাতষট্টি','আটষট্টি','ঊনসত্তর','সত্তর',
  'একাত্তর','বাহাত্তর','তিয়াত্তর','চুয়াত্তর','পঁচাত্তর','ছিয়াত্তর','সাতাত্তর','আটাত্তর','ঊনআশি','আশি',
  'একাশি','বিরাশি','তিরাশি','চুরাশি','পঁচাশি','ছিয়াশি','সাতাশি','আটাশি','ঊননব্বই','নব্বই',
  'একানব্বই','বিরানব্বই','তিরানব্বই','চুরানব্বই','পঁচানব্বই','ছিয়ানব্বই','সাতানব্বই','আটানব্বই','নিরানব্বই',
];

function bnUnder100(n: number): string {
  return BN_0_99[n] || '';
}

function numberToBanglaWords(num: number): string {
  num = Math.floor(Math.abs(num));
  if (num === 0) return 'শূন্য';
  let n = num;
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const hazar = Math.floor(n / 1000); n %= 1000;
  const shoto = Math.floor(n / 100); n %= 100;
  const rest = n;
  const parts: string[] = [];
  if (crore) parts.push(bnUnder100(crore) + ' কোটি');
  if (lakh) parts.push(bnUnder100(lakh) + ' লক্ষ');
  if (hazar) parts.push(bnUnder100(hazar) + ' হাজার');
  if (shoto) parts.push(bnUnder100(shoto) + 'শত');
  if (rest) parts.push(bnUnder100(rest));
  return parts.join(' ');
}

export function amountInWordsBn(amount: number): string {
  amount = Math.round((amount || 0) * 100) / 100;
  const taka = Math.floor(amount + 1e-6);
  const poysha = Math.round((amount - taka) * 100);
  let text = numberToBanglaWords(taka) + ' টাকা';
  if (poysha > 0) text += ' ' + numberToBanglaWords(poysha) + ' পয়সা';
  text += ' মাত্র';
  return text;
}

const EN_ONES = [
  'zero','one','two','three','four','five','six','seven','eight','nine','ten',
  'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen',
];
const EN_TENS = ['', '', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];

function enUnder100(n: number): string {
  if (n < 20) return EN_ONES[n];
  const t = Math.floor(n / 10);
  const r = n % 10;
  return r ? `${EN_TENS[t]}-${EN_ONES[r]}` : EN_TENS[t];
}

function enThreeDigits(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(EN_ONES[h] + ' hundred');
  if (rest) parts.push(h ? 'and ' + enUnder100(rest) : enUnder100(rest));
  return parts.join(' ');
}

function numberToEnglishWords(num: number): string {
  num = Math.floor(Math.abs(num));
  if (num === 0) return 'zero';
  const scales = ['', 'thousand', 'million', 'billion'];
  const groups: number[] = [];
  let n = num;
  while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    const w = enThreeDigits(groups[i]);
    parts.push(i ? `${w} ${scales[i]}` : w);
  }
  return parts.join(' ');
}

export function amountInWordsEn(amount: number): string {
  amount = Math.round((amount || 0) * 100) / 100;
  const taka = Math.floor(amount + 1e-6);
  const poysha = Math.round((amount - taka) * 100);
  let text = numberToEnglishWords(taka) + ' taka';
  if (poysha > 0) text += ' ' + numberToEnglishWords(poysha) + ' poysha';
  text += ' only';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
