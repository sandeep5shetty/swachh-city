import Bin from "../models/binModel.js";

export const createBin = async (req, res) => {
  const bin = await Bin.create(req.body);
  res.status(201).json(bin);
};

export const getBins = async (req, res) => {
  const bins = await Bin.find();
  res.json(bins);
};

export const updateBin = async (req, res) => {
  const { fillLevel } = req.body;

  let status = "EMPTY";
  if (fillLevel > 70) status = "FULL";
  else if (fillLevel > 30) status = "MEDIUM";

  const bin = await Bin.findByIdAndUpdate(
    req.params.id,
    { fillLevel, status },
    { new: true }
  );

  res.json(bin);
};