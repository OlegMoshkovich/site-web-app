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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Calendar,
  Eye,
  Trash2,
  Share,
  ArrowLeft,
  Filter,
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
  user_id: string;
  user_email?: string;
  site_ids?: string[];
}

interface Site {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  email: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [availableSites, setAvailableSites] = useState<Site[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
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

        // Check if user is admin of any site
        const { data: ownedSites } = await supabase
          .from('sites')
          .select('id, name')
          .eq('user_id', user.id);

        const { data: collaboratorSites } = await supabase
          .from('site_collaborators')
          .select('site_id, role, sites(id, name)')
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .in('role', ['admin', 'owner']);

        // Combine owned sites and admin sites
        const adminSiteIds = [
          ...(ownedSites || []).map((s: Site) => s.id),
          ...(collaboratorSites || []).map((s: { site_id: string }) => s.site_id)
        ];

        const allAdminSites = [
          ...(ownedSites || []),
          ...(collaboratorSites || []).map((cs: { sites: Site }) => cs.sites).filter(Boolean)
        ] as Site[];

        const userIsAdmin = adminSiteIds.length > 0;
        setIsAdmin(userIsAdmin);

        // Fetch reports based on admin status
        let reportsQuery = supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });

        // If not admin, only show user's own reports
        if (!userIsAdmin) {
          reportsQuery = reportsQuery.eq('user_id', user.id);
        }

        const { data: reportsData, error } = await reportsQuery;

        if (error) {
          console.error('Error fetching reports:', error);
          return;
        }

        // Enrich reports with observation counts, user info, and site info
        const enrichedReports = await Promise.all(
          (reportsData || []).map(async (report: Report) => {
            // Get observation count
            const { count } = await supabase
              .from('report_observations')
              .select('*', { count: 'exact', head: true })
              .eq('report_id', report.id);

            // Get user profile for this report
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', report.user_id)
              .single();

            // Get site IDs for this report's observations
            const { data: reportObservations } = await supabase
              .from('report_observations')
              .select('observation_id')
              .eq('report_id', report.id);

            const observationIds = (reportObservations || []).map((ro: { observation_id: string }) => ro.observation_id);

            let siteIds: string[] = [];
            if (observationIds.length > 0) {
              const { data: observations } = await supabase
                .from('observations')
                .select('site_id')
                .in('id', observationIds);

              siteIds = [...new Set((observations || [])
                .map((o: { site_id: string | null }) => o.site_id)
                .filter(Boolean) as string[])];
            }

            return {
              ...report,
              observation_count: count || 0,
              user_email: profile?.email || 'Unknown',
              site_ids: siteIds
            };
          })
        );

        // Filter reports if user is admin - only show reports they have access to
        let filteredReports = enrichedReports;
        if (userIsAdmin) {
          filteredReports = enrichedReports.filter(report => {
            // Show if it's their own report
            if (report.user_id === user.id) return true;
            // Show if report contains observations from sites they admin
            return report.site_ids?.some((siteId: string) => adminSiteIds.includes(siteId));
          });
        }

        setAllReports(filteredReports);
        setReports(filteredReports);

        // Extract unique users and sites for filters (only from visible reports)
        const uniqueUsers = new Map<string, string>();
        const uniqueSiteIds = new Set<string>();

        filteredReports.forEach(report => {
          if (report.user_email) {
            uniqueUsers.set(report.user_id, report.user_email);
          }
          report.site_ids?.forEach((siteId: string) => uniqueSiteIds.add(siteId));
        });

        setAvailableUsers(
          Array.from(uniqueUsers.entries()).map(([id, email]) => ({ id, email }))
        );

        // Get site names for the unique site IDs
        if (uniqueSiteIds.size > 0) {
          const { data: sitesData } = await supabase
            .from('sites')
            .select('id, name')
            .in('id', Array.from(uniqueSiteIds));

          setAvailableSites(sitesData || []);
        } else {
          setAvailableSites([]);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router, supabase]);

  // Filter reports based on selected filters
  useEffect(() => {
    let filtered = [...allReports];

    // Filter by user
    if (selectedUserFilter !== 'all') {
      filtered = filtered.filter(report => report.user_id === selectedUserFilter);
    }

    // Filter by site
    if (selectedSiteFilter !== 'all') {
      filtered = filtered.filter(report =>
        report.site_ids?.includes(selectedSiteFilter)
      );
    }

    setReports(filtered);
  }, [selectedUserFilter, selectedSiteFilter, allReports]);


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
          {/* Filter controls - only show for admins */}
          {isAdmin && !loading && allReports.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Filter className="h-4 w-4" />
                <span>Filters:</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
                <div className="flex flex-col gap-1.5 flex-1 sm:min-w-[200px]">
                  <label className="text-xs font-medium text-gray-600">User</label>
                  <Select value={selectedUserFilter} onValueChange={setSelectedUserFilter}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      {availableUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 sm:min-w-[200px]">
                  <label className="text-xs font-medium text-gray-600">Site</label>
                  <Select value={selectedSiteFilter} onValueChange={setSelectedSiteFilter}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="All sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sites</SelectItem>
                      {availableSites.map(site => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

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
                        {isAdmin && report.user_email && report.user_id !== user?.id && (
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <span className="text-xs text-gray-400">by</span>
                            <span className="truncate text-xs font-medium">{report.user_email}</span>
                          </div>
                        )}
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