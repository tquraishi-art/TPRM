-- ============================================================
-- TPRM Platform · Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- VENDORS
-- ============================================================
create table if not exists vendors (
  id            uuid primary key default uuid_generate_v4(),
  supplier_id   text unique,           -- Salesforce account ID
  name          text not null,
  name_clean    text,
  portfolio     text,                  -- Services / Technology
  family        text,                  -- RE / TECH / PROSERV etc.
  commodity     text,
  criticality   text,                  -- Critical / High / Medium / Low
  inherent_risk text,
  residual_risk text,
  diverse       text,                  -- Diverse / Not Diverse
  risk_rating   text,                  -- Low / Medium / High
  sourcing_lead text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- RISKS
-- ============================================================
create table if not exists risks (
  id            uuid primary key default uuid_generate_v4(),
  risk_id       text unique,
  title         text not null,
  description   text,
  vendor_id     uuid references vendors(id),
  category      text,                  -- Cybersecurity / Privacy / BC / Financial / Operational etc.
  inherent      text,                  -- Very High / High / Moderate / Low / Very Low
  residual      text,
  likelihood    int check (likelihood between 1 and 5),
  impact        int check (impact between 1 and 5),
  treatment     text,                  -- Accept / Mitigate / Transfer / Avoid
  status        text,                  -- Open / In Progress / Mitigated / Accepted / Closed
  owner         text,
  due_date      date,
  escalation    boolean default false,
  escalation_note text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- ISSUES
-- ============================================================
create table if not exists issues (
  id            uuid primary key default uuid_generate_v4(),
  issue_id      text unique,
  title         text not null,
  description   text,
  vendor_id     uuid references vendors(id),
  risk_id       uuid references risks(id),
  severity      text,
  status        text,
  owner         text,
  due_date      date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- SBR SCORES (Supplier Business Reviews)
-- ============================================================
create table if not exists sbr_scores (
  id              uuid primary key default uuid_generate_v4(),
  supplier_id     text,
  vendor_id       uuid references vendors(id),
  name            text not null,
  name_clean      text,
  fiscal_year     int,
  quarter         text,
  sbr_date        date,
  scorecard_type  text,
  sourcing_lead   text,
  portfolio       text,
  family          text,
  commodity       text,
  spend_prev_year bigint,
  spend_ytd       bigint,
  -- Top-level scores
  perf_score      numeric(4,2),
  sustainability  numeric(4,2),
  responsible_sbe numeric(4,2),
  vos_nps         numeric(4,2),
  -- Sub-dimension scores
  cost_value      numeric(4,2),
  timeliness      numeric(4,2),
  quality         numeric(4,2),
  partnership     numeric(4,2),
  innovation      numeric(4,2),
  risk_compliance numeric(4,2),
  sust_diversity  numeric(4,2),
  -- Classification
  diverse         text,
  risk_rating     text,
  created_at      timestamptz default now()
);

-- ============================================================
-- SUPPLIER COMPLIANCE ASSESSMENTS (SCA / PwC)
-- ============================================================
create table if not exists sca_assessments (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid references vendors(id),
  supplier_name   text not null,
  assessment_date date,
  auditor         text,
  overall_risk    text,               -- Very High / High / Moderate / Low
  compliant_tcs   int,
  total_tcs       int,
  notes           text,
  created_at      timestamptz default now()
);

create table if not exists sca_findings (
  id              uuid primary key default uuid_generate_v4(),
  assessment_id   uuid references sca_assessments(id),
  category        text,               -- Data Privacy / Immigration & Labor etc.
  compliant       int,
  total           int,
  risk_level      text,
  finding         text,
  created_at      timestamptz default now()
);

-- ============================================================
-- KRI MONITOR
-- ============================================================
create table if not exists kri_metrics (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  category        text,
  value           numeric,
  threshold_green numeric,
  threshold_amber numeric,
  threshold_red   numeric,
  status          text,               -- Green / Amber / Red
  trend           text,               -- Up / Down / Flat
  period          text,               -- e.g. 2026-Q2
  notes           text,
  created_at      timestamptz default now()
);

-- ============================================================
-- IRQ SCORES
-- ============================================================
create table if not exists irq_scores (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid references vendors(id),
  vendor_name     text not null,
  assessment_date date,
  assessor        text,
  -- Domain scores (0-100)
  tps_score       numeric(5,2),
  privacy_score   numeric(5,2),
  bc_score        numeric(5,2),
  financial_score numeric(5,2),
  -- Weighted composite (TPS 40%, Privacy 20%, BC 30%, Fin 10%)
  composite_score numeric(5,2),
  status          text,               -- Complete / In Progress / Overdue
  notes           text,
  created_at      timestamptz default now()
);

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table if not exists user_profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role      text default 'viewer',   -- admin / analyst / viewer
  team      text,
  created_at timestamptz default now()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
create table if not exists audit_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id),
  action      text not null,
  entity_type text,
  entity_id   text,
  detail      jsonb,
  created_at  timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table vendors         enable row level security;
alter table risks           enable row level security;
alter table issues          enable row level security;
alter table sbr_scores      enable row level security;
alter table sca_assessments enable row level security;
alter table sca_findings    enable row level security;
alter table kri_metrics     enable row level security;
alter table irq_scores      enable row level security;
alter table user_profiles   enable row level security;

-- Viewers can read everything; only admins/analysts can write
create policy "read_all" on vendors         for select using (true);
create policy "read_all" on risks           for select using (true);
create policy "read_all" on issues          for select using (true);
create policy "read_all" on sbr_scores      for select using (true);
create policy "read_all" on sca_assessments for select using (true);
create policy "read_all" on sca_findings    for select using (true);
create policy "read_all" on kri_metrics     for select using (true);
create policy "read_all" on irq_scores      for select using (true);

create policy "write_analyst" on risks  for all
  using (auth.jwt() ->> 'role' in ('admin','analyst'));
create policy "write_analyst" on issues for all
  using (auth.jwt() ->> 'role' in ('admin','analyst'));
create policy "write_admin" on vendors  for all
  using (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_risks_vendor    on risks(vendor_id);
create index if not exists idx_risks_residual  on risks(residual);
create index if not exists idx_risks_status    on risks(status);
create index if not exists idx_sbr_fy_qt       on sbr_scores(fiscal_year, quarter);
create index if not exists idx_sbr_supplier    on sbr_scores(supplier_id);
create index if not exists idx_irq_vendor      on irq_scores(vendor_id);
