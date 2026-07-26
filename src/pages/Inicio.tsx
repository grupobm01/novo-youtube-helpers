import { useEffect, useState } from "react";
import { loadProfile, getAuthUser } from "@/lib/load-user";
import { ProfileData } from "@/lib/types";
import { unlockedVideos, lockedVideos } from "@/lib/videos";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { UnlockedVideoCard, LockedVideoCard } from "@/components/VideoCard";
import { useT } from "@/lib/i18n";

export default function Inicio() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const t = useT();

  useEffect(() => {
    getAuthUser().then((user) => {
      if (user) loadProfile(user.id, user.email || "").then(setProfile);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[430px] mx-auto">
        <Header balance={profile?.balance ?? 0} />
        <main className="px-4 pt-4 pb-20 scrollbar-hide">
          {unlockedVideos.map((video) => (
            <UnlockedVideoCard key={video.id} video={video} />
          ))}

          {lockedVideos.length > 0 && (
            <div className="mt-6 mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t("videos.lockedSection")}
              </h2>
            </div>
          )}

          {lockedVideos.map((video) => (
            <LockedVideoCard key={video.id} video={video} />
          ))}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
