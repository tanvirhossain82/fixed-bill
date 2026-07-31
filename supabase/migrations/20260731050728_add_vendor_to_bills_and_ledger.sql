/*
# Add filling-station (vendor) separation to bills and ledger entries

1. Overview
Purchases already have a `vendor` (filling station) field. This migration extends that
separation to bills and ledger entries, so each bill belongs to one filling station, and
the Nippon–Modhumoti-style account ledger can be filtered/split per filling station.

2. Changes
- `bills.vendor` (text, nullable) — the filling station this bill's purchases were bought from.
- `ledger_entries.vendor` (text, nullable) — which filling station's account this entry affects.
  Auto-created 'purchase' entries copy the vendor from their source purchase; auto-created
  'payment' entries copy the vendor from their source bill; manual entries let the user pick one.
- Backfills `ledger_entries.vendor` for existing rows from their linked purchase, where possible.

3. Notes
- Both columns are nullable so existing data keeps working; unset rows show as "Unassigned"
  in the UI until edited.
*/

ALTER TABLE bills ADD COLUMN IF NOT EXISTS vendor text;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS vendor text;

CREATE INDEX IF NOT EXISTS idx_bills_vendor ON bills(vendor);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_vendor ON ledger_entries(vendor);

-- Backfill ledger vendor from the source purchase's vendor, where known
UPDATE ledger_entries le
SET vendor = p.vendor
FROM purchases p
WHERE le.source_purchase_id = p.id
  AND le.vendor IS NULL
  AND p.vendor IS NOT NULL;
