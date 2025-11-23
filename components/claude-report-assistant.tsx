"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Copy } from 'lucide-react';

interface ClaudeReportAssistantProps {
  selectedObservationIds: string[];
  reportTitle: string;
  onSummaryGenerated: (summary: string) => void;
}

export function ClaudeReportAssistant({
  selectedObservationIds,
  reportTitle,
  onSummaryGenerated,
}: ClaudeReportAssistantProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const generateSummary = async () => {
    if (selectedObservationIds.length === 0) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_summary',
          observationIds: selectedObservationIds,
          reportTitle,
          customPrompt: customPrompt || undefined,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedSummary(data.content);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const useSummary = () => {
    onSummaryGenerated(generatedSummary);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedSummary);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">AI Report Assistant</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., Focus on safety issues, include timeline analysis..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-purple-400"
              rows={2}
            />
          </div>

          <Button
            onClick={generateSummary}
            disabled={isGenerating || selectedObservationIds.length === 0}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Generating Summary...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-2" />
                Generate AI Summary ({selectedObservationIds.length} observations)
              </>
            )}
          </Button>

          {generatedSummary && (
            <div className="border border-gray-200 rounded-none p-3 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-gray-700">Generated Summary:</span>
                <div className="flex gap-1">
                  <Button
                    onClick={copyToClipboard}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap mb-3">
                {generatedSummary}
              </div>
              <Button
                onClick={useSummary}
                size="sm"
                className="w-full"
              >
                Use This Summary
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}