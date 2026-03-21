"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Label } from "@/lib/labels";
import type { ObservationWithUrl } from "@/lib/store/observations-store";
import {
  filterObservationsByDateRange,
  filterObservationsByLabels,
  filterObservationsByUserId,
  filterObservationsBySiteId,
} from "@/lib/search-utils";

interface UseFilterStateParams {
  user: { id: string; email?: string } | null;
  observations: ObservationWithUrl[];
  searchResults: ObservationWithUrl[];
  siteLabels: Map<string, Label[]>;
  fetchSiteLabels: (siteId: string, userId: string) => void;
}

export function useFilterState({
  user,
  observations,
  searchResults,
  siteLabels,
  fetchSiteLabels,
}: UseFilterStateParams) {
  const supabase = createClient();

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showLabelSelector, setShowLabelSelector] = useState<boolean>(false);
  const [showSearchSelector, setShowSearchSelector] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDateSelector, setShowDateSelector] = useState<boolean>(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; displayName: string }[]>([]);
  const [availableSites, setAvailableSites] = useState<{ id: string; name: string }[]>([]);

  // Cookie helpers
  const setCookie = useCallback((name: string, value: string, days: number = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }, []);

  const getCookie = useCallback((name: string): string => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return "";
  }, []);

  const deleteCookie = useCallback((name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  }, []);

  // Structured labels scoped to the selected site
  const filterPanelSiteLabels = useMemo(() => {
    if (selectedSiteId) return siteLabels.get(selectedSiteId) || [];
    const all: Label[] = [];
    const seen = new Set<string>();
    siteLabels.forEach(labels => {
      labels.forEach(l => { if (!seen.has(l.id)) { seen.add(l.id); all.push(l); } });
    });
    return all;
  }, [siteLabels, selectedSiteId]);

  const hasActiveFilters = !!(startDate || endDate || selectedUserId || selectedSiteId);

  const getFilteredObservations = useCallback(() => {
    let filtered = (showSearchSelector && searchQuery.trim()) ? searchResults : observations;
    if (showDateSelector && startDate && endDate) {
      filtered = filterObservationsByDateRange(filtered, startDate, endDate);
    }
    if (selectedUserId) filtered = filterObservationsByUserId(filtered, selectedUserId);
    if (selectedSiteId) filtered = filterObservationsBySiteId(filtered, selectedSiteId);
    if (selectedLabels.length > 0) {
      filtered = filterObservationsByLabels(filtered, selectedLabels, false);
    }
    return filtered;
  }, [observations, searchResults, showDateSelector, startDate, endDate, selectedUserId, selectedSiteId, showSearchSelector, searchQuery, selectedLabels]);

  const handleClearDateRange = useCallback(() => {
    setStartDate(""); setEndDate(""); setSelectedUserId(""); setSelectedSiteId("");
    deleteCookie('filter_startDate'); deleteCookie('filter_endDate');
    deleteCookie('filter_userId'); deleteCookie('filter_siteId');
  }, [deleteCookie]);

  // Load filter cookies on mount
  useEffect(() => {
    const savedStartDate = getCookie('filter_startDate');
    const savedEndDate = getCookie('filter_endDate');
    const savedUserId = getCookie('filter_userId');
    const savedSiteId = getCookie('filter_siteId');
    if (savedStartDate) setStartDate(savedStartDate);
    if (savedEndDate) setEndDate(savedEndDate);
    if (savedUserId) setSelectedUserId(savedUserId);
    if (savedSiteId) setSelectedSiteId(savedSiteId);
  }, [getCookie]);

  // Persist filter cookies
  useEffect(() => {
    startDate ? setCookie('filter_startDate', startDate) : deleteCookie('filter_startDate');
    endDate ? setCookie('filter_endDate', endDate) : deleteCookie('filter_endDate');
    selectedUserId ? setCookie('filter_userId', selectedUserId) : deleteCookie('filter_userId');
    selectedSiteId ? setCookie('filter_siteId', selectedSiteId) : deleteCookie('filter_siteId');
  }, [startDate, endDate, selectedUserId, selectedSiteId, setCookie, deleteCookie]);

  // Extract unique users from observations
  useEffect(() => {
    if (observations.length === 0) return;
    const allUsers = new Map<string, string>();
    observations.forEach(obs => {
      if (obs.user_id) {
        allUsers.set(obs.user_id, obs.user_email || `User ${obs.user_id.slice(0, 8)}...`);
      }
    });
    setAvailableUsers(
      Array.from(allUsers.entries())
        .map(([id, displayName]) => ({ id, displayName }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
    );
  }, [observations]);

  // Fetch sites for filter
  useEffect(() => {
    if (!user?.id) return;
    const fetchAllSites = async () => {
      try {
        const [
          { data: ownedSites, error: ownedError },
          { data: collaborations, error: collabError },
        ] = await Promise.all([
          supabase.from('sites').select('id, name').eq('user_id', user.id).order('name', { ascending: true }),
          supabase.from('site_collaborators').select('site_id, sites(id, name)').eq('user_id', user.id).eq('status', 'accepted'),
        ]);
        if (ownedError) { console.error('Error loading owned sites:', ownedError); return; }
        if (collabError) console.error('Error loading collaborative sites:', collabError);
        const collaborativeSites = (collaborations || []).map((c: any) => c.sites).filter(Boolean);
        const all = [...(ownedSites || []), ...collaborativeSites];
        const unique = all.reduce((acc: any[], site: any) => {
          if (!acc.find((s: any) => s.id === site.id)) acc.push(site);
          return acc;
        }, []);
        unique.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setAvailableSites(unique);
      } catch (error) {
        console.error('Error fetching sites:', error);
      }
    };
    fetchAllSites();
  }, [user, supabase]);

  // Fetch structured site labels when the label filter is opened
  useEffect(() => {
    if (!showLabelSelector || !user) return;
    if (selectedSiteId) {
      fetchSiteLabels(selectedSiteId, user.id);
    } else {
      const siteIds = [...new Set(observations.map((o: any) => o.site_id).filter(Boolean))];
      siteIds.forEach((siteId: string) => {
        fetchSiteLabels(siteId, user.id);
      });
    }
  }, [showLabelSelector, selectedSiteId, user, observations, fetchSiteLabels]);

  return {
    startDate, setStartDate,
    endDate, setEndDate,
    selectedUserId, setSelectedUserId,
    selectedSiteId, setSelectedSiteId,
    selectedLabels, setSelectedLabels,
    showLabelSelector, setShowLabelSelector,
    showSearchSelector, setShowSearchSelector,
    searchQuery, setSearchQuery,
    showDateSelector, setShowDateSelector,
    availableUsers,
    availableSites,
    filterPanelSiteLabels,
    hasActiveFilters,
    getFilteredObservations,
    handleClearDateRange,
  };
}
