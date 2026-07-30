import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loadProfile, getAuthUser } from "@/lib/load-user";
import { formatCurrency, getInitial } from "@/lib/helpers";
import { ProfileData } from "@/lib/types";
import { signOut } from "@/lib/auth";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useT } from "@/lib/i18n";

export default function Perfil() {
  const navigate = useNavigate();
  const t = useT();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    getAuthUser().then((user) => {
      if (user) loadProfile(user.id, user.email || "").then(setProfile);
    });
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/inicio", { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-[430px] flex-col bg-[#0f0f0f]">
      <Header balance={profile?.balance ?? 0} />
      <main className="flex-1 pb-16">
        <div className="flex flex-col">

          {/* Avatar & info */}
          <div className="px-4 pb-5">
            <div className="mt-4 mb-3">
              <div className="flex items-center justify-center rounded-full text-[28px] font-semibold text-white" style={{ width: 76, height: 76, backgroundColor: profile?.avatar_color || "rgb(21, 101, 192)" }}>
                {profile?.avatar_initial || getInitial(profile?.full_name)}
              </div>
            </div>
            <h1 className="text-[20px] font-bold text-[#f1f1f1]">{profile?.full_name || t("pf.user")}</h1>
            <p className="mt-0.5 text-[13px] text-[#aaaaaa]">@{profile?.username || "user"}</p>
            <p className="mt-0.5 text-[13px] text-[#aaaaaa]">{profile?.email}</p>

            {/* Stats */}
            <div className="mt-4 flex items-center justify-around rounded-xl bg-[#1f1f1f] px-4 py-3">
              <div className="flex flex-col items-center">
                <span className="text-[18px] font-bold text-[#f1f1f1]">{profile?.completed_videos ?? 0}</span>
                <span className="text-[11px] text-[#aaaaaa]">{t("pf.statVideos")}</span>
              </div>
              <div className="h-8 w-px bg-[#3f3f3f]" />
              <div className="flex flex-col items-center">
                <span className="text-[18px] font-bold text-[#f1f1f1]">{formatCurrency(profile?.balance ?? 0)}</span>
                <span className="text-[11px] text-[#aaaaaa]">{t("pf.statBalance")}</span>
              </div>
              <div className="h-8 w-px bg-[#3f3f3f]" />
              <div className="flex flex-col items-center">
                <span className="text-[18px] font-bold text-[#f1f1f1]">{profile?.member_since || "—"}</span>
                <span className="text-[11px] text-[#aaaaaa]">{t("pf.statMember")}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-4 flex gap-3">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#272727] py-2.5 text-[13px] font-semibold text-[#f1f1f1]">
                <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
                </svg>
                {t("pf.editProfile")}
              </button>
              <Link to="/saques" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#272727] py-2.5 text-[13px] font-semibold text-[#f1f1f1]">
                <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v6M6 9h4" />
                </svg>
                {t("pf.withdraw")}
              </Link>
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#272727] py-2.5 text-[13px] font-semibold text-red-400"
            >
              {t("pf.signOut")}
            </button>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
