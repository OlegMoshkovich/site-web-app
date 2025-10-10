'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';

interface AnchorPoint {
  x: number;
  y: number;
}

interface AnchorWithObservation extends AnchorPoint {
  observationId: string;
  note?: string;
  index: number;
}

interface PlanData {
  planName: string;
  anchors: AnchorWithObservation[];
}

interface PlanDisplayWidgetProps {
  observations: Array<{
    id: string;
    plan?: string | null;
    note?: string | null;
    plan_anchor?: Record<string, unknown> | null;
    anchor_x?: number | null;
    anchor_y?: number | null;
  }>;
  plan: string;
}

const PlanDisplayWidget: React.FC<PlanDisplayWidgetProps> = ({ observations, plan }) => {
  // Use the same dimensions as React Native version
  const imageWidth = 320;
  const imageHeight = 280;
  
  const getPlanImageSrc = (planName: string) => {
    return `/plans/${planName}.png`;
  };

  const getAnchorPoint = (item: PlanDisplayWidgetProps['observations'][0]): AnchorPoint | null => {
    if (item.plan_anchor && 
        typeof item.plan_anchor === 'object' && 
        item.plan_anchor.x !== null && 
        item.plan_anchor.x !== undefined && 
        item.plan_anchor.y !== null && 
        item.plan_anchor.y !== undefined &&
        !(item.plan_anchor.x === 0 && item.plan_anchor.y === 0)) {
      return { x: Number(item.plan_anchor.x), y: Number(item.plan_anchor.y) };
    }
    
    if (item.anchor_x !== null && 
        item.anchor_x !== undefined && 
        item.anchor_y !== null && 
        item.anchor_y !== undefined &&
        !(item.anchor_x === 0 && item.anchor_y === 0)) {
      return { x: item.anchor_x, y: item.anchor_y };
    }
    
    return null;
  };

  const planData = useMemo(() => {
    const planMap = new Map<string, AnchorWithObservation[]>();
    let globalIndex = 0;
    
    observations.forEach((obs) => {
      const anchor = getAnchorPoint(obs);
      const obsPlan = obs.plan || plan;
      
      console.log(`Observation ${obs.id}:`, {
        plan: obsPlan,
        anchor_x: obs.anchor_x,
        anchor_y: obs.anchor_y,
        plan_anchor: obs.plan_anchor,
        extractedAnchor: anchor
      });
      
      if (anchor && obsPlan) {
        if (!planMap.has(obsPlan)) {
          planMap.set(obsPlan, []);
        }
        globalIndex++;
        planMap.get(obsPlan)!.push({
          ...anchor,
          observationId: obs.id,
          note: obs.note || undefined,
          index: globalIndex
        });
      }
    });
    
    const plans: PlanData[] = Array.from(planMap.entries()).map(([planName, anchors]) => ({
      planName,
      anchors
    }));
    
    console.log('Plans found:', plans.map(p => `${p.planName}: ${p.anchors.length} anchors`));
    return plans;
  }, [observations, plan]);

  if (planData.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 flex flex-col items-start w-full">
      <div 
        className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        style={{ 
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {planData.map((planInfo) => (
          <div key={planInfo.planName} className="flex-shrink-0">
            <div className="flex justify-between items-center mb-2" style={{ width: imageWidth }}>
              <h3 className="text-sm text-gray-700 font-medium">{planInfo.planName}</h3>
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 ">
                {planInfo.anchors.length} anchor{planInfo.anchors.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div 
              className="relative overflow-hidden border border-gray-300 "
              style={{
                width: imageWidth,
                height: imageHeight,
              }}
            >
              <Image
                src={getPlanImageSrc(planInfo.planName)}
                alt={`Plan ${planInfo.planName}`}
                width={imageWidth}
                height={imageHeight}
                className="object-contain"
                style={{
                  width: imageWidth,
                  height: imageHeight,
                }}
              />
              
              {planInfo.anchors.map((anchor) => (
                <div
                  key={anchor.observationId}
                  className="absolute pointer-events-none"
                  style={{
                    left: anchor.x * imageWidth - 8,
                    top: anchor.y * imageHeight - 8,
                  }}
                >
                  <div className="w-4 h-4  bg-black border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold leading-none">
                      {anchor.index}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanDisplayWidget;