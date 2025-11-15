import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

const qikpodLogo = "https://leapmile-website.blr1.cdn.digitaloceanspaces.com/Qikpod/Images/q70.png";

export default function Registration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Get phone number from URL params if redirected from login
  const urlParams = new URLSearchParams(window.location.search);
  const phoneFromUrl = urlParams.get('phone') || '';
  
  const [formData, setFormData] = useState({
    user_phone: phoneFromUrl,
    user_name: "",
    user_email: "",
    user_flatno: "",
    user_address: ""
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearForm = () => {
    setFormData({
      user_phone: "",
      user_name: "",
      user_email: "",
      user_flatno: "",
      user_address: ""
    });
  };

  const validateForm = () => {
    const { user_phone, user_name, user_email, user_flatno, user_address } = formData;
    
    if (!user_phone || user_phone.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive"
      });
      return false;
    }

    if (!user_name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name.",
        variant: "destructive"
      });
      return false;
    }

    if (!user_email.trim() || !user_email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return false;
    }

    if (!user_flatno.trim()) {
      toast({
        title: "Flat No / Emp ID Required",
        description: "Please enter your flat number or employee ID.",
        variant: "destructive"
      });
      return false;
    }

    if (!user_address.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter your address.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await apiService.registerUser(formData);
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully. Please login to continue."
      });

      // Navigate to login page
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearForm();
    navigate(-1); // Go back to previous screen
  };

  return (
    <div className="min-h-screen bg-qikpod-light-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Register to get started with Qikpod</p>
        </div>

        {/* Registration Form */}
        <Card className="card-modern p-6 mb-6">
          <div className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Mobile Number *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">
                  +91
                </span>
                <Input 
                  type="tel" 
                  placeholder="Enter Your Mobile Number" 
                  value={formData.user_phone}
                  onChange={e => handleInputChange('user_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="pl-12 h-12 text-base border-border/60 focus:border-primary" 
                  maxLength={10} 
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Full Name *
              </label>
              <Input 
                type="text" 
                placeholder="Enter Your Full Name" 
                value={formData.user_name}
                onChange={e => handleInputChange('user_name', e.target.value)}
                className="h-12 text-base border-border/60 focus:border-primary" 
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Email Address *
              </label>
              <Input 
                type="email" 
                placeholder="Enter Your Email Address" 
                value={formData.user_email}
                onChange={e => handleInputChange('user_email', e.target.value)}
                className="h-12 text-base border-border/60 focus:border-primary" 
              />
            </div>

            {/* Flat No / Emp ID */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Flat No / Emp ID *
              </label>
              <Input 
                type="text" 
                placeholder="Enter Your Flat No or Employee ID" 
                value={formData.user_flatno}
                onChange={e => handleInputChange('user_flatno', e.target.value)}
                className="h-12 text-base border-border/60 focus:border-primary" 
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Address *
              </label>
              <Textarea 
                placeholder="Enter Your Complete Address" 
                value={formData.user_address}
                onChange={e => handleInputChange('user_address', e.target.value)}
                className="min-h-[80px] text-base border-border/60 focus:border-primary resize-none" 
              />
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <Button 
                onClick={handleRegister} 
                disabled={loading}
                className="btn-primary w-full h-12 text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register'
                )}
              </Button>

              <Button 
                onClick={handleCancel}
                variant="outline"
                className="w-full h-12 text-base font-medium"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-3">
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
          </div>
          <div className="text-sm">
            <button 
              onClick={() => navigate('/login')}
              className="text-black font-bold hover:text-gray-800 transition-colors"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}