'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlanStore } from '@/lib/store/plan-store';
import { PlanWidgetProps } from '@/types/types';



const PlanWidget: React.FC<PlanWidgetProps> = ({ 
  onAnchorChange, 
  selectedPlan: propSelectedPlan, 
  onPlanChange,
  anchors = [],
  isReportMode = false
}) => {
  const imageWidth = 320;
  const imageHeight = 280;
  
  const [dialogVisible, setDialogVisible] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>(propSelectedPlan || 'plan1');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const { 
    planPosition, 
    zoomScale, 
    anchor, 
    setPlanPosition, 
    setZoomScale, 
    setAnchor 
  } = usePlanStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const moveStep = 60;
  
  const getInitialPosition = () => {
    const viewportWidth = 320;
    const viewportHeight = 280;
    
    const xOffset = (viewportWidth - imageWidth) / 2;
    const yOffset = (viewportHeight - imageHeight) / 2;
    
    return { x: xOffset, y: yOffset };
  };

  useEffect(() => {
    if (propSelectedPlan && propSelectedPlan !== selectedPlan) {
      setSelectedPlan(propSelectedPlan);
    }
  }, [propSelectedPlan, selectedPlan]);

  useEffect(() => {
    const initialPos = getInitialPosition();
    setPlanPosition(initialPos);
    setZoomScale(1);
  }, [setPlanPosition, setZoomScale]);

  const handlePlanChange = (plan: string) => {
    setSelectedPlan(plan);
    if (onPlanChange) {
      onPlanChange(plan);
    }
  };

  const movePlan = (direction: 'left' | 'right' | 'up' | 'down') => {
    const newPosition = { ...planPosition };
    switch (direction) {
      case 'left':
        newPosition.x = planPosition.x - moveStep;
        break;
      case 'right':
        newPosition.x = planPosition.x + moveStep;
        break;
      case 'up':
        newPosition.y = planPosition.y - moveStep;
        break;
      case 'down':
        newPosition.y = planPosition.y + moveStep;
        break;
    }
    setPlanPosition(newPosition);
  };

  const zoomIn = () => {
    setZoomScale(Math.min(zoomScale + 1, 20));
  };

  const zoomOut = () => {
    setZoomScale(Math.max(zoomScale - 1, 1));
  };

  const resetPlan = () => {
    const resetPos = getInitialPosition();
    setPlanPosition(resetPos);
    setZoomScale(1);
  };

  const planOptions = [
    { value: 'plan1', label: 'Plan 1' },
    { value: 'plan2', label: 'Plan 2' },
    { value: 'plan3', label: 'Plan 3' },
    { value: 'plan4', label: 'Plan 4' },
    { value: 'plan5', label: 'Plan 5' },
  ];

  const getPlanImageSrc = (plan: string) => {
    return `/plans/${plan}.png`;
  };



  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - planPosition.x, 
      y: e.clientY - planPosition.y 
    });
  }, [planPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPlanPosition({ x: newX, y: newY });
  }, [isDragging, dragStart, setPlanPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isDragging || isReportMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scaledImageWidth = imageWidth * zoomScale;
    const scaledImageHeight = imageHeight * zoomScale;
    
    const anchorPos = { 
      x: x / scaledImageWidth, 
      y: y / scaledImageHeight 
    };
    
    setAnchor(anchorPos);
    if (onAnchorChange) onAnchorChange(anchorPos);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPlanPosition({ x: newX, y: newY });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, setPlanPosition]);

  return (
    <div className="bg-white w-full h-[580px] flex flex-col items-center">
      <div className="w-[92%] flex justify-center items-center mb-4">
        <Select value={selectedPlan} onValueChange={handlePlanChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            {planOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div 
        ref={containerRef}
        className="w-[90%] h-[280px] rounded-[20px] overflow-hidden border border-gray-300 mb-2.5 relative cursor-move"
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute select-none"
          style={{
            width: imageWidth * zoomScale,
            height: imageHeight * zoomScale,
            transform: `translate(${planPosition.x}px, ${planPosition.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
        >
          <Image
            ref={imageRef}
            src={getPlanImageSrc(selectedPlan)}
            alt={`Plan ${selectedPlan}`}
            width={imageWidth * zoomScale}
            height={imageHeight * zoomScale}
            className="object-contain pointer-events-none"
            style={{ 
              width: imageWidth * zoomScale, 
              height: imageHeight * zoomScale 
            }}
            onClick={handleImageClick}
            draggable={false}
          />
          {/* Render single anchor (non-report mode) */}
          {!isReportMode && anchor && (
            <div
              className="absolute border-4 border-black rounded-full pointer-events-none"
              style={{
                left: anchor.x * (imageWidth * zoomScale) - (7.5 * zoomScale),
                top: anchor.y * (imageHeight * zoomScale) - (8 * zoomScale),
                width: 12 * zoomScale,
                height: 12 * zoomScale,
                borderRadius: 15 * zoomScale,
              }}
            />
          )}
          
          {/* Render multiple anchors (report mode) */}
          {isReportMode && anchors.map((anchorPoint, index) => (
            <div key={anchorPoint.observationId} className="absolute pointer-events-none">
              <div
                className="absolute border-4 border-red-500 rounded-full bg-red-500"
                style={{
                  left: anchorPoint.x * (imageWidth * zoomScale) - (7.5 * zoomScale),
                  top: anchorPoint.y * (imageHeight * zoomScale) - (8 * zoomScale),
                  width: 12 * zoomScale,
                  height: 12 * zoomScale,
                  borderRadius: 15 * zoomScale,
                }}
              />
              <div
                className="absolute text-white text-xs font-bold flex items-center justify-center"
                style={{
                  left: anchorPoint.x * (imageWidth * zoomScale) - (7.5 * zoomScale),
                  top: anchorPoint.y * (imageHeight * zoomScale) - (8 * zoomScale),
                  width: 12 * zoomScale,
                  height: 12 * zoomScale,
                  fontSize: 8 * zoomScale,
                }}
              >
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center items-center mb-3.5 gap-2.5">
        <Button
          onClick={zoomOut}
          variant="outline"
          className="w-[100px] rounded-full bg-[#FAFEFF] border-gray-300 shadow-sm text-black font-bold"
        >
          -
        </Button>
        <Button
          onClick={resetPlan}
          variant="outline"
          className="w-[90px] rounded-[20px] border-gray-300 shadow-sm text-black"
        >
          reset
        </Button>
        <Button
          onClick={zoomIn}
          variant="outline"
          className="w-[100px] rounded-full bg-[#FAFEFF] border-gray-300 shadow-sm text-black font-bold"
        >
          +
        </Button>
      </div>

      <div className="flex flex-col justify-center items-center py-1.5 gap-1">
        <Button
          onClick={() => movePlan('down')}
          className="w-[90px] bg-[#666D70] text-[#DDDBD1] rounded-full shadow-sm font-bold hover:bg-[#666D70]/90"
        >
          ↑
        </Button>
        
        <div className="flex justify-center items-center py-0 gap-[100px]">
          <Button
            onClick={() => movePlan('right')}
            className="w-[90px] bg-[#666D70] text-[#DDDBD1] rounded-full shadow-sm font-bold hover:bg-[#666D70]/90"
          >
            ←
          </Button>
          <Button
            onClick={() => movePlan('left')}
            className="w-[90px] bg-[#666D70] text-[#DDDBD1] rounded-full shadow-sm font-bold hover:bg-[#666D70]/90"
          >
            →
          </Button>
        </div>
        
        <Button
          onClick={() => movePlan('up')}
          className="w-[90px] bg-[#666D70] text-[#DDDBD1] rounded-full shadow-sm font-bold hover:bg-[#666D70]/90"
        >
          ↓
        </Button>
      </div>

      {dialogVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-[80vw] max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-500">Project Location</h3>
              <Button
                onClick={() => setDialogVisible(false)}
                variant="ghost"
                className="text-sm"
              >
                Close
              </Button>
            </div>
            {capturedUri && (
              <Image
                src={capturedUri}
                alt="Captured plan"
                width={800}
                height={600}
                className="w-full max-w-[60vw] max-h-[40vh] object-contain border border-red-500 rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanWidget;