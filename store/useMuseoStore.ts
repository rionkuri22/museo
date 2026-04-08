import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContentItem, Platform } from '../utils/share-utils';

interface Board {
  id: string;
  name: string;
  itemIds: string[];
}

interface MuseoState {
  items: ContentItem[];
  boards: Board[];
  addItem: (item: ContentItem) => void;
  removeItem: (id: string) => void;
  createBoard: (name: string) => string;
  tagToBoard: (itemId: string, boardId: string) => void;
  getStats: () => Record<Platform, number>;
}

export const useMuseoStore = create<MuseoState>()(
  persist(
    (set, get) => ({
      items: [],
      boards: [
        { id: 'all', name: 'All Content', itemIds: [] }
      ],
      
      addItem: (item) => set((state) => ({
        items: [item, ...state.items]
      })),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
        boards: state.boards.map(b => ({
          ...b,
          itemIds: b.itemIds.filter(itemId => itemId !== id)
        }))
      })),
      
      createBoard: (name) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
          boards: [...state.boards, { id, name, itemIds: [] }]
        }));
        return id;
      },
      
      tagToBoard: (itemId, boardId) => set((state) => ({
        boards: state.boards.map(b => 
          b.id === boardId 
            ? { ...b, itemIds: b.itemIds.includes(itemId) ? b.itemIds : [...b.itemIds, itemId] } 
            : b
        ),
        items: state.items.map(i => 
          i.id === itemId 
            ? { ...i, boardIds: i.boardIds.includes(boardId) ? i.boardIds : [...i.boardIds, boardId] }
            : i
        )
      })),
      
      getStats: () => {
        const items = get().items;
        const initialStats: Record<Platform, number> = {
          youtube: 0,
          instagram: 0,
          tiktok: 0,
          pinterest: 0,
          twitter: 0,
          web: 0
        };
        
        return items.reduce((acc, item) => {
          acc[item.platform] = (acc[item.platform] || 0) + 1;
          return acc;
        }, initialStats);
      }
    }),
    {
      name: 'museo-storage',
      storage: {
        getItem: async (name: string) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name: string, value: any) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name: string) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
