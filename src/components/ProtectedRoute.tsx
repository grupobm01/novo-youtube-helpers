import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEMO_EMAIL = "digital.jhf@gmail.com";
const DEMO_PASSWORD = "123456";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthenticated(true);
        setLoading(false);
      }
    });

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAuthenticated(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });
        setAuthenticated(!error);
      }
      setLoading(false);
    })();

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">Não foi possível iniciar a sessão. Recarregue a página.</p>
      </div>
    );
  }

  return <>{children}</>;
}
