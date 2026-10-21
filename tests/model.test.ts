import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, mergeBackup, parseData, removeEmployee, removeTrip, saveEmployee, saveTrip, toggleItem, validDate } from '../src/model.ts';
import type { Trip } from '../src/model.ts';
const legacyTrip = { id: '1', title: 'Campo', destination: 'Córdoba', date: '2026-11-05', employees: ['Ana'], tasks: [{ id: 'a', text: 'Revisar', done: false }], supplies: [], updatedAt: '2026-10-21T10:00:00Z' };
const trip: Trip = { ...legacyTrip, status: 'planned', notes: 'Salida 07:00' };
test('una copia conserva empleados y estado de las listas', () => {
  const updated = toggleItem(trip, 'tasks', 'a');
  assert.equal(updated.tasks[0].done, true); assert.equal(trip.tasks[0].done, false);
  assert.deepEqual(parseData(JSON.stringify(saveTrip(emptyData, updated))).trips[0].tasks, updated.tasks);
});
test('migra la versión uno sin perder listas ni asignaciones', () => {
  const migrated = parseData(JSON.stringify({ version: 1, trips: [legacyTrip] }));
  assert.equal(migrated.version, 2); assert.equal(migrated.trips[0].status, 'planned');
  assert.deepEqual(migrated.trips[0].tasks, legacyTrip.tasks);
  assert.equal(migrated.employees[0].name, 'Ana');
  assert.deepEqual(parseData(JSON.stringify(migrated)), migrated);
});
test('migra nombres repetidos con distintas mayúsculas a un directorio válido', () => {
  const migrated = parseData(JSON.stringify({ version: 1, trips: [{ ...legacyTrip, employees: ['Ana', 'ana', ' Ana '] }] }));
  assert.equal(migrated.employees.length, 1);
  assert.doesNotThrow(() => parseData(JSON.stringify(migrated)));
});
test('rechaza copias corruptas y estados desconocidos', () => {
  for (const value of [{}, { version: 9, trips: [] }, { version: 1, trips: [{ ...legacyTrip, employees: null }] }, { version: 1, trips: [{ ...legacyTrip, tasks: [{ id: 'a', text: 'x', done: 'sí' }] }] }, { version: 1, trips: [legacyTrip, legacyTrip] }, { ...emptyData, trips: [{ ...trip, status: 'unknown' }] }, { ...emptyData, trips: [{ ...trip, date: '2026-02-30' }] }, { ...emptyData, pendingChanges: [{ entity: 'trip', id: 'missing', operation: 'upsert', updatedAt: trip.updatedAt }] }]) {
    assert.throws(() => parseData(JSON.stringify(value)));
  }
});
test('compacta cambios por registro y conserva la eliminación para no resucitar viajes', () => {
  let data = saveTrip(emptyData, trip);
  data = saveTrip(data, { ...trip, title: 'Modificado' });
  assert.equal(data.pendingChanges.length, 1);
  data = removeTrip(data, trip.id);
  assert.equal(data.pendingChanges.length, 1); assert.equal(data.pendingChanges[0].operation, 'delete');
  assert.equal(mergeBackup(data, saveTrip(emptyData, trip)).data.trips.length, 0);
  assert.doesNotThrow(() => parseData(JSON.stringify(data)));
});
test('renombrar un empleado actualiza asignaciones y encola ambos registros', () => {
  let data = saveEmployee(saveTrip(emptyData, trip), { id: 'e', name: 'Ana', role: 'Técnica', phone: '+54' });
  data = saveEmployee(data, { id: 'e', name: 'Ana García', role: 'Técnica', phone: '+54' });
  assert.deepEqual(data.trips[0].employees, ['Ana García']);
  assert.equal(data.pendingChanges.length, 2);
  assert.throws(() => saveEmployee(data, { id: 'other', name: 'ana garcía', role: '', phone: '' }));
  data = removeEmployee(data, 'e');
  assert.equal(data.employees.length, 0); assert.deepEqual(data.trips[0].employees, ['Ana García']);
});
test('importar agrega nuevos viajes sin reemplazar cambios locales y restaura tombstones', () => {
  const local = saveTrip(emptyData, { ...trip, title: 'Local' });
  const backup = removeTrip(saveTrip(saveTrip(emptyData, trip), { ...trip, id: '2' }), '2');
  const merged = mergeBackup(local, backup);
  assert.equal(merged.added, 0); assert.equal(merged.data.trips[0].title, 'Local');
  assert.equal(merged.data.pendingChanges.find(c => c.id === '2')?.operation, 'delete');
  assert.doesNotThrow(() => parseData(JSON.stringify(merged.data)));
});
test('valida fechas reales, incluyendo años bisiestos', () => {
  assert.equal(validDate('2028-02-29'), true); assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2026-13-01'), false); assert.equal(validDate('05/11/2026'), false);
});

test('reimportar una copia antigua no duplica empleados renombrados', () => {
  const backup = JSON.stringify({ version: 1, trips: [legacyTrip] });
  const migrated = parseData(backup);
  const renamed = saveEmployee(migrated, { ...migrated.employees[0], name: 'Ana García' });
  const merged = mergeBackup(renamed, parseData(backup));
  assert.equal(merged.data.employees.length, 1);
  assert.equal(merged.data.employees[0].name, 'Ana García');
});
