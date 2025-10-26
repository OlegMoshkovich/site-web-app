"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  Eye,
  Trash2,
  Download,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface Report {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  settings: any;
  observation_count?: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        router.push('/');
        return;
      }
      await fetchReports();
    };

    getUser();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch reports
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      // Get observation counts for each report
      const reportsWithCount = await Promise.all(
        (reportsData || []).map(async (report) => {
          const { count } = await supabase
            .from('report_observations')
            .select('*', { count: 'exact', head: true })
            .eq('report_id', report.id);
          
          return {
            ...report,
            observation_count: count || 0
          };
        })
      );

      setReports(reportsWithCount);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        console.error('Error deleting report:', error);
        return;
      }

      // Remove from local state
      setReports(reports.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleViewReport = (reportId: string) => {
    router.push(`/reports/${reportId}`);
  };

  const handleExportReport = async (reportId: string) => {
    router.push(`/report?reportId=${reportId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-0 items-center">
        {/* Header */}
        <nav className="sticky top-0 z-20 w-full flex justify-center h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="w-full max-w-5xl flex justify-between items-center px-3 sm:px-5 text-sm">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold">Reports</h1>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-6 max-w-5xl px-3 sm:px-5 py-6 w-full">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading reports...</div>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first report by selecting observations and clicking "Generate Report"
              </p>
              <Button onClick={() => router.push('/')} variant="outline">
                Go to Observations
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        {report.description && (
                          <CardDescription>{report.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewReport(report.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="View report"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleExportReport(report.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Export report"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteReport(report.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{report.observation_count} observations</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(report.created_at)}</span>
                        </div>
                      </div>
                      <Badge variant="secondary">Report</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}