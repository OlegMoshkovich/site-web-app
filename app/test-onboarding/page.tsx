"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { 
  Tag, 
  Upload, 
  Check,
  X,
  Plus
} from "lucide-react";

export default function TestOnboardingPage() {
  const [labels, setLabels] = useState<string[]>([]);
  const [tempLabel, setTempLabel] = useState('');
  const [planFile, setPlanFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testSiteId, setTestSiteId] = useState('');

  const supabase = createClient();

  const addLabel = () => {
    if (tempLabel.trim() && !labels.includes(tempLabel.trim())) {
      setLabels(prev => [...prev, tempLabel.trim()]);
      setTempLabel('');
    }
  };

  const removeLabel = (label: string) => {
    setLabels(prev => prev.filter(l => l !== label));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPlanFile(file);
    }
  };

  const testLabels = async () => {
    if (!testSiteId.trim()) {
      alert('Please enter a site ID to test with');
      return;
    }

    setIsLoading(true);
    try {
      await supabase
        .from('sites')
        .update({ 
          labels: labels 
        })
        .eq('id', testSiteId);
      
      console.log('Labels saved successfully:', labels);
      alert('Labels saved successfully! Check console for details.');
    } catch (error) {
      console.error('Labels save failed:', error);
      alert('Labels save failed! Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const testPlanUpload = async () => {
    if (!testSiteId.trim()) {
      alert('Please enter a site ID to test with');
      return;
    }
    
    if (!planFile) {
      alert('Please select a file first');
      return;
    }

    setIsLoading(true);
    try {
      const fileExt = planFile.name.split('.').pop();
      const fileName = `${testSiteId}/plan.${fileExt}`;
      
      // Try to upload to plans bucket
      const { error: uploadError } = await supabase.storage
        .from('plans')
        .upload(fileName, planFile);

      if (uploadError) {
        console.error('Plan upload error details:', {
          message: uploadError.message,
          status: uploadError.status,
          statusCode: uploadError.statusCode,
          error: uploadError
        });
        alert(`Plan upload failed: ${uploadError.message}`);
        // Try photos bucket as fallback
        const { error: fallbackError } = await supabase.storage
          .from('photos')
          .upload(`plans/${fileName}`, planFile);
        
        if (!fallbackError) {
          await supabase
            .from('sites')
            .update({ plan_url: `plans/${fileName}` })
            .eq('id', testSiteId);
          console.log('Plan uploaded to photos bucket as fallback');
          alert('Plan uploaded to photos bucket as fallback! Check console for details.');
        } else {
          console.error('Fallback plan upload failed:', {
            message: fallbackError.message,
            status: fallbackError.status,
            statusCode: fallbackError.statusCode,
            error: fallbackError
          });
          alert(`Both plan uploads failed: ${fallbackError.message}`);
        }
      } else {
        await supabase
          .from('sites')
          .update({ plan_url: fileName })
          .eq('id', testSiteId);
        console.log('Plan uploaded successfully');
        alert('Plan uploaded successfully! Check console for details.');
      }
    } catch (error) {
      console.error('Plan upload process failed:', error);
      alert('Plan upload failed! Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black mb-2">Test Onboarding Features</h1>
          <p className="text-gray-600">Test labels and plan upload functionality</p>
        </div>

        {/* Site ID Input */}
        <Card>
          <CardContent className="p-6">
            <Label htmlFor="siteId">Site ID (required for testing)</Label>
            <Input
              id="siteId"
              placeholder="Enter an existing site ID"
              value={testSiteId}
              onChange={(e) => setTestSiteId(e.target.value)}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Use an existing site ID from your database to test with
            </p>
          </CardContent>
        </Card>

        {/* Labels Test */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-black" />
              <h2 className="text-xl font-semibold text-black">Test Labels</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a label (e.g., Issue, Progress, Completed)"
                  value={tempLabel}
                  onChange={(e) => setTempLabel(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLabel()}
                />
                <Button onClick={addLabel} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {labels.length > 0 && (
                <div className="space-y-2">
                  <Label>Your Labels:</Label>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <Badge key={label} variant="outline" className="flex items-center gap-1">
                        {label}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeLabel(label)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={testLabels} 
                disabled={isLoading || labels.length === 0 || !testSiteId}
                className="w-full"
              >
                {isLoading ? 'Saving Labels...' : 'Test Save Labels'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plan Upload Test */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-black" />
              <h2 className="text-xl font-semibold text-black">Test Plan Upload</h2>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300  p-8 text-center">
                <input
                  type="file"
                  id="planFile"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="planFile" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload a plan file</p>
                  <p className="text-sm text-gray-400">Supports images (PNG, JPG) and PDF files</p>
                </label>
              </div>

              {planFile && (
                <div className="bg-gray-100 p-3  flex items-center gap-2">
                  <Check className="h-4 w-4 text-black" />
                  <span className="text-sm text-black">File selected: {planFile.name}</span>
                </div>
              )}

              <Button 
                onClick={testPlanUpload} 
                disabled={isLoading || !planFile || !testSiteId}
                className="w-full"
              >
                {isLoading ? 'Uploading Plan...' : 'Test Upload Plan'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Open browser console (F12) to see detailed logs of the test results
          </p>
        </div>
      </div>
    </div>
  );
}