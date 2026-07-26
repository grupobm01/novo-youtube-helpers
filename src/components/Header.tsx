import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/helpers";
import { useT } from "@/lib/i18n";
import TikTokIcon from "@/components/TikTokIcon";

interface HeaderProps {
  balance?: number;
}

export default function Header({ balance = 0 }: HeaderProps) {
  const t = useT();
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4">
      <Link to="/inicio" className="flex items-center gap-1.5 active:opacity-70">
        <TikTokIcon className="h-4 w-auto shrink-0 text-primary" />
        <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary">Rewards</span>
      </Link>

      <div className="flex flex-col items-center leading-none">
        <span className="text-[10px] font-medium tracking-[0.05em] text-muted-foreground">{t("header.balance")}</span>
        <span className="mt-0.5 text-[15px] font-bold text-foreground tabular-nums">{formatCurrency(balance)}</span>
      </div>

      <div className="flex items-center gap-2">
        <a
          href="https://forms.gle/4EMA4KuCMvQmpjUo6"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-full border border-border bg-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          {t("header.refund")}
        </a>
        <Link
          to="/saques"
          className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 1v10M4 7l4 4 4-4" />
            <path d="M2 14h12" />
          </svg>
          {t("header.withdraw")}
        </Link>
      </div>
    </header>
  );
}
