import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://abdullahalfahad2_db_user:fahad123@ac-hv7w3jz-shard-00-00.7p3wnna.mongodb.net:27017,ac-hv7w3jz-shard-00-01.7p3wnna.mongodb.net:27017,ac-hv7w3jz-shard-00-02.7p3wnna.mongodb.net:27017/ekjatray?ssl=true&replicaSet=atlas-s30b7b-shard-0&authSource=admin&appName=EkJatray");
    console.log("MongoDB connected");
  } catch (err) {
    console.log(err);
  }
};

export default connectDB;