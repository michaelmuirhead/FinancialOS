-- Seed a starter household. Replace the member insert with your real
-- auth.users id after your first sign-in:
--   insert into household_members (household_id, user_id, role)
--   values ('<household-id>', '<auth-user-id>', 'owner');

insert into households (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Our Household');

insert into categories (household_id, name, kind, monthly_target) values
  ('00000000-0000-0000-0000-000000000001', 'Housing', 'expense', 1650),
  ('00000000-0000-0000-0000-000000000001', 'Utilities', 'expense', 420),
  ('00000000-0000-0000-0000-000000000001', 'Groceries', 'expense', 750),
  ('00000000-0000-0000-0000-000000000001', 'Gas', 'expense', 300),
  ('00000000-0000-0000-0000-000000000001', 'Insurance', 'expense', 380),
  ('00000000-0000-0000-0000-000000000001', 'Medical', 'expense', 200),
  ('00000000-0000-0000-0000-000000000001', 'Children', 'expense', 250),
  ('00000000-0000-0000-0000-000000000001', 'Giving', 'expense', 560),
  ('00000000-0000-0000-0000-000000000001', 'Restaurants', 'expense', 250),
  ('00000000-0000-0000-0000-000000000001', 'Entertainment', 'expense', 120),
  ('00000000-0000-0000-0000-000000000001', 'Shopping', 'expense', 200),
  ('00000000-0000-0000-0000-000000000001', 'Subscriptions', 'expense', 85),
  ('00000000-0000-0000-0000-000000000001', 'Debt', 'expense', 650),
  ('00000000-0000-0000-0000-000000000001', 'Savings', 'expense', 500),
  ('00000000-0000-0000-0000-000000000001', 'Income', 'income', null);
