import Truck from "../models/truckModel.js";

export const createTruck = async (req, res) => {
  const truck = await Truck.create(req.body);
  res.status(201).json(truck);
};

export const getTrucks = async (req, res) => {
  const trucks = await Truck.find();
  res.json(trucks);
};

export const updateTruckLocation = async (req, res) => {
  const { lat, lng } = req.body;

  const truck = await Truck.findByIdAndUpdate(
    req.params.id,
    { currentLocation: { lat, lng } },
    { new: true }
  );

  res.json(truck);
};