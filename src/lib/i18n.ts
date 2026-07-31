export type Lang = 'bn' | 'en';

export const STRINGS = {
  // Header
  eyebrow: { bn: 'Nippon Paint (Bangladesh) Private Limited', en: 'Nippon Paint (Bangladesh) Private Limited' },
  title: { bn: 'জ্বালানি ক্রয় ও বিল ব্যবস্থাপনা', en: 'Fuel Purchase & Bill Management' },
  subtitle: {
    bn: 'গাড়ি: Hi-Ace  •  জ্বালানি সরবরাহকারী: মধুমতি সিএনজি পাম্প (Modhumoti CNG Pump)  •  CNG ও Petrol',
    en: 'Vehicle: Hi-Ace  •  Supplier: Modhumoti CNG Pump  •  CNG & Petrol',
  },
  gPurchase: { bn: 'মোট ক্রয় (সর্বমোট)', en: 'Total Purchase (All-time)' },
  gUnbilled: { bn: 'বিল অপেক্ষমাণ (আনবিলড)', en: 'Unbilled (Pending)' },
  gDue: { bn: 'জমা দেওয়া বিল (পেমেন্ট বাকি)', en: 'Submitted (Payment Due)' },
  gPaid: { bn: 'পরিশোধিত মোট', en: 'Total Paid' },

  // Tabs
  tabPurchase: { bn: '১. ক্রয় এন্ট্রি', en: '1. Purchase Entry' },
  tabGenerate: { bn: '২. বিল তৈরি', en: '2. Generate Bill' },
  tabLedger: { bn: '৩. বিল লেজার', en: '3. Bill Ledger' },
  tabNmLedger: { bn: '৪. স্টেশন হিসাব লেজার', en: '4. Station Account Ledger' },

  // Purchase form
  newPurchase: { bn: 'নতুন জ্বালানি ক্রয় এন্ট্রি', en: 'New Fuel Purchase Entry' },
  date: { bn: 'তারিখ', en: 'Date' },
  fuelType: { bn: 'জ্বালানির ধরণ', en: 'Fuel Type' },
  quantity: { bn: 'পরিমাণ', en: 'Quantity' },
  unit: { bn: 'একক', en: 'Unit' },
  rate: { bn: 'রেট / একক (৳)', en: 'Rate / Unit (৳)' },
  amount: { bn: 'মোট টাকা (৳)', en: 'Total Amount (৳)' },
  amountAuto: { bn: 'স্বয়ংক্রিয় হিসাব হবে', en: 'Auto-calculated' },
  receiptNo: { bn: 'রশিদ নং', en: 'Receipt No.' },
  vendor: { bn: 'পাম্প / বিক্রেতা', en: 'Pump / Vendor' },
  remarks: { bn: 'মন্তব্য (ঐচ্ছিক)', en: 'Remarks (optional)' },
  remarksPh: { bn: 'যেমনঃ ঢাকা-খুলনা ট্রিপ', en: 'e.g. Dhaka-Khulna trip' },
  addEntry: { bn: 'এন্ট্রি যোগ করুন', en: 'Add Entry' },

  // Purchase list
  purchaseList: { bn: 'ক্রয়ের তালিকা', en: 'Purchase List' },
  thDate: { bn: 'তারিখ', en: 'Date' },
  thFuel: { bn: 'জ্বালানি', en: 'Fuel' },
  thQty: { bn: 'পরিমাণ', en: 'Qty' },
  thRate: { bn: 'রেট', en: 'Rate' },
  thMoney: { bn: 'টাকা', en: 'Amount' },
  thReceipt: { bn: 'রশিদ নং', en: 'Receipt' },
  thVendor: { bn: 'বিক্রেতা', en: 'Vendor' },
  thStatus: { bn: 'অবস্থা', en: 'Status' },
  thAction: { bn: '', en: '' },
  emptyPurchases: {
    bn: 'এখনো কোনো ক্রয় এন্ট্রি যোগ করা হয়নি। উপরের ফর্ম থেকে শুরু করুন।',
    en: 'No purchase entries yet. Start with the form above.',
  },
  delete: { bn: 'মুছুন', en: 'Delete' },
  badgeUnbilled: { bn: 'আনবিলড', en: 'Unbilled' },
  badgeBill: { bn: 'বিল', en: 'Bill' },

  // Generate bill
  billDetails: { bn: 'বিল তৈরির বিবরণ', en: 'Bill Details' },
  billNo: { bn: 'বিল নং', en: 'Bill No.' },
  billDate: { bn: 'বিলের তারিখ', en: 'Bill Date' },
  preparer: { bn: 'প্রস্তুতকারী (নাম)', en: 'Prepared by (Name)' },
  preparerPh: { bn: 'যেমনঃ রফিক', en: 'e.g. Rafiq' },
  billRemarksPh: { bn: 'Accounts Section এর জন্য নোট', en: 'Note for Accounts Section' },
  selectUnbilled: { bn: 'আনবিলড ক্রয় বাছাই করুন', en: 'Select Unbilled Purchases' },
  selectUnbilledHint: {
    bn: 'যেসব ক্রয় এন্ট্রি এখনো কোনো বিলে অন্তর্ভুক্ত হয়নি, শুধু সেগুলো এখানে দেখা যাবে।',
    en: 'Only purchases not yet included in any bill are shown here.',
  },
  selectedTotal: { bn: 'নির্বাচিত মোট', en: 'Selected Total' },
  generateBill: { bn: 'বিল তৈরি করুন', en: 'Generate Bill' },
  emptyUnbilled: {
    bn: 'সব ক্রয় এন্ট্রি ইতিমধ্যে বিল করা হয়েছে। নতুন ক্রয় এন্ট্রি যোগ করুন।',
    en: 'All purchases have already been billed. Add new purchase entries.',
  },

  // Ledger
  billLedger: { bn: 'বিল লেজার — জমা ও পেমেন্ট হিসাব', en: 'Bill Ledger — Submission & Payment' },
  thBillNo: { bn: 'বিল নং', en: 'Bill No.' },
  thTotal: { bn: 'মোট টাকা', en: 'Total Amount' },
  thPayDate: { bn: 'পেমেন্ট তারিখ', en: 'Payment Date' },
  thPaidAmt: { bn: 'পরিশোধিত টাকা', en: 'Paid Amount' },
  badgeSubmitted: { bn: 'জমা দেওয়া হয়েছে', en: 'Submitted' },
  badgePaid: { bn: 'পরিশোধিত', en: 'Paid' },
  viewDetails: { bn: 'বিস্তারিত', en: 'Details' },
  recordPayment: { bn: 'পেমেন্ট নথিভুক্ত', en: 'Record Payment' },
  emptyBills: {
    bn: 'এখনো কোনো বিল তৈরি হয়নি। "বিল তৈরি" ট্যাব থেকে শুরু করুন।',
    en: 'No bills created yet. Start from the "Generate Bill" tab.',
  },

  // Pay modal
  payTitle: { bn: 'পেমেন্ট পাওয়ার তথ্য', en: 'Payment Information' },
  payDate: { bn: 'পেমেন্ট পাওয়ার তারিখ', en: 'Payment Date' },
  payAmount: { bn: 'পরিশোধিত টাকা (৳)', en: 'Paid Amount (৳)' },
  cancel: { bn: 'বাতিল', en: 'Cancel' },
  confirm: { bn: 'নিশ্চিত করুন', en: 'Confirm' },

  // View modal
  billViewTitle: { bn: 'বিলের বিবরণ', en: 'Bill Details' },
  close: { bn: 'বন্ধ করুন', en: 'Close' },
  print: { bn: 'প্রিন্ট করুন', en: 'Print' },
  billSubject: { bn: 'প্রাপক: Accounts Section  |  বিষয়: Hi-Ace গাড়ির CNG/Petrol বিল জমা', en: 'To: Accounts Section  |  Subject: Hi-Ace CNG/Petrol bill submission' },
  billVehicle: { bn: 'গাড়ি', en: 'Vehicle' },
  billSupplier: { bn: 'সরবরাহকারী', en: 'Supplier' },
  billPreparedBy: { bn: 'প্রস্তুতকারী', en: 'Prepared by' },
  billStatus: { bn: 'অবস্থা', en: 'Status' },
  billTotal: { bn: 'সর্বমোট', en: 'Grand Total' },
  amountInWords: { bn: 'টাকার অংক কথায়', en: 'Amount in words' },
  billRemarks: { bn: 'মন্তব্য', en: 'Remarks' },
  billPayDate: { bn: 'পেমেন্ট তারিখ', en: 'Payment Date' },
  billPaidAmt: { bn: 'পরিশোধিত টাকা', en: 'Paid Amount' },
  signPreparer: { bn: 'প্রস্তুতকারীর স্বাক্ষর', en: 'Prepared by' },
  signAccounts: { bn: 'Accounts Section অনুমোদন', en: 'Accounts Section Approval' },

  // Vendor / filling-station separation
  vendorFilter: { bn: 'ফিলিং স্টেশন', en: 'Filling Station' },
  allVendors: { bn: 'সব স্টেশন', en: 'All Stations' },
  unassignedVendor: { bn: 'অনির্ধারিত', en: 'Unassigned' },
  pickVendorFirst: {
    bn: 'প্রথমে একটি ফিলিং স্টেশন বাছাই করুন — শুধু সেই স্টেশনের আনবিলড ক্রয়গুলো এখানে দেখা যাবে।',
    en: 'Select a filling station first — only that station\u2019s unbilled purchases will show here.',
  },
  noVendorPurchases: {
    bn: 'এই স্টেশনের কোনো আনবিলড ক্রয় নেই।',
    en: 'No unbilled purchases for this station.',
  },
  thVendorCol: { bn: 'স্টেশন', en: 'Station' },
  nmVendor: { bn: 'ফিলিং স্টেশন', en: 'Filling Station' },
  vendorOutstanding: { bn: 'পাওনা', en: 'Payable' },

  // NM Ledger
  nmNewEntry: { bn: 'নতুন হিসাব এন্ট্রি (ক্রয় / পেমেন্ট)', en: 'New Account Entry (Purchase / Payment)' },
  nmType: { bn: 'ধরণ', en: 'Type' },
  nmTypePurchase: { bn: 'ক্রয় (স্টেশন থেকে — পাওনা বাড়বে)', en: 'Purchase (from station — increases payable)' },
  nmTypePayment: { bn: 'পেমেন্ট (স্টেশনকে — পাওনা কমবে)', en: 'Payment (to station — decreases payable)' },
  nmDate: { bn: 'তারিখ', en: 'Date' },
  nmAmount: { bn: 'টাকা (৳)', en: 'Amount (৳)' },
  nmRef: { bn: 'রেফারেন্স / বিল নং (ঐচ্ছিক)', en: 'Reference / Bill No. (optional)' },
  nmRefPh: { bn: 'যেমনঃ NP-CNG-003', en: 'e.g. NP-CNG-003' },
  nmNote: { bn: 'বিবরণ (ঐচ্ছিক)', en: 'Description (optional)' },
  nmNotePh: { bn: 'যেমনঃ নগদ পেমেন্ট / চেক নং', en: 'e.g. Cash payment / Cheque no.' },
  nmHint: {
    bn: 'দ্রষ্টব্য: "১. ক্রয় এন্ট্রি" ট্যাবে ক্রয় যোগ করলে তা এখানে স্বয়ংক্রিয়ভাবে যোগ হয়ে যায়, এবং কোনো বিলের পেমেন্ট নথিভুক্ত করলে পাওনা স্বয়ংক্রিয়ভাবে কমে যায়। এই ফর্মটি শুধু ম্যানুয়াল সমন্বয় বা আগের বকেয়া (opening balance) যোগ করার জন্য ব্যবহার করুন।',
    en: 'Note: Adding a purchase in the "Purchase Entry" tab automatically adds it here, and recording a bill payment automatically reduces the payable. Use this form only for manual adjustments or opening balances.',
  },
  nmLedgerTitle: { bn: 'Nippon Paint — স্টেশন হিসাব', en: 'Nippon Paint — Station Account' },
  nmLedgerHint: {
    bn: 'প্রতিটি এন্ট্রি সংরক্ষিত হয় এবং পাতা রিলোড করলেও থেকে যাবে। প্রতিটি ফিলিং স্টেশনের হিসাব আলাদাভাবে দেখানো হয় — উপরে স্টেশন বাছাই করুন। জমা (ক্রয়) কলামে যা স্টেশনকে দিতে হবে তা যোগ হয়, পরিশোধ কলামে যা দেওয়া হয়েছে তা বিয়োগ হয়। "অটো" চিহ্নিত এন্ট্রি ক্রয় এন্ট্রি বা বিল পেমেন্ট থেকে স্বয়ংক্রিয়ভাবে তৈরি হয়েছে।',
    en: 'Each entry is saved and persists across page reloads. Each filling station\u2019s account is shown separately — pick a station above. The Purchase column adds what is owed to that station; the Payment column subtracts what has been paid. Entries marked "Auto" are generated automatically from purchase entries or bill payments.',
  },
  thDesc: { bn: 'বিবরণ', en: 'Description' },
  thRef: { bn: 'রেফারেন্স', en: 'Reference' },
  thPurchaseCol: { bn: 'ক্রয় (জমা)', en: 'Purchase (Dr)' },
  thPaymentCol: { bn: 'পেমেন্ট (পরিশোধ)', en: 'Payment (Cr)' },
  thBalance: { bn: 'চলতি ব্যালেন্স', en: 'Running Balance' },
  nmDescPurchase: { bn: 'ক্রয় — স্টেশন থেকে জ্বালানি', en: 'Purchase — fuel from station' },
  nmDescPayment: { bn: 'পেমেন্ট — স্টেশনকে প্রদান', en: 'Payment — paid to station' },
  autoTag: { bn: 'অটো', en: 'Auto' },
  emptyNm: {
    bn: 'এই স্টেশনের জন্য এখনো কোনো হিসাব এন্ট্রি যোগ করা হয়নি।',
    en: 'No ledger entries yet for this station.',
  },
  nmOutstanding: { bn: 'বর্তমান পাওনা (Outstanding Balance)', en: 'Outstanding Balance' },
  nmDeleteFromSource: { bn: 'ক্রয় ট্যাব', en: 'Purchase tab' },
  nmDeleteFromBill: { bn: 'বিল লেজার', en: 'Bill ledger' },
  nmDeleteFromSourceHint: { bn: 'থেকে মুছুন', en: '— delete from source' },

  // Reset + per-entry delete
  resetAll: { bn: 'সব মুছে ফেলুন', en: 'Reset All' },
  resetConfirmTitle: { bn: 'সব এন্ট্রি মুছে ফেলবেন?', en: 'Delete all entries?' },
  resetConfirmBody: {
    bn: 'এতে সব ক্রয়, বিল ও হিসাব লেজার এন্ট্রি স্থায়ীভাবে মুছে যাবে এবং বিল নম্বর আবার ১ থেকে শুরু হবে। এটি ফেরানো যাবে না।',
    en: 'This permanently deletes all purchases, bills and ledger entries, and resets the bill number to 1. This cannot be undone.',
  },
  deleteBill: { bn: 'বিল মুছুন', en: 'Delete Bill' },
  deleteBillConfirm: {
    bn: 'এই বিলটি মুছলে এর অধীন ক্রয়গুলো আবার আনবিলড হয়ে যাবে। নিশ্চিত?',
    en: 'Deleting this bill returns its purchases to unbilled. Confirm?',
  },
  deleteLedgerConfirm: {
    bn: 'এই হিসাব এন্ট্রিটি মুছে ফেলবেন? এটি ফেরানো যাবে না।',
    en: 'Delete this ledger entry? This cannot be undone.',
  },
  toastResetDone: { bn: 'সব এন্ট্রি মুছে ফেলা হয়েছে।', en: 'All entries have been deleted.' },
  toastBillDeleted: { bn: 'বিল মুছে ফেলা হয়েছে।', en: 'Bill deleted.' },
  toastLedgerDeleted: { bn: 'হিসাব এন্ট্রি মুছে ফেলা হয়েছে।', en: 'Ledger entry deleted.' },

  // Toasts
  toastSaved: { bn: 'সংরক্ষণে সমস্যা হয়েছে, আবার চেষ্টা করুন।', en: 'Save failed, please try again.' },
  toastPurchaseAdded: {
    bn: 'ক্রয় এন্ট্রি যোগ হয়েছে এবং হিসাব লেজারে পাওনা যোগ হয়েছে।',
    en: 'Purchase added and payable recorded in the account ledger.',
  },
  toastInvalidAmt: { bn: 'অনুগ্রহ করে সঠিক পরিমাণ ও রেট/টাকা দিন।', en: 'Please enter a valid quantity and rate/amount.' },
  toastBillCreated: {
    bn: 'বিল তৈরি হয়েছে — এখন Accounts Section-এ জমা দেওয়ার জন্য প্রস্তুত।',
    en: 'Bill created — ready to submit to the Accounts Section.',
  },
  toastPaymentRecorded: {
    bn: 'বিলের পেমেন্ট নথিভুক্ত হয়েছে এবং হিসাব লেজারে পাওনা কমানো হয়েছে।',
    en: 'Payment recorded and payable reduced in the account ledger.',
  },
  toastNmPurchase: { bn: 'ক্রয় এন্ট্রি হিসাব লেজারে যোগ হয়েছে।', en: 'Purchase entry added to account ledger.' },
  toastNmPayment: { bn: 'পেমেন্ট এন্ট্রি হিসাব লেজারে যোগ হয়েছে।', en: 'Payment entry added to account ledger.' },
  toastInvalidNm: { bn: 'অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন।', en: 'Please enter a valid amount.' },

  // Units & fuel
  unitLitre: { bn: 'লিটার', en: 'Litre' },
  unitKg: { bn: 'কেজি', en: 'Kg' },
  unitCft: { bn: 'CFT (কিউবিক ফুট)', en: 'CFT (Cubic Feet)' },

  // Edit entries
  edit: { bn: 'সম্পাদনা', en: 'Edit' },
  editPurchase: { bn: 'ক্রয় এন্ট্রি সম্পাদনা', en: 'Edit Purchase Entry' },
  editBill: { bn: 'বিল সম্পাদনা', en: 'Edit Bill' },
  editLedger: { bn: 'হিসাব এন্ট্রি সম্পাদনা', en: 'Edit Ledger Entry' },
  save: { bn: 'সংরক্ষণ করুন', en: 'Save' },
  toastPurchaseUpdated: { bn: 'ক্রয় এন্ট্রি আপডেট হয়েছে।', en: 'Purchase entry updated.' },
  toastBillUpdated: { bn: 'বিল আপডেট হয়েছে।', en: 'Bill updated.' },
  toastLedgerUpdated: { bn: 'হিসাব এন্ট্রি আপডেট হয়েছে।', en: 'Ledger entry updated.' },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[key][lang];
}
