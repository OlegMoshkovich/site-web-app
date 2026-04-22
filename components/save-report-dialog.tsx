"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SaveReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedObservations: Set<string>;
  language: string;
  onSuccess: () => void;
}

export function SaveReportDialog({
  isOpen,
  onClose,
  selectedObservations,
  language,
  onSuccess,
}: SaveReportDialogProps) {
  const router = useRouter();
  const supabase = createClient();

  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportErsteller, setReportErsteller] = useState('');
  const [reportBaustelle, setReportBaustelle] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = useCallback(() => {
    setReportTitle('');
    setReportDescription('');
    setReportErsteller('');
    setReportBaustelle('');
    setReportDate('');
    onClose();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    if (!reportTitle.trim()) {
      alert('Please enter a title for the report');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to save reports');
        return;
      }

      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          title: reportTitle,
          description: reportDescription || null,
          ersteller: reportErsteller || null,
          baustelle: reportBaustelle || null,
          report_date: reportDate || null,
          settings: {
            language,
            selectedIds: Array.from(selectedObservations),
          },
        })
        .select()
        .single();

      if (reportError) {
        console.error('Error creating report:', reportError);
        alert('Error saving report. Please try again.');
        return;
      }

      const reportObservations = Array.from(selectedObservations).map(obsId => ({
        report_id: reportData.id,
        observation_id: obsId,
      }));

      const { error: observationsError } = await supabase
        .from('report_observations')
        .insert(reportObservations);

      if (observationsError) {
        console.error('Error linking observations to report:', observationsError);
        alert('Error saving report observations. Please try again.');
        return;
      }

      alert('Report saved successfully!');
      handleClose();
      onSuccess();
      router.push('/reports');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [reportTitle, reportDescription, reportErsteller, reportBaustelle, reportDate, selectedObservations, language, supabase, router, handleClose, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md border border-border bg-card p-6 text-card-foreground shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-report-title"
      >
        <h3 id="save-report-title" className="text-lg font-semibold leading-none tracking-tight text-foreground">
          Save Report
        </h3>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-title" className="text-muted-foreground">
              Title *
            </Label>
            <Input
              id="report-title"
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Enter report title"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-baustelle" className="text-muted-foreground">
              Baustelle
            </Label>
            <Input
              id="report-baustelle"
              type="text"
              value={reportBaustelle}
              onChange={(e) => setReportBaustelle(e.target.value)}
              placeholder="Enter construction site"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-ersteller" className="text-muted-foreground">
              Ersteller
            </Label>
            <Input
              id="report-ersteller"
              type="text"
              value={reportErsteller}
              onChange={(e) => setReportErsteller(e.target.value)}
              placeholder="Enter report creator"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-date" className="text-muted-foreground">
              Report Date
            </Label>
            <Input
              id="report-date"
              type="datetime-local"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-description" className="text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="report-description"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Enter report description (optional)"
              rows={3}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-6">
          <Button onClick={handleClose} variant="outline" disabled={isSaving} className="border-border">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !reportTitle.trim()}>
            {isSaving ? 'Saving...' : 'Save Report'}
          </Button>
        </div>
      </div>
    </div>
  );
}
