import Truck from "../models/truckModel.js";
import TruckLocation from "../models/truckLocationModel.js";

import Truck from "../models/truckModel.js";


export const createTruck = async (req, res) => {
  try {
    const {
      driverName,
      regNo,
      type,
      totalCapacity,
      currentLocation
    } = req.body;

    if (!driverName || !regNo || !totalCapacity) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const exists = await Truck.findOne({ regNo });
    if (exists) {
      return res.status(400).json({ message: "Truck already exists with this regNo" });
    }

    const truck = await Truck.create({
      driverName,
      regNo,
      type,
      totalCapacity,
      usedCapacity: 0,
      currentLocation
    });

    res.status(201).json({
      message: "Truck created successfully",
      data: truck
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const getTrucks = async (req, res) => {
  try {
    const trucks = await Truck.find().sort({ createdAt: -1 });

    res.json({
      count: trucks.length,
      data: trucks
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTruckById = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id) .populate("route", "binId area landmark");

    if (!truck) {
      return res.status(404).json({ message: "Truck not found" });
    }

    res.json(truck);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTruck = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);

    if (!truck) {
      return res.status(404).json({ message: "Truck not found" });
    }

    const {
      driverName,
      type,
      totalCapacity,
      usedCapacity,
      status,
      currentLocation
    } = req.body;

    if (driverName) truck.driverName = driverName;
    if (type) truck.type = type;
    if (totalCapacity) truck.totalCapacity = totalCapacity;
    if (status) truck.status = status;
    if (currentLocation) truck.currentLocation = currentLocation;

    if (usedCapacity !== undefined) {
      if (usedCapacity > truck.totalCapacity) {
        return res.status(400).json({
          message: "Used capacity cannot exceed total capacity"
        });
      }
      truck.usedCapacity = usedCapacity;
    }

    const updatedTruck = await truck.save();

    res.json({
      message: "Truck updated successfully",
      data: updatedTruck
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTruckLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    const truck = await Truck.findByIdAndUpdate(
      req.params.id,
      { currentLocation: { lat, lng } },
      { new: true }
    );

    await TruckLocation.create({
      truck: truck._id,
      location: { lat, lng }
    });

    res.json(truck);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getTruckHistory = async (req, res) => {
  const history = await TruckLocation.find({ truck: req.params.id })
    .sort({ createdAt: -1 });

  res.json(history);
};

export const emptyTruck = async (req, res) => {
  const truck = await Truck.findById(req.params.id);

  const emptiedLoad = truck.usedCapacity;

  truck.usedCapacity = 0;
  truck.status = "IDLE";

  await truck.save();

  await Collection.create({
    truck: truck._id,
    collectedAmount: emptiedLoad,
    type: "TRUCK_EMPTY"
  });

  res.json({ message: "Truck emptied successfully" });
};

export const getTruckHistoryByDate = async (req, res) => {
  try {
    const { date } = req.query; // format: YYYY-MM-DD

    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const history = await Collection.find({
      truck: req.params.id,
      createdAt: { $gte: start, $lt: end }
    })
      .populate("bin", "binId area")
      .sort({ createdAt: -1 });

    res.json({
      date,
      totalEvents: history.length,
      data: history
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const assignRoute = async (req, res) => {
  try {
    const { binIds } = req.body;

    const truck = await Truck.findById(req.params.id);

    if (!truck) {
      return res.status(404).json({ message: "Truck not found" });
    }

    truck.route = binIds;

    await truck.save();

    res.json({
      message: "Route assigned successfully",
      route: truck.route
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};