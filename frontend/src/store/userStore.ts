import { create } from 'zustand';

interface User {
  id: number;
  email: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set, get) => {
  // Загружаем токен из localStorage при инициализации
  const token = localStorage.getItem('token');
  const isAuth = !!token;
  
  console.log('UserStore init - token from localStorage:', token ? 'present' : 'missing', 'isAuth:', isAuth);

  return {
    user: null,
    token: token,
    isAuthenticated: isAuth,
    setUser: (user) => {
      const currentToken = get().token;
      console.log('setUser called - user:', user, 'currentToken:', currentToken ? 'present' : 'missing');
      // isAuthenticated = true если есть токен (пользователь может быть установлен позже)
      set({ user, isAuthenticated: !!currentToken });
    },
    setToken: (token) => {
      console.log('setToken called - token:', token ? 'present' : 'missing');
      // isAuthenticated = true если есть токен
      set({ token, isAuthenticated: !!token });
      if (token) {
        localStorage.setItem('token', token);
        console.log('Token saved to localStorage');
      } else {
        localStorage.removeItem('token');
        console.log('Token removed from localStorage');
      }
    },
    logout: () => {
      set({ user: null, token: null, isAuthenticated: false });
      localStorage.removeItem('token');
    },
  };
});

