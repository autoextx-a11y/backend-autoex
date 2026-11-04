const carModel = require('../models/carModel');

// 1) DUMMY API: pretend this is the response from the real API.
//    Later, replace the body with a real fetch() call.
const fetchCarsFromApi = async () => {
  return [
    { vin: '1HGCM82633A000001', year: 2022, make: 'Toyota', model: 'Camry', trim: 'XSE',
      interior_color: 'Black', exterior_color: 'White', engine: '2.5L 4-Cyl',
      transmission: 'Automatic', drivetrain: 'FWD', body_style: 'Sedan', fuel_type: 'Gasoline',
      carfax_url: 'https://www.carfax.com/vehicle/1HGCM82633A000001', price: 26500 },
    { vin: '1HGCM82633A000002', year: 2021, make: 'Honda', model: 'CR-V', trim: 'EX-L',
      interior_color: 'Gray', exterior_color: 'Blue', engine: '1.5L Turbo',
      transmission: 'CVT', drivetrain: 'AWD', body_style: 'SUV', fuel_type: 'Gasoline',
      carfax_url: 'https://www.carfax.com/vehicle/1HGCM82633A000002', price: 28900 },
    { vin: '1HGCM82633A000003', year: 2023, make: 'Ford', model: 'F-150', trim: 'Lariat',
      interior_color: 'Brown', exterior_color: 'Red', engine: '3.5L V6 EcoBoost',
      transmission: '10-Speed Automatic', drivetrain: '4WD', body_style: 'Truck', fuel_type: 'Gasoline',
      carfax_url: null, price: 52400 },
    { vin: '1HGCM82633A000004', year: 2023, make: 'Tesla', model: 'Model 3', trim: 'Long Range',
      interior_color: 'White', exterior_color: 'Black', engine: 'Dual Motor Electric',
      transmission: 'Single-Speed', drivetrain: 'AWD', body_style: 'Sedan', fuel_type: 'Electric',
      carfax_url: 'https://www.carfax.com/vehicle/1HGCM82633A000004', price: 41990 },
    { vin: '1HGCM82633A000005', year: 2020, make: 'BMW', model: 'X5', trim: 'xDrive40i',
      interior_color: 'Tan', exterior_color: 'Gray', engine: '3.0L I6 Turbo',
      transmission: '8-Speed Automatic', drivetrain: 'AWD', body_style: 'SUV', fuel_type: 'Gasoline',
      carfax_url: 'https://www.carfax.com/vehicle/1HGCM82633A000005', price: 47800 },
  ];
};

// 2) MAPPER: converts API field names to your DB field names.
//    When the real API arrives, you only edit this function.
const mapApiCarToDb = (c) => ({
  vin: c.vin,
  year: Number(c.year),
  make: c.make,
  model: c.model,
  trim: c.trim ?? null,
  interiorColor: c.interior_color ?? null,
  exteriorColor: c.exterior_color ?? null,
  engine: c.engine ?? null,
  transmission: c.transmission ?? null,
  driveTrain: c.drivetrain ?? null,
  bodyStyle: c.body_style ?? null,
  fuelType: c.fuel_type ?? null,
  carfaxUrl: c.carfax_url ?? null,
  price: Math.round(Number(c.price)),
});

// 3) SYNC: fetch, map, save
exports.syncCars = async () => {
  const apiCars = await fetchCarsFromApi();
  let count = 0;
  for (const apiCar of apiCars) {
    await carModel.upsertCar(mapApiCarToDb(apiCar));
    count++;
  }
  return count;
};