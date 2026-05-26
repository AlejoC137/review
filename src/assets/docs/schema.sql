-- Create the admin_documents table
CREATE TABLE IF NOT EXISTS public.admin_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL, -- 'quote', 'invoice', etc.
  content text NOT NULL, -- The markdown content
  doc_date date DEFAULT CURRENT_DATE,
  project_id text,
  amount numeric(15, 2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Note: Policies will depend on your specific auth setup.
-- If you use the user_profiles table for roles:
ALTER TABLE public.admin_documents ENABLE ROW LEVEL SECURITY;

-- If you want a simple policy (adjust as needed for your app):
CREATE POLICY "Admins can manage documents" ON public.admin_documents
  FOR ALL
  USING (true) -- Temporarily permissive for setup, or use a proper check:
  WITH CHECK (true);
