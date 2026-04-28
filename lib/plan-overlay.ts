import { createClient } from "@/lib/supabase/client";
import type { ObservationWithUrl } from "@/lib/store/observations-store";

export type PlanOverlayCalibrationPoint = {
  x: number;
  y: number;
  lat: number;
  lng: number;
};

export type PlanOverlayCalibration = {
  mode?: "three-point" | "anchor-scale-angle";
  angleDeg?: number;
  points: PlanOverlayCalibrationPoint[];
};

export type ResolvedPlanAsset = {
  url: string;
  isPdf: boolean;
  name: string;
};

export function hasValidPlanAnchor(o: ObservationWithUrl): boolean {
  const a = o.plan_anchor;
  if (!a || typeof a.x !== "number" || typeof a.y !== "number") return false;
  if (a.x === 0 && a.y === 0) return false;
  return true;
}

export function isValidOverlayCalibration(
  value: unknown,
): value is PlanOverlayCalibration {
  if (!value || typeof value !== "object") return false;
  const points = (value as { points?: unknown }).points;
  if (!Array.isArray(points)) return false;
  const mode = (value as { mode?: unknown }).mode;
  const requiredPoints = mode === "anchor-scale-angle" ? 2 : 3;
  if (points.length < requiredPoints) return false;
  if (
    mode === "anchor-scale-angle" &&
    typeof (value as { angleDeg?: unknown }).angleDeg !== "number"
  ) {
    return false;
  }
  return points.slice(0, requiredPoints).every((point) => {
    if (!point || typeof point !== "object") return false;
    const p = point as Record<string, unknown>;
    return ["x", "y", "lat", "lng"].every(
      (key) => typeof p[key] === "number" && Number.isFinite(p[key]),
    );
  });
}

export async function resolveObservationPlanUrl(
  o: ObservationWithUrl,
): Promise<ResolvedPlanAsset | null> {
  const supabase = createClient();
  let rawUrl = o.plan_url;
  let name = "Plan";

  if (!rawUrl && o.plan && o.site_id) {
    const { data } = await supabase
      .from("site_plans")
      .select("plan_url, plan_name")
      .eq("id", o.plan)
      .maybeSingle();
    if (data?.plan_url) rawUrl = data.plan_url;
    if (data?.plan_name) name = data.plan_name;
  }

  if (!rawUrl) return null;

  if (rawUrl.startsWith("http")) {
    const lower = rawUrl.toLowerCase();
    return {
      url: rawUrl,
      isPdf: lower.includes(".pdf") || lower.endsWith(".pdf"),
      name,
    };
  }

  if (!o.site_id) return null;

  const fileName = rawUrl.split("/").pop()?.split("?")[0];
  if (!fileName) return null;
  const filePath = `${o.site_id}/${fileName}`;
  const { data: signed, error } = await supabase.storage
    .from("plans")
    .createSignedUrl(filePath, 3600);
  if (error || !signed?.signedUrl) return null;

  return {
    url: signed.signedUrl,
    isPdf: fileName.toLowerCase().endsWith(".pdf"),
    name,
  };
}
