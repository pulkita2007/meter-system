// controllers/costEfficiencyController.js
const Energy = require("../models/EnergyReading"); // adjust path if your energy model has another name

// @desc    Get cost and efficiency analysis
// @route   GET /api/cost-efficiency
// @access  Public or Private (depends on your setup)
const getCostEfficiency = async (req, res) => {
  try {
    // You can replace this with real data from Energy collection
    // For now we’ll mock it based on sample readings
    const costData = [
      { period: "2025-11-01", amount: 320.45 },
      { period: "2025-11-02", amount: 290.3 },
      { period: "2025-11-03", amount: 305.9 },
    ];

    const efficiencyData = [
      { metric: "usage", value: 93 },
      { metric: "savings", value: 7 },
    ];

    res.json({
      success: true,
      costData,
      efficiencyData,
    });
  } catch (error) {
    console.error("Cost efficiency error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cost efficiency data",
    });
  }
};

module.exports = { getCostEfficiency };
