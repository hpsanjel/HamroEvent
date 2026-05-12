import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield, Eye, Database, UserCheck, Cookie } from "lucide-react";

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Last updated: {new Date().toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="data">Data Collection</TabsTrigger>
                <TabsTrigger value="usage">Data Usage</TabsTrigger>
                <TabsTrigger value="rights">Your Rights</TabsTrigger>
                <TabsTrigger value="cookies">Cookies</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-3">Privacy Overview</h2>
                  <p className="text-muted-foreground mb-4">
                    At PitchPro (EventFlow Hub), we are committed to protecting your privacy and ensuring the security of your personal data. 
                    This privacy policy explains how we collect, use, store, and protect your information in compliance with the General Data Protection Regulation (GDPR).
                  </p>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Key Points:</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• We collect only necessary data for event management</li>
                      <li>• Your data is encrypted and securely stored</li>
                      <li>• You have full control over your personal information</li>
                      <li>• We never sell your data to third parties</li>
                      <li>• You can request data deletion at any time</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="data" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data We Collect
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Personal Information</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Name and contact information</li>
                        <li>• Email address and phone number</li>
                        <li>• Payment information (processed securely)</li>
                        <li>• Team and participant details</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Event Data</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Event registration details</li>
                        <li>• Participation history</li>
                        <li>• Match results and statistics</li>
                        <li>• Ticket purchases and orders</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Technical Data</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• IP address (anonymized)</li>
                        <li>• Browser and device information</li>
                        <li>• Usage patterns and preferences</li>
                        <li>• Cookie and tracking data (with consent)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="usage" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    How We Use Your Data
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                      <h3 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Primary Purposes</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Event registration and management</li>
                        <li>• Payment processing and ticketing</li>
                        <li>• Communication about events</li>
                        <li>• Platform functionality and security</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <h3 className="font-medium mb-2 text-green-900 dark:text-green-100">Secondary Purposes</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Improving our services</li>
                        <li>• Analytics and usage insights</li>
                        <li>• Customer support</li>
                        <li>• Legal compliance</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                      <h3 className="font-medium mb-2 text-red-900 dark:text-red-100">What We Don't Do</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Sell your personal data</li>
                        <li>• Use data for unrelated marketing</li>
                        <li>• Share data without consent</li>
                        <li>• Retain data longer than necessary</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rights" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Your GDPR Rights
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Right to Access</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        You can request a copy of all personal data we hold about you.
                      </p>
                      <Button size="sm" variant="outline">Request Data Export</Button>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Right to Rectification</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        You can correct inaccurate or incomplete personal data.
                      </p>
                      <Button size="sm" variant="outline">Update My Data</Button>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Right to Erasure</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        You can request deletion of your personal data ("right to be forgotten").
                      </p>
                      <Button size="sm" variant="outline">Delete My Data</Button>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Right to Portability</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        You can request your data in a machine-readable format.
                      </p>
                      <Button size="sm" variant="outline">Export My Data</Button>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Right to Object</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        You can object to processing of your personal data.
                      </p>
                      <Button size="sm" variant="outline">Object to Processing</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cookies" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Cookie className="h-5 w-5" />
                    Cookie Policy
                  </h2>
                  
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      We use cookies and similar technologies to enhance your experience on our platform.
                    </p>

                    <div className="grid gap-4">
                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">Essential Cookies</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Required for the website to function properly.
                        </p>
                        <ul className="text-xs text-muted-foreground">
                          <li>• Authentication and session management</li>
                          <li>• Security and fraud prevention</li>
                          <li>• Shopping cart and booking functionality</li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">Analytics Cookies</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Help us understand how visitors use our website.
                        </p>
                        <ul className="text-xs text-muted-foreground">
                          <li>• Page views and user journeys</li>
                          <li>• Performance monitoring</li>
                          <li>• Error tracking</li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">Functional Cookies</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Enable enhanced functionality and personalization.
                        </p>
                        <ul className="text-xs text-muted-foreground">
                          <li>• Remembering preferences</li>
                          <li>• Language and region settings</li>
                          <li>• Customized content</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Managing Cookies</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        You can control cookies through your browser settings or our cookie consent banner.
                      </p>
                      <Button size="sm" variant="outline">Update Cookie Preferences</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Questions about our privacy policy? Contact us at{' '}
            <a href="mailto:privacy@pitchpro.com" className="text-primary hover:underline">
              privacy@pitchpro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
