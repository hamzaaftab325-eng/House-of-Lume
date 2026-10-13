-- Update active brand descriptions without changing role permissions or collection identities.
update public.roles
set description = 'Full DWELLUNE operational access. Launch is limited to one active Super Admin.'
where slug = 'super_admin';

update public.collections
set description = 'The newest objects added to DWELLUNE.'
where slug = 'new-arrivals';
