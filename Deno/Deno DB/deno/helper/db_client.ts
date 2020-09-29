import { MongoClient, Database} from "https://deno.land/x/mongo@v0.8.0/mod.ts";

let db:Database;

export const connect = () => {
  const client = new MongoClient();
  
  client.connectWithUri("mongodb+srv://YanhongChen:Cyh19950129@nodejsplayground-kxxqg.mongodb.net/DenoSimple?retryWrites=true&w=majority");
  
  db = client.database("DenoSimple");
}

export const getDb = () => {
  return db;
}