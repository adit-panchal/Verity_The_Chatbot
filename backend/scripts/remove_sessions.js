const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const removeSessionsField = async () => {
    try {
        await connectDB();

        const User = require('../models/User');

        console.log('Unsetting "sessions" field from all users...');
        
        // Use the raw collection to ensure we can touch fields not in the schema
        const result = await mongoose.connection.collection('users').updateMany(
            {}, 
            { $unset: { sessions: "" } }
        );

        console.log(`Operation complete.`);
        console.log(`Matched count: ${result.matchedCount}`);
        console.log(`Modified count: ${result.modifiedCount}`);

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

removeSessionsField();