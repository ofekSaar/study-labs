import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const connectTestDB = async () => {
    if (process.env.MONGODB_URI) {
        const testUri = process.env.MONGODB_URI.includes('?') 
          ? process.env.MONGODB_URI.replace('/studylabs', '/studylabs_test')
          : `${process.env.MONGODB_URI}_test`;
        await mongoose.connect(testUri);
        return;
    }

    try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    } catch (err) {
        console.warn("Failed to create MongoMemoryServer, falling back to local MongoDB:", err.message);
        await mongoose.connect("mongodb://127.0.0.1:27017/studylabs_test");
    }
};

export const closeTestDB = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
};

export const clearTestDB = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
};
