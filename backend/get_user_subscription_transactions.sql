-- Supabase SQL: función para obtener transacciones de suscripción de un usuario
-- Crea esta función en tu base de datos Supabase

create or replace function get_user_subscription_transactions(uid uuid)
returns table (
  id uuid,
  user_id uuid,
  amount numeric,
  currency text,
  status text,
  provider text,
  created_at timestamptz,
  description text
) as $$
begin
  return query
    select
      t.id,
      t.user_id,
      t.amount,
      t.currency,
      t.status,
      t.provider,
      t.created_at,
      t.description
    from subscription_transactions t
    where t.user_id = uid
    order by t.created_at desc;
end;
$$ language plpgsql security definer;
