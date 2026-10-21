import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseData, validDate, toggleItem } from '../src/model.ts';
const trip = {id:'1',title:'Campo',destination:'Córdoba',date:'2026-11-05',employees:['Ana'],tasks:[{id:'a',text:'Revisar',done:false}],supplies:[],updatedAt:'2026-10-21T10:00:00Z'};
test('una copia conserva empleados y estado de las listas', () => {
 const updated=toggleItem(trip,'tasks','a');
 assert.equal(updated.tasks[0].done,true);assert.equal(trip.tasks[0].done,false);
 assert.deepEqual(parseData(JSON.stringify({version:1,trips:[updated]})).trips[0],updated);
});
test('rechaza copias incompletas y elementos inválidos', () => {
 for(const value of [{}, {version:2,trips:[]}, {version:1,trips:[{...trip,employees:null}]}, {version:1,trips:[{...trip,tasks:[{id:'a',text:'x',done:'sí'}]}]}, {version:1,trips:[trip,trip]}]) assert.throws(()=>parseData(JSON.stringify(value)));
});
test('valida fechas reales, incluyendo años bisiestos',()=>{
 assert.equal(validDate('2028-02-29'),true);assert.equal(validDate('2026-02-29'),false);assert.equal(validDate('2026-13-01'),false);assert.equal(validDate('05/11/2026'),false);
});
