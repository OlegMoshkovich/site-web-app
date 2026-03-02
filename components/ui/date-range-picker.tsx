"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYMD(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDisplay(s: string): string {
  const d = parseYMD(s);
  if (!d) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ── CalendarPanel ─────────────────────────────────────────────────────────────

interface CalendarProps {
  year: number;
  month: number;
  selected: string;
  rangeStart: string;
  rangeEnd: string;
  onSelect: (ymd: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onClear: () => void;
}

function CalendarPanel({
  year, month, selected, rangeStart, rangeEnd,
  onSelect, onPrev, onNext, onToday, onClear,
}: CalendarProps) {
  const total = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rsDate = parseYMD(rangeStart);
  const reDate = parseYMD(rangeEnd);

  function classForDay(day: number): string {
    const ymd = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const d = new Date(year, month, day);
    const isEndpoint = ymd === rangeStart || ymd === rangeEnd || ymd === selected;
    const inRange = rsDate && reDate && d > rsDate && d < reDate;

    let cls =
      "w-8 h-8 flex items-center justify-center text-sm cursor-pointer select-none transition-colors rounded-full ";
    if (isEndpoint) {
      cls += "bg-blue-600 text-white font-semibold ";
    } else if (inRange) {
      cls += "bg-blue-100 text-blue-800 rounded-none ";
    } else {
      cls += "hover:bg-gray-100 text-gray-800 ";
    }
    return cls;
  }

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <div className="p-3 w-64 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={onPrev} className="p-1 rounded hover:bg-gray-100 text-gray-600">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTHS[month]} {year}
        </span>
        <button type="button" onClick={onNext} className="p-1 rounded hover:bg-gray-100 text-gray-600">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day-of-week row */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d) => (
          <div key={d} className="w-8 h-6 flex items-center justify-center text-xs font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-7">
          {row.map((day, ci) => (
            <div key={ci} className="flex items-center justify-center w-8 h-8">
              {day ? (
                <div
                  className={classForDay(day)}
                  onClick={() => {
                    const ymd = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    onSelect(ymd);
                  }}
                >
                  {day}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ))}

      {/* Footer */}
      <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
        <button type="button" onClick={onClear} className="text-xs text-blue-600 hover:underline">
          Clear
        </button>
        <button type="button" onClick={onToday} className="text-xs text-blue-600 hover:underline">
          Today
        </button>
      </div>
    </div>
  );
}

// ── DateRangePicker ───────────────────────────────────────────────────────────

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  startLabel?: string;
  endLabel?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = "Start:",
  endLabel = "End:",
}: DateRangePickerProps) {
  const today = new Date();

  const [open, setOpen] = useState<"start" | "end" | null>(null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Portal anchor position (pixels from viewport top-left)
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  const startRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Recalculate popup position whenever the active trigger changes
  useEffect(() => {
    if (!open) return;
    const btn = open === "start" ? startRef.current : endRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPopupPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popupRef.current?.contains(e.target as Node) ||
        startRef.current?.contains(e.target as Node) ||
        endRef.current?.contains(e.target as Node)
      ) return;
      setOpen(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function openFor(which: "start" | "end") {
    if (open === which) { setOpen(null); return; }
    const seed = which === "start" ? parseYMD(startDate) : parseYMD(endDate);
    const base = seed ?? today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(which);
  }

  function handleSelect(ymd: string) {
    if (open === "start") {
      onStartDateChange(ymd);
      if (endDate && endDate < ymd) onEndDateChange("");
      const base = parseYMD(ymd) ?? today;
      setViewYear(base.getFullYear());
      setViewMonth(base.getMonth());
      setOpen("end");
    } else {
      if (startDate && ymd < startDate) {
        onEndDateChange(startDate);
        onStartDateChange(ymd);
      } else {
        onEndDateChange(ymd);
      }
      setOpen(null);
    }
  }

  function handleClear() {
    onStartDateChange("");
    onEndDateChange("");
    setOpen(null);
  }

  function handleToday() {
    const ymd = toYMD(today);
    if (open === "start") {
      onStartDateChange(ymd);
      if (endDate && endDate < ymd) onEndDateChange("");
      setOpen("end");
    } else {
      if (startDate && ymd < startDate) {
        onEndDateChange(startDate);
        onStartDateChange(ymd);
      } else {
        onEndDateChange(ymd);
      }
      setOpen(null);
    }
  }

  const baseCls =
    "px-2 py-1 text-sm border border-gray-300 rounded cursor-pointer bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-32 text-left";
  const activeCls = " !border-blue-500 ring-1 ring-blue-500";

  const popup = open ? (
    <div
      ref={popupRef}
      style={{
        position: "absolute",
        top: popupPos.top,
        left: popupPos.left,
        zIndex: 9999,
      }}
      className="bg-white border border-gray-200 rounded-lg shadow-xl"
    >
      <CalendarPanel
        year={viewYear}
        month={viewMonth}
        selected={open === "start" ? startDate : endDate}
        rangeStart={startDate}
        rangeEnd={endDate}
        onSelect={handleSelect}
        onPrev={() => {
          if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
          else setViewMonth((m) => m - 1);
        }}
        onNext={() => {
          if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
          else setViewMonth((m) => m + 1);
        }}
        onToday={handleToday}
        onClear={handleClear}
      />
    </div>
  ) : null;

  return (
    <div className="flex items-end gap-4">
      {/* Start button */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-muted-foreground">{startLabel}</label>
        <button
          ref={startRef}
          type="button"
          onClick={() => openFor("start")}
          className={baseCls + (open === "start" ? activeCls : "")}
        >
          {startDate
            ? formatDisplay(startDate)
            : <span className="text-gray-400">mm/dd/yyyy</span>}
        </button>
      </div>

      {/* End button */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-muted-foreground">{endLabel}</label>
        <button
          ref={endRef}
          type="button"
          onClick={() => openFor("end")}
          className={baseCls + (open === "end" ? activeCls : "")}
        >
          {endDate
            ? formatDisplay(endDate)
            : <span className="text-gray-400">mm/dd/yyyy</span>}
        </button>
      </div>

      {/* Portal: renders outside sticky container so z-index is never clipped */}
      {typeof document !== "undefined" && popup
        ? createPortal(popup, document.body)
        : null}
    </div>
  );
}
