import SafetyContact from "./safety.model.js";

const normalizeText = (value = "") => value.toString().trim().toLowerCase();
const normalizeString = (value = "") => value.toString().trim();

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => item.toString().trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = normalizeText(value);
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  if (value === undefined) {
    return fallback;
  }

  return Boolean(value);
};

const parsePriority = (value, fallback = 50) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(100, Math.max(1, parsed));
};

const normalizePhoneLink = (value = "") => value.toString().replace(/[^\d+]/g, "");

const mapContact = (contact, source = "database") => ({
  id: contact._id?.toString() || contact.id,
  destination: contact.destination,
  category: contact.category,
  name: contact.name,
  organization: contact.organization || "",
  phone: contact.phone,
  alternatePhone: contact.alternatePhone || "",
  whatsapp: contact.whatsapp || "",
  address: contact.address || "",
  notes: contact.notes || "",
  languages: Array.isArray(contact.languages) ? contact.languages : [],
  verified: Boolean(contact.verified),
  available24Hours: Boolean(contact.available24Hours),
  supportsSos: Boolean(contact.supportsSos),
  supportsInquiry: Boolean(contact.supportsInquiry),
  priority: Number(contact.priority || 0),
  source,
  phoneLink: normalizePhoneLink(contact.phone),
  alternatePhoneLink: normalizePhoneLink(contact.alternatePhone || ""),
  whatsappLink: normalizePhoneLink(contact.whatsapp || ""),
});

function sortContacts(a, b) {
  return (b.priority || 0) - (a.priority || 0) || a.name.localeCompare(b.name);
}

function matchContact(contact, destination, category, search) {
  const normalizedDestination = normalizeText(destination);
  const normalizedCategory = normalizeText(category);
  const normalizedSearch = normalizeText(search);

  const destinationMatch =
    !normalizedDestination ||
    normalizeText(contact.destination) === normalizedDestination ||
    normalizeText(contact.destination) === "all";

  const categoryMatch = !normalizedCategory || normalizeText(contact.category) === normalizedCategory;

  if (!destinationMatch || !categoryMatch) {
    return false;
  }

  if (!normalizedSearch) {
    return true;
  }

  return [
    contact.name,
    contact.organization,
    contact.address,
    contact.notes,
    ...(Array.isArray(contact.languages) ? contact.languages : []),
  ].some((value) => normalizeText(value).includes(normalizedSearch));
}

export const getSafetyContacts = async (req, res) => {
  try {
    const { destination = "", category = "", search = "" } = req.query;

    const mongoQuery = {};
    if (destination) {
      mongoQuery.destination = destination;
    }
    if (category && category !== "all") {
      mongoQuery.category = category;
    }

    const databaseContacts = await SafetyContact.find(mongoQuery).sort({ priority: -1, name: 1 });
    const mappedDatabaseContacts = databaseContacts.map((contact) => mapContact(contact, "database"));

    const filteredDatabaseContacts = mappedDatabaseContacts.filter((contact) =>
      matchContact(contact, destination, category === "all" ? "" : category, search)
    );

    const contacts = [...filteredDatabaseContacts].sort(sortContacts);

    return res.json({
      contacts,
      meta: {
        destination: destination || "All",
        category: category || "all",
        total: contacts.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load safety contacts right now", error: error.message });
  }
};

export const createSafetyContact = async (req, res) => {
  try {
    const {
      destination,
      category,
      name,
      organization,
      phone,
      alternatePhone,
      whatsapp,
      address,
      notes,
      languages,
      verified,
      available24Hours,
      supportsSos,
      supportsInquiry,
      priority,
    } = req.body;

    const normalizedDestination = normalizeString(destination);
    const normalizedCategory = normalizeString(category);
    const normalizedName = normalizeString(name);
    const normalizedPhone = normalizeString(phone);

    if (!normalizedDestination || !normalizedCategory || !normalizedName || !normalizedPhone) {
      return res.status(400).json({ message: "Destination, category, name, and phone are required" });
    }

    const contact = await SafetyContact.create({
      destination: normalizedDestination,
      category: normalizedCategory,
      name: normalizedName,
      organization: normalizeString(organization),
      phone: normalizedPhone,
      alternatePhone: normalizeString(alternatePhone),
      whatsapp: normalizeString(whatsapp),
      address: normalizeString(address),
      notes: normalizeString(notes),
      languages: normalizeList(languages),
      verified: parseBoolean(verified, true),
      available24Hours: parseBoolean(available24Hours, false),
      supportsSos: parseBoolean(supportsSos, false),
      supportsInquiry: parseBoolean(supportsInquiry, true),
      priority: parsePriority(priority, 50),
    });

    return res.status(201).json({ message: "Safety contact created successfully", contact: mapContact(contact) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create safety contact", error: error.message });
  }
};

export const updateSafetyContact = async (req, res) => {
  try {
    const updates = { ...req.body };
    const existingContact = await SafetyContact.findById(req.params.contactId);

    if (!existingContact) {
      return res.status(404).json({ message: "Safety contact not found" });
    }

    if (updates.destination !== undefined) updates.destination = normalizeString(updates.destination);
    if (updates.category !== undefined) updates.category = normalizeString(updates.category);
    if (updates.name !== undefined) updates.name = normalizeString(updates.name);
    if (updates.organization !== undefined) updates.organization = normalizeString(updates.organization);
    if (updates.phone !== undefined) updates.phone = normalizeString(updates.phone);
    if (updates.alternatePhone !== undefined) updates.alternatePhone = normalizeString(updates.alternatePhone);
    if (updates.whatsapp !== undefined) updates.whatsapp = normalizeString(updates.whatsapp);
    if (updates.address !== undefined) updates.address = normalizeString(updates.address);
    if (updates.notes !== undefined) updates.notes = normalizeString(updates.notes);
    if (updates.languages !== undefined) updates.languages = normalizeList(updates.languages);
    if (updates.priority !== undefined) updates.priority = parsePriority(updates.priority, existingContact.priority);
    if (updates.verified !== undefined) updates.verified = parseBoolean(updates.verified, existingContact.verified);
    if (updates.available24Hours !== undefined) updates.available24Hours = parseBoolean(updates.available24Hours, existingContact.available24Hours);
    if (updates.supportsSos !== undefined) updates.supportsSos = parseBoolean(updates.supportsSos, existingContact.supportsSos);
    if (updates.supportsInquiry !== undefined) updates.supportsInquiry = parseBoolean(updates.supportsInquiry, existingContact.supportsInquiry);

    const contact = await SafetyContact.findByIdAndUpdate(req.params.contactId, updates, {
      new: true,
      runValidators: true,
    });

    return res.json({ message: "Safety contact updated successfully", contact: mapContact(contact) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update safety contact", error: error.message });
  }
};

export const deleteSafetyContact = async (req, res) => {
  try {
    const contact = await SafetyContact.findByIdAndDelete(req.params.contactId);

    if (!contact) {
      return res.status(404).json({ message: "Safety contact not found" });
    }

    return res.json({ message: "Safety contact deleted successfully", contactId: contact._id });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete safety contact", error: error.message });
  }
};
