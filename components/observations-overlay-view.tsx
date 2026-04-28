"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ObservationWithUrl } from "@/lib/store/observations-store";
import { createClient } from "@/lib/supabase/client";
import { PdfPlanCanvas } from "@/components/pdf-plan-canvas";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { translations } from "@/lib/translations";
import {
  hasValidPlanAnchor,
  isValidOverlayCalibration,
  type PlanOverlayCalibration,
  type PlanOverlayCalibrationPoint,
  resolveObservationPlanUrl,
  type ResolvedPlanAsset,
} from "@/lib/plan-overlay";

type TFn = (key: keyof typeof translations.en) => string;

const OVERLAY_WIDTH = 1000;
const OVERLAY_HEIGHT = 1000;

function emptyCalibration(): PlanOverlayCalibration {
  return {
    mode: "anchor-scale-angle",
    angleDeg: 0,
    points: [
      { x: 0, y: 0, lat: 0, lng: 0 },
      { x: 1, y: 0, lat: 0, lng: 0 },
    ],
  };
}

function fixLeafletDefaultIcons(L: typeof import("leaflet")) {
  const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
  delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

function solveAffine(
  src: Array<{ x: number; y: number }>,
  dst: Array<{ x: number; y: number }>,
) {
  const [s0, s1, s2] = src;
  const [d0, d1, d2] = dst;
  const det =
    s0.x * (s1.y - s2.y) +
    s1.x * (s2.y - s0.y) +
    s2.x * (s0.y - s1.y);

  if (Math.abs(det) < 0.000001) return null;

  return {
    a:
      (d0.x * (s1.y - s2.y) +
        d1.x * (s2.y - s0.y) +
        d2.x * (s0.y - s1.y)) /
      det,
    c:
      (d0.x * (s2.x - s1.x) +
        d1.x * (s0.x - s2.x) +
        d2.x * (s1.x - s0.x)) /
      det,
    e:
      (d0.x * (s1.x * s2.y - s2.x * s1.y) +
        d1.x * (s2.x * s0.y - s0.x * s2.y) +
        d2.x * (s0.x * s1.y - s1.x * s0.y)) /
      det,
    b:
      (d0.y * (s1.y - s2.y) +
        d1.y * (s2.y - s0.y) +
        d2.y * (s0.y - s1.y)) /
      det,
    d:
      (d0.y * (s2.x - s1.x) +
        d1.y * (s0.x - s2.x) +
        d2.y * (s1.x - s0.x)) /
      det,
    f:
      (d0.y * (s1.x * s2.y - s2.x * s1.y) +
        d1.y * (s2.x * s0.y - s0.x * s2.y) +
        d2.y * (s0.x * s1.y - s1.x * s0.y)) /
      det,
  };
}

function solveAnchorScaleAngle(
  calibration: PlanOverlayCalibration,
  map: import("leaflet").Map,
) {
  const [anchor, scalePoint] = calibration.points;
  if (!anchor || !scalePoint) return null;

  let anchorMap: import("leaflet").Point;
  let scaleMap: import("leaflet").Point;
  try {
    anchorMap = map.latLngToContainerPoint([anchor.lat, anchor.lng]);
    scaleMap = map.latLngToContainerPoint([scalePoint.lat, scalePoint.lng]);
  } catch {
    return null;
  }
  const planDx = scalePoint.x - anchor.x;
  const planDy = scalePoint.y - anchor.y;
  const planDistance = Math.hypot(planDx, planDy);
  const mapDistance = anchorMap.distanceTo(scaleMap);
  if (planDistance < 0.000001 || mapDistance < 0.000001) return null;

  const scale = mapDistance / planDistance;
  const angleRad = ((calibration.angleDeg ?? 0) * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const originX = anchor.x;
  const originY = anchor.y;

  const a = scale * cos;
  const b = scale * sin;
  const c = -scale * sin;
  const d = scale * cos;
  const e = anchorMap.x - a * originX - c * originY;
  const f = anchorMap.y - b * originX - d * originY;

  return { a, b, c, d, e, f };
}

function hasGps(point: PlanOverlayCalibrationPoint) {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng) && !(point.lat === 0 && point.lng === 0);
}

function canTransformCalibration(calibration: PlanOverlayCalibration) {
  const requiredPoints = calibration.mode === "anchor-scale-angle" ? 2 : 3;
  return calibration.points.slice(0, requiredPoints).every(hasGps);
}

function calibrationFromDraft(
  draft: PlanOverlayCalibration,
): PlanOverlayCalibration {
  return {
    mode: "anchor-scale-angle",
    angleDeg: draft.angleDeg ?? 0,
    points: draft.points.slice(0, 2).map((point) => ({ ...point })),
  };
}

function mapHasView(map: import("leaflet").Map) {
  try {
    map.getCenter();
    map.getZoom();
    return true;
  } catch {
    return false;
  }
}

async function getPlanAspect(asset: ResolvedPlanAsset): Promise<number> {
  if (asset.isPdf) {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    const loadingTask = pdfjsLib.getDocument({ url: asset.url });
    const pdf = await loadingTask.promise;
    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      return viewport.width / viewport.height;
    } finally {
      pdf.destroy();
    }
  }

  return await new Promise<number>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight;
      resolve(Number.isFinite(aspect) && aspect > 0 ? aspect : 1);
    };
    img.onerror = () => resolve(1);
    img.src = asset.url;
  });
}

export function ObservationsOverlayView({
  observations,
  onSelectObservation,
  t,
}: {
  observations: ObservationWithUrl[];
  onSelectObservation: (o: ObservationWithUrl) => void;
  t: TFn;
}) {
  const supabase = useMemo(() => createClient(), []);
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const planPreviewRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);
  const calibrationMarkersRef = useRef<import("leaflet").Layer[]>([]);
  const updateOverlayTransformRef = useRef<() => void>(() => {});
  const onSelectRef = useRef(onSelectObservation);
  onSelectRef.current = onSelectObservation;

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
  const [asset, setAsset] = useState<ResolvedPlanAsset | null>(null);
  const [calibration, setCalibration] =
    useState<PlanOverlayCalibration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [opacity, setOpacity] = useState(55);
  const [transform, setTransform] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showCalibrationEditor, setShowCalibrationEditor] = useState(false);
  const [activeCalibrationPoint, setActiveCalibrationPoint] = useState(0);
  const [calibrationDraft, setCalibrationDraft] =
    useState<PlanOverlayCalibration>(emptyCalibration);
  const [placedCalibration, setPlacedCalibration] =
    useState<PlanOverlayCalibration | null>(null);
  const [savingCalibration, setSavingCalibration] = useState(false);
  const [planPreviewSize, setPlanPreviewSize] = useState({ w: 640, h: 420 });
  const [planAspect, setPlanAspect] = useState(1);

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
  const overlayHeight = OVERLAY_WIDTH / planAspect;
  const canPlaceDraft =
    isValidOverlayCalibration(calibrationDraft) &&
    canTransformCalibration(calibrationDraft);
  const displayedCalibration = showCalibrationEditor
    ? (placedCalibration ?? null)
    : calibration;
  console.log("[Overlay] render", { showCalibrationEditor, placedCalibration, calibration, displayedCalibration, asset: !!asset, transform, canPlaceDraft });

  useEffect(() => {
    if (!sample) {
      setAsset(null);
      setCalibration(null);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    void (async () => {
      try {
        const [resolved, planRow] = await Promise.all([
          resolveObservationPlanUrl(sample),
          sample.plan
            ? supabase
                .from("site_plans")
                .select("overlay_calibration")
                .eq("id", sample.plan)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (cancelled) return;
        setAsset(resolved);
        setCalibration(
          isValidOverlayCalibration(planRow.data?.overlay_calibration)
            ? planRow.data.overlay_calibration
            : null,
        );
        setCalibrationDraft(
          isValidOverlayCalibration(planRow.data?.overlay_calibration)
            ? {
                mode: planRow.data.overlay_calibration.mode ?? "three-point",
                angleDeg: planRow.data.overlay_calibration.angleDeg ?? 0,
                points: planRow.data.overlay_calibration.points
                  .slice(0, planRow.data.overlay_calibration.mode === "anchor-scale-angle" ? 2 : 3)
                  .map((point: PlanOverlayCalibrationPoint) => ({ ...point })),
              }
            : emptyCalibration(),
        );
        setPlacedCalibration(null);
        setError(!resolved);
      } catch {
        if (!cancelled) {
          setAsset(null);
          setCalibration(null);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sample?.id, sample?.plan, supabase]);

  useEffect(() => {
    if (!asset) {
      setPlanAspect(1);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const aspect = await getPlanAspect(asset);
        if (!cancelled) setPlanAspect(aspect);
      } catch {
        if (!cancelled) setPlanAspect(1);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [asset]);

  const updateCalibrationPoint = (
    pointIndex: number,
    field: keyof PlanOverlayCalibrationPoint,
    value: number,
  ) => {
    setPlacedCalibration(null);
    setCalibrationDraft((prev) => ({
      ...prev,
      mode: "anchor-scale-angle",
      angleDeg: prev.angleDeg ?? 0,
      points: prev.points.map((point, index) =>
        index === pointIndex ? { ...point, [field]: value } : point,
      ).slice(0, 2),
    }));
  };

  const updateCalibrationAngle = (angleDeg: number) => {
    setPlacedCalibration(null);
    setCalibrationDraft((prev) => ({
      ...prev,
      mode: "anchor-scale-angle",
      angleDeg: Number.isFinite(angleDeg) ? angleDeg : 0,
      points: prev.points.slice(0, 2),
    }));
  };

  const handlePlanPreviewClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    setPlacedCalibration(null);
    setCalibrationDraft((prev) => ({
      ...prev,
      mode: "anchor-scale-angle",
      angleDeg: prev.angleDeg ?? 0,
      points: prev.points.map((point, index) =>
        index === activeCalibrationPoint ? { ...point, x, y } : point,
      ).slice(0, 2),
    }));
  };

  const setMapCoordinateForActivePoint = (lat: number, lng: number) => {
    setPlacedCalibration(null);
    setCalibrationDraft((prev) => ({
      ...prev,
      mode: "anchor-scale-angle",
      angleDeg: prev.angleDeg ?? 0,
      points: prev.points.map((point, index) =>
        index === activeCalibrationPoint
          ? { ...point, lat, lng }
          : point,
      ).slice(0, 2),
    }));
  };

  const saveCalibration = async () => {
    if (!sample?.plan || !isValidOverlayCalibration(calibrationDraft)) return;
    const nextCalibration = calibrationFromDraft(calibrationDraft);

    try {
      setSavingCalibration(true);
      const { error: saveError } = await supabase
        .from("site_plans")
        .update({
          overlay_calibration: nextCalibration,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sample.plan);

      if (saveError) {
        setError(true);
        return;
      }

      setCalibration(nextCalibration);
      setPlacedCalibration(nextCalibration);
      setShowCalibrationEditor(false);
    } finally {
      setSavingCalibration(false);
    }
  };

  const placePlan = () => {
    console.log("[Overlay] placePlan called", { canPlaceDraft, calibrationDraft });
    if (!canPlaceDraft) {
      console.log("[Overlay] placePlan blocked – canPlaceDraft is false", {
        isValidOverlayCalibration: isValidOverlayCalibration(calibrationDraft),
        canTransformCalibration: canTransformCalibration(calibrationDraft),
        calibrationDraft,
      });
      return;
    }
    const next = calibrationFromDraft(calibrationDraft);
    console.log("[Overlay] setPlacedCalibration →", next);
    setPlacedCalibration(next);
  };

  const updateOverlayTransform = useCallback(() => {
    const map = mapRef.current;
    console.log("[Overlay] updateOverlayTransform", {
      hasMap: !!map,
      mapHasView: map ? mapHasView(map) : false,
      displayedCalibration,
    });
    if (!map || !mapHasView(map) || !displayedCalibration) {
      setTransform(null);
      return;
    }

    const points = displayedCalibration.points.slice(0, 3);
    const affine =
      displayedCalibration.mode === "anchor-scale-angle"
        ? solveAnchorScaleAngle(displayedCalibration, map)
        : solveAffine(
            points.map((point) => ({ x: point.x, y: point.y })),
            points.map((point) => {
              try {
                const projected = map.latLngToContainerPoint([point.lat, point.lng]);
                return { x: projected.x, y: projected.y };
              } catch {
                return { x: 0, y: 0 };
              }
            }),
          );

    console.log("[Overlay] affine result", affine);
    if (!affine) {
      setTransform(null);
      return;
    }

    const t = `matrix(${affine.a / OVERLAY_WIDTH}, ${affine.b / OVERLAY_WIDTH}, ${affine.c / OVERLAY_HEIGHT}, ${affine.d / OVERLAY_HEIGHT}, ${affine.e}, ${affine.f})`;
    console.log("[Overlay] setTransform →", t);
    setTransform(t);
  }, [displayedCalibration]);
  updateOverlayTransformRef.current = updateOverlayTransform;

  useEffect(() => {
    const el = mapElRef.current;
    if (!el) return;

    let cancelled = false;

    const run = async () => {
      const leafletMod = await import("leaflet");
      const L = leafletMod.default as typeof import("leaflet");
      if (cancelled || !mapElRef.current) return;
      fixLeafletDefaultIcons(L);

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(el);
      mapRef.current = map;
      setMapReady(true);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      map.on("move zoom resize viewreset", () => updateOverlayTransformRef.current());
    };

    void run();

    return () => {
      cancelled = true;
      setMapReady(false);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      calibrationMarkersRef.current.forEach((marker) => marker.remove());
      calibrationMarkersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    let cancelled = false;

    const run = async () => {
      const leafletMod = await import("leaflet");
      const L = leafletMod.default as typeof import("leaflet");
      if (cancelled || mapRef.current !== map) return;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const bounds = L.latLngBounds([] as [number, number][]);
      const gpsList = observations.filter((o) => {
        const lat = Number(o.gps_lat);
        const lng = Number(o.gps_lng);
        return Number.isFinite(lat) && Number.isFinite(lng);
      });

      gpsList.forEach((obs) => {
        const lat = Number(obs.gps_lat);
        const lng = Number(obs.gps_lng);
        const marker = L.marker([lat, lng], {
          title: obs.site_name || obs.plan || undefined,
        }).addTo(map);
        marker.on("click", (event) => {
          if (showCalibrationEditor) {
            setMapCoordinateForActivePoint(lat, lng);
            event.originalEvent.preventDefault();
            return;
          }
          onSelectRef.current(obs);
        });
        markersRef.current.push(marker);
        bounds.extend([lat, lng]);
      });

      if (displayedCalibration) {
        displayedCalibration.points.forEach((point) => {
          if (hasGps(point)) bounds.extend([point.lat, point.lng]);
        });
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
      } else {
        map.setView([51, 10], 5);
      }

      requestAnimationFrame(updateOverlayTransform);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [observations, displayedCalibration, mapReady, showCalibrationEditor, updateOverlayTransform]);

  useEffect(() => {
    updateOverlayTransform();
  }, [updateOverlayTransform]);

  useEffect(() => {
    if (!placedCalibration || !showCalibrationEditor) return;
    requestAnimationFrame(updateOverlayTransform);
  }, [placedCalibration, showCalibrationEditor, updateOverlayTransform]);

  useEffect(() => {
    const el = planPreviewRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const w = Math.max(320, el.clientWidth);
      setPlanPreviewSize({
        w,
        h: Math.max(120, w / planAspect),
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showCalibrationEditor, asset?.url, planAspect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !showCalibrationEditor) return;

    const handleClick = (event: import("leaflet").LeafletMouseEvent) => {
      setMapCoordinateForActivePoint(event.latlng.lat, event.latlng.lng);
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [activeCalibrationPoint, mapReady, showCalibrationEditor]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !showCalibrationEditor) {
      calibrationMarkersRef.current.forEach((marker) => marker.remove());
      calibrationMarkersRef.current = [];
      return;
    }

    let cancelled = false;
    const run = async () => {
      const leafletMod = await import("leaflet");
      const L = leafletMod.default as typeof import("leaflet");
      if (cancelled || mapRef.current !== map) return;

      calibrationMarkersRef.current.forEach((marker) => marker.remove());
      calibrationMarkersRef.current = [];

      calibrationDraft.points.forEach((point, index) => {
        if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
        if (point.lat === 0 && point.lng === 0) return;
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: index === activeCalibrationPoint ? 9 : 7,
          color: "#ffffff",
          weight: 2,
          fillColor: index === activeCalibrationPoint ? "#2563eb" : "#dc2626",
          fillOpacity: 1,
          interactive: false,
        }).addTo(map);
        calibrationMarkersRef.current.push(marker);

        const label = L.marker([point.lat, point.lng], {
          interactive: false,
          icon: L.divIcon({
            className: "",
            html: `<span style="display:flex;height:20px;width:20px;align-items:center;justify-content:center;border-radius:9999px;border:2px solid white;background:${index === activeCalibrationPoint ? "#2563eb" : "#dc2626"};color:white;font-size:11px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.4);">${index + 1}</span>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).addTo(map);
        calibrationMarkersRef.current.push(label);
      });
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [activeCalibrationPoint, calibrationDraft, mapReady, showCalibrationEditor]);

  if (withPlan.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {t("mapPlanNoPositions")}
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div ref={mapElRef} className="absolute inset-0 z-0" />

      {asset && displayedCalibration && transform ? (
        <div
          ref={overlayRef}
          className="pointer-events-none absolute left-0 top-0 z-[401] overflow-hidden bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
          style={{
            width: OVERLAY_WIDTH,
            height: OVERLAY_HEIGHT,
            opacity: opacity / 100,
            transform,
            transformOrigin: "0 0",
          }}
        >
          {asset.isPdf ? (
            <PdfPlanCanvas
              url={asset.url}
              width={OVERLAY_WIDTH}
              height={OVERLAY_HEIGHT}
              fit="fill"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.url}
              alt={asset.name}
              className="block h-full w-full object-fill"
              draggable={false}
            />
          )}

          {displayedCalibration.points.slice(0, 3).map((point, index) => (
            <div
              key={index}
              className={`absolute z-[2] flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow ${
                index === activeCalibrationPoint && showCalibrationEditor
                  ? "bg-blue-600 text-white"
                  : "bg-red-600 text-white"
              }`}
              style={{
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
              }}
            >
              {index + 1}
            </div>
          ))}
        </div>
      ) : null}

      <div className="absolute bottom-3 left-3 z-[500] flex w-[min(24rem,calc(100%-1.5rem))] flex-col gap-2 rounded-md border border-border bg-background/90 p-3 shadow-sm backdrop-blur-sm">
        {groups.size > 1 && planKey != null ? (
          <select
            value={planKey}
            onChange={(e) => setPlanKey(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            aria-label={t("mapPlanSelectLabel")}
          >
            {Array.from(groups.entries()).map(([k, arr]) => (
              <option key={k} value={k}>
                {arr[0].site_name ?? t("mapPlanSelectLabel")} ({arr.length})
              </option>
            ))}
          </select>
        ) : null}

        <div className="flex items-center gap-3">
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {t("mapOverlayOpacity")}
          </span>
          <Slider
            value={[opacity]}
            min={10}
            max={90}
            step={5}
            onValueChange={([value]) => setOpacity(value)}
            className="flex-1"
            aria-label={t("mapOverlayOpacity")}
          />
          <span className="w-9 text-right text-xs text-muted-foreground">
            {opacity}%
          </span>
        </div>

        {!loading && (!calibration || !asset || error) ? (
          <p className="text-xs text-muted-foreground">
            {!calibration
              ? showCalibrationEditor && canPlaceDraft
                ? t("mapOverlayNeedsPlacement")
                : t("mapOverlayNeedsCalibration")
              : t("mapPlanError")}
          </p>
        ) : null}

        <Button
          type="button"
          variant={showCalibrationEditor ? "default" : "outline"}
          size="sm"
          onClick={() => setShowCalibrationEditor((value) => !value)}
          disabled={!asset || !sample?.plan}
          className="w-full"
        >
          {showCalibrationEditor
            ? t("mapOverlayCloseCalibration")
            : t("mapOverlayCalibrate")}
        </Button>
      </div>

      {showCalibrationEditor && asset ? (
        <div className="absolute bottom-3 right-3 top-3 z-[500] flex w-[min(46rem,calc(100%-1.5rem))] flex-col gap-3 overflow-hidden rounded-md border border-border bg-background/95 p-3 shadow-lg backdrop-blur-sm lg:w-[45vw]">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t("mapOverlayCalibrationTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("mapOverlayCalibrationHelp")}
            </p>
          </div>

          <div
            ref={planPreviewRef}
            className="relative w-full shrink-0 cursor-crosshair overflow-hidden rounded-md border border-border bg-white"
            style={{ height: planPreviewSize.h }}
            onClick={handlePlanPreviewClick}
          >
            {asset.isPdf ? (
              <PdfPlanCanvas
                url={asset.url}
                width={planPreviewSize.w}
                height={planPreviewSize.h}
                fit="fill"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asset.url}
                alt={asset.name}
                className="h-full w-full object-fill"
                draggable={false}
              />
            )}
            {calibrationDraft.points.map((point, index) => (
              <button
                key={index}
                type="button"
                className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white text-[10px] font-semibold shadow ${
                  index === activeCalibrationPoint
                    ? "bg-primary text-primary-foreground"
                    : "bg-red-600 text-white"
                }`}
                style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveCalibrationPoint(index);
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {calibrationDraft.points.map((_, index) => (
              <Button
                key={index}
                type="button"
                variant={activeCalibrationPoint === index ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCalibrationPoint(index)}
              >
                {index === 0
                  ? t("mapOverlayAnchorPoint")
                  : t("mapOverlayScalePoint")}
              </Button>
            ))}
            <span className="ml-auto self-center text-xs text-muted-foreground">
              {t("mapOverlayClickMap")}
            </span>
          </div>

          <div className="grid gap-1 rounded-md border border-border p-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("mapOverlayAngle")}
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={calibrationDraft.angleDeg ?? 0}
              onChange={(event) => updateCalibrationAngle(Number(event.target.value))}
              className="h-9 text-sm"
            />
          </div>

          <div className="max-h-[15rem] overflow-auto pr-1">
            <div className="grid gap-2">
            {calibrationDraft.points.map((point, pointIndex) => (
              <div
                key={pointIndex}
                className="grid grid-cols-2 gap-2 rounded-md border border-border p-2 sm:grid-cols-[3.5rem_repeat(4,minmax(0,1fr))]"
              >
                <div className="col-span-2 self-center text-xs font-medium text-muted-foreground sm:col-span-1">
                  {pointIndex === 0
                    ? t("mapOverlayAnchorPoint")
                    : t("mapOverlayScalePoint")}
                </div>
                {(["x", "y", "lat", "lng"] as const).map((field) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">
                      {field}
                    </Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step={field === "lat" || field === "lng" ? "0.000001" : "0.001"}
                      min={field === "x" || field === "y" ? 0 : undefined}
                      max={field === "x" || field === "y" ? 1 : undefined}
                      value={point[field]}
                      onFocus={() => setActiveCalibrationPoint(pointIndex)}
                      onChange={(event) =>
                        updateCalibrationPoint(
                          pointIndex,
                          field,
                          Number(event.target.value),
                        )
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setCalibrationDraft(
                  calibration
                    ? {
                        mode: calibration.mode ?? "anchor-scale-angle",
                        angleDeg: calibration.angleDeg ?? 0,
                        points: calibration.points.slice(0, 2).map((point) => ({ ...point })),
                      }
                    : emptyCalibration(),
                );
                setPlacedCalibration(null);
                setShowCalibrationEditor(false);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={placePlan}
              disabled={!canPlaceDraft}
            >
              {t("mapOverlayPlacePlan")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveCalibration}
              disabled={savingCalibration || !sample?.plan}
            >
              {savingCalibration ? t("loading") : t("mapOverlaySaveCalibration")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
