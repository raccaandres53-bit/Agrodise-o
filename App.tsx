import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { Data, Trip, emptyData, parseData, toggleItem, uid, validDate } from './src/model';
const KEY = 'agroviajes.v1';
const notify = (message: string) => Platform.OS === 'web' ? window.alert(message) : Alert.alert('AgroViajes', message);
function Button({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[s.button, secondary && s.secondary]}><Text style={[s.buttonText, secondary && { color: '#164e3b' }]}>{title}</Text></Pressable>;
}
export default function App() {
  const [data, setData] = useState<Data>(emptyData);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [employees, setEmployees] = useState('');
  const [entry, setEntry] = useState('');
  const [list, setList] = useState<'tasks' | 'supplies'>('tasks');
  const [gps, setGps] = useState('');
  const [locating, setLocating] = useState(false);
  const queue = useRef(Promise.resolve());
  const saveRevision = useRef(0);
  useEffect(() => { AsyncStorage.getItem(KEY).then(raw => { if (raw) setData(parseData(raw)); setReady(true); }).catch(() => setError('No se pudieron leer los datos. Reiniciá la app para reintentar; no se sobrescribirá el almacenamiento.')); }, []);
  function persist(next: Data) {
    setData(next); setSaved('Guardando…');
    const revision = ++saveRevision.current;
    queue.current = queue.current.then(() => AsyncStorage.setItem(KEY, JSON.stringify(next))).then(() => { if (revision === saveRevision.current) setSaved('Guardado en este dispositivo'); }).catch(() => { if (revision === saveRevision.current) setSaved('Error al guardar. Exportá una copia antes de cerrar.'); });
  }
  const trip = data.trips.find(t => t.id === selected);
  function update(next: Trip) { persist({ ...data, trips: data.trips.map(t => t.id === next.id ? next : t) }); }
  function create() {
    if (!title.trim() || !destination.trim() || !validDate(date)) return notify('Completá nombre, destino y una fecha válida (AAAA-MM-DD).');
    const t: Trip = { id: uid(), title: title.trim(), destination: destination.trim(), date, employees: employees.split(',').map(e => e.trim()).filter(Boolean), tasks: [], supplies: [], updatedAt: new Date().toISOString() };
    persist({ ...data, trips: [...data.trips, t] }); setSelected(t.id); setCreating(false); setTitle(''); setDestination(''); setDate(''); setEmployees(''); setEntry(''); setGps('');
  }
  async function locate() {
    setLocating(true);
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (!p.granted) return notify('Permití el acceso a la ubicación para usar el GPS.');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setGps(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)} · precisión ${Math.round(pos.coords.accuracy ?? 0)} m`);
    } catch { notify('No se pudo obtener la ubicación. Revisá que el GPS esté habilitado.'); } finally { setLocating(false); }
  }
  async function exportData() {
    try {
      const text = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = 'agroviajes.json'; a.click(); URL.revokeObjectURL(url);
      } else {
        if (!await Sharing.isAvailableAsync()) return notify('Compartir archivos no está disponible en este dispositivo.');
        const file = new File(Paths.cache, 'agroviajes.json'); file.create({ overwrite: true }); file.write(text); await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
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
      const imported = parseData(text);
      // Preserve local trips; importing a duplicate never replaces local edits.
      const existing = new Set(data.trips.map(t => t.id));
      const added = imported.trips.filter(t => !existing.has(t.id));
      persist({ ...data, trips: [...data.trips, ...added] }); notify(`${added.length} viajes agregados. Los viajes existentes se conservaron.`);
    } catch { notify('No se pudo importar. Elegí una copia JSON válida de AgroViajes.'); }
  }
  if (!ready) return <View style={s.loading}><Text style={s.title}>AgroViajes</Text>{error ? <Text accessibilityRole="alert">{error}</Text> : <ActivityIndicator color="#166849" />}</View>;
  return <View style={s.root}><StatusBar style="light" /><View style={s.header}><Text style={s.brand}>AGRO / VIAJES</Text><Text style={s.hero}>Tu equipo, en camino.</Text><Text style={s.headerSub}>Planificá. Prepará. Viajá.</Text></View>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><View style={s.badge}><Text style={s.badgeText}>● Datos disponibles sin conexión</Text></View><Text style={s.muted}>{saved || 'Almacenamiento local · sin sincronización automática'}</Text>
    {creating ? <View style={s.card}><Text style={s.title}>Nuevo viaje</Text><Field label="Nombre del viaje" value={title} onChangeText={setTitle} placeholder="Visita a campo norte" /><Field label="Destino / dirección" value={destination} onChangeText={setDestination} placeholder="Localidad, provincia o coordenadas" /><Field label="Fecha (AAAA-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-11-05" /><Field label="Empleados (separados por coma)" value={employees} onChangeText={setEmployees} placeholder="Ana, Pedro, Luis" /><Button title="Crear viaje" onPress={create} /><Button title="Cancelar" secondary onPress={() => setCreating(false)} /></View>
    : trip ? <><Button title="← Todos los viajes" secondary onPress={() => { setSelected(null); setEntry(''); setGps(''); }} /><View style={s.card}><Text style={s.eyebrow}>{trip.date}</Text><Text style={s.title}>{trip.title}</Text><Text style={s.destination}>⌖ {trip.destination}</Text><Text style={s.label}>EQUIPO ASIGNADO</Text><Text style={s.body}>{trip.employees.join(' · ') || 'Sin empleados asignados'}</Text><Field label="Actualizar equipo (separado por comas)" value={employees} onChangeText={setEmployees} placeholder="Nombres de empleados" /><Button title="Guardar equipo" secondary onPress={() => { update({ ...trip, employees: employees.split(',').map(e => e.trim()).filter(Boolean), updatedAt: new Date().toISOString() }); }} /><Button title="Abrir destino en Google Maps ↗" onPress={() => { Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.destination)}`).catch(() => notify('No se pudo abrir Google Maps.')); }} /><Button title={locating ? 'Obteniendo ubicación…' : 'Consultar mi ubicación GPS'} secondary onPress={() => { if (!locating) void locate(); }} />{!!gps && <Text selectable style={s.body}>{gps}</Text>}<Text style={s.muted}>Google Maps puede necesitar conexión para cargar mapas y rutas. El GPS requiere permiso de ubicación.</Text></View>
    <View style={s.tabs}>{(['tasks', 'supplies'] as const).map(k => <Pressable key={k} accessibilityRole="tab" aria-selected={list === k} onPress={() => setList(k)} style={[s.tab, list === k && s.activeTab]}><Text style={s.tabText}>{k === 'tasks' ? 'Tareas' : 'Qué llevar'} ({trip[k].filter(i => i.done).length}/{trip[k].length})</Text></Pressable>)}</View><View style={s.card}>{trip[list].length === 0 && <Text style={s.muted}>Agregá {list === 'tasks' ? 'las tareas para este viaje' : 'herramientas, materiales y elementos personales'}.</Text>}{trip[list].map(i => <View key={i.id} style={s.item}><Pressable accessibilityRole="checkbox" aria-checked={i.done} onPress={() => update(toggleItem(trip, list, i.id))} style={s.checkRow}><Text style={s.check}>{i.done ? '☑' : '☐'}</Text><Text style={[s.body, { flex: 1 }, i.done && s.done]}>{i.text}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Eliminar ${i.text}`} onPress={() => update({ ...trip, [list]: trip[list].filter(x => x.id !== i.id), updatedAt: new Date().toISOString() })}><Text style={s.remove}>×</Text></Pressable></View>)}<Field label={list === 'tasks' ? 'Nueva tarea' : 'Nuevo elemento'} value={entry} onChangeText={setEntry} placeholder={list === 'tasks' ? 'Revisar el equipo al llegar' : 'Herramientas, agua, documentación…'} /><Button title="+ Agregar" onPress={() => { if (entry.trim()) { update({ ...trip, [list]: [...trip[list], { id: uid(), text: entry.trim(), done: false }], updatedAt: new Date().toISOString() }); setEntry(''); } }} /></View></>
    : <><View style={s.row}><Text style={s.title}>Mis viajes</Text><Text style={s.count}>{data.trips.length}</Text></View><Button title="+ Organizar un viaje" onPress={() => { setCreating(true); setEmployees(''); }} />{data.trips.length === 0 && <View style={s.card}><Text style={s.title}>Todo listo para salir</Text><Text style={s.body}>Creá tu primer viaje, asigná el equipo y prepará las listas. Podrás consultarlas y marcarlas aunque no tengas señal.</Text></View>}{[...data.trips].sort((a,b) => a.date.localeCompare(b.date)).map(t => <Pressable key={t.id} accessibilityRole="button" onPress={() => { setSelected(t.id); setEmployees(t.employees.join(', ')); setGps(''); }} style={s.card}><Text style={s.eyebrow}>{t.date} · {t.employees.length} empleados</Text><Text style={s.title}>{t.title}</Text><Text style={s.destination}>⌖ {t.destination}</Text><Text style={s.muted}>{t.tasks.filter(i => i.done).length}/{t.tasks.length} tareas · {t.supplies.filter(i => i.done).length}/{t.supplies.length} elementos preparados</Text><Text style={s.link}>Ver preparación →</Text></Pressable>)}<View style={s.card}><Text style={s.title}>Copias y traslado de datos</Text><Text style={s.body}>Exportá una copia para guardarla o enviarla a otro teléfono. La importación agrega viajes nuevos; conserva los existentes, sin fusionar sus cambios.</Text><Button title="Exportar viajes" secondary onPress={() => void exportData()} /><Button title="Importar copia" secondary onPress={() => void importData()} /><Text style={s.muted}>No hay servidor conectado. Los datos no se sincronizan entre empleados automáticamente. Las copias contienen nombres y destinos: compartilas solo con tu equipo.</Text></View></>}
    <Text style={s.footer}>AGROVIAJES · ORGANIZACIÓN EN MOVIMIENTO</Text></ScrollView></View>;
}
function Field({ label, ...props }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string }) { return <View style={{ marginVertical: 8 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} style={s.input} placeholderTextColor="#78857c" {...props} /></View>; }
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3f5ef' }, loading: { flex: 1, padding: 32, justifyContent: 'center', gap: 24 }, header: { backgroundColor: '#153e30', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 30 }, brand: { color: '#bfe587', fontSize: 13, fontWeight: '800', letterSpacing: 3 }, hero: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 18 }, headerSub: { color: '#c6d5cc', marginTop: 8, fontSize: 16 }, content: { padding: 20, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center', paddingBottom: 48 }, badge: { alignSelf: 'flex-start', backgroundColor: '#dfebd5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 }, badgeText: { color: '#295639', fontSize: 12, fontWeight: '600' }, card: { backgroundColor: '#fff', borderRadius: 20, padding: 22, gap: 12, borderWidth: 1, borderColor: '#e1e7dc' }, title: { fontSize: 23, fontWeight: '700', color: '#173e30' }, body: { fontSize: 16, color: '#405449', lineHeight: 24 }, muted: { fontSize: 13, color: '#66756c', lineHeight: 20 }, destination: { fontSize: 17, color: '#536749' }, eyebrow: { color: '#6c7d57', fontSize: 12, fontWeight: '700', letterSpacing: 1 }, label: { color: '#40594b', fontSize: 12, fontWeight: '700', marginBottom: 6 }, input: { backgroundColor: '#f5f7f1', borderWidth: 1, borderColor: '#d7dfd0', borderRadius: 10, padding: 14, fontSize: 16, color: '#183d2e' }, button: { backgroundColor: '#236246', padding: 16, borderRadius: 12, alignItems: 'center', marginVertical: 3 }, secondary: { backgroundColor: '#eaf0e2' }, buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, count: { backgroundColor: '#e0e9d5', color: '#236246', borderRadius: 20, padding: 10 }, tabs: { flexDirection: 'row', gap: 8 }, tab: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#e6ebdf' }, activeTab: { backgroundColor: '#c8dfaf' }, tabText: { textAlign: 'center', color: '#244630', fontWeight: '700' }, item: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#edf0e8', paddingVertical: 8 }, checkRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }, check: { fontSize: 27, color: '#236246' }, done: { textDecorationLine: 'line-through', color: '#819083' }, remove: { fontSize: 28, color: '#9a5a46', padding: 12 }, link: { color: '#236246', fontWeight: '700', marginTop: 6 }, footer: { textAlign: 'center', color: '#819078', fontSize: 10, letterSpacing: 2, marginTop: 20 }
});
