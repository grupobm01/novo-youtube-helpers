import { supabase } from "@/integrations/supabase/client";
import type { ProfileData, RewardHistoryItem, WithdrawHistoryItem } from "./types";

function toNumericProfile(data: any): ProfileData {
  const profile = {
    ...data,
    balance: Number(data.balance) || 0,
    in_transit: Number(data.in_transit) || 0,
    total_paid_out: Number(data.total_paid_out) || 0,
    completed_videos: Number(data.completed_videos) || 0,
  };
  console.log("[load-user] profile loaded:", profile);
  console.log("[load-user] balance received:", profile.balance);
  return profile as ProfileData;
}

export async function ensureProfile(userId: string, email?: string): Promise<ProfileData | null> {
  const lookupEmail = email || "";
  console.log("[load-user] ensureProfile called for userId:", userId, "email:", lookupEmail);

  if (!lookupEmail) {
    console.error("[load-user] No email provided, cannot look up profile");
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", lookupEmail)
    .maybeSingle();

  if (error) {
    console.error("[load-user] Error loading profile by email:", error);
    return null;
  }

  if (data) {
    console.log("[load-user] profile found by email:", lookupEmail);
    console.log("[load-user] profile.balance:", data.balance);
    return toNumericProfile(data);
  }

  // Profile doesn't exist – create one with default balance 240
  const { data: created, error: insertErr } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email: lookupEmail,
      balance: 240.0,
      in_transit: 0,
      total_paid_out: 0,
      completed_videos: 0,
    })
    .select("*")
    .single();

  if (insertErr) {
    console.error("[load-user] Error creating profile:", insertErr);
    return null;
  }

  console.log("[load-user] new profile created for email:", lookupEmail);
  return toNumericProfile(created);
}

export async function loadProfile(userId: string, email?: string): Promise<ProfileData | null> {
  return ensureProfile(userId, email);
}

/** Helper: get authenticated user (uses getUser for security) */
export async function getAuthUser() {
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[load-user] auth user:", user?.id ?? "none", "email:", user?.email ?? "none");
  return user;
}

export async function loadRewardHistory(profileId: string): Promise<RewardHistoryItem[]> {
  const { data, error } = await supabase
    .from("reward_history")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error loading reward history:", error);
    return [];
  }
  return data as RewardHistoryItem[];
}

export async function loadWithdrawHistory(profileId: string): Promise<WithdrawHistoryItem[]> {
  const { data, error } = await supabase
    .from("withdraw_history")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error loading withdraw history:", error);
    return [];
  }
  return data as WithdrawHistoryItem[];
}
