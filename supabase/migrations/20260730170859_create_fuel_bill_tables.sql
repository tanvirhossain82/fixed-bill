/*
# Fuel Bill Manager — Create core tables

1. Overview
This migration sets up the database for the Nippon Paint fuel bill management app.
It is a single-tenant app with no sign-in screen, so all tables allow anon + authenticated
CRUD (the data is intentionally shared).

2. New Tables
- `purchases` — individual fuel purchase entries (CNG/Petrol/Octane).
  Columns: id, date, fuel_type, quantity, unit, rate, amount, receipt_no, vendor,
  remarks, bill_id (nullable FK to bills), created_at.
- `bills` — generated bills grouping one or more purchases, submitted to accounts.
  Columns: id, bill_no (unique), date, total_amount, status (submitted/paid),
  submitted_date, payment_date, payment_amount, preparer, remarks, created_at.
- `ledger_entries` — Nippon–Modhumoti account ledger rows. Each purchase auto-creates
  a 'purchase' row (increases payable); each bill payment auto-creates a 'payment' row
  (decreases payable). Manual entries are also supported for opening balances/adjustments.
  Columns: id, type, date, amount, ref, note, source_purchase_id (nullable FK),
  source_bill_id (nullable FK), auto, created_at.
- `app_meta` — single-row metadata table holding the bill number sequence counter.

3. Security
- RLS enabled on all tables.
- Policies allow anon + authenticated full CRUD (single-tenant, intentionally shared data).
- Four separate policies per table (select/insert/update/delete).

4. Notes
- bill_id on purchases is nullable (unbilled purchases have null).
- source_purchase_id / source_bill_id on ledger_entries are nullable and cascade on delete,
  so deleting a purchase or bill also cleans up its auto-generated ledger rows.
*/

CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no text UNIQUE NOT NULL,
  date date NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'submitted',
  submitted_date date,
  payment_date date,
  payment_amount numeric,
  preparer text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  fuel_type text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'লিটার',
  rate numeric,
  amount numeric NOT NULL DEFAULT 0,
  receipt_no text,
  vendor text,
  remarks text,
  bill_id uuid REFERENCES bills(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  ref text,
  note text,
  source_purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  source_bill_id uuid REFERENCES bills(id) ON DELETE CASCADE,
  auto boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_meta (
  id int PRIMARY KEY DEFAULT 1,
  bill_seq int NOT NULL DEFAULT 1,
  CONSTRAINT app_meta_single_row CHECK (id = 1)
);

INSERT INTO app_meta (id, bill_seq) VALUES (1, 1)
  ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchases_bill_id ON purchases(bill_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_date ON ledger_entries(date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_source_purchase ON ledger_entries(source_purchase_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_source_bill ON ledger_entries(source_bill_id);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_meta ENABLE ROW LEVEL SECURITY;

-- purchases policies
DROP POLICY IF EXISTS "purchases_select" ON purchases;
CREATE POLICY "purchases_select" ON purchases FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "purchases_insert" ON purchases;
CREATE POLICY "purchases_insert" ON purchases FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "purchases_update" ON purchases;
CREATE POLICY "purchases_update" ON purchases FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "purchases_delete" ON purchases;
CREATE POLICY "purchases_delete" ON purchases FOR DELETE
  TO anon, authenticated USING (true);

-- bills policies
DROP POLICY IF EXISTS "bills_select" ON bills;
CREATE POLICY "bills_select" ON bills FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "bills_insert" ON bills;
CREATE POLICY "bills_insert" ON bills FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "bills_update" ON bills;
CREATE POLICY "bills_update" ON bills FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "bills_delete" ON bills;
CREATE POLICY "bills_delete" ON bills FOR DELETE
  TO anon, authenticated USING (true);

-- ledger_entries policies
DROP POLICY IF EXISTS "ledger_select" ON ledger_entries;
CREATE POLICY "ledger_select" ON ledger_entries FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "ledger_insert" ON ledger_entries;
CREATE POLICY "ledger_insert" ON ledger_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "ledger_update" ON ledger_entries;
CREATE POLICY "ledger_update" ON ledger_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ledger_delete" ON ledger_entries;
CREATE POLICY "ledger_delete" ON ledger_entries FOR DELETE
  TO anon, authenticated USING (true);

-- app_meta policies
DROP POLICY IF EXISTS "app_meta_select" ON app_meta;
CREATE POLICY "app_meta_select" ON app_meta FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "app_meta_insert" ON app_meta;
CREATE POLICY "app_meta_insert" ON app_meta FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "app_meta_update" ON app_meta;
CREATE POLICY "app_meta_update" ON app_meta FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "app_meta_delete" ON app_meta;
CREATE POLICY "app_meta_delete" ON app_meta FOR DELETE
  TO anon, authenticated USING (true);
