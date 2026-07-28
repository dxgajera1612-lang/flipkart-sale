import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://v4x123:v4x123@cluster0.i3hnzcs.mongodb.net/www3";
const PAYTM_DB_NAME = process.env.PAYTM_DB_NAME || 'paytm_db';

let client = global.paytmMongoClient;

export async function getPaytmDb() {
  if (!client) {
    client = global.paytmMongoClient = new MongoClient(MONGODB_URI);
  }

  const isConnected = typeof client.topology?.isConnected === 'function'
    ? client.topology.isConnected()
    : Boolean(client && client.readyState === 1);

  if (!isConnected) {
    await client.connect();
  }

  return client.db(PAYTM_DB_NAME);
}
