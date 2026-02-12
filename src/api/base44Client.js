// Backend-Client: Nutzt Supabase (Datenbank), wenn VITE_SUPABASE_URL und
// VITE_SUPABASE_ANON_KEY gesetzt sind – sonst localStorage (nur lokal).
//
// Entities: Service, Booking, Review, BlogPost, EventBooking, HomeCard
// Integrations: SendEmail (simuliert), UploadFile (Data-URL)
// Auth: deaktiviert (öffentliche App)

import { useSupabase } from './supabaseClient';
import { createSupabaseEntities } from './supabaseBackend';

const STORAGE_PREFIX = 'local_backend_';

const isBrowser = typeof window !== 'undefined' && !!window.localStorage;

const getStorage = () => {
  if (!isBrowser) {
    // Fallback für z.B. SSR / Tests
    const memory = new Map();
    return {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => memory.set(k, v),
      removeItem: (k) => memory.delete(k),
    };
  }
  return window.localStorage;
};

const storage = getStorage();

const readCollection = (name) => {
  const raw = storage.getItem(STORAGE_PREFIX + name);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCollection = (name, items) => {
  storage.setItem(STORAGE_PREFIX + name, JSON.stringify(items));
};

const generateId = () => {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

const applyOrderAndLimit = (items, orderBy, limit) => {
  let result = [...items];
  if (orderBy) {
    const desc = orderBy.startsWith('-');
    const field = desc ? orderBy.slice(1) : orderBy;
    result.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av == null && bv == null) return 0;
      if (av == null) return desc ? 1 : -1;
      if (bv == null) return desc ? -1 : 1;
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return 0;
    });
  }
  if (typeof limit === 'number') {
    result = result.slice(0, limit);
  }
  return result;
};

const createEntityApi = (entityName) => {
  return {
    async list(orderBy) {
      const items = readCollection(entityName);
      return applyOrderAndLimit(items, orderBy, undefined);
    },

    async filter(where = {}, orderBy, limit) {
      const items = readCollection(entityName).filter((item) => {
        return Object.entries(where).every(([key, value]) => item[key] === value);
      });
      return applyOrderAndLimit(items, orderBy, limit);
    },

    async create(data) {
      const items = readCollection(entityName);
      const now = new Date().toISOString();
      const newItem = {
        id: generateId(),
        created_date: now,
        ...data,
      };
      items.push(newItem);
      writeCollection(entityName, items);
      return newItem;
    },

    async update(id, data) {
      const items = readCollection(entityName);
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) {
        throw new Error(`Item with id ${id} not found in ${entityName}`);
      }
      const updated = { ...items[idx], ...data };
      items[idx] = updated;
      writeCollection(entityName, items);
      return updated;
    },

    async delete(id) {
      const items = readCollection(entityName);
      const filtered = items.filter((i) => i.id !== id);
      writeCollection(entityName, filtered);
      return { success: true };
    },
  };
};

// Bei Supabase: echte Datenbank; sonst: localStorage
const supabaseEntities = useSupabase() ? createSupabaseEntities() : null;
const localEntity = (name) => createEntityApi(name);

const entities = supabaseEntities ?? {
  Service: localEntity('Service'),
  Booking: localEntity('Booking'),
  Review: localEntity('Review'),
  BlogPost: localEntity('BlogPost'),
  EventBooking: localEntity('EventBooking'),
  HomeCard: localEntity('HomeCard'),
};

const integrations = {
  Core: {
    // E-Mails werden hier nur „simuliert“ und in localStorage protokolliert.
    async SendEmail({ to, subject, body }) {
      const key = STORAGE_PREFIX + 'SentEmails';
      const existingRaw = storage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.push({
        id: generateId(),
        to,
        subject,
        body,
        sent_at: new Date().toISOString(),
      });
      storage.setItem(key, JSON.stringify(existing));
      console.log('[LocalBackend] Simulierte E-Mail:', { to, subject, body });
      return { success: true };
    },

    // Dateien werden als Data-URL gespeichert, um eine Bildvorschau zu ermöglichen.
    async UploadFile({ file }) {
      return new Promise((resolve, reject) => {
        if (!file) {
          resolve({ file_url: '' });
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          resolve({ file_url: dataUrl });
        };
        reader.onerror = (err) => {
          console.error('UploadFile failed', err);
          reject(err);
        };
        reader.readAsDataURL(file);
      });
    },
  },
};

const auth = {
  async me() {
    // Keine echte Authentifizierung – gesamte App ist öffentlich
    return null;
  },
  logout() {
    // NOP – nichts zu tun, da kein echtes Login
    console.log('[LocalBackend] logout() aufgerufen (ohne Wirkung)');
  },
  redirectToLogin() {
    // NOP – es gibt keine Login-Seite
    console.log('[LocalBackend] redirectToLogin() aufgerufen (ohne Wirkung)');
  },
};

export const base44 = {
  entities,
  integrations,
  auth,
};
