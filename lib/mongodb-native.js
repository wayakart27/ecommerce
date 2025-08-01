// lib/mongodb-native.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10, // Adjust based on your needs
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
};

let client;
let clientPromise;

if (!uri) throw new Error('Missing MONGODB_URI');

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoNativePromise) {
    client = new MongoClient(uri, options);
    global._mongoNativePromise = client.connect();
  }
  clientPromise = global._mongoNativePromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;