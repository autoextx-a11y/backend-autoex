const carModel = require('../models/carModel');
const { syncCars } = require('../services/carSyncService');

exports.getCars = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const { make, model, year, bodyStyle, fuelType, minPrice, maxPrice } = req.query;

    const { cars, total } = await carModel.findAll(
      { make, model, year, bodyStyle, fuelType, minPrice, maxPrice }, page, limit
    );

    res.json({
      data: cars,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

exports.getCarById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid car id' });

    const car = await carModel.findById(id);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json(car);
  } catch (err) { next(err); }
};

// Manual trigger to re-run the sync (protect this before going live)
exports.syncFromApi = async (req, res, next) => {
  try {
    const count = await syncCars();
    res.json({ message: `Synced ${count} cars` });
  } catch (err) { next(err); }
};