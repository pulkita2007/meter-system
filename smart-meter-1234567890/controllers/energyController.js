const { validationResult } = require("express-validator");
const EnergyReading = require("../models/EnergyReading");
const Device = require("../models/Device");
const Alert = require("../models/Alert");
const { sendEnergyAlert } = require("../utils/notificationService");
const User = require("../models/User");

// ✅ Add energy reading
// const addEnergyReading = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         errors: errors.array(),
//       });
//     }

//     const { deviceId, current, voltage, temperature } = req.body;

//     const device = await Device.findOne({ deviceId });
//     if (!device) {
//       return res.status(404).json({
//         success: false,
//         message: "Device not found",
//       });
//     }

//     const power = current * voltage;

//     const energyReading = await EnergyReading.create({
//       deviceId,
//       current,
//       voltage,
//       temperature,
//       power,
//       userId: device.userId,
//     });

//     await checkForPowerSpike(deviceId, power, device.userId);

//     res.status(201).json({
//       success: true,
//       energyReading,
//     });
//   } catch (error) {
//     console.error("Add energy reading error:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

const addEnergyReading = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { deviceId, current, voltage, temperature } = req.body;

    let device = await Device.findOne({ deviceId });
    if (!device) {
      // ✅ Auto-create a placeholder device if not found
      device = await Device.create({
        deviceId,
    deviceName: `ESP Device ${deviceId}`,
    location: "Auto-created by ESP32",
    powerRating: 1000, // default 1000W
    userId: "6906f2494abbdf0af4d92240", // ⚠️ replace with a valid user _id from your DB
    status: "off"
      });
      console.log(`ℹ️ Auto-created new device: ${deviceId}`);
    }

    const power = current * voltage;

    const energyReading = await EnergyReading.create({
      deviceId,
      current,
      voltage,
      temperature,
      power,
      userId: device.userId || null,
    });
    await device.save({ validateBeforeSave: false });
  console.log(`ℹ️ Auto-created new device: ${deviceId}`);

    await checkForPowerSpike(deviceId, power, device.userId);

    res.status(201).json({
      success: true,
      energyReading,
    });
  } catch (error) {
    console.error("Add energy reading error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ✅ Get readings for a device
const getEnergyReadings = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 100, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const readings = await EnergyReading.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await EnergyReading.countDocuments({ deviceId });

    res.json({
      success: true,
      count: readings.length,
      total,
      readings,
    });
  } catch (error) {
    console.error("Get energy readings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const checkForPowerSpike = async (deviceId, currentPower, userId) => {
  try {
    const recentReadings = await EnergyReading.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(10);

    if (recentReadings.length >= 5) {
      const averagePower =
        recentReadings.reduce((sum, r) => sum + r.power, 0) /
        recentReadings.length;
      const threshold = averagePower * 1.5;

      if (currentPower > threshold) {
        const alert = await Alert.create({
          userId,
          deviceId,
          message: `Power spike detected! Current power: ${currentPower.toFixed(
            2
          )}W (avg: ${averagePower.toFixed(2)}W)`,
          alertType: "power_spike",
          severity: "high",
          metadata: { currentPower, averagePower, threshold },
        });

        const user = await User.findById(userId);
        if (user && (user.email || user.fcmToken)) {
          try {
            await sendEnergyAlert({
              email: user.email,
              fcmToken: user.fcmToken,
              deviceName: deviceId,
              alertType: "Power Spike",
              message: alert.message,
              energyData: { currentPower, averagePower, threshold },
            });
          } catch (err) {
            console.error("Notification error:", err.message);
          }
        }
      }
    }
  } catch (error) {
    console.error("Power spike check error:", error.message);
  }
};

/**
 * GET /api/energy/trends
 * Query params (optional):
 *  - deviceId  (string) : filter by device
 *  - period    (string) : '7d' | '30d' | '24h' (default '7d')
 *  - groupBy   (string) : 'day' | 'hour' (default 'day')
 *
 * Returns aggregated consumption (avg power) grouped by day/hour for the requested period.
 */


// const getEnergyTrends = async (req, res) => {
//   try {
//     const { deviceId, period = "1h", groupBy = "minute" } = req.query;

//     // determine start date
//     let startDate = new Date();
//     if (period === "24h") startDate.setHours(startDate.getHours() - 24);
//     else if (period === "7d") startDate.setDate(startDate.getDate() - 7);
//     else if (period === "30d") startDate.setDate(startDate.getDate() - 30);

//     else startDate.setHours(startDate.getHours() - 1); // default 1 hour

//     // Build match stage
//     const match = { timestamp: { $gte: startDate } };
//     if (deviceId) match.deviceId = deviceId;

//     // Choose grouping expression
//      const groupId = {
//       year: { $year: "$timestamp" },
//       month: { $month: "$timestamp" },
//       day: { $dayOfMonth: "$timestamp" },
//       hour: { $hour: "$timestamp" },
//       minute: { $minute: "$timestamp" },
//     };
//     // } else {
//     //   // group by day (default)
//     //   groupId = {
//     //     year: { $year: "$timestamp" },
//     //     month: { $month: "$timestamp" },
//     //     day: { $dayOfMonth: "$timestamp" },
//     //   };
//     // }

//     const pipeline = [
//       { $match: match },
//       {
//         $group: {
//           _id: groupId,
//           avgPower: { $avg: "$power" },
//           maxPower: { $max: "$power" },
//           minPower: { $min: "$power" },
//           count: { $sum: 1 },
//         },
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
//     ];

//     const agg = await EnergyReading.aggregate(pipeline).allowDiskUse(true);

//     // Convert _id to readable label
//    const trends = agg.map((item) => {
//       const id = item._id;
//       const label = `${id.year}-${String(id.month).padStart(2, "0")}-${String(
//         id.day
//       ).padStart(2, "0")} ${String(id.hour).padStart(2, "0")}:${String(
//         id.minute
//       ).padStart(2, "0")}`;

//       return {
//         label,
//         avgPower: Number(item.avgPower.toFixed(2)),
//         maxPower: Number(item.maxPower.toFixed(2)),
//         minPower: Number(item.minPower.toFixed(2)),
//         count: item.count,
//       };
//     });

//     const formattedTrends = trends.map((t) => ({
//   title: `Trend for ${t.label}`,
//   value: `${t.avgPower} W`,
//   change: "+5%",
//   changeType: "up",
//   color: "#00d4ff",
//   data: [
//     {
//       label: t.label,
//       avgPower: t.avgPower,
//       maxPower: t.maxPower,
//       minPower: t.minPower,
//       count: t.count,
//     },
//   ],
// }));

// return res.json({ success: true, trends: formattedTrends });

//     // return res.json({ success: true, trends });
//   } catch (err) {
//     console.error("getEnergyTrends error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// const getEnergyTrends = async (req, res) => {
//   try {
//     const { deviceId, period = "1h", groupBy = "minute" } = req.query;

//     // Determine start date
//     let startDate = new Date();
//     if (period === "24h") startDate.setHours(startDate.getHours() - 24);
//     else if (period === "7d") startDate.setDate(startDate.getDate() - 7);
//     else if (period === "30d") startDate.setDate(startDate.getDate() - 30);
//     else startDate.setHours(startDate.getHours() - 1); // default 1 hour

//     // Match stage

//     const match = { timestamp: { $gte: startDate } };
//     if (deviceId) match.deviceId = deviceId;

//     // Group by minute instead of hour/day
//     const groupId = {
//       year: { $year: "$timestamp" },
//       month: { $month: "$timestamp" },
//       day: { $dayOfMonth: "$timestamp" },
//       hour: { $hour: "$timestamp" },
//       minute: { $minute: "$timestamp" },
//     };

//     const pipeline = [
//       { $match: match },
//       {
//         $group: {
//           _id: groupId,
//           avgPower: { $avg: "$power" },
//           maxPower: { $max: "$power" },
//           minPower: { $min: "$power" },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $sort: {
//           "_id.year": 1,
//           "_id.month": 1,
//           "_id.day": 1,
//           "_id.hour": 1,
//           "_id.minute": 1,
//         },
//       },
//     ];

//     const agg = await EnergyReading.aggregate(pipeline).allowDiskUse(true);

//     // Format output
//     const trends = agg.map((item) => {
//       const id = item._id;
//       const label = `${id.year}-${String(id.month).padStart(2, "0")}-${String(
//         id.day
//       ).padStart(2, "0")} ${String(id.hour).padStart(2, "0")}:${String(
//         id.minute
//       ).padStart(2, "0")}`;

//       return {
//         label,
//         avgPower: Number(item.avgPower.toFixed(2)),
//         maxPower: Number(item.maxPower.toFixed(2)),
//         minPower: Number(item.minPower.toFixed(2)),
//         count: item.count,
//       };
//     });

//     // Format for frontend
//     const formattedTrends = [
//       {
//         title: `Trend for ${new Date().toISOString().split("T")[0]}`,
//         value: `${trends.length ? trends[trends.length - 1].avgPower : 0} W`,
//         change: "+5%",
//         changeType: "up",
//         color: "#00d4ff",
//         data: trends,
//       },
//     ];

//     res.json({ success: true, trends: formattedTrends });
//   } catch (error) {
//     console.error("Error in getEnergyTrends:", error);
//     res.status(500).json({ success: false, error: "Server Error" });
//   }
// };

const getEnergyTrends = async (req, res) => {
  try {
    const { deviceId, period = "7d", groupBy = "hour" } = req.query;

    // Determine start date based on period
    let startDate = new Date();
    if (period === "24h") startDate.setHours(startDate.getHours() - 24);
    else if (period === "7d") startDate.setDate(startDate.getDate() - 7);
    else if (period === "30d") startDate.setDate(startDate.getDate() - 30);
    else startDate.setHours(startDate.getHours() - 1); // default 1 hour

    // ✅ Check whether your model uses timestamp or createdAt
    const dateField = EnergyReading.schema.path("timestamp")
      ? "timestamp"
      : "createdAt";

    const match = { [dateField]: { $gte: startDate } };
    if (deviceId) match.deviceId = deviceId;

    console.log("🔍 Aggregation match filter:", match);

    // ✅ Dynamically group based on `groupBy`
    let groupId;
    if (groupBy === "minute") {
      groupId = {
        year: { $year: `$${dateField}` },
        month: { $month: `$${dateField}` },
        day: { $dayOfMonth: `$${dateField}` },
        hour: { $hour: `$${dateField}` },
        minute: { $minute: `$${dateField}` },
      };
    } else if (groupBy === "hour") {
      groupId = {
        year: { $year: `$${dateField}` },
        month: { $month: `$${dateField}` },
        day: { $dayOfMonth: `$${dateField}` },
        hour: { $hour: `$${dateField}` },
      };
    } else {
      groupId = {
        year: { $year: `$${dateField}` },
        month: { $month: `$${dateField}` },
        day: { $dayOfMonth: `$${dateField}` },
      };
    }

    // ✅ Aggregation pipeline
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: groupId,
          avgPower: { $avg: "$power" },
          maxPower: { $max: "$power" },
          minPower: { $min: "$power" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
          "_id.hour": 1,
        },
      },
    ];

    const agg = await EnergyReading.aggregate(pipeline).allowDiskUse(true);
    console.log(`📊 Aggregated ${agg.length} data points`);

    if (agg.length === 0) {
      return res.json({
        success: true,
        trends: [
          {
            title: `Trend for ${new Date().toISOString().split("T")[0]}`,
            value: "0 W",
            change: "0%",
            changeType: "neutral",
            color: "#ccc",
            data: [],
          },
        ],
      });
    }

    // ✅ Format data
    const trends = agg.map((item) => {
      const id = item._id;
      const labelParts = [
        id.year,
        String(id.month).padStart(2, "0"),
        String(id.day).padStart(2, "0"),
      ];
      if (id.hour !== undefined)
        labelParts.push(String(id.hour).padStart(2, "0"));
      if (id.minute !== undefined)
        labelParts.push(String(id.minute).padStart(2, "0"));

      const label = labelParts.join("-");

      return {
        label,
        avgPower: Number(item.avgPower.toFixed(2)),
        maxPower: Number(item.maxPower.toFixed(2)),
        minPower: Number(item.minPower.toFixed(2)),
        count: item.count,
      };
    });

    // ✅ Frontend format
    const latest = trends[trends.length - 1];
    const formattedTrends = [
      {
        title: `Trend for ${new Date().toISOString().split("T")[0]}`,
        value: `${latest.avgPower} W`,
        change: "+5%",
        changeType: "up",
        color: "#00d4ff",
        data: trends,
      },
    ];

    return res.json({ success: true, trends: formattedTrends });
  } catch (error) {
    console.error("❌ Error in getEnergyTrends:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};


/**
 * GET /api/energy/history
 * Query params:
 *  - deviceId (required) : which device's readings
 *  - limit (optional) : number of points, default 100
 *  - since (optional ISO date) : only records after this date
 *
 * Returns recent readings for charting (time-series).
 */
const getEnergyHistory = async (req, res) => {
  try {
    const { deviceId, limit = 100, since } = req.query;
    if (!deviceId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required param: deviceId" });
    }

    const filter = { deviceId };
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate)) filter.timestamp = { $gte: sinceDate };
    }

    const readings = await EnergyReading.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    // Convert to ascending order for charts (old -> new)
    const history = readings
      .map((r) => ({
        time: r.timestamp,
        power: r.power,
        voltage: r.voltage,
        current: r.current,
        temperature: r.temperature,
      }))
      .reverse();

    return res.json({ success: true, history });
  } catch (err) {
    console.error("getEnergyHistory error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/energy/insights
 * Query params:
 *  - deviceId (optional)
 *
 * Returns a small set of computed insights (e.g., week-over-week change).
 */
const getEnergyInsights = async (req, res) => {
  try {
    const { deviceId } = req.query;

    const now = new Date();
    const last7Start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const prev7Start = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
    const prev7End = last7Start;

    const baseMatchLast = { timestamp: { $gte: last7Start } };
    const baseMatchPrev = { timestamp: { $gte: prev7Start, $lt: prev7End } };
    if (deviceId) {
      baseMatchLast.deviceId = deviceId;
      baseMatchPrev.deviceId = deviceId;
    }

    const lastAgg = await EnergyReading.aggregate([
      { $match: baseMatchLast },
      { $group: { _id: null, avgPower: { $avg: "$power" }, totalEnergy: { $sum: "$power" } } },
    ]);

    const prevAgg = await EnergyReading.aggregate([
      { $match: baseMatchPrev },
      { $group: { _id: null, avgPower: { $avg: "$power" }, totalEnergy: { $sum: "$power" } } },
    ]);

    const lastAvg = lastAgg[0]?.avgPower || 0;
    const prevAvg = prevAgg[0]?.avgPower || 0;

    let changePercent = null;
    if (prevAvg > 0) {
      changePercent = ((lastAvg - prevAvg) / prevAvg) * 100;
    }

    const insights = [
      {
        title: "Average Power (last 7 days)",
        value: Number(lastAvg.toFixed(2)),
        unit: "W",
      },
      {
        title: "Week-over-week change",
        value: changePercent === null ? "N/A" : `${changePercent.toFixed(2)}%`,
      },
      {
        title: "Top recommendation",
        value:
          changePercent && changePercent > 10
            ? "Consider load shifting to off-peak hours"
            : "Usage stable - no major recommendations",
      },
    ];

    return res.json({ success: true, insights });
  } catch (err) {
    console.error("getEnergyInsights error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Export all controllers properly
module.exports = {
  addEnergyReading,
  getEnergyReadings,
  getEnergyTrends,
  getEnergyHistory,
  getEnergyInsights,
};



