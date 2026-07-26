import { useLocation, useNavigate } from "react-router-dom";
import { Home, Gift, DollarSign, User } from "lucide-react";
import YoutubeIcon from "@/components/YoutubeIcon";
import { useT } from "@/lib/i18n";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();

  const navItems = [
    { path: "/inicio", label: t("nav.home"), icon: Home },
    { path: "/tiktok", label: t("nav.tiktok"), icon: YoutubeIcon },
    { path: "/bonus", label: t("nav.bonus"), icon: Gift },
    { path: "/saques", label: t("nav.withdraws"), icon: DollarSign },
    { path: "/perfil", label: t("nav.profile"), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 min-w-[48px]"
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
              <span className={`text-[10px] ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
