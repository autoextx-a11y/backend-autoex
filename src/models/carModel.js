const prisma = require('../config/prisma');

const buildWhere = (f) => {
  const where = {};
  if (f.make) where.make = { equals: f.make, mode: 'insensitive' };
  if (f.model) where.model = { equals: f.model, mode: 'insensitive' };
  if (f.bodyStyle) where.bodyStyle = { equals: f.bodyStyle, mode: 'insensitive' };
  if (f.fuelType) where.fuelType = { equals: f.fuelType, mode: 'insensitive' };
  if (f.year) where.year = Number(f.year);
  if (f.minPrice || f.maxPrice) {
    where.price = {};
    if (f.minPrice) where.price.gte = Number(f.minPrice);
    if (f.maxPrice) where.price.lte = Number(f.maxPrice);
  }
  return where;
};

exports.findAll = async (filters, page, limit) => {
  const where = buildWhere(filters);
  const [cars, total] = await Promise.all([
    prisma.car.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.car.count({ where }),
  ]);
  return { cars, total };
};

exports.findById = (id) => prisma.car.findUnique({ where: { id } });

// Insert new cars or update existing ones (matched by vin)
exports.upsertCar = (car) =>
  prisma.car.upsert({
    where: { vin: car.vin },
    update: car,
    create: car,
  });