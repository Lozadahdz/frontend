// src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Usa localStorage por defecto
import authReducer from './authSlice';

// Configuración de redux-persist
const persistConfig = {
  key: 'root', // Clave para el almacenamiento
  storage, // Usar localStorage
};

// Reducer persistido
const persistedReducer = persistReducer(persistConfig, authReducer);

// Crear el store con el reducer persistido
const store = configureStore({
  reducer: {
    auth: persistedReducer, // Usar el reducer persistido
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'], // Ignorar acciones de redux-persist
      },
    }),
});

// Crear el persistor
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;