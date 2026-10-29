/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import { MongoClient } from 'mongodb';

const uri =
  process.env.MIMIC_MANAGER_MONGODB_URI ||
  process.env.MONGODB_URI ||
  'mongodb+srv://wefikplugin_db_user:PS7dOJI1EYpXxqLt@mimic-manager.4llnuji.mongodb.net/mimic_manager?retryWrites=true&w=majority';

export const client = new MongoClient(uri);

export async function connectToMongoDB(): Promise<MongoClient | undefined> {
  try {
    await client.connect();
    console.log('You successfully connected to MongoDB!');
    return client;
  } catch (err) {
    console.dir(err);
    throw err;
  }
}

// Call this only when your application terminates
export async function disconnectFromMongoDB(): Promise<void> {
  await client.close();
}
