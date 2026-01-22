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
  Share,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
    
interface Report {
  id: string;
  title: string;
  description: string | null;
  report_date?: string | null;
  created_at: string;
  updated_at: string;
  settings: Record<string, unknown>;
  observation_count?: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
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

    const fetchReports = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch only reports created by the current user
        const { data: reportsData, error } = await supabase
          .from('reports')
          .select('*, report_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching reports:', error);
          return;
        }

        // Get observation counts for each report
        const reportsWithCount = await Promise.all(
          (reportsData || []).map(async (report: Report) => {
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

    getUser();
  }, [router, supabase]);


  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      // First delete related report_observations
      const { error: reportObsError } = await supabase
        .from('report_observations')
        .delete()
        .eq('report_id', reportId);

      if (reportObsError) {
        console.error('Error deleting report observations:', reportObsError);
        alert('Error deleting report. Please try again.');
        return;
      }

      // Then delete the report
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        console.error('Error deleting report:', error);
        alert('Error deleting report. Please try again.');
        return;
      }

      // Remove from local state
      setReports(reports.filter(report => report.id !== reportId));
      alert('Report deleted successfully!');
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Error deleting report. Please try again.');
    }
  };

  const handleViewReport = (reportId: string) => {
    router.push(`/reports/${reportId}`);
  };


  const handleShareReport = async (reportId: string) => {
    const shareUrl = `${window.location.origin}/reports/${reportId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Report link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback: show a prompt with the URL
      prompt('Copy this link to share the report:', shareUrl);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center overflow-x-hidden">
      <div className="flex-1 w-full flex flex-col gap-0 items-center overflow-x-hidden">
        {/* Header */}
        <nav className="sticky top-0 z-20 w-full flex justify-center h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="w-full max-w-5xl flex justify-start items-center px-3 sm:px-5 text-sm">
          <button 
              onClick={() => router.push('/')}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Image
                src="/images/banner_logo.png"
                alt="Site Logo"
                width={120}
                height={32}
                className="w-auto object-contain lg:h-6 h-5"
              />
            </button>
            <button 
              onClick={() => router.push('/')}
              className="hover:bg-gray-100 transition-colors p-1 rounded ml-4"
              title="Back to Home"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-6 max-w-5xl px-3 sm:px-5 py-6 w-full overflow-x-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading reports...</div>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first report by selecting observations and clicking &quot;Generate Report&quot;
              </p>
              <Button onClick={() => router.push('/')} variant="outline">
                Go to Observations
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 w-full">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="hover:shadow-md transition-shadow cursor-pointer w-full overflow-hidden"
                  onClick={() => handleViewReport(report.id)}
                >
                  <CardHeader>
                    {/* Title and buttons on same line */}
                    <div className="flex items-start justify-between pb-3 gap-2 w-full">
                      <CardTitle className="text-lg flex-1 line-clamp-2 sm:line-clamp-none break-words min-w-0">{report.title}</CardTitle>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReport(report.id);
                          }}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="View report"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareReport(report.id);
                          }}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Share report"
                        >
                          <Share className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(report.id);
                          }}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Description in separate container below */}
                    {report.description && (
                      <div className="mt-3 w-full overflow-hidden">
                        <CardDescription className="break-words">{report.description}</CardDescription>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500 w-full overflow-hidden">
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap min-w-0">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{report.observation_count} observations</span>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{formatDate(report.report_date || report.created_at)}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0 ml-2">Report</Badge>
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