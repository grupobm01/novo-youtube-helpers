import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile, getAuthUser } from "@/lib/load-user";
import { ProfileData } from "@/lib/types";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

interface PaymentMethod {
  id: string;
  profile_id: string;
  first_name: string;
  last_name: string;
  bank_name: string;
  account_number_last4: string;
  routing_number_last4: string;
}

export default function Conta() {
  const t = useT();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  useEffect(() => {
    getAuthUser().then((user) => {
      if (user) {
        loadProfile(user.id, user.email || "").then((p) => {
          if (!p) return;
          setProfile(p);
          supabase
            .from("payment_methods")
            .select("id, profile_id, first_name, last_name, bank_name, account_number_last4, routing_number_last4")
            .eq("profile_id", p.id)
            .maybeSingle()
            .then(({ data }) => {
              if (data) {
                const pm = data as unknown as PaymentMethod;
                setPaymentMethod(pm);
                setFirstName(pm.first_name);
                setLastName(pm.last_name);
                setBankName(pm.bank_name);
                setAccountNumber("");
                setRoutingNumber("");
                localStorage.setItem("payment_method_set", "1");
              }
              setIsLoading(false);
            });
        });
      }
    });
  }, []);

  const isFormValid = firstName.trim() && lastName.trim() && bankName.trim() && accountNumber.trim() && routingNumber.trim();

  async function handleSave() {
    if (!isFormValid || isSaving || !profile) return;
    setIsSaving(true);

    const acct = accountNumber.trim();
    const rout = routingNumber.trim();

    const { error } = await supabase.rpc("save_payment_method", {
      p_profile_id: profile.id,
      p_first_name: firstName.trim(),
      p_last_name: lastName.trim(),
      p_bank_name: bankName.trim(),
      p_account_number: acct,
      p_routing_number: rout,
    });

    if (error) {
      console.error("Save payment method error:", error);
      toast.error(t("ct.saveFailed"));
    } else {
      localStorage.setItem("payment_method_set", "1");
      setPaymentMethod({
        id: paymentMethod?.id ?? "",
        profile_id: profile.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bank_name: bankName.trim(),
        account_number_last4: acct.slice(-4),
        routing_number_last4: rout.slice(-4),
      });
      setAccountNumber("");
      setRoutingNumber("");
      setIsEditing(false);
      toast.success(t("ct.savedSuccess"));
    }
    setIsSaving(false);
  }

  async function handleDelete() {
    if (!profile) return;

    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("profile_id", profile.id);

    if (error) {
      toast.error(t("ct.removeFailed"));
    } else {
      localStorage.removeItem("payment_method_set");
      setPaymentMethod(null);
      setFirstName("");
      setLastName("");
      setBankName("");
      setAccountNumber("");
      setRoutingNumber("");
      setIsEditing(false);
      toast.success(t("ct.removedSuccess"));
    }
  }

  const showForm = !paymentMethod || isEditing;

  return (
    <div className="mx-auto flex min-h-svh max-w-[430px] flex-col bg-[#0f0f0f]">
      <Header balance={profile?.balance ?? 0} />
      <main className="flex-1 px-4 pb-20 pt-5">
        <h1 className="text-[18px] font-bold text-[#f1f1f1] mb-5">{t("ct.title")}</h1>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-[#1a1a1a]" />
            ))}
          </div>
        ) : showForm ? (
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-[12px] font-medium text-[#606060]">{t("ct.firstName")}</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full rounded-xl border border-[#3f3f3f] bg-[#1a1a1a] px-4 py-3 text-[14px] text-[#f1f1f1] placeholder-[#3f3f3f] focus:border-[#606060] focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-[12px] font-medium text-[#606060]">{t("ct.lastName")}</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full rounded-xl border border-[#3f3f3f] bg-[#1a1a1a] px-4 py-3 text-[14px] text-[#f1f1f1] placeholder-[#3f3f3f] focus:border-[#606060] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#606060]">{t("ct.bankName")}</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank of America"
                className="w-full rounded-xl border border-[#3f3f3f] bg-[#1a1a1a] px-4 py-3 text-[14px] text-[#f1f1f1] placeholder-[#3f3f3f] focus:border-[#606060] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#606060]">{t("ct.accountNumber")}</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="123456789"
                className="w-full rounded-xl border border-[#3f3f3f] bg-[#1a1a1a] px-4 py-3 text-[14px] text-[#f1f1f1] placeholder-[#3f3f3f] focus:border-[#606060] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#606060]">{t("ct.routingNumber")}</label>
              <input
                type="text"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                placeholder="021000021"
                className="w-full rounded-xl border border-[#3f3f3f] bg-[#1a1a1a] px-4 py-3 text-[14px] text-[#f1f1f1] placeholder-[#3f3f3f] focus:border-[#606060] focus:outline-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!isFormValid || isSaving}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-2xl bg-[#ff0000] text-[14px] font-bold text-white active:bg-[#cc0000] disabled:opacity-40"
            >
              {isSaving ? t("ct.saving") : t("ct.save")}
            </button>

            {isEditing && paymentMethod && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFirstName(paymentMethod.first_name);
                  setLastName(paymentMethod.last_name);
                  setBankName(paymentMethod.bank_name);
                  setAccountNumber("");
                  setRoutingNumber("");
                }}
                className="w-full py-2 text-[14px] text-[#606060] active:text-[#aaaaaa]"
              >
                {t("ct.cancel")}
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[#3f3f3f] bg-[#1a1a1a] p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#272727]">
                <svg viewBox="0 0 24 24" className="size-5 text-[#aaaaaa]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[#f1f1f1]">
                  {paymentMethod.first_name} {paymentMethod.last_name}
                </p>
                <p className="text-[12px] text-[#606060]">{paymentMethod.bank_name}</p>
              </div>
              <div className="flex size-6 items-center justify-center rounded-full bg-[#2ba640]/20">
                <svg viewBox="0 0 24 24" className="size-3.5 text-[#2ba640]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <div className="flex justify-between">
                <span className="text-[12px] text-[#606060]">{t("ct.account")}</span>
                <span className="text-[13px] font-medium text-[#aaaaaa]">
                  ••••{paymentMethod.account_number_last4}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] text-[#606060]">{t("ct.routing")}</span>
                <span className="text-[13px] font-medium text-[#aaaaaa]">
                  ••••{paymentMethod.routing_number_last4}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 rounded-xl bg-[#272727] py-2.5 text-[13px] font-semibold text-[#f1f1f1] active:bg-[#3f3f3f]"
              >
                {t("ct.edit")}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-xl border border-[#3f3f3f] py-2.5 text-[13px] font-semibold text-[#ff4444] active:bg-[#272727]"
              >
                {t("ct.remove")}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-start gap-2">
          <svg viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0 text-[#606060]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="7" />
            <path d="M8 5v3M8 10.5v.5" />
          </svg>
          <p className="text-[12px] leading-relaxed text-[#606060]">
            {t("ct.info")}
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
