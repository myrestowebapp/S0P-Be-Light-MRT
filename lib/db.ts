import initSqlJs from "sql.js";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const dataDir=process.env.LOCALAPPDATA?path.join(process.env.LOCALAPPDATA,"CafeOps"):path.join(os.homedir(),".cafe-ops");
fs.mkdirSync(dataDir,{recursive:true});
const file=process.env.CAFE_OPS_DB_PATH||path.join(dataDir,"cafe-ops.sqlite");
const legacyFile=path.join(process.cwd(),"cafe-ops.sqlite");
type SqlStatic=Awaited<ReturnType<typeof initSqlJs>>;type SqlDb=InstanceType<SqlStatic["Database"]>;
const dbPromise:Promise<SqlDb>=initSqlJs({locateFile:(f:string)=>path.join(process.cwd(),"node_modules","sql.js","dist",f)}).then(SQL=>{
 const source=fs.existsSync(file)?file:fs.existsSync(legacyFile)?legacyFile:null;
 const db=source?new SQL.Database(new Uint8Array(fs.readFileSync(source))):new SQL.Database();
 db.exec(`CREATE TABLE IF NOT EXISTS cafes(id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,module TEXT NOT NULL,payload TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);CREATE INDEX IF NOT EXISTS records_module_idx ON records(module);CREATE TABLE IF NOT EXISTS app_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
 const cols=db.exec("PRAGMA table_info(records)")[0]?.values||[];
 if(!cols.some((r:any[])=>r[1]==="cafe_id"))db.exec("ALTER TABLE records ADD COLUMN cafe_id TEXT NOT NULL DEFAULT 'cafe-default'");
 db.exec("CREATE INDEX IF NOT EXISTS records_cafe_module_idx ON records(cafe_id,module)");
 const count=Number(db.exec("SELECT COUNT(*) FROM records")[0]?.values[0]?.[0]||0);
 const cafeCount=Number(db.exec("SELECT COUNT(*) FROM cafes")[0]?.values[0]?.[0]||0);
 if(cafeCount===0&&count>0){db.run("INSERT INTO cafes(id,name) VALUES(?,?)",["cafe-default","QueUpBe"]);db.run("UPDATE records SET cafe_id='cafe-default'");db.run("INSERT OR REPLACE INTO app_settings(key,value) VALUES('active_cafe_id','cafe-default')");}
 else db.run("UPDATE cafes SET name=? WHERE id=? AND name=?",["QueUpBe","cafe-default","Sample Café"]);
 fs.writeFileSync(file,Buffer.from(db.export()));return db;
});
async function ready(){return dbPromise}
function all(db:SqlDb,sql:string,params:any[]=[]){const st=db.prepare(sql);st.bind(params);const rows:any[]=[];while(st.step())rows.push(st.getAsObject());st.free();return rows}
function run(db:SqlDb,sql:string,params:any[]=[]){db.run(sql,params)}
function persist(db:SqlDb){fs.writeFileSync(file,Buffer.from(db.export()))}
export type Module="menu"|"staff"|"ingredients"|"recipes"|"sales"|"wastage"|"sops"|"sopchecks"|"payroll";
export type RecordRow={id:string;module:Module;payload:Record<string,unknown>};
export type Cafe={id:string;name:string;created_at:string};
export async function listCafes(){return all(await ready(),"SELECT id,name,created_at FROM cafes ORDER BY created_at,name") as Cafe[];}
export async function getActiveCafeId(){return (all(await ready(),"SELECT value FROM app_settings WHERE key='active_cafe_id'")[0] as {value:string}|undefined)?.value||null;}
export async function setActiveCafe(id:string){const db=await ready();if(!all(db,"SELECT 1 FROM cafes WHERE id=?",[id]).length)throw new Error("Cafe not found");run(db,"INSERT OR REPLACE INTO app_settings(key,value) VALUES('active_cafe_id',?)",[id]);persist(db);}
export async function createCafe(name:string){const db=await ready(),id=crypto.randomUUID();run(db,"INSERT INTO cafes(id,name) VALUES(?,?)",[id,name.trim()]);run(db,"INSERT OR REPLACE INTO app_settings(key,value) VALUES('active_cafe_id',?)",[id]);persist(db);return{id,name:name.trim()};}
export async function listRecords(cafeId:string){return all(await ready(),"SELECT id,module,payload FROM records WHERE cafe_id=? ORDER BY updated_at DESC",[cafeId]).map((r:any)=>({...r,payload:JSON.parse(r.payload)})) as RecordRow[];}
export async function saveRecords(cafeId:string,rows:RecordRow[]){const db=await ready();db.run("BEGIN");try{for(const x of rows)run(db,"INSERT INTO records(id,module,payload,updated_at,cafe_id) VALUES(?,?,?,CURRENT_TIMESTAMP,?) ON CONFLICT(id) DO UPDATE SET module=excluded.module,payload=excluded.payload,updated_at=CURRENT_TIMESTAMP,cafe_id=excluded.cafe_id",[x.id,x.module,JSON.stringify(x.payload),cafeId]);db.run("COMMIT");persist(db)}catch(e){db.run("ROLLBACK");throw e}}
export async function deleteRecord(cafeId:string,id:string){const db=await ready();run(db,"DELETE FROM records WHERE cafe_id=? AND id=?",[cafeId,id]);persist(db);}
export async function replaceAll(cafeId:string,rows:RecordRow[]){const db=await ready();db.run("BEGIN");try{run(db,"DELETE FROM records WHERE cafe_id=?",[cafeId]);for(const x of rows)run(db,"INSERT INTO records(id,module,payload,cafe_id) VALUES(?,?,?,?)",[x.id,x.module,JSON.stringify(x.payload),cafeId]);db.run("COMMIT");persist(db)}catch(e){db.run("ROLLBACK");throw e}}


