import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile, loadRewardHistory, loadWithdrawHistory, getAuthUser } from "@/lib/load-user";
import { formatCurrency } from "@/lib/helpers";
import { ProfileData, RewardHistoryItem, WithdrawHistoryItem } from "@/lib/types";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { labelKey: TranslationKey; color: string; dot: string }> = {
  pending:    { labelKey: "sq.status.pending",    color: "text-[#f9a825]", dot: "bg-[#f9a825]" },
  processing: { labelKey: "sq.status.processing", color: "text-[#065fd4]", dot: "bg-[#065fd4] animate-pulse" },
  completed:  { labelKey: "sq.status.completed",  color: "text-[#2ba640]", dot: "bg-[#2ba640]" },
  cancelled:  { labelKey: "sq.status.cancelled",  color: "text-[#606060]", dot: "bg-[#606060]" },
};

// ─── Withdrawal Modal ────────────────────────────────────────────────────────

type ModalState = "amount" | "success";

function WithdrawalModal({
  open,
  onClose,
  available,
  onWithdraw,
}: {
  open: boolean;
  onClose: () => void;
  available: number;
  onWithdraw: (amount: number) => Promise<void>;
}) {
  const t = useT();
  const [state, setState] = useState<ModalState>("amount");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setState("amount");
      setAmount("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const presets = [50, 100, 200];

  const handleConfirm = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 10) { setError(t("sq.minWithdraw")); return; }
    if (val > available) { setError(t("sq.exceedsBalance")); return; }
    setLoading(true);
    try {
      await onWithdraw(val);
      setState("success");
    } catch {
      setError(t("sq.withdrawFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[430px] rounded-t-3xl bg-[#1a1a1a] p-6 pb-10">
        {state === "amount" ? (
          <>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#f1f1f1]">{t("sq.withdrawFunds")}</h2>
              <button onClick={onClose} className="text-[#606060] text-xl leading-none">&times;</button>
            </div>
            <p className="mb-5 text-[12px] text-[#606060]">{t("sq.available", { amount: formatCurrency(available) })}</p>
            <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              placeholder="0.00"
              className="mb-3 w-full rounded-xl border border-[#3f3f3f] bg-[#272727] px-4 py-3 text-[20px] font-bold tabular-nums text-[#f1f1f1] outline-none placeholder:text-[#606060] focus:border-[#ff0000]"
            />
            <div className="mb-4 flex gap-2">
              {presets.map((p) => (
                <button key={p} onClick={() => { setAmount(String(p)); setError(""); }}
                  className="flex-1 rounded-lg bg-[#272727] py-2 text-[13px] font-semibold text-[#aaaaaa] active:bg-[#3f3f3f]">
                  ${p}
                </button>
              ))}
              <button onClick={() => { setAmount(String(available)); setError(""); }}
                className="flex-1 rounded-lg bg-[#272727] py-2 text-[13px] font-semibold text-[#aaaaaa] active:bg-[#3f3f3f]">
                {t("sq.all")}
              </button>
            </div>
            {error && <p className="mb-3 text-center text-[12px] text-red-400">{error}</p>}
            <button onClick={handleConfirm} disabled={loading}
              className="w-full rounded-2xl bg-[#ff0000] py-4 text-[16px] font-bold text-white disabled:opacity-50 active:bg-[#cc0000]">
              {loading ? t("sq.processing") : t("sq.confirmWithdrawal")}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center py-4">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#2ba640]/20">
              <svg viewBox="0 0 24 24" className="size-7 text-[#2ba640]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-[18px] font-bold text-[#f1f1f1]">{t("sq.withdrawalRequested")}</h2>
            <p className="mt-1 text-[13px] text-[#606060]">{t("sq.beingProcessed", { amount: formatCurrency(parseFloat(amount)) })}</p>
            <button onClick={onClose} className="mt-6 w-full rounded-2xl bg-[#272727] py-3 text-[14px] font-semibold text-[#f1f1f1]">
              {t("sq.done")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Saques() {
  const t = useT();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [rewards, setRewards] = useState<RewardHistoryItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(() => localStorage.getItem("payment_method_set") === "1");
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCardSuccessOpen, setIsCardSuccessOpen] = useState(false);
  const [cardTermsChecked, setCardTermsChecked] = useState(false);

  const balance = profile?.balance ?? 0;

  const loadPageData = useCallback(async () => {
    const user = await getAuthUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadedProfile = await loadProfile(user.id, user.email || "");
    setProfile(loadedProfile);

    if (!loadedProfile) {
      setRewards([]);
      setWithdrawals([]);
      setHasPaymentMethod(false);
      localStorage.removeItem("payment_method_set");
      setIsLoading(false);
      return;
    }

    const [r, w, pm] = await Promise.all([
      loadRewardHistory(loadedProfile.id),
      loadWithdrawHistory(loadedProfile.id),
      supabase.from("payment_methods").select("id").eq("profile_id", loadedProfile.id).maybeSingle(),
    ]);

    setRewards(r);
    setWithdrawals(w);

    if (pm.data) {
      localStorage.setItem("payment_method_set", "1");
      setHasPaymentMethod(true);
    } else {
      localStorage.removeItem("payment_method_set");
      setHasPaymentMethod(false);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    function onFocus() {
      void loadPageData();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadPageData]);

  async function handleWithdraw(amount: number) {
    if (!profile) return;

    const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const { error: insertErr } = await supabase.from("withdraw_history").insert({
      profile_id: profile.id,
      amount,
      status: "processing",
      date_label: dateLabel,
    });

    if (insertErr) {
      console.error("[Saques] withdraw insert error:", insertErr);
      throw insertErr;
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        balance: profile.balance - amount,
        in_transit: profile.in_transit + amount,
      })
      .eq("id", profile.id);

    if (updateErr) {
      console.error("[Saques] balance update error:", updateErr);
    }

    setProfile((prev) => prev ? { ...prev, balance: prev.balance - amount, in_transit: prev.in_transit + amount } : prev);
    setWithdrawals((prev) => [{
      id: crypto.randomUUID(),
      profile_id: profile.id,
      amount,
      status: "processing",
      date_label: dateLabel,
    }, ...prev]);
  }

  const history = [
    ...rewards.map((r) => ({
      type: "reward" as const,
      id: r.id,
      title: r.title,
      amount: r.amount,
      date: r.date_label,
      status: null as string | null,
      created_at: r.created_at,
    })),
    ...withdrawals.map((w) => ({
      type: "withdraw" as const,
      id: w.id,
      title: t("sq.withdrawal"),
      amount: w.amount,
      date: w.date_label,
      status: w.status,
      created_at: w.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  return (
    <div className="mx-auto flex min-h-svh max-w-[430px] flex-col bg-[#0f0f0f]">
      <Header balance={balance} />
      <main className="flex-1 pb-16">
        <div className="flex flex-col bg-[#0f0f0f]">
          {/* ── Balance ── */}
          <div className="px-4 pb-2 pt-5">
            <div className="flex flex-col gap-1 px-1 pb-5">
              <span className="text-[12px] font-medium text-[#606060]">{t("sq.availableBalance")}</span>
              <span className="text-[42px] font-bold tabular-nums leading-tight text-[#f1f1f1]">
                {formatCurrency(balance)}
              </span>
            </div>

            <button
              onClick={() => {
                if (!hasPaymentMethod) {
                  toast.error(t("sq.addBankFirst"), {
                    action: { label: t("sq.addNow"), onClick: () => navigate("/conta") },
                  });
                  return;
                }
                setIsModalOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff0000] py-4 text-[16px] font-bold text-white active:bg-[#cc0000]"
            >
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 1v10M4 5l4-4 4 4M2 14h12" />
              </svg>
              {t("sq.requestPayment")}
            </button>

            <button
              onClick={() => {
                setCardTermsChecked(false);
                setIsCardModalOpen(true);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#3f3f3f] bg-[#1a1a1a] py-4 text-[15px] font-semibold text-[#f1f1f1] active:bg-[#272727]"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              {t("sq.withdrawToCC")}
            </button>
          </div>

          {withdrawals.length > 0 && (
            <div className="mx-4 mt-4 rounded-xl border border-[#3f3f3f] bg-[#1a1a1a] p-4">
              <p className="text-[13px] font-semibold text-[#f1f1f1]">{t("sq.processingTitle")}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#606060]">
                {t("sq.processingBody")}
              </p>
            </div>
          )}

          <h3 className="px-4 pb-3 pt-6 text-[12px] font-semibold uppercase tracking-widest text-[#606060]">
            {t("sq.bankDetails")}
          </h3>
          <div className="px-4">
            {hasPaymentMethod ? (
              <Link
                to="/conta"
                className="flex items-center gap-3 rounded-xl border border-[#3f3f3f] bg-[#1a1a1a] px-4 py-3.5 active:bg-white/5"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-[#272727]">
                  <svg viewBox="0 0 24 24" className="size-4 text-[#aaaaaa]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-[#f1f1f1]">{t("sq.bankAccount")}</p>
                  <p className="text-[12px] text-[#606060]">{t("sq.configured")}</p>
                </div>
                <span className="text-[12px] text-[#3ea6ff]">{t("sq.edit")}</span>
              </Link>
            ) : (
              <Link
                to="/conta"
                className="flex items-center gap-3 rounded-xl border border-dashed border-[#3f3f3f] px-4 py-3.5 active:bg-white/5"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-[#272727]">
                  <svg viewBox="0 0 16 16" className="size-4 text-[#606060]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-[#f1f1f1]">{t("sq.addBankAccount")}</p>
                  <p className="text-[12px] text-[#606060]">{t("sq.bankTransfer")}</p>
                </div>
                <svg viewBox="0 0 16 16" className="size-5 text-[#606060]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </Link>
            )}
          </div>

          <h3 className="px-4 pb-3 pt-6 text-[12px] font-semibold uppercase tracking-widest text-[#606060]">
            {t("sq.history")}
          </h3>

          {isLoading ? (
            <div className="flex flex-col gap-3 px-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-[#1a1a1a]" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ff0000]/15">
                  <svg viewBox="0 0 20 14" className="h-[12px] w-auto">
                    <rect width="20" height="14" rx="3" fill="#FF0000" />
                    <polygon points="8,3.5 8,10.5 14,7" fill="white" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#f1f1f1]">{t("sq.noTransactions")}</p>
                  <p className="text-[12px] text-[#606060]">{t("sq.watchToEarn")}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4">
              {history.map((item, index) => {
                const isReward = item.type === "reward";
                const statusConfig = item.status ? STATUS_CONFIG[item.status] : null;

                return (
                  <div key={item.id}>
                    <div className="flex items-center gap-3 py-3">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${isReward ? "bg-[#2ba640]/15" : "bg-[#ff0000]/15"}`}>
                        {isReward ? (
                          <svg viewBox="0 0 24 24" className="size-4 text-[#2ba640]" fill="currentColor">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 16 16" className="size-4 text-[#ff4444]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 1v10M4 5l4-4 4 4M2 14h12" />
                          </svg>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[#f1f1f1]">
                          {item.title}
                        </p>
                        <p className="text-[12px]">
                          {isReward ? (
                            <span className="text-[#2ba640]">{t("sq.reviewReward")}</span>
                          ) : (
                            <span className={statusConfig?.color ?? "text-[#606060]"}>
                              <span className={`mr-1 inline-block size-1.5 rounded-full ${statusConfig?.dot ?? ""}`} />
                              {statusConfig ? t(statusConfig.labelKey) : item.status}
                            </span>
                          )}
                          <span className="text-[#606060]"> · {item.date || "—"}</span>
                        </p>
                      </div>

                      <span className={`shrink-0 text-[15px] font-bold tabular-nums ${isReward ? "text-[#2ba640]" : "text-red-400"}`}>
                        {isReward ? "+" : "-"}{formatCurrency(item.amount)}
                      </span>
                    </div>

                    {index < history.length - 1 && (
                      <div className="ml-12 h-px bg-[#272727]" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-8">
            <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-[#606060]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="7" />
              <path d="M8 5v3M8 10.5v.5" />
            </svg>
            <p className="text-[12px] text-[#606060]">
              {t("sq.bankTransferTime")}
            </p>
          </div>
        </div>
      </main>
      <BottomNav />

      <WithdrawalModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        available={balance}
        onWithdraw={handleWithdraw}
      />

      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsCardModalOpen(false)} />
          <div className="relative z-10 w-full max-w-[430px] rounded-t-3xl bg-[#1a1a1a] p-6 pb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#f1f1f1]">{t("sq.withdrawToCC")}</h2>
              <button onClick={() => setIsCardModalOpen(false)} className="text-[#606060] text-xl leading-none">&times;</button>
            </div>
            <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-xl border border-[#3f3f3f] bg-[#272727] p-4">
              <input
                type="checkbox"
                checked={cardTermsChecked}
                onChange={(e) => setCardTermsChecked(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[#ff0000]"
              />
              <span className="text-[13px] leading-relaxed text-[#f1f1f1]">
                {t("sq.ccTerms")}
              </span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="flex-1 rounded-2xl bg-[#272727] py-3.5 text-[14px] font-semibold text-[#f1f1f1] active:bg-[#3f3f3f]"
              >
                {t("sq.cancel")}
              </button>
              <button
                disabled={!cardTermsChecked}
                onClick={() => {
                  setIsCardModalOpen(false);
                  setIsCardSuccessOpen(true);
                }}
                className="flex-1 rounded-2xl bg-[#ff0000] py-3.5 text-[14px] font-bold text-white disabled:opacity-40 active:bg-[#cc0000]"
              >
                {t("sq.submit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCardSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsCardSuccessOpen(false)} />
          <div className="relative z-10 w-full max-w-[430px] rounded-t-3xl bg-[#1a1a1a] p-6 pb-10">
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#2ba640]/20">
                <svg viewBox="0 0 24 24" className="size-7 text-[#2ba640]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-[18px] font-bold text-[#f1f1f1]">{t("sq.requestSubmitted")}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[#aaaaaa]">
                {t("sq.requestSubmittedBody")}
              </p>
              <button
                onClick={() => setIsCardSuccessOpen(false)}
                className="mt-6 w-full rounded-2xl bg-[#272727] py-3 text-[14px] font-semibold text-[#f1f1f1] active:bg-[#3f3f3f]"
              >
                {t("sq.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
