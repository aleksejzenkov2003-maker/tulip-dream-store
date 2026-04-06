
-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat sessions policies
CREATE POLICY "Anyone can create chat sessions" ON public.chat_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read own session by id" ON public.chat_sessions FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update chat sessions" ON public.chat_sessions FOR UPDATE TO public USING (true);
CREATE POLICY "Admins can delete chat sessions" ON public.chat_sessions FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- Chat messages policies
CREATE POLICY "Anyone can insert chat messages" ON public.chat_messages FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read chat messages" ON public.chat_messages FOR SELECT TO public USING (true);
CREATE POLICY "Admins can delete chat messages" ON public.chat_messages FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
