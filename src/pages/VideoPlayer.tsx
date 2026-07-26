import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile, getAuthUser } from "@/lib/load-user";
import { ProfileData } from "@/lib/types";
import { unlockedVideos, lockedVideos } from "@/lib/videos";
import { formatCurrency, getVideoThumbnail } from "@/lib/helpers";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Lock, ThumbsUp, ThumbsDown, Share2, Download, Bookmark, Scissors, CheckCircle2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export default function VideoPlayer() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [liked, setLiked] = useState(false);
  const [rating, setRating] = useState<"relevant" | "not-relevant" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [reviewed, setReviewed] = useState(false);
  const [rewardLoading, setRewardLoading] = useState(false);

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
    if (!id) return;
    if (localStorage.getItem(`reviewed:${id}`)) setReviewed(true);
  }, [id]);

  const submitReview = useCallback(async () => {
    if (!profile?.id || !id || reviewed || rewardLoading) return;
    setRewardLoading(true);
    try {
      const video = [...unlockedVideos, ...lockedVideos].find((v) => v.id === id);
      const amount = video?.rewardAmount ?? 40;

      const { data, error } = await supabase.rpc("complete_video_review", {
        p_profile_id: profile.id,
        p_video_id: id,
        p_title: video?.title ?? "Video Review",
        p_amount: amount,
      });

      if (error) throw error;

      const result = data as { success: boolean; reason?: string; amount?: number };

      if (!result.success && result.reason === "already_reviewed") {
        localStorage.setItem(`reviewed:${id}`, "1");
        setReviewed(true);
        return;
      }

      localStorage.setItem(`reviewed:${id}`, "1");
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
  }, [profile, userId, userEmail, id, reviewed, rewardLoading, t]);

  const toggleLike = useCallback(() => {
    setLiked((prev) => {
      const next = !prev;
      if (next && !reviewed) submitReview();
      return next;
    });
  }, [reviewed, submitReview]);

  const allVideos = [...unlockedVideos, ...lockedVideos];
  const video = allVideos.find((v) => v.id === id);
  const isLocked = lockedVideos.some((v) => v.id === id);
  const relatedVideos = allVideos.filter((v) => v.id !== id).slice(0, 6);

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
          <div className="relative w-full" style={{ paddingTop: "56.25%", background: "#000" }}>
            {isLocked ? (
              <>
                <img src={getVideoThumbnail(video)} alt={video.title} className="absolute inset-0 w-full h-full object-cover blur-md" />
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                  <Lock className="w-10 h-10 text-white/80" />
                  <p className="text-white font-medium text-sm">{t("vp.thisLocked")}</p>
                  <p className="text-white/60 text-xs">{t("videos.willUnlockIn", { days: video.unlockDaysRemaining ?? 0 })}</p>
                </div>
              </>
            ) : (
              <iframe
                className="absolute inset-0 w-full h-full border-none"
                src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>

          <div className="px-4 pt-3">
            <h1 className="text-[15px] font-bold leading-[1.3] text-foreground line-clamp-2">{video.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
              <span>{video.views}</span>
              <span>·</span>
              <span>{video.time}</span>
              <span>·</span>
              <span className="text-[#3ea6ff]">#{video.channel.split(" ")[0]}</span>
              <span className="ml-1 font-semibold text-foreground">{t("vp.more")}</span>
            </div>
          </div>

          {!isLocked && (
            <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3">
              <div className="flex shrink-0 overflow-hidden rounded-full border border-border bg-secondary">
                <button
                  onClick={toggleLike}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold transition-colors ${liked ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <ThumbsUp className="w-5 h-5" fill={liked ? "currentColor" : "none"} />
                  <span>{liked ? t("vp.liked") : t("vp.like")}</span>
                </button>
                <div className="my-2 w-px bg-border" />
                <button className="flex items-center px-3 py-2.5 text-muted-foreground">
                  <ThumbsDown className="w-5 h-5" />
                </button>
              </div>
              <ActionPill icon={<Share2 className="w-4 h-4" />} label={t("vp.share")} />
              <ActionPill icon={<Download className="w-4 h-4" />} label={t("vp.download")} />
              <ActionPill icon={<Bookmark className="w-4 h-4" />} label={t("vp.save")} />
              <ActionPill icon={<Scissors className="w-4 h-4" />} label={t("vp.clip")} />
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: video.avatarColor }}>
              {video.channel.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-foreground truncate">{video.channel}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </div>
              <span className="text-xs text-muted-foreground">{video.views} {t("vp.subscribers")}</span>
            </div>
            <button className="shrink-0 rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background">{t("vp.subscribe")}</button>
          </div>

          {!isLocked && (
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
          )}

          {!isLocked && (
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
          )}

          <div className="px-4 mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">{t("vp.comments")}</span>
              <span className="text-xs text-muted-foreground">1.2K</span>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-card border border-border p-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                {profile?.avatar_initial || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{t("vp.topComment")}</p>
                <p className="text-sm text-foreground mt-0.5 line-clamp-2">{t("vp.commentSample")}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex flex-col gap-3 px-4">
              {relatedVideos.map((v) => {
                const vIsLocked = lockedVideos.some((lv) => lv.id === v.id);
                return (
                  <Link key={v.id} to={`/video/${v.id}`} className="flex gap-3 active:opacity-70">
                    <div className="relative w-[160px] shrink-0 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <img src={getVideoThumbnail(v)} alt={v.title} className={`w-full h-full object-cover ${vIsLocked ? "blur-sm" : ""}`} />
                      {vIsLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-white/80" />
                        </div>
                      )}
                      {v.duration && (
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">{v.duration}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="text-[13px] font-medium text-foreground leading-tight line-clamp-2">{v.title}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">{v.channel}</p>
                      <p className="text-xs text-muted-foreground">{v.views} · {v.time}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

function ActionPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary px-4 py-2.5 text-[13px] font-semibold text-muted-foreground hover:bg-secondary/80 transition-colors">
      {icon}
      {label}
    </button>
  );
}
