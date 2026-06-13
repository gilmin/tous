import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SphereView } from "./SphereView";
import { HeartButton } from "@/app/_components/HeartButton";
import { MobileGuard } from "@/app/_components/MobileGuard";
import type { OrbitalBody } from "@/app/scene/types";

// Public share link. Anyone (incl. anonymous) can read a published, non-flagged
// sphere here. The anon-key client + public-read RLS policy is the real gate;
// the explicit filters mirror it for clarity. A missing/private/flagged code 404s.
export default async function PublicSpherePage({
  params,
}: {
  params: Promise<{ short_code: string }>;
}) {
  const { short_code } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("spheres")
    .select("tree")
    .eq("short_code", short_code)
    .eq("is_public", true)
    .eq("is_flagged", false)
    .maybeSingle();

  if (!data) notFound();

  return (
    <div className="w-screen h-screen">
      <SphereView tree={data.tree as OrbitalBody} />
      <HeartButton shortCode={short_code} />
      <MobileGuard />
    </div>
  );
}
