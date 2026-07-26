export type RewardHistoryItem = {
  id: string;
  profile_id: string;
  title: string;
  amount: number;
  date_label: string | null;
  created_at?: string;
};

export type WithdrawHistoryItem = {
  id: string;
  profile_id: string;
  amount: number;
  status: string;
  date_label: string | null;
  created_at?: string;
};

export type VideoItem = {
  id: string;
  title: string;
  channel: string;
  views: string;
  time: string;
  duration?: string;
  avatarColor: string;
  rewardAmount: number;
  thumbnail?: string;
  unlockDaysRemaining?: number;
};

export type ProfileData = {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_initial: string | null;
  avatar_color: string | null;
  balance: number;
  in_transit: number;
  total_paid_out: number;
  completed_videos: number;
  member_since: string | null;
  created_at?: string;
  updated_at?: string;
};
