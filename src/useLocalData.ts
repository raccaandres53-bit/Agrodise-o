import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Data, emptyData, parseData } from './model';
// Keep the old key so version-one installations are migrated rather than abandoned.
const KEY = 'agroviajes.v1';
export function useLocalData() {
  const [data, setData] = useState<Data>(emptyData);
  const latest = useRef(data);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const queue = useRef(Promise.resolve());
  const revision = useRef(0);
  async function load() {
    setError('');
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const loaded = raw ? parseData(raw) : emptyData;
      latest.current = loaded; setData(loaded); setReady(true);
    } catch { setError('No se pudieron leer los datos. Podés reintentar; el almacenamiento original no se sobrescribirá.'); }
  }
  useEffect(() => { void load(); }, []);
  function persist(change: (current: Data) => Data) {
    const next = change(latest.current);
    latest.current = next; setData(next); setSaved('Guardando…');
    const current = ++revision.current;
    queue.current = queue.current.then(() => AsyncStorage.setItem(KEY, JSON.stringify(next)))
      .then(() => { if (current === revision.current) setSaved('Guardado en este dispositivo'); })
      .catch(() => { if (current === revision.current) setSaved('Error al guardar. Reintentá o exportá una copia antes de cerrar.'); });
  }
  return { data, ready, error, saved, persist, retry: load, retrySave: () => persist(d => d) };
}
