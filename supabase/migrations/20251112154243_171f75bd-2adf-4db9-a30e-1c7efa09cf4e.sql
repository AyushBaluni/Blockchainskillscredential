-- Create a secure public verification function that returns limited, non-sensitive fields
CREATE OR REPLACE FUNCTION public.verify_certificate_public(cert_number text)
RETURNS TABLE (
  certificate_number text,
  qualification_name text,
  qualification_level text,
  ncrf_level text,
  issue_date date,
  expiry_date date,
  blockchain_hash text,
  blockchain_timestamp timestamptz,
  institution_name text,
  institution_registration_number text,
  institution_ncvet_approved boolean,
  learner_full_name text,
  status public.certificate_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.certificate_number,
    c.qualification_name,
    c.qualification_level,
    c.ncrf_level,
    c.issue_date,
    c.expiry_date,
    c.blockchain_hash,
    c.blockchain_timestamp,
    i.name AS institution_name,
    i.registration_number AS institution_registration_number,
    COALESCE(i.ncvet_approved, true) AS institution_ncvet_approved,
    p.full_name AS learner_full_name,
    c.status
  FROM public.certificates c
  JOIN public.institutions i ON i.id = c.institution_id
  JOIN public.profiles p ON p.id = c.learner_id
  WHERE c.certificate_number = cert_number
$$;

-- Restrict and then grant execute permissions explicitly
REVOKE ALL ON FUNCTION public.verify_certificate_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate_public(text) TO anon, authenticated;