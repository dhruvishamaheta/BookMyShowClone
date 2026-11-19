import dotenv from "dotenv";
import mongoose from "mongoose";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Activity, Event, Movie, Sport } from "./models/Content.js";
import { Cinema } from "./models/Cinema.js";
import { City } from "./models/City.js";
import { User } from "./models/User.js";
import { seedData, seedCinemas, seedCities } from "./seeds/seedData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const shouldReset = process.argv.includes("--reset");
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is not set in backend/.env");
}

async function seedCollection(Model, documents, options = {}) {
  const existingCount = await Model.countDocuments();
  if (options.reset) {
    await Model.deleteMany({});
    if (documents.length > 0) {
      await Model.insertMany(documents);
    }
    return { existingCount, insertedCount: documents.length, reset: true };
  }

  if (existingCount === 0 && documents.length > 0) {
    await Model.insertMany(documents);
    return { existingCount, insertedCount: documents.length, reset: false };
  }

  return { existingCount, insertedCount: 0, reset: false };
}

async function run() {
  await mongoose.connect(mongoUri);

  const results = {};
  results.movies = await seedCollection(Movie, seedData.movies, { reset: shouldReset });
  results.events = await seedCollection(Event, seedData.events, { reset: shouldReset });
  results.sports = await seedCollection(Sport, seedData.sports, { reset: shouldReset });
  results.activities = await seedCollection(Activity, seedData.activities, { reset: shouldReset });
  results.cinemas = await seedCollection(Cinema, seedCinemas, { reset: shouldReset });
  results.cities = await seedCollection(City, seedCities, { reset: shouldReset });


  const adminFilter = { username: "admin" };
  const existingAdmin = await User.findOne(adminFilter);
  if (shouldReset && existingAdmin) {
    await User.deleteMany(adminFilter);
  }

  const adminAfterReset = await User.findOne(adminFilter);
  if (!adminAfterReset) {
    await User.create({
      name: "Admin",
      username: "admin",
      email: "admin@example.com",
      gender: "Other",
      mobile: "9999999999",
      password: "admin123",
      city: "Rajkot",
    });
  }

  const userCount = await User.countDocuments();

  console.log(
    JSON.stringify(
      {
        connected: true,
        reset: shouldReset,
        results,
        users: { count: userCount },
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error("Atlas seed failed:", error);
  process.exit(1);
});