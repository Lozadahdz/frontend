import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  user: {
    id: string | null;
    email: string | null;
    name: string | null;
  } | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ token: string; user: { id: string; email: string; name: string } }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      console.log(state.user?.id); // Ahora debería mostrar el ID correctamente
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
    },
  },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;