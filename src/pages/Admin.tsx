import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthUser } from "@/lib/load-user";
import { isAdmin } from "@/lib/admin";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const user = await getAuthUser();
      if (!user) {
        navigate("/inicio", { replace: true });
        return;
      }
      const ok = await isAdmin(user.id);
      setAllowed(ok);
      if (ok) {
        const [{ data: p }, { data: w }] = await Promise.all([
          supabase.from("profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("withdraw_history").select("*").order("created_at", { ascending: false }),
        ]);
        setProfiles(p || []);
        setWithdrawals(w || []);
      }
      setLoading(false);
    })();
  }, [navigate]);

  const updateWithdraw = async (id: string, status: string) => {
    await supabase.from("withdraw_history").update({ status }).eq("id", id);
    setWithdrawals((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <p>Acesso negado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin</h1>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Saques ({withdrawals.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">Profile</th>
                <th className="text-left p-3">Valor</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-t border-border">
                  <td className="p-3">{new Date(w.created_at).toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{w.profile_id.slice(0, 8)}</td>
                  <td className="p-3">${Number(w.amount).toFixed(2)}</td>
                  <td className="p-3">{w.status}</td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => updateWithdraw(w.id, "approved")} className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">Aprovar</button>
                    <button onClick={() => updateWithdraw(w.id, "failed")} className="px-2 py-1 text-xs rounded bg-destructive text-destructive-foreground">Rejeitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Usuários ({profiles.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Saldo</th>
                <th className="text-left p-3">Pago</th>
                <th className="text-left p-3">Vídeos</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">{p.email}</td>
                  <td className="p-3">{p.full_name}</td>
                  <td className="p-3">${Number(p.balance).toFixed(2)}</td>
                  <td className="p-3">${Number(p.total_paid_out).toFixed(2)}</td>
                  <td className="p-3">{p.completed_videos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
