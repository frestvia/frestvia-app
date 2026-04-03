import { create } from 'zustand';
import { api } from '../services/api';

export interface Stats {
  total_exits: number;
  total_items_checked: number;
  total_items_forgotten: number;
  items_saved_today: number;
  items_forgotten_today: number;
  items_saved_week: number;
  items_forgotten_week: number;
  items_saved_month: number;
  items_forgotten_month: number;
  most_forgotten_items: { name: string; count: number }[];
  risk_score: number;
  current_streak: number;
  best_streak: number;
  exits_by_day: { date: string; saved: number; forgotten: number; exits: number }[];
}

export interface ExitRecord {
  id: string;
  user_id: string;
  checklist_id: string;
  checklist_name: string;
  checked_items: string[];
  forgotten_items: string[];
  location_id?: string;
  location_name?: string;
  created_at: string;
}

interface StatsState {
  stats: Stats | null;
  exitHistory: ExitRecord[];
  isLoading: boolean;
  
  // Actions
  fetchStats: () => Promise<void>;
  fetchExitHistory: () => Promise<void>;
  recordExit: (data: {
    checklist_id: string;
    checked_items: string[];
    forgotten_items: string[];
    location_name?: string;
  }) => Promise<ExitRecord>;
}

export const useStatsStore = create<StatsState>((set) => ({
  stats: null,
  exitHistory: [],
  isLoading: false,
  
  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/stats');
      set({ stats: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      set({ isLoading: false });
    }
  },
  
  fetchExitHistory: async () => {
    try {
      const response = await api.get('/exits');
      set({ exitHistory: response.data });
    } catch (error) {
      console.error('Failed to fetch exit history:', error);
    }
  },
  
  recordExit: async (data) => {
    try {
      const response = await api.post('/exits', data);
      set((state) => ({
        exitHistory: [response.data, ...state.exitHistory],
      }));
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to record exit');
    }
  },
}));
