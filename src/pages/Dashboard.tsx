import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogOut, Award, Shield, User as UserIcon } from "lucide-react";
import LearnerDashboard from "@/components/dashboard/LearnerDashboard";
import InstitutionDashboard from "@/components/dashboard/InstitutionDashboard";
import VerifierDashboard from "@/components/dashboard/VerifierDashboard";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Fetch user role
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching role:", error);
      } else {
        setUserRole(roleData?.role || "learner");
      }

      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold">NCVET Credential System</h1>
                <p className="text-sm text-muted-foreground capitalize">{userRole} Dashboard</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm truncate max-w-[200px]">{user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full sm:w-auto">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {userRole === "learner" && <LearnerDashboard userId={user?.id || ""} />}
        {userRole === "institution" && <InstitutionDashboard userId={user?.id || ""} />}
        {userRole === "verifier" && <VerifierDashboard />}
      </main>
    </div>
  );
};

export default Dashboard;
