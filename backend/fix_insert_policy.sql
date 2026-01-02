-- Fix RLS INSERT policy for users table
-- The issue: INSERT policy needs WITH CHECK clause that allows user to insert their own row

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Recreate with proper WITH CHECK
CREATE POLICY "Users can insert their own profile"
ON users
FOR INSERT
WITH CHECK (
  auth.uid() = id 
  OR auth.uid() = auth_uid
);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
