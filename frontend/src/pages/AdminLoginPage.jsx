import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Lock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_b2d8f042-a3eb-4c92-8bd4-1f08637642bc/artifacts/uu8m5o1z_logo-e-slogan-fx-cmyk-eng-cmyk.png";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/login`, {
        username,
        password,
      });
      
      localStorage.setItem("admin_token", response.data.access_token);
      toast.success("Login successful!");
      navigate("/admin");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const setupAdmin = async () => {
    try {
      const response = await axios.post(`${API}/admin/setup`);
      toast.success(`Admin created! User: ${response.data.username}, Password: ${response.data.password}`);
    } catch (error) {
      if (error.response?.data?.message === "Admin already exists") {
        toast.info("Admin already exists. Use: admin / admin123");
      } else {
        toast.error("Error creating admin");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#27272A]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="logo-container">
            <img src={LOGO_URL} alt="FREMAX" className="h-10" />
          </Link>
          <Link 
            to="/" 
            className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 font-mono text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[#121212] border-[#27272A]">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-3xl text-white uppercase">
              Admin Area
            </CardTitle>
            <CardDescription className="text-neutral-500">
              Login to manage catalog products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-neutral-400 font-mono text-xs uppercase">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className="pl-10 bg-[#09090B] border-[#27272A] h-12"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    data-testid="input-username"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-400 font-mono text-xs uppercase">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 bg-[#09090B] border-[#27272A] h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#FFB800] text-black hover:bg-[#F59E0B] font-heading uppercase tracking-wider"
                disabled={loading}
                data-testid="login-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#27272A]">
              <p className="text-neutral-500 text-xs font-mono text-center mb-4">
                First access? Click below to create default admin.
              </p>
              <Button
                variant="outline"
                className="w-full border-[#27272A] text-neutral-400 hover:text-white"
                onClick={setupAdmin}
                data-testid="setup-admin-button"
              >
                Create Default Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
