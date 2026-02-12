import { supabase } from './supabaseClient';

const generateId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const entityToTable = {
  Service: 'services',
  Booking: 'bookings',
  Review: 'reviews',
  BlogPost: 'blog_posts',
  EventBooking: 'event_bookings',
  HomeCard: 'home_cards',
};

function parseOrder(orderBy) {
  if (!orderBy) return { column: 'created_date', ascending: true };
  const desc = orderBy.startsWith('-');
  const column = desc ? orderBy.slice(1) : orderBy;
  return { column, ascending: !desc };
}

export function createSupabaseEntities() {
  if (!supabase) return null;

  const entities = {};

  for (const [entityName, tableName] of Object.entries(entityToTable)) {
    entities[entityName] = {
      async list(orderBy) {
        const { column, ascending } = parseOrder(orderBy);
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order(column, { ascending });
        if (error) {
          console.error('[Supabase]', tableName, 'list:', error.message, error.code, error.details);
          throw error;
        }
        return data || [];
      },

      async filter(where = {}, orderBy, limit) {
        const { column, ascending } = parseOrder(orderBy);
        let q = supabase.from(tableName).select('*');
        for (const [key, value] of Object.entries(where)) {
          if (value === undefined || value === null) continue;
          q = q.eq(key, value);
        }
        q = q.order(column, { ascending });
        if (typeof limit === 'number') q = q.limit(limit);
        const { data, error } = await q;
        if (error) {
          console.error('[Supabase]', tableName, 'filter:', error.message, error.code, error.details);
          throw error;
        }
        return data || [];
      },

      async create(data) {
        const id = generateId();
        const row = { id, created_date: new Date().toISOString(), ...data };
        if (row.dates && Array.isArray(row.dates)) row.dates = row.dates;
        if (row.selected_dates && Array.isArray(row.selected_dates)) row.selected_dates = row.selected_dates;
        const { data: inserted, error } = await supabase.from(tableName).insert(row).select().single();
        if (error) {
          console.error('[Supabase]', tableName, 'create:', error.message, error.code, error.details);
          throw error;
        }
        return inserted;
      },

      async update(id, data) {
        const { data: updated, error } = await supabase
          .from(tableName)
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) {
          console.error('[Supabase]', tableName, 'update:', error.message, error.code, error.details);
          throw error;
        }
        return updated;
      },

      async delete(id) {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) {
          console.error('[Supabase]', tableName, 'delete:', error.message, error.code, error.details);
          throw error;
        }
        return { success: true };
      },
    };
  }

  return entities;
}
