"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-none p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Save Report</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="report-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              id="report-title"
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Enter report title"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="report-baustelle" className="block text-sm font-medium text-gray-700 mb-1">
              Baustelle
            </label>
            <input
              id="report-baustelle"
              type="text"
              value={reportBaustelle}
              onChange={(e) => setReportBaustelle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Enter construction site"
            />
          </div>
          <div>
            <label htmlFor="report-ersteller" className="block text-sm font-medium text-gray-700 mb-1">
              Ersteller
            </label>
            <input
              id="report-ersteller"
              type="text"
              value={reportErsteller}
              onChange={(e) => setReportErsteller(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Enter report creator"
            />
          </div>
          <div>
            <label htmlFor="report-date" className="block text-sm font-medium text-gray-700 mb-1">
              Report Date
            </label>
            <input
              id="report-date"
              type="datetime-local"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label htmlFor="report-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="report-description"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Enter report description (optional)"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={handleClose} variant="outline" disabled={isSaving}>
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
