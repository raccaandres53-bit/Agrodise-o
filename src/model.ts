export type Item = { id: string; text: string; done: boolean };
export const statuses = ['planned', 'in_progress', 'completed', 'cancelled'] as const;
export type Status = typeof statuses[number];
export const statusLabels: Record<Status, string> = {
  planned: 'Planificado', in_progress: 'En curso', completed: 'Finalizado', cancelled: 'Cancelado',
};
export type Trip = {
  id: string; title: string; destination: string; date: string; employees: string[];
  tasks: Item[]; supplies: Item[]; updatedAt: string; status: Status; notes: string;
};
export type Employee = { id: string; name: string; role: string; phone: string };
export type Change = { entity: 'trip' | 'employee'; id: string; operation: 'upsert' | 'delete'; updatedAt: string };
export type Data = { version: 2; trips: Trip[]; employees: Employee[]; pendingChanges: Change[] };
export const emptyData: Data = { version: 2, trips: [], employees: [], pendingChanges: [] };
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function names(value: string) {
  return [...new Set(value.split(',').map(e => e.trim()).filter(Boolean))];
}
function uniqueRows(rows: unknown): asserts rows is Record<string, unknown>[] {
  if (!Array.isArray(rows)) throw new Error('Lista inválida');
  const ids = new Set<string>();
  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id)) throw new Error('Identificador inválido o duplicado');
    ids.add(row.id);
  }
}
function strings(row: Record<string, unknown>, keys: string[]) {
  if (!keys.every(k => typeof row[k] === 'string')) throw new Error('Campo inválido');
}
export function parseData(raw: string): Data {
  const value = JSON.parse(raw);
  if (!value || ![1, 2].includes(value.version)) throw new Error('Formato de archivo inválido');
  uniqueRows(value.trips);
  for (const t of value.trips) {
    strings(t, ['title', 'destination', 'date', 'updatedAt']);
    if (!t.title.trim() || !t.destination.trim() || !validDate(t.date) || !Number.isFinite(Date.parse(t.updatedAt)) || !Array.isArray(t.employees) || !t.employees.every((e: unknown) => typeof e === 'string')) throw new Error('Viaje inválido');
    for (const items of [t.tasks, t.supplies]) {
      uniqueRows(items);
      for (const i of items) {
        strings(i, ['text']);
        if (!i.text || typeof i.done !== 'boolean') throw new Error('Elemento inválido');
      }
    }
    if (value.version === 2 && (!statuses.includes(t.status) || typeof t.notes !== 'string')) throw new Error('Estado inválido');
  }
  if (value.version === 1) {
    const trips: Trip[] = value.trips.map((t: Trip) => ({ ...t, status: 'planned', notes: '' }));
    const employeeNames = new Map<string, string>();
    for (const name of trips.flatMap(t => t.employees)) {
      if (name.trim()) employeeNames.set(name.trim().toLocaleLowerCase(), name.trim());
    }
    const employees = [...employeeNames.values()].map(name => ({ id: `legacy-employee:${encodeURIComponent(name.toLocaleLowerCase())}`, name, role: '', phone: '' }));
    return { version: 2, trips, employees, pendingChanges: [
      ...trips.map(t => ({ entity: 'trip' as const, id: t.id, operation: 'upsert' as const, updatedAt: t.updatedAt })),
      ...employees.map(e => ({ entity: 'employee' as const, id: e.id, operation: 'upsert' as const, updatedAt: new Date().toISOString() })),
    ] };
  }
  uniqueRows(value.employees);
  const employeeNames = new Set<string>();
  for (const e of value.employees) {
    strings(e, ['name', 'role', 'phone']);
    const key = e.name.trim().toLocaleLowerCase();
    if (!key || employeeNames.has(key)) throw new Error('Nombre de empleado repetido');
    employeeNames.add(key);
  }
  if (!Array.isArray(value.pendingChanges)) throw new Error('Cola inválida');
  const changes = new Set<string>();
  for (const c of value.pendingChanges) {
    if (!c || !['trip', 'employee'].includes(c.entity) || typeof c.id !== 'string' || !c.id || !['upsert', 'delete'].includes(c.operation) || typeof c.updatedAt !== 'string' || !Number.isFinite(Date.parse(c.updatedAt)) || changes.has(`${c.entity}:${c.id}`)) throw new Error('Cambio inválido');
    const exists = (c.entity === 'trip' ? value.trips : value.employees).some((e: { id: string }) => e.id === c.id);
    if ((c.operation === 'upsert') !== exists) throw new Error('Cambio sin entidad correspondiente');
    changes.add(`${c.entity}:${c.id}`);
  }
  return value;
}
function changed(data: Data, entity: Change['entity'], id: string, operation: Change['operation']): Data {
  const change: Change = { entity, id, operation, updatedAt: new Date().toISOString() };
  return { ...data, pendingChanges: [...data.pendingChanges.filter(c => c.entity !== entity || c.id !== id), change] };
}
export function saveTrip(data: Data, trip: Trip): Data {
  return changed({ ...data, trips: [...data.trips.filter(t => t.id !== trip.id), { ...trip, updatedAt: new Date().toISOString() }] }, 'trip', trip.id, 'upsert');
}
export function removeTrip(data: Data, id: string): Data {
  return changed({ ...data, trips: data.trips.filter(t => t.id !== id) }, 'trip', id, 'delete');
}
export function saveEmployee(data: Data, employee: Employee): Data {
  const cleaned = { ...employee, name: employee.name.trim(), role: employee.role.trim(), phone: employee.phone.trim() };
  if (!cleaned.name || cleaned.name.includes(',')) throw new Error('Ingresá un nombre sin comas.');
  if (data.employees.some(e => e.id !== employee.id && e.name.toLocaleLowerCase() === cleaned.name.toLocaleLowerCase())) throw new Error('Ya existe un empleado con ese nombre.');
  const previous = data.employees.find(e => e.id === employee.id);
  let next = changed({ ...data, employees: [...data.employees.filter(e => e.id !== employee.id), cleaned] }, 'employee', employee.id, 'upsert');
  if (previous && previous.name !== cleaned.name) {
    for (const trip of data.trips.filter(t => t.employees.includes(previous.name))) {
      next = saveTrip(next, { ...trip, employees: [...new Set(trip.employees.map(n => n === previous.name ? cleaned.name : n))] });
    }
  }
  return next;
}
export function removeEmployee(data: Data, id: string): Data {
  // Assignments keep their names as a historical snapshot when a contact is removed.
  return changed({ ...data, employees: data.employees.filter(e => e.id !== id) }, 'employee', id, 'delete');
}
export function mergeBackup(local: Data, imported: Data) {
  let next = local;
  let added = 0;
  let contacts = 0;
  for (const trip of imported.trips) {
    if (next.trips.some(t => t.id === trip.id) || next.pendingChanges.some(c => c.entity === 'trip' && c.id === trip.id && c.operation === 'delete')) continue;
    next = saveTrip(next, trip); added++;
  }
  for (const employee of imported.employees) {
    if (next.employees.some(e => e.id === employee.id || e.name.toLocaleLowerCase() === employee.name.toLocaleLowerCase()) || next.pendingChanges.some(c => c.entity === 'employee' && c.id === employee.id && c.operation === 'delete')) continue;
    next = saveEmployee(next, employee); contacts++;
  }
  // Restore tombstones from a backup without deleting any existing local record.
  for (const c of imported.pendingChanges.filter(c => c.operation === 'delete')) {
    const exists = (c.entity === 'trip' ? next.trips : next.employees).some(e => e.id === c.id);
    if (!exists && !next.pendingChanges.some(local => local.entity === c.entity && local.id === c.id)) {
      next = changed(next, c.entity, c.id, 'delete');
    }
  }
  return { data: next, added, contacts };
}
export function toggleItem(trip: Trip, list: 'tasks' | 'supplies', id: string): Trip {
  return { ...trip, updatedAt: new Date().toISOString(), [list]: trip[list].map(i => i.id === id ? { ...i, done: !i.done } : i) };
}
