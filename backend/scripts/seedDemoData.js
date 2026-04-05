import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Bin from "../models/binModel.js";
import Truck from "../models/truckModel.js";
import Complaint from "../models/complaintModel.js";
import Collection from "../models/collectionModel.js";
import TruckLocation from "../models/truckLocationModel.js";
import User from "../models/userModel.js";
import Driver from "../models/driverModel.js";

dotenv.config();

const now = Date.now();

const bengaluruBins = [
    {
        binId: "BLR-BIN-001",
        area: "MG Road",
        landmark: "Trinity Circle",
        address: "MG Road, Bengaluru",
        location: { lat: 12.9738, lng: 77.6206 },
        capacity: 120,
        currentLoad: 98,
    },
    {
        binId: "BLR-BIN-002",
        area: "Indiranagar",
        landmark: "100 Feet Road",
        address: "Indiranagar 100 Feet Rd, Bengaluru",
        location: { lat: 12.9719, lng: 77.6412 },
        capacity: 110,
        currentLoad: 67,
    },
    {
        binId: "BLR-BIN-003",
        area: "Koramangala",
        landmark: "Sony Signal",
        address: "Koramangala 5th Block, Bengaluru",
        location: { lat: 12.9352, lng: 77.6245 },
        capacity: 130,
        currentLoad: 45,
    },
    {
        binId: "BLR-BIN-004",
        area: "Whitefield",
        landmark: "ITPL Main Gate",
        address: "Whitefield Main Rd, Bengaluru",
        location: { lat: 12.9698, lng: 77.7499 },
        capacity: 140,
        currentLoad: 118,
    },
    {
        binId: "BLR-BIN-005",
        area: "Jayanagar",
        landmark: "4th Block Complex",
        address: "Jayanagar 4th Block, Bengaluru",
        location: { lat: 12.925, lng: 77.5938 },
        capacity: 115,
        currentLoad: 74,
    },
    {
        binId: "BLR-BIN-006",
        area: "Hebbal",
        landmark: "Esteem Mall",
        address: "Hebbal Flyover, Bengaluru",
        location: { lat: 13.0352, lng: 77.597 },
        capacity: 125,
        currentLoad: 29,
    },
    {
        binId: "BLR-BIN-007",
        area: "Electronic City",
        landmark: "Phase 1 Toll",
        address: "Electronic City Phase 1, Bengaluru",
        location: { lat: 12.8399, lng: 77.677 },
        capacity: 150,
        currentLoad: 104,
    },
    {
        binId: "BLR-BIN-008",
        area: "Yelahanka",
        landmark: "Yelahanka New Town",
        address: "Yelahanka, Bengaluru",
        location: { lat: 13.1007, lng: 77.5963 },
        capacity: 100,
        currentLoad: 33,
    },
];

function deriveBinStatus(fillLevel) {
    if (fillLevel > 70) return "FULL";
    if (fillLevel > 30) return "MEDIUM";
    return "EMPTY";
}

const truckSeeds = [
    {
        driverName: "Manjunath R",
        regNo: "KA-01-GC-4123",
        type: "2-Axle-Standard",
        totalCapacity: 900,
        usedCapacity: 580,
        currentLocation: { lat: 12.9708, lng: 77.6389 },
        status: "BUSY",
    },
    {
        driverName: "Shalini P",
        regNo: "KA-05-GC-2874",
        type: "2-Axle-Mini",
        totalCapacity: 700,
        usedCapacity: 320,
        currentLocation: { lat: 12.9344, lng: 77.6121 },
        status: "IDLE",
    },
    {
        driverName: "Imran K",
        regNo: "KA-53-GC-9301",
        type: "3-Wheeler",
        totalCapacity: 450,
        usedCapacity: 205,
        currentLocation: { lat: 13.0173, lng: 77.6067 },
        status: "BUSY",
    },
    {
        driverName: "Naveen S",
        regNo: "KA-41-GC-5520",
        type: "2-Axle-Mini",
        totalCapacity: 750,
        usedCapacity: 140,
        currentLocation: { lat: 12.8476, lng: 77.6653 },
        status: "IDLE",
    },
];

const complaintTemplates = [
    {
        issueType: "HIGH: Overflowing mixed-waste bin near bus stop",
        location: { lat: 12.9731, lng: 77.6168 },
        image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    },
    {
        issueType: "MEDIUM: Missed pickup for two consecutive days",
        location: { lat: 12.9358, lng: 77.6242 },
        image: "https://res.cloudinary.com/demo/image/upload/dog.jpg",
    },
    {
        issueType: "LOW: Litter accumulation around street-side bin",
        location: { lat: 13.0312, lng: 77.5898 },
        image: "https://res.cloudinary.com/demo/image/upload/flower.jpg",
    },
    {
        issueType: "HIGH: Wet waste leak causing road blockage",
        location: { lat: 12.8422, lng: 77.6754 },
        image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    },
];

const demoUsers = [
    {
        name: "Demo Citizen",
        email: "citizen@swachh.city",
        password: "user123",
        phone: 9876543210,
        gender: "Other",
        address: "Bengaluru Urban",
        city: "Bengaluru",
        pincode: "560001",
    },
    {
        name: "Asha N",
        email: "asha@swachh.city",
        password: "user123",
        phone: 9981122334,
        gender: "Female",
        address: "Indiranagar, Bengaluru",
        city: "Bengaluru",
        pincode: "560038",
    },
    {
        name: "Rohit K",
        email: "rohit@swachh.city",
        password: "user123",
        phone: 9900112233,
        gender: "Male",
        address: "Whitefield, Bengaluru",
        city: "Bengaluru",
        pincode: "560066",
    },
    {
        name: "Meera S",
        email: "meera@swachh.city",
        password: "user123",
        phone: 9911223344,
        gender: "Female",
        address: "Jayanagar, Bengaluru",
        city: "Bengaluru",
        pincode: "560041",
    },
];

const demoDrivers = [
    {
        name: "Manjunath R",
        email: "manjunath.driver@swachh.city",
        password: "driver123",
        phone: "9000000001",
        gender: "Male",
        licenseNumber: "DL-BLR-001-2026",
        age: 32,
        startDate: new Date("2023-01-10"),
    },
    {
        name: "Shalini P",
        email: "shalini.driver@swachh.city",
        password: "driver123",
        phone: "9000000002",
        gender: "Female",
        licenseNumber: "DL-BLR-002-2026",
        age: 30,
        startDate: new Date("2022-07-05"),
    },
    {
        name: "Imran K",
        email: "imran.driver@swachh.city",
        password: "driver123",
        phone: "9000000003",
        gender: "Male",
        licenseNumber: "DL-BLR-003-2026",
        age: 35,
        startDate: new Date("2021-09-17"),
    },
    {
        name: "Naveen S",
        email: "naveen.driver@swachh.city",
        password: "driver123",
        phone: "9000000004",
        gender: "Male",
        licenseNumber: "DL-BLR-004-2026",
        age: 29,
        startDate: new Date("2024-02-22"),
    },
];

async function seed() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is missing in backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    await Promise.all([
        Collection.deleteMany({}),
        TruckLocation.deleteMany({}),
        Complaint.deleteMany({}),
        Bin.deleteMany({}),
        Truck.deleteMany({}),
        Driver.deleteMany({}),
    ]);

    const seededUsers = [];
    for (const userSeed of demoUsers) {
        const hashedPassword = await bcrypt.hash(userSeed.password, 10);
        const user = await User.findOneAndUpdate(
            { email: userSeed.email },
            {
                name: userSeed.name,
                email: userSeed.email,
                password: hashedPassword,
                phone: userSeed.phone,
                gender: userSeed.gender,
                address: userSeed.address,
                city: userSeed.city,
                pincode: userSeed.pincode,
                role: "citizen",
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        );
        seededUsers.push(user);
    }

    const seededDrivers = [];
    for (const driverSeed of demoDrivers) {
        const hashedPassword = await bcrypt.hash(driverSeed.password, 10);
        const driver = await Driver.findOneAndUpdate(
            { email: driverSeed.email },
            {
                name: driverSeed.name,
                email: driverSeed.email,
                password: hashedPassword,
                phone: driverSeed.phone,
                gender: driverSeed.gender,
                licenseNumber: driverSeed.licenseNumber,
                age: driverSeed.age,
                startDate: driverSeed.startDate,
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        );
        seededDrivers.push(driver);
    }

    const trucks = await Truck.insertMany(
        truckSeeds.map((truck, index) => ({
            ...truck,
            driver: seededDrivers[index % seededDrivers.length]?._id,
            createdAt: new Date(now - (index + 1) * 60 * 60 * 1000),
            updatedAt: new Date(now - index * 45 * 60 * 1000),
        })),
    );

    await Promise.all(
        seededDrivers.map((driver, index) =>
            Driver.findByIdAndUpdate(driver._id, {
                truck: trucks[index % trucks.length]._id,
            }),
        ),
    );

    const bins = await Bin.insertMany(
        bengaluruBins.map((bin, index) => {
            const fillLevel = Math.round((bin.currentLoad / bin.capacity) * 100);
            return {
                ...bin,
                fillLevel,
                status: deriveBinStatus(fillLevel),
                assignedTruck: trucks[index % trucks.length]._id,
                lastCollectedAt: new Date(now - (index + 2) * 2 * 60 * 60 * 1000),
                lastUpdatedAt: new Date(now - index * 20 * 60 * 1000),
                createdAt: new Date(now - (index + 4) * 24 * 60 * 60 * 1000),
                updatedAt: new Date(now - index * 20 * 60 * 1000),
            };
        }),
    );

    await TruckLocation.insertMany(
        trucks.flatMap((truck, idx) => {
            const baseLat = truck.currentLocation?.lat ?? 12.9716;
            const baseLng = truck.currentLocation?.lng ?? 77.5946;
            return [0, 1, 2].map((step) => ({
                truck: truck._id,
                location: {
                    lat: Number((baseLat + step * 0.0012).toFixed(6)),
                    lng: Number((baseLng + step * 0.0015).toFixed(6)),
                },
                createdAt: new Date(now - (idx + step + 1) * 25 * 60 * 1000),
                updatedAt: new Date(now - (idx + step + 1) * 25 * 60 * 1000),
            }));
        }),
    );

    await Collection.insertMany(
        bins.slice(0, 6).map((bin, idx) => ({
            bin: bin._id,
            truck: trucks[idx % trucks.length]._id,
            collectedAmount: Math.max(15, Math.round(bin.currentLoad * 0.35)),
            location: bin.location,
            type: "COLLECTION",
            collectedAt: new Date(now - (idx + 1) * 75 * 60 * 1000),
            createdAt: new Date(now - (idx + 1) * 75 * 60 * 1000),
            updatedAt: new Date(now - (idx + 1) * 75 * 60 * 1000),
        })),
    );

    await Complaint.insertMany(
        complaintTemplates.map((complaint, idx) => ({
            ...complaint,
            user: seededUsers[idx % seededUsers.length]._id,
            createdAt: new Date(now - (idx + 1) * 40 * 60 * 1000),
            updatedAt: new Date(now - (idx + 1) * 35 * 60 * 1000),
        })),
    );

    console.log("Seed completed successfully");
    console.log(`Users: ${seededUsers.length}`);
    console.log(`Drivers: ${seededDrivers.length}`);
    console.log(`Bins: ${bins.length}`);
    console.log(`Trucks: ${trucks.length}`);
    console.log(`Complaints: ${complaintTemplates.length}`);
    console.log("Demo citizen login: citizen@swachh.city / user123");
    console.log("Additional citizens: asha@swachh.city, rohit@swachh.city, meera@swachh.city (password: user123)");
    console.log("Demo admin login: admin@swachh.city / admin123");
    console.log("Driver logins (password: driver123):");
    console.log("- manjunath.driver@swachh.city");
    console.log("- shalini.driver@swachh.city");
    console.log("- imran.driver@swachh.city");
    console.log("- naveen.driver@swachh.city");

    await mongoose.disconnect();
}

seed()
    .then(() => process.exit(0))
    .catch(async (error) => {
        console.error("Seed failed:", error.message);
        await mongoose.disconnect().catch(() => undefined);
        process.exit(1);
    });
