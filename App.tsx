import React, { useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Text, View, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { Employee, mergeBackup, parseData, removeEmployee, removeTrip, saveEmployee, saveTrip, Status, statuses, statusLabels, toggleItem, Trip, uid } from './src/model';
import { useLocalData } from './src/useLocalData';
import { Button, Choice, Confirm, EmployeeForm, Field, TripForm } from './src/ui';
import { s } from './src/styles';
const notify = (message: string) => Platform.OS === 'web' ? window.alert(message) : Alert.alert('AgroViajes', message);
type Confirmation = { title: string; message: string; action: () => void };
export default function App() {
  const { data, ready, error, saved, persist, retry, retrySave } = useLocalData();
  const [selected, setSelected] = useState<string | null>(null);
  const [tripForm, setTripForm] = useState<Trip | 'new' | null>(null);
  const [directory, setDirectory] = useState(false);
  const [employeeForm, setEmployeeForm] = useState<Employee | 'new' | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [entry, setEntry] = useState('');
  const [list, setList] = useState<'tasks' | 'supplies'>('tasks');
  const [gps, setGps] = useState('');
  const [locating, setLocating] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const trip = data.trips.find(t => t.id === selected);
  const visibleTrips = data.trips.filter(t => (filter === 'all' || t.status === filter) && `${t.title} ${t.destination} ${t.employees.join(' ')} ${t.notes}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).sort((a, b) => a.date.localeCompare(b.date));
  function openTrip(t: Trip) { setSelected(t.id); setEntry(''); setGps(''); setList('tasks'); }
  function updateTrip(change: (current: Trip) => Trip) {
    persist(current => { const existing = current.trips.find(t => t.id === selected); return existing ? saveTrip(current, change(existing)) : current; });
  }
  async function locate() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return notify('Permití el acceso a la ubicación para usar el GPS.');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setGps(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)} · precisión ${Math.round(pos.coords.accuracy ?? 0)} m`);
    } catch { notify('No se pudo obtener la ubicación. Revisá que el GPS esté habilitado.'); }
    finally { setLocating(false); }
  }
  async function exportData() {
    try {
      const text = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = 'agroviajes.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        if (!await Sharing.isAvailableAsync()) return notify('Compartir archivos no está disponible en este dispositivo.');
        const file = new File(Paths.cache, 'agroviajes.json'); file.create({ overwrite: true }); file.write(text);
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
      }
    } catch { notify('No se pudo exportar la copia.'); }
  }
  async function importData() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > 5_000_000) return notify('El archivo supera los 5 MB.');
      const text = Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
      if (text.length > 5_000_000) return notify('El archivo supera el tamaño permitido.');
      const imported = parseData(text);
      let added = 0, contacts = 0;
      persist(current => { const result = mergeBackup(current, imported); added = result.added; contacts = result.contacts; return result.data; });
      notify(`${added} viajes y ${contacts} empleados agregados. Se conservaron los datos existentes y las eliminaciones locales.`);
    } catch { notify('No se pudo importar. Elegí una copia JSON válida de AgroViajes.'); }
  }
  if (!ready) return <View style={s.loading}><Text style={s.title}>AgroViajes</Text>{error ? <><Text accessibilityRole="alert">{error}</Text><Button title="Reintentar lectura" onPress={() => void retry()} /></> : <ActivityIndicator color="#166849" />}</View>;
  return <View style={s.root}>
    <StatusBar style="light" />
    <View style={s.header}><Text style={s.brand}>AGRO / VIAJES</Text><Text style={s.hero}>Tu equipo, en camino.</Text><Text style={s.headerSub}>Planificá. Prepará. Viajá.</Text></View>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.badge}><Text style={s.badgeText}>● Datos disponibles sin conexión</Text></View>
      <Text accessibilityLiveRegion="polite" style={s.muted}>{saved || 'Almacenamiento local · sin sincronización automática'}</Text>
      {saved.startsWith('Error') && <Button title="Reintentar guardado" secondary onPress={retrySave} />}
      {tripForm ? <TripForm key={tripForm === 'new' ? 'new' : tripForm.id} initial={tripForm === 'new' ? undefined : tripForm} creating={tripForm === 'new' || !data.trips.some(t => t.id === tripForm.id)} employees={data.employees} onSave={t => { persist(d => saveTrip(d, t)); setTripForm(null); openTrip(t); }} onCancel={() => setTripForm(null)} />
      : directory ? <>
        <Button title="← Todos los viajes" secondary onPress={() => { setDirectory(false); setEmployeeForm(null); }} />
        <Text style={s.title}>Directorio de empleados</Text>
        <Text style={s.muted}>Contactos locales para asignar a tus viajes. No son cuentas de acceso.</Text>
        {employeeForm ? <EmployeeForm key={employeeForm === 'new' ? 'new' : employeeForm.id} initial={employeeForm === 'new' ? undefined : employeeForm} onSave={e => { persist(d => saveEmployee(d, e)); setEmployeeForm(null); }} onCancel={() => setEmployeeForm(null)} /> : <Button title="+ Agregar empleado" onPress={() => setEmployeeForm('new')} />}
        {!data.employees.length && <Text style={s.body}>Todavía no hay empleados. Agregá los integrantes de tu equipo.</Text>}
        {[...data.employees].sort((a, b) => a.name.localeCompare(b.name)).map(e => <View style={s.card} key={e.id}>
          <Text style={s.title}>{e.name}</Text><Text style={s.body}>{e.role || 'Sin puesto definido'}</Text><Text selectable style={s.body}>{e.phone || 'Sin teléfono'}</Text>
          <Button title={`Editar ${e.name}`} secondary onPress={() => setEmployeeForm(e)} />
          <Button title={`Eliminar ${e.name}`} secondary onPress={() => setConfirmation({ title: 'Eliminar empleado', message: `Se quitará a ${e.name} del directorio. Su nombre se conservará en los viajes ya asignados.`, action: () => { persist(d => removeEmployee(d, e.id)); if (employeeForm !== 'new' && employeeForm?.id === e.id) setEmployeeForm(null); } })} />
        </View>)}
      </> : trip ? <>
        <Button title="← Todos los viajes" secondary onPress={() => { setSelected(null); setEntry(''); setGps(''); }} />
        <View style={s.card}>
          <Text style={s.eyebrow}>{trip.date} · {statusLabels[trip.status]}</Text><Text style={s.title}>{trip.title}</Text><Text style={s.destination}>⌖ {trip.destination}</Text>
          <Text style={s.label}>EQUIPO ASIGNADO</Text><Text style={s.body}>{trip.employees.join(' · ') || 'Sin empleados asignados'}</Text>
          {!!trip.notes && <><Text style={s.label}>INDICACIONES</Text><Text selectable style={s.body}>{trip.notes}</Text></>}
          <Button title="Editar viaje y equipo" secondary onPress={() => setTripForm(trip)} />
          <Text style={s.label}>ESTADO DEL VIAJE</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{statuses.map(k => <Choice key={k} label={statusLabels[k]} selected={trip.status === k} onPress={() => updateTrip(t => ({ ...t, status: k }))} />)}</View>
          <Button title="Abrir destino en Google Maps ↗" onPress={() => { Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.destination)}`).catch(() => notify('No se pudo abrir Google Maps.')); }} />
          <Button title={locating ? 'Obteniendo ubicación…' : 'Consultar mi ubicación GPS'} secondary onPress={() => { if (!locating) void locate(); }} />
          {!!gps && <Text selectable style={s.body}>{gps}</Text>}
          <Text style={s.muted}>Google Maps puede necesitar conexión para cargar mapas y rutas. El GPS requiere permiso de ubicación.</Text>
        </View>
        <View style={s.tabs}>{(['tasks', 'supplies'] as const).map(k => <Pressable key={k} accessibilityRole="tab" aria-selected={list === k} onPress={() => { setList(k); setEntry(''); }} style={[s.tab, list === k && s.activeTab]}><Text style={s.tabText}>{k === 'tasks' ? 'Tareas' : 'Qué llevar'} ({trip[k].filter(i => i.done).length}/{trip[k].length})</Text></Pressable>)}</View>
        <View style={s.card}>
          {!trip[list].length && <Text style={s.muted}>Agregá {list === 'tasks' ? 'las tareas para este viaje' : 'herramientas, materiales y elementos personales'}.</Text>}
          {trip[list].map(i => <View key={i.id} style={s.item}><Pressable accessibilityRole="checkbox" aria-checked={i.done} accessibilityLabel={i.text} onPress={() => updateTrip(t => toggleItem(t, list, i.id))} style={s.checkRow}><Text style={s.check}>{i.done ? '☑' : '☐'}</Text><Text style={[s.body, { flex: 1 }, i.done && s.done]}>{i.text}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Eliminar ${i.text}`} onPress={() => setConfirmation({ title: 'Eliminar elemento', message: `¿Querés quitar “${i.text}” de esta lista?`, action: () => updateTrip(t => ({ ...t, [list]: t[list].filter(x => x.id !== i.id) })) })}><Text style={s.remove}>×</Text></Pressable></View>)}
          <Field label={list === 'tasks' ? 'Nueva tarea' : 'Nuevo elemento'} value={entry} onChangeText={setEntry} placeholder={list === 'tasks' ? 'Revisar el equipo al llegar' : 'Herramientas, agua, documentación…'} />
          <Button title="+ Agregar" onPress={() => { if (entry.trim()) { const item = { id: uid(), text: entry.trim(), done: false }; updateTrip(t => ({ ...t, [list]: [...t[list], item] })); setEntry(''); } }} />
        </View>
        <Button title="Duplicar viaje como nueva planificación" secondary onPress={() => {
          const copy = { ...trip, id: uid(), title: `${trip.title} (copia)`, status: 'planned' as const, tasks: trip.tasks.map(i => ({ ...i, id: uid(), done: false })), supplies: trip.supplies.map(i => ({ ...i, id: uid(), done: false })) };
          setTripForm(copy);
        }} />
        <Button title="Eliminar viaje" danger onPress={() => setConfirmation({ title: 'Eliminar viaje', message: `Se eliminará “${trip.title}” y sus listas de este dispositivo. Exportá una copia antes si querés conservarlo.`, action: () => { persist(d => removeTrip(d, trip.id)); setSelected(null); } })} />
      </> : <>
        <View style={s.row}><Text style={s.title}>Mis viajes</Text><Text style={s.count}>{data.trips.length}</Text></View>
        <Text style={s.muted}>{data.trips.filter(t => t.status === 'planned').length} planificados · {data.trips.filter(t => t.status === 'in_progress').length} en curso · {data.trips.filter(t => t.status === 'completed').length} finalizados</Text>
        <Button title="+ Organizar un viaje" onPress={() => setTripForm('new')} />
        <Button title={`Directorio de empleados (${data.employees.length})`} secondary onPress={() => setDirectory(true)} />
        <Field label="Buscar viajes" value={search} onChangeText={setSearch} placeholder="Nombre, destino, empleado o notas" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}><Choice label="Todos" selected={filter === 'all'} onPress={() => setFilter('all')} />{statuses.map(k => <Choice key={k} label={statusLabels[k]} selected={filter === k} onPress={() => setFilter(k)} />)}</View>
        {!visibleTrips.length && <View style={s.card}><Text style={s.title}>{data.trips.length ? 'Sin coincidencias' : 'Todo listo para salir'}</Text><Text style={s.body}>{data.trips.length ? 'Probá otro texto o seleccioná Todos los estados.' : 'Creá tu primer viaje, asigná el equipo y prepará las listas.'}</Text></View>}
        {visibleTrips.map(t => <Pressable key={t.id} accessibilityRole="button" onPress={() => openTrip(t)} style={s.card}><Text style={s.eyebrow}>{t.date} · {statusLabels[t.status]}</Text><Text style={s.title}>{t.title}</Text><Text style={s.destination}>⌖ {t.destination}</Text><Text style={s.muted}>{t.employees.length} empleados · {t.tasks.filter(i => i.done).length}/{t.tasks.length} tareas · {t.supplies.filter(i => i.done).length}/{t.supplies.length} elementos preparados</Text><Text style={s.link}>Ver preparación →</Text></Pressable>)}
        <View style={s.card}><Text style={s.title}>Datos y copias de seguridad</Text><Text style={s.body}>Exportá viajes, empleados y cambios locales. Importar agrega registros nuevos, conserva los existentes y respeta lo eliminado en este dispositivo.</Text>
          <Button title="Exportar viajes" secondary onPress={() => void exportData()} /><Button title="Importar copia" secondary onPress={() => void importData()} />
          <Text style={s.label}>{data.pendingChanges.length} REGISTROS CON CAMBIOS LOCALES</Text><Text style={s.muted}>La cola conserva el último cambio por registro, incluidas eliminaciones. No hay servidor conectado: estos cambios todavía no se envían ni se sincronizan con otros teléfonos.</Text><Text style={s.muted}>Las copias incluyen nombres, teléfonos y destinos sin cifrar. Compartilas solo con tu equipo.</Text>
        </View>
      </>}
      <Text style={s.footer}>AGROVIAJES · ORGANIZACIÓN EN MOVIMIENTO</Text>
    </ScrollView>
    {confirmation && <Confirm title={confirmation.title} message={confirmation.message} onCancel={() => setConfirmation(null)} onConfirm={() => { confirmation.action(); setConfirmation(null); }} />}
  </View>;
}
