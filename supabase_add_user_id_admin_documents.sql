-- Migration to add user_id to admin_documents for session isolation
ALTER TABLE public.admin_documents 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- If you have existing data and want to assign it to a specific user temporarily, you can do it here before making it NOT NULL, or leave it nullable.
-- We recommend keeping it nullable for backward compatibility, or update existing rows before adding NOT NULL.

-- Note: Since the application uses a custom authentication system (user_profiles table) 
-- rather than Supabase's native auth.users, we cannot use auth.uid() in RLS policies.
-- The isolation is handled entirely by the frontend queries in Documents.jsx filtering by user_id.

-- We leave the table permissive so the frontend can query it with the user_id filter.
DROP POLICY IF EXISTS "Admins can manage documents" ON public.admin_documents;

CREATE POLICY "Allow all operations for custom auth" ON public.admin_documents
    FOR ALL
    USING (true)
    WITH CHECK (true);
