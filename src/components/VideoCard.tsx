import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { VideoItem } from "@/lib/types";
import { getVideoThumbnail, formatCurrency } from "@/lib/helpers";
import { useT } from "@/lib/i18n";

export function UnlockedVideoCard({ video }: { video: VideoItem }) {
  const navigate = useNavigate();
  const t = useT();

  return (
    <div
      className="cursor-pointer mb-4"
      onClick={() => navigate(`/video/${video.id}`)}
    >
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-card">
        <img
          src={getVideoThumbnail(video)}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {video.duration && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
            {video.duration}
          </span>
        )}
      </div>
      <div className="flex gap-3 mt-3 px-1">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
          style={{ backgroundColor: video.avatarColor }}
        >
          {video.channel.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground leading-tight line-clamp-2">
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {video.channel} · {video.views} {t("videos.views")} · {video.time} {t("videos.ago")}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="bg-primary/20 text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "hsl(0, 80%, 32%)", color: "white" }}>
              {t("videos.rewards")}
            </span>
            <span className="text-xs font-semibold text-green-400">
              +{formatCurrency(video.rewardAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LockedVideoCard({ video }: { video: VideoItem }) {
  const t = useT();
  return (
    <div className="mb-4 opacity-80">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-card">
        <img
          src={getVideoThumbnail(video)}
          alt={video.title}
          className="w-full h-full object-cover blur-[6px] scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
          <Lock className="w-8 h-8 text-white/80" />
          <span className="text-white/90 text-sm font-medium">
            {t("videos.willUnlockIn", { days: video.unlockDaysRemaining ?? 0 })}
          </span>
        </div>
      </div>
      <div className="flex gap-3 mt-3 px-1">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
          style={{ backgroundColor: video.avatarColor }}
        >
          {video.channel.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-muted-foreground leading-tight line-clamp-2">
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {video.channel} · {video.views} {t("videos.views")} · {video.time} {t("videos.ago")}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="bg-muted text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {t("videos.locked")}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              +{formatCurrency(video.rewardAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
