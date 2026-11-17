
const parseNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const cleaned = String(value).replace(/[$,\s]/g, "");
  const number = Number(cleaned);

  return Number.isFinite(number) ? Math.round(number) : null;
};

const parseBoolean = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();

  return ["yes", "true", "1", "y"].includes(normalized);
};

const splitList = (value) => {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parsePhotoDate = (value) => {
  if (!value) return null;

  // Capital One format: MM/DD/YYYY HH:mm
  const match = String(value).trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/
  );

  if (!match) return null;

  const [, month, day, year, hour = "0", minute = "0"] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  if (Number.isNaN(date.getTime())) return null;

  return date;
};

const mapDealer = (row) => ({
  id: parseNumber(row["DealerID"]),
  name: String(row["Dealer Name"] || "").trim(),
  address: String(row["Address"] || "").trim() || null,
  city: String(row["City"] || "").trim() || null,
  state: String(row["state"] || "").trim() || null,
  zip: String(row["Zip"] || "").trim() || null,
  phone: String(row["Phone"] || "").trim() || null,
});

const mapVehicle = (row, dealerId) => {
  const vin = String(row["VIN"] || "").trim().toUpperCase();

  const year = parseNumber(row["Year"]);
  const make = String(row["make"] || row["Make"] || "").trim();
  const model = String(row["Model"] || "").trim();

  if (!vin || !year || !make || !model) {
    throw new Error(`Missing required vehicle information. VIN: ${vin || "Missing"}`);
  }

  if (vin.length !== 17) {
    throw new Error(`Invalid VIN length for ${vin}`);
  }

  return {
    vin,
    dealerId,

    stockNumber: String(row["Stock Number"] || "").trim() || null,

    year,
    make,
    model,
    trim: String(row["Trim"] || "").trim() || null,

    odometer: parseNumber(row["Odometer"]),
    price: parseNumber(row["Price"]),

    exteriorColor: String(row["Exterior Color"] || "").trim() || null,
    interiorColor: String(row["Interior Color"] || "").trim() || null,
    transmission: String(row["Transmission"] || "").trim() || null,

    bodyStyle: String(row["Style"] || "").trim() || null,
    condition: String(row["Condition"] || "").trim() || null,
    certified: parseBoolean(row["Certified Pre-Owned"]),

    // These fields are not supplied as separate columns
    // in the current Capital One CSV.
    engine: null,
    driveTrain: null,
    fuelType: null,
    carfaxUrl: null,

    description: String(row["WebAdDescription"] || "").trim() || null,

    // Empty photos are valid. Do not reject the vehicle.
    photos: splitList(row["PhotoURLs"]),

    equipment: splitList(row["EquipmentCode"]),

    photosUpdatedAt: parsePhotoDate(row["LatestPhotoModifiedDate"]),

    vdpUrl: String(row["VdpURL"] || "").trim() || null,

    isActive: true,
    lastSeenAt: new Date(),
  };
};

module.exports = {
  mapDealer,
  mapVehicle,
};
