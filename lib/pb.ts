import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

// Client-side PocketBase instance (singleton)
let pbClient: PocketBase | null = null;

export const getPBClient = (): PocketBase => {
  if (!pbClient) {
    pbClient = new PocketBase(process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090');
  }
  return pbClient;
};

// Server-side PocketBase instance with auth from cookies
export const getPB = (): PocketBase => {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090');
  
  try {
    const cookieStore = cookies();
    const cookieString = cookieStore.toString();
    pb.authStore.loadFromCookie(cookieString);
  } catch (error) {
    console.error('Failed to load auth from cookies:', error);
  }
  
  return pb;
};

// Persist auth to cookies in server actions
export const persistAuthToCookies = (pb: PocketBase): string[] => {
  const cookies: string[] = [];
  
  if (pb.authStore.exportToCookie) {
    cookies.push(pb.authStore.exportToCookie());
  }
  
  return cookies;
};
