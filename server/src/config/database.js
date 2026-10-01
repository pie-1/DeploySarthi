const mongoose = require("mongoose");

const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploysarthi');
        console.log(`mongodb connected: ${conn.connection.host}`);
    }catch(error){
        console.error(`error: ${error.message}`);
        process.exit(1)
    }
};

module.exports = connectDB;