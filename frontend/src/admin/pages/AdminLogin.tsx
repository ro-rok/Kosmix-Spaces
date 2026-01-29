import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { OverlayLoadingAnimation } from "@/components/LoadingAnimation";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.auth.loginAdmin({
        email: email.trim(),
        password,
      });
      
      // Use the new auth context login method
      await login(response.accessToken, 'admin');
      
      toast.success("Login successful!");
      navigate("/admin");
    } catch (error: any) {
      // Show specific error messages
      let errorMessage = "Login failed";
      if (error.message) {
        if (error.message.includes("Wrong password")) {
          errorMessage = "❌ Wrong password. Please try again.";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "❌ Invalid email address.";
        } else if (error.message.includes("Authentication required")) {
          errorMessage = "❌ Please check your credentials and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <OverlayLoadingAnimation 
        isLoading={isLoading}
        text="Signing you in..."
      />
      
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Logo size="medium" showFallbackText />
          <h1 className="font-display text-2xl font-bold">Admin Login</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kosmixspaces.in"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to main site
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}