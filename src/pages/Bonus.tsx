import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";

type BonusVideo = {
  id: string;
  title: string;
  vimeo_id: string;
  display_order: number;
};

export default function Bonus() {
  const [videos, setVideos] = useState<BonusVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("bonus_videos")
        .select("id, title, vimeo_id, display_order")
        .order("display_order", { ascending: true });
      setVideos(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <Header />
      <main className="max-w-[430px] mx-auto px-4 pt-4">
        <h1 className="text-2xl font-bold mb-1">Bonus</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Free bonus content — no unlock required.
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No videos yet.</p>
        ) : (
          <div className="space-y-6">
            {videos.map((v) => (
              <div key={v.id} className="rounded-xl overflow-hidden border border-border bg-card">
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    src={`https://player.vimeo.com/video/${v.vimeo_id}?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479`}
                    frameBorder={0}
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                    title={v.title}
                  />
                </div>
                <div className="p-3">
                  <h2 className="text-sm font-semibold">{v.title}</h2>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}