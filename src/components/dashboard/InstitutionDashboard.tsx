import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, Plus, Users, TrendingUp } from "lucide-react";

interface InstitutionDashboardProps {
  userId: string;
}

const InstitutionDashboard = ({ userId }: InstitutionDashboardProps) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCertificates: 0,
    activeLearners: 0,
    thisMonth: 0,
  });
  const [formData, setFormData] = useState({
    learnerEmail: "",
    qualificationName: "",
    qualificationLevel: "",
    ncrfLevel: "",
  });

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      // Get institution ID
      const { data: instData } = await supabase
        .from("institutions")
        .select("id")
        .eq("admin_user_id", userId)
        .single();

      if (!instData) return;

      // Get total certificates
      const { count: totalCount } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true })
        .eq("institution_id", instData.id);

      // Get unique learners
      const { data: learnerData } = await supabase
        .from("certificates")
        .select("learner_id")
        .eq("institution_id", instData.id);

      const uniqueLearners = new Set(learnerData?.map(c => c.learner_id)).size;

      // Get this month's certificates
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthCount } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true })
        .eq("institution_id", instData.id)
        .gte("created_at", startOfMonth.toISOString());

      setStats({
        totalCertificates: totalCount || 0,
        activeLearners: uniqueLearners,
        thisMonth: monthCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const generateBlockchainHash = (data: any): string => {
    const str = JSON.stringify(data) + Date.now();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First get the learner's user ID from email
      const { data: authData, error: authError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", formData.learnerEmail)
        .single();

      if (authError || !authData) {
        throw new Error("Learner not found. Please check the email address.");
      }

      // Get institution ID for this user
      const { data: instData, error: instError } = await supabase
        .from("institutions")
        .select("id")
        .eq("admin_user_id", userId)
        .single();

      if (instError || !instData) {
        throw new Error("Institution not found. Please contact administrator.");
      }

      // Generate certificate number and blockchain hash
      const certNumber = `NCVET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const blockchainData = {
        certificateNumber: certNumber,
        learnerId: authData.id,
        institutionId: instData.id,
        qualificationName: formData.qualificationName,
        timestamp: new Date().toISOString(),
      };
      const blockchainHash = generateBlockchainHash(blockchainData);

      // Insert certificate
      const { error: certError } = await supabase
        .from("certificates")
        .insert({
          certificate_number: certNumber,
          learner_id: authData.id,
          institution_id: instData.id,
          qualification_name: formData.qualificationName,
          qualification_level: formData.qualificationLevel,
          ncrf_level: formData.ncrfLevel,
          blockchain_hash: blockchainHash,
          status: "issued",
        });

      if (certError) throw certError;

      // Create blockchain transaction record
      await supabase
        .from("blockchain_transactions")
        .insert({
          transaction_type: "CERTIFICATE_ISSUED",
          certificate_id: certNumber,
          previous_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
          current_hash: blockchainHash,
          transaction_data: blockchainData,
          performed_by: userId,
        });

      toast.success("Certificate issued successfully!");
      
      // Reset form
      setFormData({
        learnerEmail: "",
        qualificationName: "",
        qualificationLevel: "",
        ncrfLevel: "",
      });

      // Refresh stats
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Error issuing certificate");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
              <Award className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCertificates}</div>
            <p className="text-xs text-muted-foreground mt-1">Total credentials</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{stats.activeLearners}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique students</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">New certificates</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-elevated">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <CardTitle>Issue New Certificate</CardTitle>
          </div>
          <CardDescription>Create a blockchain-verified skill credential</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleIssueCertificate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="learnerEmail">Learner Email *</Label>
              <Input
                id="learnerEmail"
                type="email"
                placeholder="learner@example.com"
                value={formData.learnerEmail}
                onChange={(e) => setFormData({ ...formData, learnerEmail: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualificationName">Qualification Name *</Label>
              <Input
                id="qualificationName"
                placeholder="e.g., Advanced Welding Techniques"
                value={formData.qualificationName}
                onChange={(e) => setFormData({ ...formData, qualificationName: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qualificationLevel">Qualification Level *</Label>
                <Select
                  value={formData.qualificationLevel}
                  onValueChange={(value) => setFormData({ ...formData, qualificationLevel: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ncrfLevel">NCRF Level</Label>
                <Select
                  value={formData.ncrfLevel}
                  onValueChange={(value) => setFormData({ ...formData, ncrfLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select NCRF level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="level-1">Level 1</SelectItem>
                    <SelectItem value="level-2">Level 2</SelectItem>
                    <SelectItem value="level-3">Level 3</SelectItem>
                    <SelectItem value="level-4">Level 4</SelectItem>
                    <SelectItem value="level-5">Level 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Award className="w-4 h-4 mr-2" />
              {loading ? "Issuing Certificate..." : "Issue Certificate"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitutionDashboard;
