import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpCircle, Phone, Mail, MessageSquare, ArrowLeft } from "lucide-react";
import { getUserData, isLoggedIn } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";

export default function Support() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getUserData();

  const [formData, setFormData] = useState({
    name: user?.user_name || "",
    mobile: user?.user_phone || "",
    issue: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  const issueTypes = [
    "Locker Access Issue",
    "Payment Problem",
    "Damaged Package",
    "Missing Package",
    "Technical Issue",
    "Account Problem",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.issue || !formData.description) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Simulate email sending
    setTimeout(() => {
      toast({
        title: "Support Request Submitted",
        description: "We'll get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        name: user?.user_name || "",
        mobile: user?.user_phone || "",
        issue: "",
        description: "",
      });

      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mobile-container space-y-6">
        <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Need Help?</h1>
              <p className="text-muted-foreground">We're here to assist you with any questions or issues</p>
            </div>
          </div>
        </div>

        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
          <Card className="card-3d bg-card/80 backdrop-blur-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Call Support</h3>
                <p className="text-sm text-muted-foreground">+91 80 4000 5000</p>
              </div>
            </div>
          </Card>

          <Card className="card-3d bg-card/80 backdrop-blur-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Email Us</h3>
                <p className="text-sm text-muted-foreground">support@qikpod.com</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Support Form */}
        <Card className="card-3d bg-card/80 backdrop-blur-sm p-6 animate-fade-in">
          <div className="flex items-center space-x-2 mb-6">
            <MessageSquare className="w-5 h-5 text-gray-800 opacity-40" />
            <h2 className="text-lg font-semibold text-foreground">Submit a Request</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your full name"
                className="h-12"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Mobile Number</label>
              <Input
                value={formData.mobile}
                onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
                placeholder="Your mobile number"
                className="h-12"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Issue Type *</label>
              <Select
                value={formData.issue}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, issue: value }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map((issue) => (
                    <SelectItem key={issue} value={issue}>
                      {issue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Please describe your issue in detail..."
                rows={4}
                className="resize-none"
              />
            </div>

            <Button type="submit" disabled={loading} className="btn-qikpod w-full h-12">
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </Card>

        {/* FAQ Section */}
        <Card className="bg-muted/30 p-6 animate-fade-in">
          <div className="flex items-center space-x-2 mb-4">
            <HelpCircle className="w-5 h-5 text-gray-800 opacity-40" />
            <h3 className="font-semibold text-foreground">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-foreground mb-1">How do I access my locker?</p>
              <p className="text-muted-foreground">
                Use your drop/pickup code at the locker keypad or scan the QR code.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground mb-1">What if my package is damaged?</p>
              <p className="text-muted-foreground">
                Report damaged packages immediately through support form or inform the site security.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
