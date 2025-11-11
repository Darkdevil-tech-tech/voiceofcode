import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Shield, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-primary">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          {/* Logo/Title */}
          <div className="mb-8 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-6 py-3 backdrop-blur-sm">
            <MessageSquare className="h-8 w-8 text-accent" />
            <h1 className="text-4xl font-bold text-white">VoiceOfCode</h1>
          </div>

          {/* Hero Text */}
          <h2 className="mb-4 text-5xl font-bold leading-tight text-white sm:text-6xl">
            Your Voice,<br />Your Power
          </h2>
          <p className="mb-12 text-xl text-white/90 sm:text-2xl">
            Speak Freely at VoiceOfCode
          </p>

          {/* Login Buttons */}
          <div className="mb-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth?type=student")}
              className="group w-full bg-white text-primary hover:bg-white/90 sm:w-auto min-w-[200px] h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Users className="mr-2 h-5 w-5" />
              Login as Student
            </Button>
            <Button
              size="lg"
              onClick={() => navigate("/auth?type=admin")}
              className="group w-full bg-accent text-white hover:bg-accent-light sm:w-auto min-w-[200px] h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Shield className="mr-2 h-5 w-5" />
              Admin Login
            </Button>
          </div>

          {/* Features */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 text-accent" />
              <h3 className="mb-2 font-semibold text-white">Submit Complaints</h3>
              <p className="text-sm text-white/80">Raise your concerns easily and transparently</p>
            </div>
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
              <Shield className="mx-auto mb-3 h-10 w-10 text-accent" />
              <h3 className="mb-2 font-semibold text-white">Track Status</h3>
              <p className="text-sm text-white/80">Monitor your complaints in real-time</p>
            </div>
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
              <Users className="mx-auto mb-3 h-10 w-10 text-accent" />
              <h3 className="mb-2 font-semibold text-white">Get Responses</h3>
              <p className="text-sm text-white/80">Receive feedback from administrators</p>
            </div>
          </div>

          {/* Footer Text */}
          <p className="mt-12 text-sm text-white/70">
            Building transparency and trust in the Brototype ecosystem
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
