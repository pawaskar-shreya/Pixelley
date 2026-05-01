import axios, { AxiosError } from 'axios';
import { User } from './types';


type Gender = 'Female' | 'Male';

type SignupRequest = {
  username: string;
  password: string;
  gender: Gender
};

type SigninRequest = {
  username: string;
  password: string;
};

type AddElementRequest = {
  elementId: string;
  spaceId: string;
  x: number;
  y: number;
};

function getToken() {
  return localStorage.getItem('token');
}

function getApiBaseUrl() {
  // Prefer explicit env var if you add one later; otherwise rely on same-origin.
  const envBase = "http://localhost:3000"
  if (envBase) return envBase.replace(/\/$/, '');
  return '';
}

const http = axios.create({
  baseURL: `${getApiBaseUrl()}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers?.set?.('Authorization', `Bearer ${token}`);
  }
  return config;
});

function toMessage(error: unknown) {
  const fallback = 'Something went wrong';
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;

  const axiosErr = error as AxiosError<any>;
  const data = axiosErr?.response?.data;
  if (data?.message && typeof data.message === 'string') return data.message;
  return fallback;
}

async function get<T>(url: string, config?: any): Promise<T> {
  try {
    const res = await http.get<T>(url, config);
    return res.data;
  } catch (e) {
    throw new Error(toMessage(e));
  }
}

async function post<T>(url: string, body?: any, config?: any): Promise<T> {
  try {
    const res = await http.post<T>(url, body, config);
    return res.data;
  } catch (e) {
    throw new Error(toMessage(e));
  }
}

async function del<T>(url: string, config?: any): Promise<T> {
  try {
    const res = await http.delete<T>(url, config);
    return res.data;
  } catch (e) {
    throw new Error(toMessage(e));
  }
}

export const api = {
  // Auth
  signup: async (data: SignupRequest) => {
    const { username, password, gender } = data;

    return post<{ userId: string }>('/signup', {
      username,
      password,
      gender
    });
  },

  signin: async (data: SigninRequest) => {
    return post<{ token: string, user: User }>('/signin', data);
  },

  //  ------------ TODO: Add avatar selection

  // getAvatars: async () => {
  //   return get<{ avatars: Array<{ id: string; name: string; imageUrl: string }> }>('/avatars');
  // },

  // updateMetadata: async (data: { avatarId: string }) => {
  //   // Backend returns { message }, but callers only care that it succeeded.
  //   await post<{ message: string }>('/user/metadata', data);
  //   return { success: true };
  // },

  getBulkMetadata: async (ids: string[]) => {
    // Backend reads ids from query string: /user/metadata/bulk?ids=a,b,c
    const idsParam = ids.join(',');
    return post<{ avatars: Array<{ userId: string; idleUrl: string }> }>(
      '/user/metadata/bulk',
      undefined,
      { params: { ids: idsParam } }
    );
  },

  // Spaces (Dashboard)
  getSpaces: async () => {
    return get<{ spaces: Array<{ id: string; name: string; width: string; height: string;  tilemapUrl: string; thumbnail: string }> }>(
      '/space'
    );
  },

  // Space page
  getSpace: async (spaceId: string) => {
    return get<{
      dimensions: string;
      elements: Array<{
        id: string;
        x: number;
        y: number;
        addedById: string;
        element: { id: string; imageUrl: string; width: number; height: number; isCollidable: boolean };
      }>;
    }>(`/space/${spaceId}`);
  },

  // Elements palette
  getElements: async (spaceId: string) => {
    return get<{
      elements: Array<{ id: string; name: string; width: number; height: number; imageUrl: string; isCollidable: boolean }>;
    }>(`/space/${spaceId}/elements`);
  },

  addElementToSpace: async (data: AddElementRequest) => {
    // Backend doesn't return the created spaceElement id, so we do a best-effort re-fetch to find it.
    await post<{ message: string }>('/space/element', data);
    const after = await api.getSpace(data.spaceId);
    const match = [...(after.elements || [])]
      .reverse()
      .find((e) => e.element?.id === data.elementId && e.x === data.x && e.y === data.y);
    return { id: match?.id };
  },

  deleteElementFromSpace: async (id: string) => {
    // Backend expects body: { id }
    await del<{ message: string }>('/space/element', { data: { id } });
    return { success: true };
  },
};
