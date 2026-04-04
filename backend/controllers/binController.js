import Bin from "../models/binModel.js";
import Collection from "../models/collectionModel.js";
import Truck from "../models/truckModel.js";

export const createBin = async (req, res) => {
  try {
    const {
      binId,
      location,
      landmark,
      address,
      area,
      capacity
    } = req.body;

    if (!binId || !capacity) {
      return res.status(400).json({ message: "binId and capacity are required" });
    }

    const exists = await Bin.findOne({ binId });
    if (exists) {
      return res.status(400).json({ message: "Bin already exists" });
    }

    const bin = await Bin.create({
      binId,
      location,
      landmark,
      address,
      area,
      capacity,
      currentLoad: 0,
      fillLevel: 0,
      status: "EMPTY",
      lastUpdatedAt: new Date()
    });

    res.status(201).json({
      message: "Bin created successfully",
      data: bin
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const getBins = async (req, res) => {
  try {
    const bins = await Bin.find()
      .populate("assignedTruck", "driverName regNo")
      .sort({ createdAt: -1 });

    res.json({
      count: bins.length,
      data: bins
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const getBinById = async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id)
      .populate("assignedTruck");

    if (!bin) {
      return res.status(404).json({ message: "Bin not found" });
    }

    res.json(bin);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBin = async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id);

    if (!bin) {
      return res.status(404).json({ message: "Bin not found" });
    }

    const {
      fillLevel,
      currentLoad,
      capacity,
      location,
      landmark,
      address,
      area,
      assignedTruck
    } = req.body;

    if (location) bin.location = location;
    if (landmark) bin.landmark = landmark;
    if (address) bin.address = address;
    if (area) bin.area = area;
    if (assignedTruck) bin.assignedTruck = assignedTruck;

    if (capacity) bin.capacity = capacity;

    if (fillLevel !== undefined) {
      bin.fillLevel = fillLevel;

      if (fillLevel > 70) bin.status = "FULL";
      else if (fillLevel > 30) bin.status = "MEDIUM";
      else bin.status = "EMPTY";
    }

    if (currentLoad !== undefined) {
      if (currentLoad > bin.capacity) {
        return res.status(400).json({
          message: "Current load cannot exceed capacity"
        });
      }

      bin.currentLoad = currentLoad;

      bin.fillLevel = Math.round((currentLoad / bin.capacity) * 100);

      if (bin.fillLevel > 70) bin.status = "FULL";
      else if (bin.fillLevel > 30) bin.status = "MEDIUM";
      else bin.status = "EMPTY";
    }

    bin.lastUpdatedAt = new Date();

    const updatedBin = await bin.save();

    res.json({
      message: "Bin updated successfully",
      data: updatedBin
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const collectBin = async (req, res) => {
  try {
    const { truckId } = req.body;

    const bin = await Bin.findById(req.params.id);
    const truck = await Truck.findById(truckId);

    if (!bin || !truck) {
      return res.status(404).json({ message: "Bin or Truck not found" });
    }

    const waste = bin.currentLoad;

    if (waste === 0) {
      return res.status(400).json({ message: "Bin already empty" });
    }

    if (truck.usedCapacity + waste > truck.totalCapacity) {
      return res.status(400).json({
        message: "Truck does not have enough capacity"
      });
    }

    truck.usedCapacity += waste;
    truck.status = truck.usedCapacity >= truck.totalCapacity ? "BUSY" : "IDLE";
    await truck.save();

    bin.currentLoad = 0;
    bin.fillLevel = 0;
    bin.status = "EMPTY";
    bin.lastCollectedAt = new Date();
    await bin.save();

    await Collection.create({
      bin: bin._id,
      truck: truck._id,
      collectedAmount: waste,
      location: bin.location
    });

    res.json({
      message: "Garbage collected successfully",
      truckLoad: truck.usedCapacity,
      binStatus: bin.status
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCollectionHistory = async (req, res) => {
  const history = await Collection.find()
    .populate("bin", "binId area")
    .populate("truck", "regNo driverName")
    .sort({ createdAt: -1 });

  res.json(history);
};