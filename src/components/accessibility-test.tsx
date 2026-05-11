import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, Image, Type, Palette } from "lucide-react";

export default function AccessibilityTest() {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Accessibility Features Test</h1>
        <p className="text-lg text-muted-foreground">
          Test the accessibility widget by clicking the accessibility icon in the bottom-right corner.
        </p>
      </div>

      {/* Text Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Text Elements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h2 className="text-2xl font-semibold">Heading Level 2</h2>
          <h3 className="text-xl font-medium">Heading Level 3</h3>
          <p className="text-base">
            This is a paragraph with normal text. You can test the font size and large text settings here.
            The accessibility widget allows you to increase font size from 80% to 200% and enable large text mode.
          </p>
          <p className="text-sm text-muted-foreground">
            This is smaller muted text for testing contrast and readability improvements.
          </p>
        </CardContent>
      </Card>

      {/* Form Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-input">Text Input</Label>
              <Input id="test-input" placeholder="Test input field" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-input-2">Another Input</Label>
              <Input id="test-input-2" placeholder="Focus styles test" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-textarea">Textarea</Label>
            <Textarea 
              id="test-textarea" 
              placeholder="Test textarea for enhanced focus visibility"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
          </div>
        </CardContent>
      </Card>

      {/* Images and Visual Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Visual Elements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Image className="w-8 h-8 text-white" />
            </div>
            <div className="aspect-square bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <div className="aspect-square bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Palette className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Test the "Hide Images" and "Black & White" settings with these visual elements.
          </p>
        </CardContent>
      </Card>

      {/* Color and Contrast */}
      <Card>
        <CardHeader>
          <CardTitle>Color and Contrast</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Badge variant="default">Default Badge</Badge>
            <Badge variant="secondary">Secondary Badge</Badge>
            <Badge variant="destructive">Destructive Badge</Badge>
            <Badge variant="outline">Outline Badge</Badge>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="p-3 bg-primary text-primary-foreground rounded">
              Primary Colors
            </div>
            <div className="p-3 bg-secondary text-secondary-foreground rounded">
              Secondary Colors
            </div>
            <div className="p-3 bg-accent text-accent-foreground rounded">
              Accent Colors
            </div>
            <div className="p-3 bg-destructive text-destructive-foreground rounded">
              Destructive Colors
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Test high contrast mode to improve color visibility and readability.
          </p>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Click the accessibility icon (👤) in the bottom-right corner</li>
            <li>Toggle <strong>High Contrast</strong> for better color contrast</li>
            <li>Enable <strong>Large Text</strong> for bigger fonts</li>
            <li>Adjust <strong>Font Size</strong> with the slider (80% - 200%)</li>
            <li>Toggle <strong>Hide Images</strong> to remove visual elements</li>
            <li>Enable <strong>Black & White</strong> for grayscale view</li>
            <li>Toggle <strong>Dark Mode</strong> for dark theme</li>
            <li>Enable <strong>Reduced Motion</strong> to disable animations</li>
            <li>Toggle <strong>Enhanced Focus</strong> for better keyboard navigation</li>
            <li>Click <strong>Reset</strong> to restore default settings</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-4">
            Settings are automatically saved and will persist when you refresh the page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
