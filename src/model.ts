export type Item = { id: string; text: string; done: boolean };
export type Trip = { id: string; title: string; destination: string; date: string; employees: string[]; tasks: Item[]; supplies: Item[]; updatedAt: string };
export type Data = { version: 1; trips: Trip[] };
export const emptyData: Data = { version: 1, trips: [] };
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function parseData(raw: string): Data {
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !Array.isArray(value.trips)) throw new Error('Formato de archivo inválido');
  const ids = new Set<string>();
  for (const t of value.trips) {
    if (!t || typeof t.id !== 'string' || ids.has(t.id) || !['title', 'destination', 'date', 'updatedAt'].every(k => typeof t[k] === 'string') || !t.title.trim() || !Array.isArray(t.employees) || !t.employees.every((e: unknown) => typeof e === 'string')) throw new Error('Viaje inválido');
    ids.add(t.id);
    for (const items of [t.tasks, t.supplies]) {
      if (!Array.isArray(items)) throw new Error('Lista inválida');
      const itemIds = new Set<string>();
      for (const i of items) {
        if (!i || typeof i.id !== 'string' || itemIds.has(i.id) || typeof i.text !== 'string' || typeof i.done !== 'boolean') throw new Error('Elemento inválido');
        itemIds.add(i.id);
      }
    }
  }
  return value;
}
export function toggleItem(trip: Trip, list: 'tasks' | 'supplies', id: string): Trip {
  return { ...trip, updatedAt: new Date().toISOString(), [list]: trip[list].map(i => i.id === id ? { ...i, done: !i.done } : i) };
}
export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
