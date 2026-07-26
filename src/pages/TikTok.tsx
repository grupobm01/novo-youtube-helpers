import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProfile, getAuthUser } from "@/lib/load-user";
import { ProfileData } from "@/lib/types";
import { tiktokVideos } from "@/lib/tiktok-videos";
import { fetchTikTokThumbnail } from "@/lib/tiktok-thumbnails";
import { formatCurrency } from "@/lib/helpers";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { CheckCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function TikTok() {
  const t = useT();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [failedThumbs, setFailedThumbs] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    getAuthUser().then((user) => {
      if (user) loadProfile(user.id, user.email || "").then(setProfile);
    });
  }, []);

  useEffect(() => {
    const stored = new Set<string>();
    tiktokVideos.forEach((v) => {
      if (localStorage.getItem(`reviewed:${v.id}`)) stored.add(v.id);
    });
    setReviewedIds(stored);
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    const loadThumbnails = async () => {
      const results = await Promise.all(
        tiktokVideos.map(async (video) => {
          try {
            const url = await fetchTikTokThumbnail(video.url);
            return { id: video.id, url };
          } catch {
            return { id: video.id, url: null };
          }
        })
      );
      const mapped: Record<string, string> = {};
      results.forEach((r) => {
        if (r.url) mapped[r.id] = r.url;
      });
      setThumbnails(mapped);
    };
    loadThumbnails();
    return () => abort.abort();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[430px] mx-auto">
        <Header balance={profile?.balance ?? 0} />
        <main className="px-3 pt-3 pb-20">
          <h1 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.3z" />
            </svg>
            {t("tt.title")}
          </h1>

          <div className="grid grid-cols-2 gap-3">
            {tiktokVideos.map((video) => {
              const isReviewed = reviewedIds.has(video.id);
              return (
                <button
                  key={video.id}
                  onClick={() => navigate(`/tiktok/${video.id}`)}
                  className="flex flex-col rounded-xl overflow-hidden border border-border bg-card text-left active:opacity-80 transition-opacity"
                >
                  <div className="relative w-full bg-secondary" style={{ aspectRatio: "9/16" }}>
                    {thumbnails[video.id] && !failedThumbs.has(video.id) ? (
                      <img
                        src={thumbnails[video.id]}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={() => setFailedThumbs((prev) => new Set(prev).add(video.id))}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-muted-foreground/40">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.3z" />
                        </svg>
                        <span className="text-[11px] text-muted-foreground font-medium">{video.username}</span>
                      </div>
                    )}

                    <span className="absolute top-2 left-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {t("videos.rewards")}
                    </span>

                    {isReviewed && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 flex flex-col gap-1">
                    <p className="text-[12px] font-semibold text-foreground leading-tight line-clamp-2">
                      {video.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{video.account}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{video.views}</span>
                      <span className="text-[12px] font-bold text-green-400">
                        +{formatCurrency(video.rewardAmount)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
