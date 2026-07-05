-- ==========================================
-- AURYN SUPABASE INITIALIZATION DATABASE SCHEMA
-- ==========================================

-- CREATE TABLES

CREATE TABLE IF NOT EXISTS public.settings (
  id text PRIMARY KEY,
  restaurant_name text NOT NULL DEFAULT 'AURYN',
  logo_url text,
  primary_color text NOT NULL DEFAULT '#0A0A0A',
  accent_color text NOT NULL DEFAULT '#D4AF37',
  typography text NOT NULL DEFAULT 'Outfit',
  welcome_screen jsonb,
  splash_screen jsonb,
  background_music text NOT NULL DEFAULT 'classical_jazz',
  notification_sounds boolean NOT NULL DEFAULT true,
  receipt_layout text NOT NULL DEFAULT 'classic_luxury',
  qr_code_style text NOT NULL DEFAULT 'rounded_gold',
  business_hours text NOT NULL DEFAULT '11:00 AM - 11:00 PM',
  taxes numeric NOT NULL DEFAULT 5,
  gst numeric NOT NULL DEFAULT 18,
  currency text NOT NULL DEFAULT 'INR',
  language text NOT NULL DEFAULT 'English',
  dining_policies text NOT NULL DEFAULT 'Smart casual dress code.',
  payment_options text[] NOT NULL DEFAULT ARRAY['Razorpay', 'Cash'],
  ai_settings jsonb,
  restaurant_id text NOT NULL DEFAULT 'auryn-hq',
  branch_id text NOT NULL DEFAULT 'main-branch'
);

CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'runner',
  password_hash text,
  restaurant_id text NOT NULL DEFAULT 'auryn-hq',
  branch_id text NOT NULL DEFAULT 'main-branch'
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  category text NOT NULL,
  rating numeric NOT NULL DEFAULT 5,
  is_chef_recommendation boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  prep_time integer NOT NULL DEFAULT 10,
  calories integer NOT NULL DEFAULT 300,
  protein text NOT NULL DEFAULT '12g',
  allergens text[] NOT NULL DEFAULT '{}',
  ingredients text[] NOT NULL DEFAULT '{}',
  image text NOT NULL DEFAULT '/images/placeholder.jpg',
  restaurant_id text NOT NULL DEFAULT 'auryn-hq',
  branch_id text NOT NULL DEFAULT 'main-branch'
);

CREATE TABLE IF NOT EXISTS public.tables (
  id text PRIMARY KEY,
  name text NOT NULL,
  qr_code text NOT NULL,
  status text NOT NULL DEFAULT 'available',
  current_session_id text,
  restaurant_id text NOT NULL DEFAULT 'auryn-hq',
  branch_id text not null default 'main-branch'
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id text PRIMARY KEY,
  table_id text NOT NULL,
  owner_id text NOT NULL,
  guests jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'active',
  created_at text NOT NULL,
  closed_at text,
  orders text[] NOT NULL DEFAULT '{}',
  timeline jsonb NOT NULL DEFAULT '[]',
  payment_method text,
  restaurant_id text NOT NULL DEFAULT 'auryn-hq',
  branch_id text NOT NULL DEFAULT 'main-branch'
);

CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  session_id text NOT NULL,
  table_id text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'placed',
  created_at text NOT NULL,
  updated_at text NOT NULL,
  runner_id text,
  runner_route text[] NOT NULL DEFAULT '{}',
  estimated_completion text NOT NULL DEFAULT '10m',
  confidence_score numeric NOT NULL DEFAULT 90,
  kitchen_load numeric NOT NULL DEFAULT 50
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id text PRIMARY KEY,
  name text NOT NULL,
  stock numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  min_stock numeric NOT NULL DEFAULT 0,
  expiry_date text,
  restaurant_id text NOT NULL DEFAULT 'auryn-hq',
  branch_id text NOT NULL DEFAULT 'main-branch'
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id text PRIMARY KEY,
  timestamp text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  restaurant_id text NOT NULL DEFAULT 'auryn-hq',
  branch_id text NOT NULL DEFAULT 'main-branch'
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id text PRIMARY KEY,
  timestamp text NOT NULL,
  action text NOT NULL,
  details text NOT NULL,
  restaurant_id text NOT NULL DEFAULT 'auryn-hq',
  branch_id text NOT NULL DEFAULT 'main-branch'
);

CREATE TABLE IF NOT EXISTS public.receipts (
  id text PRIMARY KEY,
  restaurant_id text NOT NULL DEFAULT 'auryn-hq',
  branch_id text NOT NULL DEFAULT 'main-branch',
  receipt_number text NOT NULL,
  session_id text NOT NULL,
  table_id text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  payment_method text NOT NULL,
  amount_paid numeric NOT NULL,
  amount_received numeric,
  change_returned numeric,
  runner_name text,
  timestamp text NOT NULL,
  gst numeric NOT NULL,
  taxes numeric NOT NULL
);

-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- CREATE RLS PERMISSION POLICIES (MULTI-TENANT JWT ISOLATION)
-- Allows public select for menus/settings, but restricts modifications based on authenticated tenant claims.

CREATE POLICY "Settings Select Isolation" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Settings Write Isolation" ON public.settings FOR ALL USING (
  restaurant_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'restaurant_id', 'auryn-hq')
);

CREATE POLICY "Menu Items Select Isolation" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Menu Items Write Isolation" ON public.menu_items FOR ALL USING (
  restaurant_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'restaurant_id', 'auryn-hq')
);

CREATE POLICY "Tables Select Isolation" ON public.tables FOR SELECT USING (true);
CREATE POLICY "Tables Write Isolation" ON public.tables FOR ALL USING (
  restaurant_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'restaurant_id', 'auryn-hq')
);

CREATE POLICY "Sessions Isolation" ON public.sessions FOR ALL USING (
  restaurant_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'restaurant_id', 'auryn-hq')
);

CREATE POLICY "Orders Isolation" ON public.orders FOR ALL USING (true);

CREATE POLICY "Inventory Isolation" ON public.inventory FOR ALL USING (
  restaurant_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'restaurant_id', 'auryn-hq')
);

CREATE POLICY "Users Isolation" ON public.users FOR ALL USING (
  restaurant_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'restaurant_id', 'auryn-hq')
);

CREATE POLICY "Notifications Isolation" ON public.notifications FOR ALL USING (
  restaurant_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'restaurant_id', 'auryn-hq')
);

CREATE POLICY "Audit Logs Isolation" ON public.audit_logs FOR ALL USING (
  restaurant_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'restaurant_id', 'auryn-hq')
);

CREATE POLICY "Receipts Isolation" ON public.receipts FOR ALL USING (
  restaurant_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'restaurant_id', 'auryn-hq')
);

-- ENABLE SUPABASE REALTIME ON TELEMETRY TABLES
BEGIN;
  -- If publication exists, alter it to add our realtime tracking tables
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
COMMIT;
