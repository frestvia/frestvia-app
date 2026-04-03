import { create } from 'zustand';
import { api } from '../services/api';

export interface SharedListItem {
  id: string;
  text: string;
  emoji?: string;
  checked_by: string[];
}

export interface SharedListMember {
  id: string;
  name: string;
  role: string;
}

export interface SharedList {
  id: string;
  creator_id: string;
  creator_name: string;
  share_code: string;
  title: string;
  emoji?: string;
  items: SharedListItem[];
  members: SharedListMember[];
  status: 'pending' | 'in_progress' | 'completed';
  reminders: any[];
  created_at: string;
  updated_at: string;
}

interface SharedListState {
  lists: SharedList[];
  currentList: SharedList | null;
  isLoading: boolean;

  fetchLists: () => Promise<void>;
  fetchList: (id: string) => Promise<void>;
  createList: (data: { title: string; emoji?: string; items: { text: string; emoji?: string }[] }) => Promise<SharedList>;
  toggleItem: (listId: string, itemId: string) => Promise<void>;
  addItem: (listId: string, data: { text: string; emoji?: string }) => Promise<void>;
  joinList: (code: string) => Promise<SharedList>;
  setReminder: (listId: string, data: { type: string; minutes?: number; time?: string }) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
}

export const useSharedListStore = create<SharedListState>((set, get) => ({
  lists: [],
  currentList: null,
  isLoading: false,

  fetchLists: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/shared-lists');
      set({ lists: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch shared lists:', error);
      set({ isLoading: false });
    }
  },

  fetchList: async (id) => {
    try {
      const response = await api.get(`/shared-lists/${id}`);
      set({ currentList: response.data });
    } catch (error) {
      console.error('Failed to fetch shared list:', error);
    }
  },

  createList: async (data) => {
    const response = await api.post('/shared-lists', data);
    set((state) => ({ lists: [response.data, ...state.lists] }));
    return response.data;
  },

  toggleItem: async (listId, itemId) => {
    try {
      const response = await api.put(`/shared-lists/${listId}/toggle/${itemId}`);
      const updated = response.data;
      set((state) => ({
        lists: state.lists.map((l) => (l.id === listId ? updated : l)),
        currentList: state.currentList?.id === listId ? updated : state.currentList,
      }));
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  },

  addItem: async (listId, data) => {
    const response = await api.post(`/shared-lists/${listId}/items`, data);
    const updated = response.data;
    set((state) => ({
      lists: state.lists.map((l) => (l.id === listId ? updated : l)),
      currentList: state.currentList?.id === listId ? updated : state.currentList,
    }));
  },

  joinList: async (code) => {
    const response = await api.post(`/shared-lists/join?share_code=${code}`);
    const list = response.data;
    set((state) => {
      const exists = state.lists.find((l) => l.id === list.id);
      return { lists: exists ? state.lists : [list, ...state.lists] };
    });
    return list;
  },

  setReminder: async (listId, data) => {
    await api.post(`/shared-lists/${listId}/reminder`, data);
  },

  deleteList: async (id) => {
    await api.delete(`/shared-lists/${id}`);
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== id),
      currentList: state.currentList?.id === id ? null : state.currentList,
    }));
  },
}));
