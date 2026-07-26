import { supabase } from "@/integrations/supabase/client";

export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles" as any)
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("[admin] error checking role:", error);
    return false;
  }
  return !!data;
}
