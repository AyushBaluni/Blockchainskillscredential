import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Shield, Building, Calendar, Award, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VerificationResult {
  valid: boolean;
  certificate?: any;
  institution?: any;
  learner?: any;
  message: string;
}

const VerifierDashboard = () => {
  const [certificateNumber, setCertificateNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);

  useEffect(() => {
    fetchRecentVerifications();
  }, []);

  const fetchRecentVerifications = async () => {
    try {
      const { data } = await supabase
        .from("verification_logs")
        .select(`
          *,
          certificates (
            certificate_number,
            qualification_name,
            institutions (
              name
            )
          )
        `)
        .order("verified_at", { ascending: false })
        .limit(5);

      setRecentVerifications(data || []);
    } catch (error) {
      console.error("Error fetching recent verifications:", error);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const { data: certificate, error } = await supabase
        .from("certificates")
        .select(`
          *,
          institutions (
            name,
            registration_number,
            ncvet_approved
          ),
          profiles (
            full_name,
            email
          )
        `)
        .eq("certificate_number", certificateNumber)
        .single();

      if (error || !certificate) {
        setResult({
          valid: false,
          message: "Certificate not found. Please check the certificate number.",
        });
        
        // Log verification attempt
        await supabase.from("verification_logs").insert({
          verification_result: false,
          verification_details: {
            certificate_number: certificateNumber,
            error: "not_found",
          },
        });
      } else {
        const isValid = certificate.status === "issued";
        
        setResult({
          valid: isValid,
          certificate,
          institution: certificate.institutions,
          learner: certificate.profiles,
          message: isValid 
            ? "Certificate is valid and blockchain-verified!" 
            : `Certificate status: ${certificate.status}`,
        });

        // Refresh recent verifications
        fetchRecentVerifications();

        // Log verification
        await supabase.from("verification_logs").insert({
          certificate_id: certificate.id,
          verification_result: isValid,
          verification_details: {
            certificate_number: certificateNumber,
            status: certificate.status,
          },
        });

        if (isValid) {
          toast.success("Certificate verified successfully!");
        } else {
          toast.warning("Certificate found but not active");
        }
      }
    } catch (error: any) {
      toast.error("Error verifying certificate");
      console.error(error);
      setResult({
        valid: false,
        message: "Error during verification. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
              <FileCheck className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recentVerifications.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Recent checks</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">
              {recentVerifications.length > 0
                ? Math.round((recentVerifications.filter(v => v.verification_result).length / recentVerifications.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Valid certificates</p>
          </CardContent>
        </Card>
      </div>
      <Card className="shadow-elevated">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            <CardTitle>Verify Certificate</CardTitle>
          </div>
          <CardDescription>Enter the certificate number to verify authenticity</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Certificate Number</Label>
              <Input
                id="certificateNumber"
                placeholder="e.g., NCVET-1234567890-ABCD"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <Shield className="w-4 h-4 mr-2" />
              {loading ? "Verifying..." : "Verify Certificate"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className={`shadow-elevated border-2 ${result.valid ? 'border-secondary' : 'border-destructive'}`}>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {result.valid ? (
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10">
                    <CheckCircle2 className="w-8 h-8 text-secondary" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {result.valid ? "Valid Certificate" : "Invalid Certificate"}
                  </h3>
                  <p className="text-muted-foreground">{result.message}</p>
                </div>
              </div>

              {result.valid && result.certificate && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Award className="w-4 h-4" />
                          <span className="font-medium">Learner</span>
                        </div>
                        <p className="font-semibold">{result.learner?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{result.learner?.email}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="w-4 h-4" />
                          <span className="font-medium">Institution</span>
                        </div>
                        <p className="font-semibold">{result.institution?.name}</p>
                        {result.institution?.ncvet_approved && (
                          <Badge variant="secondary">NCVET Approved</Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Award className="w-4 h-4" />
                          <span className="font-medium">Qualification</span>
                        </div>
                        <p className="font-semibold">{result.certificate.qualification_name}</p>
                        <Badge>{result.certificate.qualification_level}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">Issue Date</span>
                        </div>
                        <p className="font-semibold">
                          {new Date(result.certificate.issue_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">Blockchain Hash</span>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="font-mono text-xs break-all">
                          {result.certificate.blockchain_hash}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                      <p className="text-sm font-medium text-secondary">
                        ✓ This certificate has been verified on the blockchain and is authentic.
                      </p>
                    </div>
                  </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {recentVerifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Verifications</CardTitle>
            <CardDescription>Latest certificate verification history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentVerifications.map((verification) => (
                <div
                  key={verification.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {verification.verification_result ? (
                      <CheckCircle2 className="w-5 h-5 text-secondary" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">
                        {verification.certificates?.qualification_name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {verification.certificates?.institutions?.name || "Unknown Institution"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(verification.verified_at).toLocaleDateString()}
                    </p>
                    <Badge variant={verification.verification_result ? "default" : "destructive"} className="mt-1">
                      {verification.verification_result ? "Valid" : "Invalid"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VerifierDashboard;
