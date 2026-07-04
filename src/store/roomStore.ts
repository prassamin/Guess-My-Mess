import { create } from 'zustand';

interface User {
  id: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  [key: string]: any;
}

interface RoomStore {
  // App state
  gameStarted: boolean;
  setGameStarted: (started: boolean) => void;
  
  roomNotFound: boolean;
  setRoomNotFound: (notFound: boolean) => void;
  
  ws: WebSocket | null;
  setWs: (ws: WebSocket | null) => void;
  
  roomState: any | null;
  setRoomState: (state: any) => void;
  
  chatMessages: any[];
  setChatMessages: (messages: any[] | ((prev: any[]) => any[])) => void;
  
  mutedUserIds: string[];
  setMutedUserIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  
  // Game variables
  wordChoices: string[];
  setWordChoices: (choices: string[]) => void;
  
  currentWord: string;
  setCurrentWord: (word: string) => void;
  
  revealedWord: string;
  setRevealedWord: (word: string) => void;

  // Auth/User state
  user: User | null;
  setUser: (user: User | null) => void;

  reset: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  gameStarted: false,
  setGameStarted: (started) => set({ gameStarted: started }),

  roomNotFound: false,
  setRoomNotFound: (notFound) => set({ roomNotFound: notFound }),

  ws: null,
  setWs: (ws) => set({ ws }),

  roomState: null,
  setRoomState: (state) => set({ roomState: state }),

  chatMessages: [],
  setChatMessages: (updater) => set((state) => ({ 
    chatMessages: typeof updater === 'function' ? updater(state.chatMessages) : updater 
  })),

  mutedUserIds: [],
  setMutedUserIds: (updater) => set((state) => ({ 
    mutedUserIds: typeof updater === 'function' ? updater(state.mutedUserIds) : updater 
  })),

  wordChoices: [],
  setWordChoices: (choices) => set({ wordChoices: choices }),

  currentWord: "",
  setCurrentWord: (word) => set({ currentWord: word }),

  revealedWord: "",
  setRevealedWord: (word) => set({ revealedWord: word }),

  user: null,
  setUser: (user) => set({ user }),

  reset: () => set({
    gameStarted: false,
    roomNotFound: false,
    ws: null,
    roomState: null,
    chatMessages: [],
    mutedUserIds: [],
    wordChoices: [],
    currentWord: "",
    revealedWord: "",
  })
}));
