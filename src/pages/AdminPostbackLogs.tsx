import { Fragment, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthUser } from "@/lib/load-user";
import { isAdmin } from "@/lib/admin";

type PostbackLog = {
  id: string;
  raw_params: Record<string, unknown>;
  success: boolean;
  error: string | null;
  resolved_email: string | null;
  resolved_user_id: string | null;
  created_at: string;
};

export default function AdminPostbackLogs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [logs, setLogs] = useState<PostbackLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadLogs = useCallback(async () => {
    setRefreshing(true);
    const { data } = await supabase
      .from("postback_logs")
      .select("*")
      .order("created_at", { ascending: false });
    setLogs((data as PostbackLog[] | null) ?? []);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    (async () => {
      const user = await getAuthUser();
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      const ok = await isAdmin(user.id);
      setAllowed(ok);
      if (ok) await loadLogs();
      setLoading(false);
    })();
  }, [navigate, loadLogs]);

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
    <div className="min-h-screen bg-background text-foreground p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Postback Logs ({logs.length})</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={refreshing}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {refreshing ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Sucesso</th>
              <th className="text-left p-3">Erro</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">User ID</th>
              <th className="text-left p-3">JSON</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Nenhum postback registrado ainda.
                </td>
              </tr>
            )}
            {logs.map((log) => {
              const isOpen = !!expanded[log.id];
              return (
                <Fragment key={log.id}>
                  <tr className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          "inline-block px-2 py-0.5 rounded-full text-xs font-semibold " +
                          (log.success
                            ? "bg-green-500/15 text-green-500"
                            : "bg-red-500/15 text-red-500")
                        }
                      >
                        {log.success ? "OK" : "FALHA"}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs">{log.error ?? "—"}</td>
                    <td className="p-3">{log.resolved_email ?? "—"}</td>
                    <td className="p-3 font-mono text-xs">
                      {log.resolved_user_id ? log.resolved_user_id.slice(0, 8) : "—"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          setExpanded((prev) => ({ ...prev, [log.id]: !prev[log.id] }))
                        }
                        className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
                      >
                        {isOpen ? "Ocultar" : "Ver JSON completo"}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-border bg-muted/30">
                      <td colSpan={6} className="p-3">
                        <pre className="text-xs whitespace-pre-wrap break-all font-mono bg-background border border-border rounded p-3 overflow-auto max-h-96">
                          {JSON.stringify(log.raw_params, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}