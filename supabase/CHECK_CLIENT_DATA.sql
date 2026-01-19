-- Ver el usuario cliente recién creado para verificar qué datos tiene
SELECT 
  id,
  email,
  full_name,
  phone,
  id_number,
  country,
  province,
  department,
  city,
  barrio,
  is_professional
FROM public.users
WHERE email = 'maaates@gmail.com';

-- Ver el metadata en auth.users para ese usuario
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE email = 'maaates@gmail.com';
