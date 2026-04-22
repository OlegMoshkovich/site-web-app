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
  const [fetchError, setFetchError] = useState<string | null>(null);
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
        setFetchError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user is admin of any site (parallel)
        const [{ data: ownedSites }, { data: collaboratorSites }] = await Promise.all([
          supabase.from('sites').select('id, name').eq('user_id', user.id),
          supabase
            .from('site_collaborators')
            .select('site_id, role, sites(id, name)')
            .eq('user_id', user.id)
            .eq('status', 'accepted')
            .in('role', ['admin', 'owner']),
        ]);

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

        // Always fetch user's own reports — this is the guaranteed baseline
        const { data: ownReports, error: ownError } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ownError) {
          console.error('Error fetching reports:', ownError);
          setFetchError(`Failed to load reports: ${ownError.message}`);
          return;
        }

        // For admins, also fetch reports from other team members on their sites
        let teamReports: Report[] = [];
        if (userIsAdmin && adminSiteIds.length > 0) {
          const { data: allData } = await supabase
            .from('reports')
            .select('*')
            .neq('user_id', user.id)
            .order('created_at', { ascending: false });

          teamReports = allData || [];
        }

        // Merge own + team reports (deduped by id)
        const seenIds = new Set((ownReports || []).map((r: Report) => r.id));
        const reportsData: Report[] = [
          ...(ownReports || []),
          ...teamReports.filter((r: Report) => !seenIds.has(r.id)),
        ];

        if (!reportsData.length) {
          setAllReports([]);
          setReports([]);
          return;
        }

        const reportIds = reportsData.map((r: Report) => r.id);
        const uniqueUserIds = [...new Set(reportsData.map((r: Report) => r.user_id))];

        // Batch: fetch ALL report_observations + ALL profiles in parallel
        const [{ data: allReportObs }, { data: allProfiles }] = await Promise.all([
          supabase
            .from('report_observations')
            .select('report_id, observation_id')
            .in('report_id', reportIds),
          supabase
            .from('profiles')
            .select('id, email')
            .in('id', uniqueUserIds),
        ]);

        // Build profile lookup map
        const profileMap = new Map<string, string>(
          (allProfiles || []).map((p: { id: string; email: string }) => [p.id, p.email] as [string, string])
        );

        // Group observation IDs by report
        const obsByReport = new Map<string, string[]>();
        (allReportObs || []).forEach((ro: { report_id: string; observation_id: string }) => {
          if (!obsByReport.has(ro.report_id)) obsByReport.set(ro.report_id, []);
          obsByReport.get(ro.report_id)!.push(ro.observation_id);
        });

        // Assemble enriched reports (skip site_id lookup — not needed for display)
        const enrichedReports = reportsData.map((report: Report) => {
          const obsIds = obsByReport.get(report.id) || [];
          return {
            ...report,
            observation_count: obsIds.length,
            user_email: profileMap.get(report.user_id) || 'Unknown',
            site_ids: [] as string[],
          };
        });

        // All accessible reports are already scoped:
        // own reports fetched directly, team reports filtered by RLS
        const filteredReports = enrichedReports;

        setAllReports(filteredReports);
        setReports(filteredReports);

        // Extract unique users and sites for filters (only from visible reports)
        const uniqueUsers = new Map<string, string>();
        const uniqueSiteIds = new Set<string>();

        filteredReports.forEach((report: Report) => {
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
        setFetchError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
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
    <main className="flex min-h-screen flex-col items-center overflow-x-hidden bg-background text-foreground">
      <div className="flex w-full flex-1 flex-col items-center gap-0 overflow-x-hidden">
        {/* Header — match settings / semantic theme */}
        <nav className="sticky top-0 z-20 flex h-16 w-full justify-center border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
          <div className="flex w-full max-w-5xl items-center justify-start px-3 text-sm sm:px-5">
          <button 
              onClick={() => router.push('/')}
              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              <Image
                src="/images/banner_logo.png"
                alt="Site Logo"
                width={120}
                height={32}
                className="h-5 w-auto object-contain lg:h-6"
              />
            </button>
            <button 
              onClick={() => router.push('/')}
              className="ml-4 rounded p-1 text-foreground transition-colors hover:bg-muted"
              title="Back to Home"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </nav>

        {/* Main content */}
        <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 overflow-x-hidden px-3 py-6 sm:px-5">
          {/* Filter controls - only show for admins */}
          {isAdmin && !loading && allReports.length > 0 && (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span>Filters:</span>
              </div>
              <div className="flex w-full flex-1 flex-col gap-3 sm:w-auto sm:flex-row">
                <div className="flex flex-1 flex-col gap-1.5 sm:min-w-[200px]">
                  <label className="text-xs font-medium text-muted-foreground">User</label>
                  <Select value={selectedUserFilter} onValueChange={setSelectedUserFilter}>
                    <SelectTrigger className="w-full">
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
                <div className="flex flex-1 flex-col gap-1.5 sm:min-w-[200px]">
                  <label className="text-xs font-medium text-muted-foreground">Site</label>
                  <Select value={selectedSiteFilter} onValueChange={setSelectedSiteFilter}>
                    <SelectTrigger className="w-full">
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
              <div className="text-muted-foreground">Loading reports...</div>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-destructive/80" />
              <h3 className="mb-2 text-lg font-medium text-foreground">Could not load reports</h3>
              <p className="mb-4 max-w-md text-sm text-destructive">{fetchError}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium text-foreground">No reports yet</h3>
              <p className="mb-4 text-muted-foreground">
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
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                    <div className="flex w-full items-center justify-between overflow-hidden text-sm text-muted-foreground">
                      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">{report.observation_count} observations</span>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span className="truncate">{formatDate(report.report_date || report.created_at)}</span>
                        </div>
                        {isAdmin && report.user_email && report.user_id !== user?.id && (
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <span className="text-xs text-muted-foreground/80">by</span>
                            <span className="truncate text-xs font-medium text-foreground">{report.user_email}</span>
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