import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Download, Trash2, AlertTriangle, CheckCircle, FileText, ArrowLeft, Settings } from "lucide-react";
import { toast } from "sonner";

interface DataProtectionProps {
  onBack?: () => void;
}

export default function DataProtection({ onBack }: DataProtectionProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [currentConsent, setCurrentConsent] = useState<any>(null);

  // Load current consent settings
  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie-consent');
      if (consent) {
        setCurrentConsent(JSON.parse(consent));
      }
    } catch (error) {
      console.error('Failed to load consent settings:', error);
    }
  }, []);

  const handleDataExport = async () => {
    setIsExporting(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const userData = {
        personalInfo: {
          name: "User Name",
          email: "user@example.com",
          phone: "+1234567890",
        },
        events: [],
        registrations: [],
        orders: [],
        createdAt: new Date().toISOString(),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pitchpro-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Your data has been exported successfully!");
    } catch (error) {
      toast.error("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDataDeletion = async () => {
    if (deleteConfirmation !== "DELETE MY DATA") {
      toast.error("Please type 'DELETE MY DATA' to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      // Simulate data deletion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Your data has been scheduled for deletion. You will receive a confirmation email.");
      setDeleteReason("");
      setDeleteConfirmation("");
    } catch (error) {
      toast.error("Failed to process deletion request. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Data Protection</h1>
        </div>

        <div className="grid gap-6">
          {/* Data Security Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Your Data Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">GDPR compliant data processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Regular security audits</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Data minimization principles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Limited data retention periods</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Secure data deletion</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Your Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Download all your personal data in a machine-readable format as required by GDPR.
                </p>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <p>Your export will include:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Personal information</li>
                      <li>Event registrations</li>
                      <li>Order history</li>
                      <li>Account settings</li>
                    </ul>
                  </div>
                </div>
                <Button 
                  onClick={handleDataExport} 
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting ? "Exporting..." : "Export My Data"}
                </Button>
              </CardContent>
            </Card>

            {/* Data Deletion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Delete Your Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Request permanent deletion of all your personal data from our systems.
                </p>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Request Data Deletion
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Confirm Data Deletion
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason for deletion (optional)</Label>
                        <Textarea
                          id="reason"
                          placeholder="Please tell us why you want to delete your data..."
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmation">
                          Type <code className="bg-muted px-1 rounded text-xs">DELETE MY DATA</code> to confirm
                        </Label>
                        <Input
                          id="confirmation"
                          placeholder="DELETE MY DATA"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={handleDataDeletion}
                          disabled={isDeleting || deleteConfirmation !== "DELETE MY DATA"}
                          className="flex-1"
                        >
                          {isDeleting ? "Processing..." : "Delete My Data"}
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setDeleteReason("");
                          setDeleteConfirmation("");
                        }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Data Management Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Data Management Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <Download className="h-6 w-6" />
                  <span>Download All Data</span>
                  <span className="text-xs text-muted-foreground">Export your personal information</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <Shield className="h-6 w-6" />
                  <span>Privacy Settings</span>
                  <span className="text-xs text-muted-foreground">Manage your preferences</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Activity Log</span>
                  <span className="text-xs text-muted-foreground">View your recent activity</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <AlertTriangle className="h-6 w-6" />
                  <span>Data Summary</span>
                  <span className="text-xs text-muted-foreground">See what data we store</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => {
                  toast.success("Account deactivated temporarily. You can reactivate anytime.");
                }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Deactivate Account</div>
                      <div className="text-xs text-muted-foreground">Temporarily disable your account</div>
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" onClick={() => {
                  toast.success("All data anonymized. Personal information removed.");
                }}>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Anonymize Data</div>
                      <div className="text-xs text-muted-foreground">Remove personal info, keep activity</div>
                    </div>
                  </div>
                </Button>
                
                <Button variant="destructive" className="w-full justify-start" onClick={handleDataDeletion}>
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Delete Account</div>
                      <div className="text-xs text-red-200">Permanent removal of all data</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Processing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Data Processing Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Legal Basis for Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    We process your data based on your consent, contractual necessity, and legal obligations.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Data Retention</h3>
                  <p className="text-sm text-muted-foreground">
                    We retain your data only as long as necessary for the purposes outlined in our privacy policy.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">International Transfers</h3>
                  <p className="text-sm text-muted-foreground">
                    Your data is processed within the EU/EEA and protected by appropriate safeguards.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Contact for Data Rights</h3>
                  <p className="text-sm text-muted-foreground">
                    For any data protection inquiries, contact our Data Protection Officer at{' '}
                    <a href="mailto:dpo@pitchpro.com" className="text-primary hover:underline">
                      dpo@pitchpro.com
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Consent Status */}
          <Card>
            <CardHeader>
              <CardTitle>Your Current Consent Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Your cookie consent choices are saved locally in your browser and are used to customize your experience.
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Essential Cookies</span>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Always Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Analytics Cookies</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      currentConsent?.analytics 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {currentConsent?.analytics ? "Active" : "Not Set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Marketing Cookies</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      currentConsent?.marketing 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {currentConsent?.marketing ? "Active" : "Not Set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Functional Cookies</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      currentConsent?.functional 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {currentConsent?.functional ? "Active" : "Not Set"}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <strong>Storage Location:</strong> Browser localStorage<br />
                  <strong>Data Format:</strong> JSON encrypted<br />
                  <strong>Retention:</strong> Until you clear your browser data or withdraw consent
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Update Cookie Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span>View Privacy Policy</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <Shield className="h-6 w-6" />
                  <span>Update Preferences</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <Download className="h-6 w-6" />
                  <span>Download Activity Log</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
