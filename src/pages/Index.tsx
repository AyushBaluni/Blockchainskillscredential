import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  Award, 
  CheckCircle2, 
  Lock, 
  Globe, 
  Zap,
  Building,
  Users,
  Search,
  BarChart3
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Tamper-proof certificates secured by blockchain technology",
    },
    {
      icon: Zap,
      title: "Instant Verification",
      description: "Verify credentials in seconds from anywhere in the world",
    },
    {
      icon: Lock,
      title: "Immutable Records",
      description: "Permanent, unchangeable certification records",
    },
    {
      icon: Globe,
      title: "Global Recognition",
      description: "Internationally accepted and portable credentials",
    },
  ];

  const userTypes = [
    {
      icon: Users,
      title: "Learners",
      description: "Access and share your verified skill certificates anytime",
      action: "View My Certificates",
    },
    {
      icon: Building,
      title: "Institutions",
      description: "Issue blockchain-verified certificates to your students",
      action: "Issue Certificates",
    },
    {
      icon: Search,
      title: "Verifiers",
      description: "Instantly verify the authenticity of any certificate",
      action: "Verify Certificates",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%230066CC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white mb-6 shadow-elevated">
              <Shield className="w-10 h-10" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Blockchain-Based Skill
              <span className="block text-primary mt-2">Credentialing System</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Secure, tamper-proof digital certificates powered by blockchain technology. 
              Issued by NCVET-approved institutions, verified instantly worldwide.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                <Award className="w-5 h-5" />
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/verify")}>
                Verify Certificate
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("/stats")} className="gap-2">
                <BarChart3 className="w-5 h-5" />
                View Stats
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">Blockchain Secured</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-secondary mb-2">Instant</div>
                <div className="text-sm text-muted-foreground">Verification</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">Global</div>
                <div className="text-sm text-muted-foreground">Recognition</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Our System?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built on cutting-edge blockchain technology to ensure authenticity and trust
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Who Can Use It?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Designed for learners, institutions, and employers across India
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {userTypes.map((type) => (
              <Card key={type.title} className="shadow-card hover:shadow-elevated transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white mb-4">
                    <type.icon className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-base">{type.description}</CardDescription>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                    {type.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Trusted by Educational Institutions Nationwide
            </h2>
            <p className="text-lg opacity-90">
              Our blockchain-based system ensures every credential issued is authentic, 
              verifiable, and recognized by employers and institutions across India and globally.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8">
              {[
                "NCVET Approved",
                "DigiLocker Compatible",
                "Skill India Integrated",
                "ISO Certified",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="shadow-elevated max-w-4xl mx-auto">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Join thousands of learners and institutions using our blockchain-based 
                credentialing system for secure, verifiable skill certificates.
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Create Account
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/verify")}>
                  Verify a Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-semibold">NCVET Credential System</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 National Council for Vocational Education and Training
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
