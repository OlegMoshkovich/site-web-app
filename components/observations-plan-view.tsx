"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ObservationWithUrl } from "@/lib/store/observations-store";
import { PdfPlanCanvas } from "@/components/pdf-plan-canvas";
import { cn } from "@/lib/utils";
import type { translations } from "@/lib/translations";
import {
  hasValidPlanAnchor,
  resolveObservationPlanUrl,
} from "@/lib/plan-overlay";

type TFn = (key: keyof typeof translations.en) => string;

export function ObservationsPlanView({
  observations,
  onSelectObservation,
  t,
}: {
  observations: ObservationWithUrl[];
  onSelectObservation: (o: ObservationWithUrl) => void;
  t: TFn;
}) {
  const withPlan = useMemo(
    () => observations.filter(hasValidPlanAnchor),
    [observations],
  );

  const groups = useMemo(() => {
    const m = new Map<string, ObservationWithUrl[]>();
    for (const o of withPlan) {
      const k = o.plan ?? o.plan_url ?? "default";
      const list = m.get(k);
      if (list) list.push(o);
      else m.set(k, [o]);
    }
    return m;
  }, [withPlan]);

  const [planKey, setPlanKey] = useState<string | null>(null);

  useEffect(() => {
    if (groups.size === 0) {
      setPlanKey(null);
      return;
    }
    let best: string | null = null;
    let bestN = 0;
    for (const [k, arr] of groups) {
      if (arr.length > bestN) {
        bestN = arr.length;
        best = k;
      }
    }
    setPlanKey((prev) => (prev && groups.has(prev) ? prev : best));
  }, [groups]);

  const list = planKey ? (groups.get(planKey) ?? []) : [];
  const sample = list[0];

  const [resolved, setResolved] = useState<{
    url: string;
    isPdf: boolean;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sample) {
      setResolved(null);
      setLoading(false);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    void (async () => {
      try {
        const r = await resolveObservationPlanUrl(sample);
        if (cancelled) return;
        if (!r) {
          setResolved(null);
          setError(true);
          return;
        }
        setResolved(r);
      } catch {
        if (!cancelled) {
          setResolved(null);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [planKey, sample?.id]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 640, h: 480 });

  const measure = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const w = Math.max(280, el.clientWidth);
    const h = Math.max(200, Math.min(el.clientHeight, 720));
    setBox({ w, h });
  }, []);

  useEffect(() => {
    measure();
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, resolved?.url]);

  if (withPlan.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {t("mapPlanNoPositions")}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {groups.size > 1 && planKey != null ? (
        <div className="shrink-0 border-b border-border/70 bg-background px-3 py-2 sm:px-4">
          <label className="sr-only" htmlFor="map-plan-select">
            {t("mapPlanSelectLabel")}
          </label>
          <select
            id="map-plan-select"
            value={planKey}
            onChange={(e) => setPlanKey(e.target.value)}
            className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {Array.from(groups.entries()).map(([k, arr]) => (
              <option key={k} value={k}>
                {arr[0].site_name ?? t("mapPlanSelectLabel")} ({arr.length})
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div
        ref={wrapRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-2"
      >
        {loading && (
          <div className="absolute inset-0 z-[1] flex items-center justify-center bg-background/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-b-transparent" />
            <span className="sr-only">{t("mapPlanLoading")}</span>
          </div>
        )}

        {!loading && error ? (
          <p className="text-center text-sm text-muted-foreground">
            {t("mapPlanError")}
          </p>
        ) : null}

        {resolved && (
          <div
            className="relative mx-auto overflow-hidden rounded-lg border border-border bg-black"
            style={{ width: box.w, height: box.h }}
          >
            {resolved.isPdf ? (
              <PdfPlanCanvas
                url={resolved.url}
                width={box.w}
                height={box.h}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolved.url}
                alt={resolved.name}
                width={box.w}
                height={box.h}
                className="block h-full w-full object-contain"
                draggable={false}
              />
            )}

            {list.map((o) => {
              const x = o.plan_anchor!.x;
              const y = o.plan_anchor!.y;
              return (
                <button
                  key={o.id}
                  type="button"
                  className={cn(
                    "absolute z-[2] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-white shadow-md ring-2 ring-red-600/30 transition-transform hover:scale-110",
                    "h-[14px] w-[14px] bg-red-600 hover:bg-red-500",
                  )}
                  style={{
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                  }}
                  title={o.site_name ?? o.note ?? undefined}
                  onClick={() => onSelectObservation(o)}
                  aria-label={o.site_name ?? "Observation"}
                />
              );
            })}

            <div className="pointer-events-none absolute bottom-2 left-2 right-2 truncate rounded bg-background/85 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              {resolved.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
