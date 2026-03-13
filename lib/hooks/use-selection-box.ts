import { useState, useCallback, useEffect } from 'react';

interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function useSelectionBox(
  selectedObservations: Set<string>,
  setSelectedObservations: (s: Set<string>) => void
) {
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [initialSelection, setInitialSelection] = useState<Set<string>>(new Set());

  const handleSelectionStart = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('[role="checkbox"]') ||
      target.tagName === 'IMG'
    ) {
      return;
    }

    event.preventDefault();
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;

    setSelectionBox({
      startX: event.clientX + scrollX,
      startY: event.clientY + scrollY,
      currentX: event.clientX + scrollX,
      currentY: event.clientY + scrollY,
    });
    setInitialSelection(new Set(selectedObservations));
  }, [selectedObservations]);

  const handleSelectionMove = useCallback((event: MouseEvent) => {
    if (!selectionBox) return;

    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;

    setSelectionBox(prev => prev ? {
      ...prev,
      currentX: event.clientX + scrollX,
      currentY: event.clientY + scrollY,
    } : null);

    const boxLeft = Math.min(selectionBox.startX, event.clientX + scrollX);
    const boxTop = Math.min(selectionBox.startY, event.clientY + scrollY);
    const boxRight = Math.max(selectionBox.startX, event.clientX + scrollX);
    const boxBottom = Math.max(selectionBox.startY, event.clientY + scrollY);

    const photoElements = document.querySelectorAll('[data-observation-id]');
    const newSelection = new Set(initialSelection);

    photoElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const elementLeft = rect.left + scrollX;
      const elementTop = rect.top + scrollY;
      const elementRight = rect.right + scrollX;
      const elementBottom = rect.bottom + scrollY;

      const intersects = !(
        elementRight < boxLeft ||
        elementLeft > boxRight ||
        elementBottom < boxTop ||
        elementTop > boxBottom
      );

      if (intersects) {
        const observationId = element.getAttribute('data-observation-id');
        if (observationId) newSelection.add(observationId);
      }
    });

    setSelectedObservations(newSelection);
  }, [selectionBox, initialSelection, setSelectedObservations]);

  const handleSelectionEnd = useCallback(() => {
    setSelectionBox(null);
  }, []);

  useEffect(() => {
    if (!selectionBox) return;

    const handleMouseMove = (e: MouseEvent) => handleSelectionMove(e);
    const handleMouseUp = () => handleSelectionEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectionBox, handleSelectionMove, handleSelectionEnd]);

  return { selectionBox, handleSelectionStart };
}
