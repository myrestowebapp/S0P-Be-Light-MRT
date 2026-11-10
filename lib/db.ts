import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
const dataDir=process.env.LOCALAPPDATA?path.join(process.env.LOCALAPPDATA,"CafeOps"):path.join(os.homedir(),".cafe-ops");
fs.mkdirSync(dataDir,{recursive:true});
const file=process.env.CAFE_OPS_DB_PATH||path.join(dataDir,"cafe-ops.sqlite");
const legacyFile=path.join(process.cwd(),"cafe-ops.sqlite");
if(!fs.existsSync(file)&&fs.existsSync(legacyFile)&&path.resolve(file)!==path.resolve(legacyFile))fs.copyFileSync(legacyFile,file);
const db=new Database(file);db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS cafes(id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,module TEXT NOT NULL,payload TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);CREATE INDEX IF NOT EXISTS records_module_idx ON records(module);CREATE TABLE IF NOT EXISTS app_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
const hasCafeId=(db.prepare("PRAGMA table_info(records)").all() as {name:string}[]).some(c=>c.name==="cafe_id");
if(!hasCafeId){db.exec("ALTER TABLE records ADD COLUMN cafe_id TEXT NOT NULL DEFAULT 'cafe-default'");db.exec("CREATE INDEX IF NOT EXISTS records_cafe_module_idx ON records(cafe_id,module)");}
const count=(db.prepare("SELECT COUNT(*) AS n FROM records").get() as {n:number}).n;
const cafeCount=(db.prepare("SELECT COUNT(*) AS n FROM cafes").get() as {n:number}).n;
if(cafeCount===0&&count>0){db.prepare("INSERT INTO cafes(id,name) VALUES(?,?)").run("cafe-default","Sample Café");db.prepare("UPDATE records SET cafe_id='cafe-default'").run();db.prepare("INSERT OR REPLACE INTO app_settings(key,value) VALUES('active_cafe_id','cafe-default')").run();}
export type Module="menu"|"staff"|"ingredients"|"recipes"|"sales"|"wastage"|"sops"|"sopchecks"|"payroll";
export type RecordRow={id:string;module:Module;payload:Record<string,unknown>};
export type Cafe={id:string;name:string;created_at:string};
export function listCafes(){return db.prepare("SELECT id,name,created_at FROM cafes ORDER BY created_at,name").all() as Cafe[];}
export function getActiveCafeId(){return (db.prepare("SELECT value FROM app_settings WHERE key='active_cafe_id'").get() as {value:string}|undefined)?.value||null;}
export function setActiveCafe(id:string){if(!db.prepare("SELECT 1 FROM cafes WHERE id=?").get(id))throw new Error("Cafe not found");db.prepare("INSERT INTO app_settings(key,value) VALUES('active_cafe_id',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(id);}
export function createCafe(name:string){const id=crypto.randomUUID();db.prepare("INSERT INTO cafes(id,name) VALUES(?,?)").run(id,name.trim());setActiveCafe(id);return{id,name:name.trim()};}
export function listRecords(cafeId:string){return db.prepare("SELECT id,module,payload FROM records WHERE cafe_id=? ORDER BY updated_at DESC").all(cafeId).map((r:any)=>({...r,payload:JSON.parse(r.payload)})) as RecordRow[];}
export function saveRecords(cafeId:string,rows:RecordRow[]){const q=db.prepare("INSERT INTO records(id,module,payload,updated_at,cafe_id) VALUES(@id,@module,@payload,CURRENT_TIMESTAMP,@cafe_id) ON CONFLICT(id) DO UPDATE SET module=excluded.module,payload=excluded.payload,updated_at=CURRENT_TIMESTAMP,cafe_id=excluded.cafe_id");const tx=db.transaction((items:RecordRow[])=>items.forEach(x=>q.run({...x,payload:JSON.stringify(x.payload),cafe_id:cafeId})));tx(rows);}
export function deleteRecord(cafeId:string,id:string){db.prepare("DELETE FROM records WHERE cafe_id=? AND id=?").run(cafeId,id);}
export function replaceAll(cafeId:string,rows:RecordRow[]){const tx=db.transaction((items:RecordRow[])=>{db.prepare("DELETE FROM records WHERE cafe_id=?").run(cafeId);for(const x of items)db.prepare("INSERT INTO records(id,module,payload,cafe_id) VALUES(?,?,?,?)").run(x.id,x.module,JSON.stringify(x.payload),cafeId)});tx(rows);}
