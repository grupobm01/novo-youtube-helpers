import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile, getAuthUser } from "@/lib/load-user";
import { ProfileData } from "@/lib/types";
import { tiktokVideos } from "@/lib/tiktok-videos";
import { formatCurrency } from "@/lib/helpers";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { CheckCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export default function TikTokPlayer() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const fullId = id?.startsWith("tiktok_") ? id : `tiktok_${id}`;
  const video = tiktokVideos.find((v) => v.id === fullId);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [reviewed, setReviewed] = useState(false);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [rating, setRating] = useState<"relevant" | "not-relevant" | null>(null);

  useEffect(() => {
    getAuthUser().then((user) => {
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");
        loadProfile(user.id, user.email || "").then(setProfile);
      }
    });
  }, []);

  useEffect(() => {
    if (!fullId) return;
    if (localStorage.getItem(`reviewed:${fullId}`)) setReviewed(true);
  }, [fullId]);

  const submitReview = useCallback(async () => {
    if (!profile?.id || !fullId || reviewed || rewardLoading) return;
    setRewardLoading(true);
    try {
      const amount = video?.rewardAmount ?? 40;

      const { data, error } = await supabase.rpc("complete_video_review", {
        p_profile_id: profile.id,
        p_video_id: fullId,
        p_title: video?.title ?? "TikTok Video Review",
        p_amount: amount,
      });

      if (error) throw error;

      const result = data as { success: boolean; reason?: string; amount?: number };

      if (!result.success && result.reason === "already_reviewed") {
        localStorage.setItem(`reviewed:${fullId}`, "1");
        setReviewed(true);
        return;
      }

      localStorage.setItem(`reviewed:${fullId}`, "1");
      setReviewed(true);

      const updated = await loadProfile(userId!, userEmail);
      if (updated) setProfile(updated);

      toast.success(t("vp.reviewRegistered", { amount: formatCurrency(amount) }), { duration: 4000 });
    } catch (e) {
      console.error("Review submit error:", e);
      toast.error(t("vp.reviewFailed"));
    } finally {
      setRewardLoading(false);
    }
  }, [profile, userId, userEmail, fullId, reviewed, rewardLoading, video, t]);

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t("vp.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[430px] mx-auto">
        <Header balance={profile?.balance ?? 0} />
        <main className="pb-20">
          <div className="relative w-full bg-black flex items-center justify-center" style={{ aspectRatio: "9/16", maxHeight: "70vh" }}>
            <iframe
              src={`https://www.tiktok.com/player/v1/${fullId.replace("tiktok_", "")}?music_info=1&description=1`}
              className="absolute inset-0 w-full h-full border-none"
              allow="fullscreen"
              allowFullScreen
            />
          </div>

          <div className="px-4 pt-3">
            <h1 className="text-[15px] font-bold leading-[1.3] text-foreground line-clamp-2">{video.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
              <span>{video.views}</span>
              <span>·</span>
              <span>{video.time}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-t border-border mt-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground text-sm font-bold shrink-0">
              {video.account.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-foreground truncate">{video.account}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </div>
              <span className="text-xs text-muted-foreground">{video.username}</span>
            </div>
            <span className="shrink-0 rounded bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">{t("videos.rewards")}</span>
          </div>

          <div className="mx-4 mt-2 rounded-xl border border-border bg-card p-4">
            {reviewed ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-semibold">{t("vp.reviewSubmitted")}</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground mb-3">{t("vp.isRelevant")}</p>
                <div className="flex gap-3">
                  <button
                    disabled={rewardLoading}
                    onClick={() => { setRating("relevant"); submitReview(); }}
                    className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${rating === "relevant" ? "bg-primary text-primary-foreground" : "border border-border bg-secondary text-foreground hover:bg-secondary/80"}`}
                  >{t("vp.yes")}</button>
                  <button
                    disabled={rewardLoading}
                    onClick={() => { setRating("not-relevant"); submitReview(); }}
                    className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${rating === "not-relevant" ? "bg-secondary text-foreground border border-foreground" : "border border-border bg-secondary text-foreground hover:bg-secondary/80"}`}
                  >{t("vp.no")}</button>
                </div>
              </>
            )}
          </div>

          <div className={`mx-4 mt-3 flex items-center gap-3 rounded-xl border p-4 ${reviewed ? "border-green-500/30 bg-green-500/5" : "border-border bg-card"}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 shrink-0">
              {reviewed ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{reviewed ? t("vp.rewardCollected") : t("vp.rewardAvailable")}</p>
              <p className="text-xs text-muted-foreground">{reviewed ? t("vp.addedToBalance") : t("vp.rateToEarn")}</p>
            </div>
            <span className="text-base font-bold text-green-400">{reviewed ? "" : "+"}{formatCurrency(video.rewardAmount)}</span>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
