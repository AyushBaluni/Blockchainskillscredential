-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'institution', 'learner', 'verifier');

-- Create enum for certificate status
CREATE TYPE public.certificate_status AS ENUM ('issued', 'revoked', 'expired');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create institutions table
CREATE TABLE public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  ncvet_approved BOOLEAN DEFAULT true,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT UNIQUE NOT NULL,
  learner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  qualification_name TEXT NOT NULL,
  qualification_level TEXT NOT NULL,
  ncrf_level TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  status public.certificate_status NOT NULL DEFAULT 'issued',
  blockchain_hash TEXT UNIQUE NOT NULL,
  blockchain_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create blockchain_transactions table (ledger)
CREATE TABLE public.blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL,
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE CASCADE,
  previous_hash TEXT NOT NULL,
  current_hash TEXT UNIQUE NOT NULL,
  transaction_data JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create verification_logs table
CREATE TABLE public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE CASCADE,
  verifier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_result BOOLEAN NOT NULL,
  verification_details JSONB,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for institutions
CREATE POLICY "Everyone can view institutions"
  ON public.institutions FOR SELECT
  USING (true);

CREATE POLICY "Admins and institution admins can manage institutions"
  ON public.institutions FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    auth.uid() = admin_user_id
  );

-- RLS Policies for certificates
CREATE POLICY "Learners can view their own certificates"
  ON public.certificates FOR SELECT
  USING (auth.uid() = learner_id);

CREATE POLICY "Institutions can view their issued certificates"
  ON public.certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.institutions
      WHERE id = certificates.institution_id
      AND admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Verifiers and admins can view all certificates"
  ON public.certificates FOR SELECT
  USING (
    public.has_role(auth.uid(), 'verifier') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Institutions can issue certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'institution') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins and institutions can update certificates"
  ON public.certificates FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.institutions
      WHERE id = certificates.institution_id
      AND admin_user_id = auth.uid()
    )
  );

-- RLS Policies for blockchain_transactions
CREATE POLICY "Everyone can view blockchain transactions"
  ON public.blockchain_transactions FOR SELECT
  USING (true);

CREATE POLICY "System can insert transactions"
  ON public.blockchain_transactions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for verification_logs
CREATE POLICY "Verifiers can view all verification logs"
  ON public.verification_logs FOR SELECT
  USING (
    public.has_role(auth.uid(), 'verifier') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Learners can view their certificate verification logs"
  ON public.verification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.certificates
      WHERE id = verification_logs.certificate_id
      AND learner_id = auth.uid()
    )
  );

CREATE POLICY "Verifiers can log verifications"
  ON public.verification_logs FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'verifier') OR
    public.has_role(auth.uid(), 'admin')
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  
  -- Assign default learner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'learner');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_certificates_learner_id ON public.certificates(learner_id);
CREATE INDEX idx_certificates_institution_id ON public.certificates(institution_id);
CREATE INDEX idx_certificates_blockchain_hash ON public.certificates(blockchain_hash);
CREATE INDEX idx_blockchain_transactions_certificate_id ON public.blockchain_transactions(certificate_id);
CREATE INDEX idx_verification_logs_certificate_id ON public.verification_logs(certificate_id);