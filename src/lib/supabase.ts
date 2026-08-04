import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Purchase = {
  id: string;
  date: string;
  fuel_type: string;
  quantity: number;
  unit: string;
  rate: number | null;
  amount: number;
  receipt_no: string | null;
  vendor: string | null;
  remarks: string | null;
  bill_id: string | null;
  created_at: string;
};

export type Bill = {
  id: string;
  bill_no: string;
  date: string;
  total_amount: number;
  status: 'submitted' | 'paid';
  submitted_date: string | null;
  payment_date: string | null;
  payment_amount: number | null;
  preparer: string | null;
  remarks: string | null;
  created_at: string;
};

export type LedgerEntry = {
  id: string;
  type: 'purchase' | 'payment';
  date: string;
  amount: number;
  ref: string | null;
  note: string | null;
  source_purchase_id: string | null;
  source_bill_id: string | null;
  auto: boolean;
  created_at: string;
};

export type AppMeta = {
  id: number;
  bill_seq: number;
};
