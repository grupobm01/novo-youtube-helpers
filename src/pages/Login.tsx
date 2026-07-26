import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { signInWithEmail } from "@/lib/auth";
import { ensureProfile } from "@/lib/load-user";
import { useI18n } from "@/lib/i18n";
import TikTokIcon from "@/components/TikTokIcon";

export default function Login() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/inicio", { replace: true });
      setCheckingSession(false);
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await signInWithEmail(email, password);
      if (user) {
        await ensureProfile(user.id, user.email || email);

        const { data: profile } = await supabase
          .from("profiles")
          .select("primeiro_acesso")
          .eq("email", user.email || email)
          .maybeSingle();

        if (profile && !(profile as any).primeiro_acesso) {
          await supabase
            .from("profiles")
            .update({ primeiro_acesso: new Date().toISOString() } as any)
            .eq("email", user.email || email);
        }
      }
      navigate("/inicio", { replace: true });
    } catch (err: any) {
      setError(err.message || t("login.failed"));
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#000" }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative" style={{ backgroundColor: "#000" }}>
      {/* Language Selector */}
      <div className="absolute top-4 right-4 flex items-center gap-2" aria-label={t("login.languageLabel")}>
        <button
          type="button"
          onClick={() => setLang("en")}
          aria-label="English"
          className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xl transition-all border-2 ${
            lang === "en" ? "border-primary opacity-100 scale-110" : "border-transparent opacity-50 hover:opacity-80"
          }`}
        >
          <span role="img" aria-hidden>🇺🇸</span>
        </button>
        <button
          type="button"
          onClick={() => setLang("fr")}
          aria-label="Français"
          className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xl transition-all border-2 ${
            lang === "fr" ? "border-primary opacity-100 scale-110" : "border-transparent opacity-50 hover:opacity-80"
          }`}
        >
          <span role="img" aria-hidden>🇫🇷</span>
        </button>
      </div>

      <div className="w-full max-w-[430px] flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-primary-foreground bg-primary">
            <TikTokIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-[0.2em] text-primary">REWARDS</p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-8 mt-2">{t("login.signInToAccount")}</p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{t("login.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl bg-[#1a1a1a] border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={t("login.emailPlaceholder")}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{t("login.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl bg-[#1a1a1a] border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={t("login.passwordPlaceholder")}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? t("login.signingIn") : t("login.signIn")}
          </button>
        </form>

        {/* Info card */}
        <div className="w-full mt-8 p-4 rounded-xl bg-[#1a1a1a] border border-border">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            {t("login.info")}{" "}
            <span className="text-foreground font-semibold">123456</span>.
          </p>
        </div>
      </div>

      <Link
        to="/terms"
        className="absolute bottom-3 text-[7px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("footer.terms")}
      </Link>
    </div>
  );
}
