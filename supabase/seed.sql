insert into public.organizations (id, name, slug, active)
values (
  '10000000-0000-0000-0000-000000000001',
  'BLS Learning Demonstration Organisation',
  'bls-learning-demo',
  true
)
on conflict (id) do nothing;
