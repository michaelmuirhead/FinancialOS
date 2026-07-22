-- HomeVault Financial OS — initial household schema
-- Every financial record belongs to a household; access is enforced with RLS.

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'USD',
  timezone text not null default 'America/Chicago',
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  monthly_target numeric(14, 2),
  created_at timestamptz not null default now()
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  name text not null,
  institution text,
  account_type text not null,
  last_four text,
  current_balance numeric(14, 2) not null default 0,
  available_balance numeric(14, 2),
  credit_limit numeric(14, 2),
  interest_rate numeric(7, 4),
  include_in_safe_to_spend boolean not null default false,
  include_in_net_worth boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  account_id uuid not null references accounts(id),
  transaction_date date not null,
  merchant text not null,
  description text,
  amount numeric(14, 2) not null,
  transaction_type text not null
    check (transaction_type in ('income', 'expense', 'transfer')),
  category_id uuid references categories(id),
  status text not null default 'posted'
    check (status in ('pending', 'posted', 'reconciled')),
  notes text,
  created_at timestamptz not null default now()
);

create table bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  name text not null,
  category_id uuid references categories(id),
  expected_amount numeric(14, 2) not null,
  due_day integer check (due_day between 1 and 31),
  frequency text not null,
  autopay boolean not null default false,
  payment_account_id uuid references accounts(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table bill_occurrences (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id),
  household_id uuid not null references households(id),
  due_date date not null,
  expected_amount numeric(14, 2) not null,
  actual_amount numeric(14, 2),
  status text not null default 'scheduled'
    check (
      status in (
        'scheduled',
        'due_soon',
        'paid',
        'overdue',
        'skipped'
      )
    ),
  paid_date date,
  transaction_id uuid references transactions(id)
);

create table debts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  account_id uuid references accounts(id),
  name text not null,
  debt_type text not null,
  original_balance numeric(14, 2),
  current_balance numeric(14, 2) not null,
  minimum_payment numeric(14, 2) not null,
  annual_interest_rate numeric(7, 4) not null,
  credit_limit numeric(14, 2),
  due_day integer,
  payoff_priority integer,
  created_at timestamptz not null default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  name text not null,
  goal_type text not null
    check (goal_type in ('savings', 'sinking_fund', 'emergency_fund')),
  target_amount numeric(14, 2) not null,
  current_amount numeric(14, 2) not null default 0,
  target_date date,
  monthly_contribution numeric(14, 2),
  created_at timestamptz not null default now()
);

create index idx_transactions_household_date
  on transactions (household_id, transaction_date desc);
create index idx_bill_occurrences_household_due
  on bill_occurrences (household_id, due_date);
create index idx_accounts_household on accounts (household_id);
create index idx_debts_household on debts (household_id);
create index idx_goals_household on goals (household_id);

-- ---------- Row Level Security ----------

alter table households enable row level security;
alter table household_members enable row level security;
alter table categories enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table bills enable row level security;
alter table bill_occurrences enable row level security;
alter table debts enable row level security;
alter table goals enable row level security;

create or replace function is_household_member(target_household uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from household_members
    where household_members.household_id = target_household
      and household_members.user_id = auth.uid()
  );
$$;

create policy "Members can view their household"
on households for select
using (is_household_member(id));

create policy "Members can view membership"
on household_members for select
using (user_id = auth.uid() or is_household_member(household_id));

create policy "Household members can view categories"
on categories for select using (is_household_member(household_id));
create policy "Household members can manage categories"
on categories for all using (is_household_member(household_id));

create policy "Household members can view accounts"
on accounts for select using (is_household_member(household_id));
create policy "Household members can manage accounts"
on accounts for all using (is_household_member(household_id));

create policy "Household members can view transactions"
on transactions for select using (is_household_member(household_id));
create policy "Household members can manage transactions"
on transactions for all using (is_household_member(household_id));

create policy "Household members can view bills"
on bills for select using (is_household_member(household_id));
create policy "Household members can manage bills"
on bills for all using (is_household_member(household_id));

create policy "Household members can view bill occurrences"
on bill_occurrences for select using (is_household_member(household_id));
create policy "Household members can manage bill occurrences"
on bill_occurrences for all using (is_household_member(household_id));

create policy "Household members can view debts"
on debts for select using (is_household_member(household_id));
create policy "Household members can manage debts"
on debts for all using (is_household_member(household_id));

create policy "Household members can view goals"
on goals for select using (is_household_member(household_id));
create policy "Household members can manage goals"
on goals for all using (is_household_member(household_id));
