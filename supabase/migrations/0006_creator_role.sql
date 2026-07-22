-- ============================================================
-- Anima Pulse — 'creator' role (Konten Kreator)
-- Narrower than staff: can submit content and view the Content
-- Pillar guide, but has no access to the Content Plan Tracker.
-- Postgres requires ADD VALUE to run outside a transaction block —
-- run this statement alone if your SQL client wraps queries in one.
-- ============================================================
alter type user_role add value if not exists 'creator';
