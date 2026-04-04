import Collection from "../models/collectionModel.js";
import Bin from "../models/binModel.js";
import Truck from "../models/truckModel.js";
import Complaint from "../models/complaintModel.js";

export const getDashboardStats = async (req, res) => {
    try {
        const totalBins = await Bin.countDocuments();

        const activeBins = await Bin.countDocuments({
            status: { $ne: "INACTIVE" }
        });

        const inactiveBins = await Bin.countDocuments({
            status: "INACTIVE"
        });

        const criticalBins = await Bin.countDocuments({
            status: "FULL"
        });

        const onlinePercentage = totalBins > 0
            ? Math.round((activeBins / totalBins) * 100)
            : 0;
        const totalTrucks = await Truck.countDocuments();

        const activeTrucks = await Truck.countDocuments({
            status: "BUSY"
        });

        const unresolvedReports = await Complaint.countDocuments({
            status: { $in: ["PENDING", "IN_PROGRESS"] }
        });

        const systemOnline = totalBins > 0 ? "100% Online" : "Offline";

        res.json({
            bins: {
                total: totalBins,
                active: activeBins,
                inactive: inactiveBins,
                critical: criticalBins,
                onlinePercentage: `${onlinePercentage}%`
              },

            trucks: {
                active: activeTrucks,
                total: totalTrucks
            },

            complaints: {
                unresolved: unresolvedReports
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCollectionStats = async (req, res) => {
  try {
    const totalWaste = await Collection.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$collectedAmount" }
        }
      }
    ]);

    res.json({
      totalWaste: totalWaste[0]?.total || 0
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getTodayStats = async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const binsCollected = await Collection.countDocuments({
        createdAt: { $gte: today }
      });
  
      const complaintsToday = await Complaint.countDocuments({
        createdAt: { $gte: today }
      });
  
      const activeTrucks = await Truck.countDocuments({
        status: "BUSY"
      });
  
      res.json({
        binsCollected,
        complaintsToday,
        activeTrucks
      });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };