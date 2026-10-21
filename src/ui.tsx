import React, { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Employee, names, statuses, statusLabels, Trip, uid, validDate } from './model';
import { s } from './styles';
export function Button({ title, onPress, secondary = false, danger = false }: { title: string; onPress: () => void; secondary?: boolean; danger?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[s.button, secondary && s.secondary, danger && { backgroundColor: '#973f35' }]}>
    <Text style={[s.buttonText, secondary && !danger && { color: '#164e3b' }]}>{title}</Text>
  </Pressable>;
}
export function Field({ label, multiline = false, ...props }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  return <View style={{ marginVertical: 8 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} style={[s.input, multiline && { minHeight: 100, textAlignVertical: 'top' }]} placeholderTextColor="#78857c" multiline={multiline} {...props} /></View>;
}
export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" aria-pressed={selected} onPress={onPress} style={[s.tab, { flex: 0, padding: 12 }, selected && s.activeTab]}><Text style={s.tabText}>{label}</Text></Pressable>;
}
export function Confirm({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return <Modal transparent animationType="fade" onRequestClose={onCancel}><View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 24 }}><View style={[s.card, { width: '100%', maxWidth: 500, alignSelf: 'center' }]} accessibilityViewIsModal><Text accessibilityRole="header" style={s.title}>{title}</Text><Text style={s.body}>{message}</Text><Button title="Confirmar eliminación" danger onPress={onConfirm} /><Button title="Conservar" secondary onPress={onCancel} /></View></View></Modal>;
}
export function TripForm({ initial, employees, onSave, onCancel, creating = !initial }: { creating?: boolean; initial?: Trip; employees: Employee[]; onSave: (trip: Trip) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [destination, setDestination] = useState(initial?.destination ?? '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [assigned, setAssigned] = useState(initial?.employees.join(', ') ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'planned');
  const [error, setError] = useState('');
  function submit() {
    if (!title.trim() || !destination.trim() || !validDate(date)) { setError('Completá nombre, destino y una fecha válida (AAAA-MM-DD).'); return; }
    onSave({ id: initial?.id ?? uid(), title: title.trim(), destination: destination.trim(), date, employees: names(assigned), tasks: initial?.tasks ?? [], supplies: initial?.supplies ?? [], status, notes: notes.trim(), updatedAt: new Date().toISOString() });
  }
  return <View style={s.card}><Text style={s.title}>{creating ? 'Nuevo viaje' : 'Editar viaje'}</Text>
    <Field label="Nombre del viaje" value={title} onChangeText={setTitle} placeholder="Visita a campo norte" />
    <Field label="Destino / dirección" value={destination} onChangeText={setDestination} placeholder="Localidad, provincia o coordenadas" />
    <Field label="Fecha (AAAA-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-11-05" />
    <Field label="Empleados (separados por coma)" value={assigned} onChangeText={setAssigned} placeholder="Ana, Pedro, Luis" />
    {employees.length > 0 && <><Text style={s.label}>ELEGIR DEL DIRECTORIO</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{employees.map(e => <Choice key={e.id} label={e.name} selected={names(assigned).includes(e.name)} onPress={() => setAssigned((names(assigned).includes(e.name) ? names(assigned).filter(n => n !== e.name) : [...names(assigned), e.name]).join(', '))} />)}</View></>}
    <Text style={s.label}>ESTADO DEL VIAJE</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{statuses.map(k => <Choice key={k} label={statusLabels[k]} selected={status === k} onPress={() => setStatus(k)} />)}</View>
    <Field label="Indicaciones y notas" value={notes} onChangeText={setNotes} multiline placeholder="Horario de salida, contacto en destino, instrucciones…" />
    {!!error && <Text accessibilityRole="alert" style={{ color: '#973f35' }}>{error}</Text>}
    <Button title={creating ? 'Crear viaje' : 'Guardar cambios'} onPress={submit} /><Button title="Cancelar" secondary onPress={onCancel} />
  </View>;
}
export function EmployeeForm({ initial, onSave, onCancel }: { initial?: Employee; onSave: (e: Employee) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [error, setError] = useState('');
  return <View style={s.card}><Text style={s.title}>{initial ? 'Editar empleado' : 'Nuevo empleado'}</Text>
    <Field label="Nombre y apellido" value={name} onChangeText={setName} placeholder="Ana García" />
    <Field label="Puesto o función" value={role} onChangeText={setRole} placeholder="Técnica, conductor…" />
    <Field label="Teléfono de contacto" value={phone} onChangeText={setPhone} placeholder="+54…" />
    {!!error && <Text accessibilityRole="alert" style={{ color: '#973f35' }}>{error}</Text>}
    <Button title="Guardar empleado" onPress={() => { try { onSave({ id: initial?.id ?? uid(), name, role, phone }); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar'); } }} />
    <Button title="Cancelar" secondary onPress={onCancel} />
  </View>;
}
