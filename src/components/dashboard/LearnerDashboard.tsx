import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, Building, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Certificate {
  id: string;
  certificate_number: string;
  qualification_name: string;
  qualification_level: string;
  issue_date: string;
  status: string;
  blockchain_hash: string;
  institutions: {
    name: string;
  };
}

interface LearnerDashboardProps {
  userId: string;
}

const LearnerDashboard = ({ userId }: LearnerDashboardProps) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, [userId]);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select(`
          *,
          institutions (
            name
          )
        `)
        .eq("learner_id", userId)
        .order("issue_date", { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error: any) {
      toast.error("Error loading certificates");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (cert: Certificate) => {
    toast.info("Certificate download will be available soon");
  };

  if (loading) {
    return <div className="text-center py-12">Loading your credentials...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{certificates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">
              {certificates.filter(c => c.status === "issued").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Blockchain Secured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">100%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Credentials</CardTitle>
          <CardDescription>Your blockchain-verified skill certificates</CardDescription>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No certificates yet</p>
              <p className="text-sm">Certificates will appear here once issued</p>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold text-lg">{cert.qualification_name}</h3>
                          <Badge variant={cert.status === "issued" ? "default" : "secondary"}>
                            {cert.status}
                          </Badge>
                        </div>
                        
                        <div className="grid gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span>{cert.institutions.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            <span className="font-mono text-xs truncate max-w-md">
                              {cert.blockchain_hash}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" onClick={() => handleDownload(cert)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LearnerDashboard;
