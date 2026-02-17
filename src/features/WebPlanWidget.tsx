'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PdfPlanCanvas } from '@/components/pdf-plan-canvas';

const PLAN_WIDTH = 320;
const PLAN_HEIGHT = 280;

interface WebPlanWidgetProps {
  siteId: string;
  userId: string;
  observations?: any[];                   // for displaying existing anchors
  onAnchorDrop?: (anchor: { x: number; y: number }, planId: string) => void;
  onAnchorClick?: (observationNumber: number) => void;
  selectedObservationNumber?: number | null;
  pendingAnchor?: { x: number; y: number } | null;
}

interface SitePlan {
  id: string;
  plan_name: string;
  plan_url: string;
  site_id: string;
  isPdf?: boolean;
}

function renderAnchor(
  anchor: { x: number; y: number },
  index: number,
  observationNumber: number,
  isSelected: boolean,
  onPress: () => void,
) {
  const left = anchor.x * PLAN_WIDTH - 15;
  const top  = anchor.y * PLAN_HEIGHT - 15;
  return (
    <div
      key={index}
      style={{
        position: 'absolute',
        left,
        top,
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: isSelected ? 10 : 1,
        cursor: 'pointer',
      }}
      onClick={(e) => { e.stopPropagation(); onPress(); }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: isSelected ? 'red' : 'black',
          border: isSelected ? '2px solid white' : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isSelected ? 'scale(1.2)' : 'scale(1)',
        }}
      >
        <span style={{ color: 'white', fontSize: isSelected ? 9 : 8, lineHeight: 1 }}>
          {observationNumber}
        </span>
      </div>
    </div>
  );
}

export default function WebPlanWidget({
  siteId,
  observations = [],
  onAnchorDrop,
  onAnchorClick,
  selectedObservationNumber,
  pendingAnchor,
}: WebPlanWidgetProps) {
  const supabase = createClient();

  const [plans, setPlans] = useState<SitePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;

    const loadPlans = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('site_plans')
          .select('id, plan_name, plan_url, site_id')
          .eq('site_id', siteId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('WebPlanWidget: error loading plans:', error);
          return;
        }

        // Generate 7-day signed URLs
        const plansWithUrls = await Promise.all(
          (data || []).map(async (plan: SitePlan) => {
            try {
              const fileName = plan.plan_url.split('/').pop()?.split('?')[0];
              const filePath = `${plan.site_id}/${fileName}`;
              const { data: urlData, error: urlError } = await supabase.storage
                .from('plans')
                .createSignedUrl(filePath, 604800);
              if (urlError || !urlData) return plan;
              const originalFileName = (fileName ?? '').toLowerCase();
              const isPdf = originalFileName.endsWith('.pdf');
              return { ...plan, plan_url: urlData.signedUrl, isPdf };
            } catch {
              return plan;
            }
          }),
        );

        setPlans(plansWithUrls);
        if (plansWithUrls.length > 0) {
          setSelectedPlanId(plansWithUrls[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, [siteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Build list of anchors that belong to the selected plan.
  // An observation is associated with this plan when obs.plan === selectedPlanId
  // (or when there's no plan field and we fall back to any anchor present).
  const planAnchors: Array<{ x: number; y: number; observationNumber: number }> = [];
  observations.forEach((obs, globalIdx) => {
    const obsPlan: string | null | undefined = obs.plan;
    if (obsPlan && obsPlan !== selectedPlanId) return;

    let anchor: { x: number; y: number } | null = null;

    if (
      obs.plan_anchor &&
      typeof obs.plan_anchor === 'object' &&
      obs.plan_anchor.x != null &&
      obs.plan_anchor.y != null &&
      !(obs.plan_anchor.x === 0 && obs.plan_anchor.y === 0)
    ) {
      anchor = { x: Number(obs.plan_anchor.x), y: Number(obs.plan_anchor.y) };
    } else if (
      obs.anchor_x != null &&
      obs.anchor_y != null &&
      !(obs.anchor_x === 0 && obs.anchor_y === 0)
    ) {
      anchor = { x: obs.anchor_x, y: obs.anchor_y };
    }

    if (anchor) {
      planAnchors.push({ ...anchor, observationNumber: globalIdx + 1 });
    }
  });

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onAnchorDrop || !selectedPlanId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const locationX = e.clientX - rect.left;
    const locationY = e.clientY - rect.top;
    const anchor = { x: locationX / PLAN_WIDTH, y: locationY / PLAN_HEIGHT };
    onAnchorDrop(anchor, selectedPlanId);
  };

  if (isLoading) {
    return (
      <div
        style={{
          width: PLAN_WIDTH,
          height: PLAN_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div
        style={{
          width: PLAN_WIDTH,
          height: PLAN_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed #d1d5db',
          borderRadius: 8,
          color: '#9ca3af',
          fontSize: 14,
        }}
      >
        No plans available
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Plan selector — only shown when multiple plans exist */}
      {plans.length > 1 && (
        <select
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          style={{
            width: PLAN_WIDTH,
            padding: '4px 8px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            background: 'white',
          }}
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.plan_name}
            </option>
          ))}
        </select>
      )}

      {/* Drop-mode hint */}
      {onAnchorDrop && (
        <div
          style={{
            width: PLAN_WIDTH,
            textAlign: 'center',
            fontSize: 12,
            color: '#6b7280',
          }}
        >
          Click on the plan to place the anchor
        </div>
      )}

      {/* Plan image + anchors */}
      <div
        style={{
          position: 'relative',
          width: PLAN_WIDTH,
          height: PLAN_HEIGHT,
          border: '1px solid #d1d5db',
          borderRadius: 8,
          overflow: 'hidden',
          cursor: onAnchorDrop ? 'crosshair' : 'default',
        }}
        onClick={handleContainerClick}
      >
        {selectedPlan ? (
          selectedPlan.isPdf ? (
            <PdfPlanCanvas url={selectedPlan.plan_url} width={PLAN_WIDTH} height={PLAN_HEIGHT} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedPlan.plan_url}
              alt={selectedPlan.plan_name}
              style={{
                width: PLAN_WIDTH,
                height: PLAN_HEIGHT,
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
              }}
            />
          )
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: 13,
            }}
          >
            No plan selected
          </div>
        )}

        {/* Existing anchors */}
        {planAnchors.map((anchor, index) => {
          const isSelected = anchor.observationNumber === selectedObservationNumber;
          return renderAnchor(
            anchor,
            index,
            anchor.observationNumber,
            isSelected,
            () => onAnchorClick?.(anchor.observationNumber),
          );
        })}

        {/* Pending anchor — blue dot */}
        {pendingAnchor && (
          <div
            style={{
              position: 'absolute',
              left: pendingAnchor.x * PLAN_WIDTH - 7,
              top: pendingAnchor.y * PLAN_HEIGHT - 7,
              backgroundColor: 'rgba(0,120,255,0.85)',
              borderColor: 'white',
              borderWidth: 2,
              borderStyle: 'solid',
              width: 14,
              height: 14,
              borderRadius: 7,
              pointerEvents: 'none',
              zIndex: 20,
            }}
          />
        )}
      </div>
    </div>
  );
}
