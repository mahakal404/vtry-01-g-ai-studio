import { Timestamp } from 'firebase/firestore';

export interface UserTheme {
  primary: string;
  background: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  isDarkMode: boolean;
  useGradient: boolean;
}

export interface Gift {
  id: string;
  amount: number;
  message: string;
  isOpened: boolean;
  createdAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  tokens: number | '∞';
  role: 'user' | 'admin';
  joinedAt: Timestamp;
  theme?: UserTheme;
  adsWatched: number;
  lastDailyReward?: Timestamp;
  gifts?: Gift[];
}

export interface HistoryItem {
  id: string;
  userId: string;
  userImage: string;
  clothImage: string;
  resultImage: string;
  createdAt: Timestamp;
}

export interface MarketingSettings {
  saleName: string;
  discountPercentage: number;
  isSaleActive: boolean;
}

export const DEFAULT_THEME: UserTheme = {
  primary: '#8852e0',
  background: '#1b0f2e',
  card: '#291943',
  text: '#fafafa',
  muted: '#a294b8',
  border: '#3b2d53',
  isDarkMode: true,
  useGradient: false,
};
