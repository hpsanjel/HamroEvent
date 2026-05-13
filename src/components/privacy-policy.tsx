import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield, Eye, Database, UserCheck, Cookie, Trash2, Download, AlertTriangle } from "lucide-react";

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
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
                  <p className=" mb-4">
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
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Account Information</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        When you create an account or register for events, we collect:
                      </p>
                      <ul className="space-y-1 text-sm text-gray-500">
                        <li>• Full name, email address, phone number</li>
                        <li>• Profile photo and bio (optional)</li>
                        <li>• Password (encrypted, never stored in plain text)</li>
                        <li>• Authentication tokens for secure access</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Event Management Data</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        As an event organizer, you provide and we process:
                      </p>
                      <ul className="space-y-1 text-sm text-gray-500">
                        <li>• Event details: name, description, venue, dates</li>
                        <li>• Sport type, tournament format, rules</li>
                        <li>• Registration fees, prize pools, currency</li>
                        <li>• Contact information for participants</li>
                        <li>• Budget items: income, expenses, donations</li>
                        <li>• Match schedules, brackets, results</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Participant & Team Data</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        When registering for events or purchasing tickets:
                      </p>
                      <ul className="space-y-1 text-sm text-gray-500">
                        <li>• Team name, captain details, player roster</li>
                        <li>• Player names, contact info, jersey numbers</li>
                        <li>• Emergency contact information</li>
                        <li>• Payment information (processed via secure payment gateways)</li>
                        <li>• Check-in status, attendance records</li>
                        <li>• Match participation, performance statistics</li>
                      </ul>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Technical & Usage Data</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Automatically collected for platform functionality:
                      </p>
                      <ul className="space-y-1 text-sm text-gray-500">
                        <li>• IP address (anonymized for privacy)</li>
                        <li>• Device type, browser, operating system</li>
                        <li>• Pages visited, time spent, actions taken</li>
                        <li>• Error logs, performance metrics</li>
                        <li>• Location data (approximate, with consent)</li>
                        <li>• Cookie and local storage data (with consent)</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Data We Do NOT Collect</h3>
                      <ul className="space-y-1 text-sm text-gray-500">
                        <li>• Sensitive personal information (religion, politics, etc.)</li>
                        <li>• Biometric data beyond what you voluntarily provide</li>
                        <li>• Financial details beyond payment processing</li>
                        <li>• Private communications between users</li>
                        <li>• Data from third-party social media accounts</li>
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
                      <h3 className="font-medium text-gray-700 mb-2">Core Platform Functions</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        We use your data to provide essential tournament management services:
                      </p>
                      <ul className="space-y-1 text-gray-500 text-sm">
                        <li>• <strong>Account Management:</strong> User authentication, profile creation, access control</li>
                        <li>• <strong>Event Registration:</strong> Team sign-ups, player registrations, ticket purchases</li>
                        <li>• <strong>Payment Processing:</strong> Secure transaction handling, fee collection, refunds</li>
                        <li>• <strong>Communication:</strong> Event updates, notifications, organizer-participant messaging</li>
                        <li>• <strong>Scheduling & Brackets:</strong> Match generation, tournament bracket creation</li>
                        <li>• <strong>Check-in & Access:</strong> QR code scanning, attendance tracking</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Service Enhancement</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        To improve your tournament management experience:
                      </p>
                      <ul className="space-y-1 text-gray-500 text-sm">
                        <li>• <strong>Analytics:</strong> Platform usage insights, feature optimization</li>
                        <li>• <strong>Personalization:</strong> Sport preferences, event recommendations</li>
                        <li>• <strong>Performance:</strong> Load time optimization, error prevention</li>
                        <li>• <strong>Support:</strong> Help desk responses, issue resolution</li>
                        <li>• <strong>Features:</strong> New functionality based on user feedback</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Legal & Security</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        For compliance and platform protection:
                      </p>
                      <ul className="space-y-1 text-gray-500 text-sm">
                        <li>• <strong>GDPR Compliance:</strong> Data subject rights, consent management</li>
                        <li>• <strong>Security:</strong> Fraud detection, abuse prevention, account protection</li>
                        <li>• <strong>Legal Requirements:</strong> Tax records, audit trails, dispute resolution</li>
                        <li>• <strong>Safety:</strong> Emergency contacts, participant verification</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Strict Prohibitions</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        We never use your data for:
                      </p>
                      <ul className="space-y-1 text-gray-500 text-sm">
                        <li>• <strong>Third-party Sales:</strong> We never sell participant or organizer data</li>
                        <li>• <strong>Unrelated Marketing:</strong> No spam, no data sharing with advertisers</li>
                        <li>• <strong>Social Media Profiling:</strong> We don't build profiles from your data</li>
                        <li>• <strong>Credit Scoring:</strong> Your tournament activity doesn't affect financial records</li>
                        <li>• <strong>Unnecessary Retention:</strong> Data deleted when no longer needed</li>
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
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Right to Access
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        You have the right to know what personal data we hold about you and how it's used.
                      </p>
                      <div className="text-sm space-y-2 mb-3 text-gray-600">
                        <p><strong>What you can access:</strong></p>
                        <ul className="ml-4 space-y-1">
                          <li>• Account profile and authentication data</li>
                          <li>• All events you've organized or participated in</li>
                          <li>• Team registrations and player information</li>
                          <li>• Payment history and ticket purchases</li>
                          <li>• Match results and performance statistics</li>
                          <li>• Communication logs and support tickets</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Right to Rectification
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        You can correct inaccurate or incomplete personal data we hold about you.
                      </p>
                      <div className="text-sm space-y-2 mb-3 text-gray-500">
                        <p><strong>What you can update:</strong></p>
                        <ul className="ml-4 space-y-1 ">
                          <li>• Personal profile information (name, contact details)</li>
                          <li>• Team and player information</li>
                          <li>• Event details and settings</li>
                          <li>• Payment and billing information</li>
                          <li>• Communication preferences</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Right to Erasure (Right to be Forgotten)
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        You can request deletion of your personal data when it's no longer needed.
                      </p>
                      <div className="text-sm space-y-2 mb-3 text-gray-500">
                        <p><strong>What gets deleted:</strong></p>
                        <ul className="ml-4 space-y-1">
                          <li>• Your account and profile data</li>
                          <li>• All events you've created</li>
                          <li>• Team registrations and participation records</li>
                          <li>• Payment history and financial data</li>
                          <li>• Communication logs and activity history</li>
                        </ul>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                          <strong>Note:</strong> Some data may be retained for legal obligations (tax records, etc.)
                        </p>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Right to Portability
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        You can request your data in a structured, machine-readable format.
                      </p>
                      <div className="text-sm space-y-2 mb-3 text-gray-500">
                        <p><strong>Available formats:</strong></p>
                        <ul className="ml-4 space-y-1">
                          <li>• CSV files for tabular data (events, participants, etc.)</li>
                          <li>• JSON files for structured data</li>
                          <li>• PDF reports for human-readable summaries</li>
                          <li>• Complete data package for migration to other services</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Right to Object & Restrict Processing
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        You can object to or restrict how we process your personal data.
                      </p>
                      <div className="text-sm space-y-2 mb-3 text-gray-500">
                        <p><strong>You can object to:</strong></p>
                        <ul className="ml-4 space-y-1">
                          <li>• Direct marketing communications</li>
                          <li>• Analytics and tracking cookies</li>
                          <li>• Data sharing with third-party services</li>
                          <li>• Automated decision-making processes</li>
                        </ul>
                      </div>
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
                    <p className="text-muted-foreground mb-4">
                      PitchPro just uses essential cookies to provide secure tournament management services and enhance your experience. 
                    </p>

                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <h3 className="font-medium text-gray-700 mb-2">Essential Cookies</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Required for core tournament management functionality:
                        </p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          <li>• <strong>Authentication:</strong> Login sessions, access tokens, security</li>
                          <li>• <strong>Event Management:</strong> Registration forms, booking processes</li>
                          <li>• <strong>Security:</strong> CSRF protection, fraud prevention</li>
                          <li>• <strong>Functionality:</strong> Shopping cart, payment processing</li>
                          <li>• <strong>Platform:</strong> Sidebar preferences, UI settings</li>
                        </ul>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                          <strong>Cannot be disabled</strong> - Platform won't function without these
                        </p>
                      </div>


                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <h3 className="font-medium text-gray-700 mb-2">Third-Party Services</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        We integrate with trusted services for tournament management:
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• <strong>Payment Processors:</strong> Stripe, Vipps (secure transactions only)</li>
                        <li>• <strong>Communication:</strong> Email services (transactional emails only)</li>
                        <li>• <strong>Storage:</strong> Cloud providers (encrypted data storage)</li>
                      </ul>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                        <strong>Note:</strong> These services have their own privacy policies
                      </p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-300 mb-2">Managing Your Preferences</h3>
                      <div className="text-sm text-gray-400 space-y-3">
                   
                        <p>
                          <strong>Data Rights:</strong> Use "Data Rights" in authenticated area to manage all preferences
                        </p>
                        <p>
                          <strong>Impact:</strong> Disabling non-essential cookies may affect some features but won't break core functionality
                        </p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">Clear All Data</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
