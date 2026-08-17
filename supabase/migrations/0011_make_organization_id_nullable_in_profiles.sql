-- Make organization_id nullable in profiles table
-- Users should only have organization_id after creating one or being added by admin

-- Step 1: Create new version of handle_new_user that doesn't assign organization
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, organization_id)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'seller',
    null  -- No organization until user creates one or admin assigns it
  );
  return new;
end; $$;

-- Step 2: Make organization_id nullable
alter table public.profiles
  alter column organization_id drop not null;

-- Step 3: Update existing profiles that are linked to the root org
-- Only if they don't have any proposals/data (new accounts)
-- Keep existing users' organization_id as is (don't change them)
