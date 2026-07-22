-- Phase 2 planning tools: paychecks with allocations, and monthly
-- net-worth snapshots. Same household-scoped RLS model as 0001.

create table paychecks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  member_name text not null,
  pay_date date not null,
  net_amount numeric(14, 2) not null,
  starting_balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table paycheck_allocations (
  id uuid primary key default gen_random_uuid(),
  paycheck_id uuid not null references paychecks(id) on delete cascade,
  household_id uuid not null references households(id),
  label text not null,
  amount numeric(14, 2) not null,
  kind text not null check (
    kind in ('bills', 'giving', 'groceries', 'gas', 'debt', 'savings', 'buffer', 'other')
  )
);

create table net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  month date not null,
  net_worth numeric(14, 2) not null,
  created_at timestamptz not null default now(),
  unique (household_id, month)
);

create index idx_paychecks_household_date on paychecks (household_id, pay_date);
create index idx_snapshots_household_month
  on net_worth_snapshots (household_id, month);

alter table paychecks enable row level security;
alter table paycheck_allocations enable row level security;
alter table net_worth_snapshots enable row level security;

create policy "Household members can view paychecks"
on paychecks for select using (is_household_member(household_id));
create policy "Household members can manage paychecks"
on paychecks for all using (is_household_member(household_id));

create policy "Household members can view paycheck allocations"
on paycheck_allocations for select using (is_household_member(household_id));
create policy "Household members can manage paycheck allocations"
on paycheck_allocations for all using (is_household_member(household_id));

create policy "Household members can view net worth snapshots"
on net_worth_snapshots for select using (is_household_member(household_id));
create policy "Household members can manage net worth snapshots"
on net_worth_snapshots for all using (is_household_member(household_id));
