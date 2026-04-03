import { create } from 'zustand';
import { api } from '../services/api';

export interface ChecklistItem {
  id: string;
  name: string;
  checked: boolean;
  order: number;
}

export interface Checklist {
  id: string;
  user_id: string;
  name: string;
  type: string;
  items: ChecklistItem[];
  location_id?: string;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

interface ChecklistState {
  checklists: Checklist[];
  activeChecklist: Checklist | null;
  isLoading: boolean;
  
  // Actions
  fetchChecklists: () => Promise<void>;
  setActiveChecklist: (checklist: Checklist | null) => void;
  updateChecklist: (id: string, data: Partial<Checklist>) => Promise<void>;
  createChecklist: (data: { name: string; type: string; items: ChecklistItem[] }) => Promise<Checklist>;
  deleteChecklist: (id: string) => Promise<void>;
  toggleItem: (checklistId: string, itemId: string) => void;
  resetChecklist: (checklistId: string) => void;
  addItem: (checklistId: string, name: string) => void;
  removeItem: (checklistId: string, itemId: string) => void;
}

export const useChecklistStore = create<ChecklistState>((set, get) => ({
  checklists: [],
  activeChecklist: null,
  isLoading: false,
  
  fetchChecklists: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/checklists');
      set({ checklists: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch checklists:', error);
      set({ isLoading: false });
    }
  },
  
  setActiveChecklist: (checklist) => {
    set({ activeChecklist: checklist });
  },
  
  updateChecklist: async (id, data) => {
    try {
      const response = await api.put(`/checklists/${id}`, data);
      set((state) => ({
        checklists: state.checklists.map((c) => (c.id === id ? response.data : c)),
        activeChecklist: state.activeChecklist?.id === id ? response.data : state.activeChecklist,
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Update failed');
    }
  },
  
  createChecklist: async (data) => {
    try {
      const response = await api.post('/checklists', data);
      set((state) => ({ checklists: [...state.checklists, response.data] }));
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Create failed');
    }
  },
  
  deleteChecklist: async (id) => {
    try {
      await api.delete(`/checklists/${id}`);
      set((state) => ({
        checklists: state.checklists.filter((c) => c.id !== id),
        activeChecklist: state.activeChecklist?.id === id ? null : state.activeChecklist,
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Delete failed');
    }
  },
  
  toggleItem: (checklistId, itemId) => {
    set((state) => {
      const updateItems = (items: ChecklistItem[]) =>
        items.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );
      
      return {
        checklists: state.checklists.map((c) =>
          c.id === checklistId ? { ...c, items: updateItems(c.items) } : c
        ),
        activeChecklist:
          state.activeChecklist?.id === checklistId
            ? { ...state.activeChecklist, items: updateItems(state.activeChecklist.items) }
            : state.activeChecklist,
      };
    });
  },
  
  resetChecklist: (checklistId) => {
    set((state) => {
      const resetItems = (items: ChecklistItem[]) =>
        items.map((item) => ({ ...item, checked: false }));
      
      return {
        checklists: state.checklists.map((c) =>
          c.id === checklistId ? { ...c, items: resetItems(c.items) } : c
        ),
        activeChecklist:
          state.activeChecklist?.id === checklistId
            ? { ...state.activeChecklist, items: resetItems(state.activeChecklist.items) }
            : state.activeChecklist,
      };
    });
  },
  
  addItem: (checklistId, name) => {
    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      checked: false,
      order: 999,
    };
    
    set((state) => ({
      checklists: state.checklists.map((c) =>
        c.id === checklistId ? { ...c, items: [...c.items, newItem] } : c
      ),
      activeChecklist:
        state.activeChecklist?.id === checklistId
          ? { ...state.activeChecklist, items: [...state.activeChecklist.items, newItem] }
          : state.activeChecklist,
    }));
  },
  
  removeItem: (checklistId, itemId) => {
    set((state) => ({
      checklists: state.checklists.map((c) =>
        c.id === checklistId
          ? { ...c, items: c.items.filter((item) => item.id !== itemId) }
          : c
      ),
      activeChecklist:
        state.activeChecklist?.id === checklistId
          ? {
              ...state.activeChecklist,
              items: state.activeChecklist.items.filter((item) => item.id !== itemId),
            }
          : state.activeChecklist,
    }));
  },
}));
