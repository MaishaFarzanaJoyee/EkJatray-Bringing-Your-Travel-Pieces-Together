import LocalDiscoveryItem from "./localDiscovery.model.js";

const normalizeText = (value = "") => value.toString().trim().toLowerCase();
const normalizeString = (value = "") => value.toString().trim();

const parseNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = normalizeText(value);
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  if (value === undefined) return fallback;
  return Boolean(value);
};

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => item.toString().trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const mapItem = (item, source = "database") => ({
  id: item._id?.toString() || item.id,
  type: item.type,
  destination: item.destination,
  name: item.name,
  provider: item.provider,
  category: item.category,
  shortDescription: item.shortDescription || "",
  price: Number(item.price || 0),
  pricingUnit: item.pricingUnit || "",
  durationHours: Number(item.durationHours || 0),
  capacity: Number(item.capacity || 1),
  pickupLocation: item.pickupLocation || "",
  contactPhone: item.contactPhone || "",
  features: Array.isArray(item.features) ? item.features : [],
  languages: Array.isArray(item.languages) ? item.languages : [],
  verified: Boolean(item.verified),
  available: Boolean(item.available),
  priority: Number(item.priority || 0),
  source,
});

function matchesItem(item, { destination = "", type = "", category = "", search = "", maxPrice = "" }) {
  const destinationOk = !destination || normalizeText(item.destination) === normalizeText(destination);
  const typeOk = !type || type === "all" || normalizeText(item.type) === normalizeText(type);
  const categoryOk = !category || category === "all" || normalizeText(item.category).includes(normalizeText(category));
  const maxPriceValue = parseNumber(maxPrice);
  const priceOk = maxPriceValue === null || Number(item.price || 0) <= maxPriceValue;

  if (!destinationOk || !typeOk || !categoryOk || !priceOk) {
    return false;
  }

  const normalizedSearch = normalizeText(search);
  if (!normalizedSearch) {
    return true;
  }

  return [
    item.name,
    item.provider,
    item.category,
    item.shortDescription,
    item.pickupLocation,
    ...(item.features || []),
  ].some((value) => normalizeText(value).includes(normalizedSearch));
}

function sortItems(a, b) {
  return (b.priority || 0) - (a.priority || 0) || a.price - b.price || a.name.localeCompare(b.name);
}

export const getLocalDiscoveryItems = async (req, res) => {
  try {
    const { destination = "", type = "", category = "", search = "", maxPrice = "" } = req.query;
    const mongoQuery = {};

    if (destination) mongoQuery.destination = destination;
    if (type && type !== "all") mongoQuery.type = type;

    const maxPriceValue = parseNumber(maxPrice);
    if (maxPriceValue !== null) {
      mongoQuery.price = { $lte: maxPriceValue };
    }

    const databaseItems = await LocalDiscoveryItem.find(mongoQuery).sort({ priority: -1, price: 1, name: 1 });
    const mappedDatabaseItems = databaseItems.map((item) => mapItem(item, "database"));
    const filteredDatabaseItems = mappedDatabaseItems.filter((item) =>
      matchesItem(item, { destination, type, category, search, maxPrice })
    );

    const items = [...filteredDatabaseItems].sort(sortItems);
    return res.json({ items, meta: { total: items.length, destination: destination || "All", type: type || "all" } });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load rentals and experiences right now", error: error.message });
  }
};

export const createLocalDiscoveryItem = async (req, res) => {
  try {
    const payload = {
      type: normalizeString(req.body.type),
      destination: normalizeString(req.body.destination),
      name: normalizeString(req.body.name),
      provider: normalizeString(req.body.provider),
      category: normalizeString(req.body.category),
      shortDescription: normalizeString(req.body.shortDescription),
      price: parseNumber(req.body.price, 0),
      pricingUnit: normalizeString(req.body.pricingUnit),
      durationHours: parseNumber(req.body.durationHours, 0),
      capacity: parseNumber(req.body.capacity, 1),
      pickupLocation: normalizeString(req.body.pickupLocation),
      contactPhone: normalizeString(req.body.contactPhone),
      features: normalizeList(req.body.features),
      languages: normalizeList(req.body.languages),
      verified: parseBoolean(req.body.verified, true),
      available: parseBoolean(req.body.available, true),
      priority: Math.min(100, Math.max(1, parseNumber(req.body.priority, 50))),
    };

    if (!payload.type || !payload.destination || !payload.name || !payload.provider || !payload.category) {
      return res.status(400).json({ message: "Type, destination, name, provider, and category are required" });
    }

    const item = await LocalDiscoveryItem.create(payload);
    return res.status(201).json({ message: "Local discovery item created successfully", item: mapItem(item) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create local discovery item", error: error.message });
  }
};

export const updateLocalDiscoveryItem = async (req, res) => {
  try {
    const existingItem = await LocalDiscoveryItem.findById(req.params.itemId);
    if (!existingItem) {
      return res.status(404).json({ message: "Local discovery item not found" });
    }

    const updates = { ...req.body };
    if (updates.type !== undefined) updates.type = normalizeString(updates.type);
    if (updates.destination !== undefined) updates.destination = normalizeString(updates.destination);
    if (updates.name !== undefined) updates.name = normalizeString(updates.name);
    if (updates.provider !== undefined) updates.provider = normalizeString(updates.provider);
    if (updates.category !== undefined) updates.category = normalizeString(updates.category);
    if (updates.shortDescription !== undefined) updates.shortDescription = normalizeString(updates.shortDescription);
    if (updates.pricingUnit !== undefined) updates.pricingUnit = normalizeString(updates.pricingUnit);
    if (updates.pickupLocation !== undefined) updates.pickupLocation = normalizeString(updates.pickupLocation);
    if (updates.contactPhone !== undefined) updates.contactPhone = normalizeString(updates.contactPhone);
    if (updates.features !== undefined) updates.features = normalizeList(updates.features);
    if (updates.languages !== undefined) updates.languages = normalizeList(updates.languages);
    if (updates.price !== undefined) updates.price = parseNumber(updates.price, existingItem.price);
    if (updates.durationHours !== undefined) updates.durationHours = parseNumber(updates.durationHours, existingItem.durationHours);
    if (updates.capacity !== undefined) updates.capacity = parseNumber(updates.capacity, existingItem.capacity);
    if (updates.priority !== undefined) updates.priority = Math.min(100, Math.max(1, parseNumber(updates.priority, existingItem.priority)));
    if (updates.verified !== undefined) updates.verified = parseBoolean(updates.verified, existingItem.verified);
    if (updates.available !== undefined) updates.available = parseBoolean(updates.available, existingItem.available);

    const item = await LocalDiscoveryItem.findByIdAndUpdate(req.params.itemId, updates, {
      new: true,
      runValidators: true,
    });

    return res.json({ message: "Local discovery item updated successfully", item: mapItem(item) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update local discovery item", error: error.message });
  }
};

export const deleteLocalDiscoveryItem = async (req, res) => {
  try {
    const item = await LocalDiscoveryItem.findByIdAndDelete(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Local discovery item not found" });
    }

    return res.json({ message: "Local discovery item deleted successfully", itemId: item._id });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete local discovery item", error: error.message });
  }
};
