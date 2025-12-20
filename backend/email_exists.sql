-- Verifica si un email existe en auth.users
create or replace function public.email_exists(email_input text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from auth.users where email = email_input
  );
end;
$$;

-- Permitir acceso a todos (o solo a rol anon si prefieres)
alter function public.email_exists(text) owner to postgres;
grant execute on function public.email_exists(text) to anon, authenticated;
