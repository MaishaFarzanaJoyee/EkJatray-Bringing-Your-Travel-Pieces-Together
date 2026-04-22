import { useEffect, useState } from "react";
import { getMyProfile } from "../services/authService";
import {
  createAdminDestination,
  deleteAdminDestination,
  deleteAdminReview,
  getAdminAnalytics,
  getAdminDestinations,
  getAdminReviews,
  getAdminUsers,
  updateAdminDestination,
  updateUserModeration,
} from "../services/adminService";
import {
  createLocalDiscoveryItem,
  deleteLocalDiscoveryItem,
  searchLocalDiscoveryItems,
  updateLocalDiscoveryItem,
} from "../services/localDiscoveryService";
import {
  createSafetyContact,
  deleteSafetyContact,
  searchSafetyContacts,
  updateSafetyContact,
} from "../services/safetyService";
import {
  createTransportTicket,
  deleteTransportTicket,
  searchTransportTickets,
  updateTransportTicket,
} from "../services/transportService";
import { bangladeshDistricts } from "../utils/bangladeshDistricts";

const safetyCategoryOptions = [
  { value: "tourist-police", label: "Tourist police" },
  { value: "hospital", label: "Hospital" },
  { value: "guide", label: "Registered guide" },
  { value: "general-emergency", label: "Emergency hotline" },
  { value: "transport-help", label: "Transport help" },
  { value: "embassy", label: "Embassy support" },
];
const discoveryTypeOptions = [
  { value: "vehicle-rental", label: "Vehicle rental" },
  { value: "local-experience", label: "Local workshop" },
];

function formatDuration(durationMinutes) {
  const totalMinutes = Number(durationMinutes);

  if (Number.isNaN(totalMinutes) || totalMinutes < 0) {
    return "N/A";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function AdminPage() {
  const [adminStatus, setAdminStatus] = useState("Checking admin permission...");
  const [isAllowed, setIsAllowed] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [listMessage, setListMessage] = useState("No tickets loaded.");
  const [editingTicketId, setEditingTicketId] = useState("");
  const [contacts, setContacts] = useState([]);
  const [contactMessage, setContactMessage] = useState("No safety contacts loaded.");
  const [editingContactId, setEditingContactId] = useState("");
  const [discoveryItems, setDiscoveryItems] = useState([]);
  const [discoveryMessage, setDiscoveryMessage] = useState("No rentals or workshops loaded.");
  const [editingDiscoveryItemId, setEditingDiscoveryItemId] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersMessage, setUsersMessage] = useState("No users loaded.");
  const [moderationReviews, setModerationReviews] = useState([]);
  const [moderationMessage, setModerationMessage] = useState("No reviews loaded.");
  const [destinations, setDestinations] = useState([]);
  const [destinationMessage, setDestinationMessage] = useState("No tour spots loaded.");
  const [editingDestinationId, setEditingDestinationId] = useState("");

  const [form, setForm] = useState({
    mode: "flight",
    title: "",
    operator: "",
    origin: "",
    destination: "",
    travelDate: "",
    departureTime: "",
    arrivalTime: "",
    price: "",
    seatTypes: "",
    seatsAvailable: "",
  });
  const [contactForm, setContactForm] = useState({
    destination: "Cox's Bazar",
    category: "tourist-police",
    name: "",
    organization: "",
    phone: "",
    alternatePhone: "",
    whatsapp: "",
    address: "",
    languages: "",
    notes: "",
    priority: "50",
    verified: true,
    available24Hours: false,
    supportsSos: true,
    supportsInquiry: true,
  });
  const [discoveryForm, setDiscoveryForm] = useState({
    type: "vehicle-rental",
    destination: "Cox's Bazar",
    name: "",
    provider: "",
    category: "",
    shortDescription: "",
    price: "",
    pricingUnit: "",
    durationHours: "",
    capacity: "1",
    pickupLocation: "",
    contactPhone: "",
    features: "",
    languages: "",
    priority: "50",
    verified: true,
    available: true,
  });
  const [destinationForm, setDestinationForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    cost: "",
    tags: "",
    lat: "",
    lng: "",
  });

  function getTicketPayloadFromForm() {
    return {
      mode: form.mode,
      title: form.title.trim(),
      operator: form.operator.trim(),
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      travelDate: form.travelDate,
      departureTime: form.departureTime,
      arrivalTime: form.arrivalTime,
      price: Number(form.price),
      seatTypes: form.seatTypes
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      seatsAvailable: Number(form.seatsAvailable),
    };
  }

  function resetTicketForm() {
    setEditingTicketId("");
    setForm({
      mode: "flight",
      title: "",
      operator: "",
      origin: "",
      destination: "",
      travelDate: "",
      departureTime: "",
      arrivalTime: "",
      price: "",
      seatTypes: "",
      seatsAvailable: "",
    });
  }

  function getContactPayloadFromForm() {
    const parsedPriority = Number(contactForm.priority);

    return {
      destination: contactForm.destination.trim(),
      category: contactForm.category,
      name: contactForm.name.trim(),
      organization: contactForm.organization.trim(),
      phone: contactForm.phone.trim(),
      alternatePhone: contactForm.alternatePhone.trim(),
      whatsapp: contactForm.whatsapp.trim(),
      address: contactForm.address.trim(),
      languages: contactForm.languages
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      notes: contactForm.notes.trim(),
      priority: Number.isNaN(parsedPriority) ? 50 : parsedPriority,
      verified: contactForm.verified,
      available24Hours: contactForm.available24Hours,
      supportsSos: contactForm.supportsSos,
      supportsInquiry: contactForm.supportsInquiry,
    };
  }

  function resetContactForm() {
    setEditingContactId("");
    setContactForm({
      destination: "Cox's Bazar",
      category: "tourist-police",
      name: "",
      organization: "",
      phone: "",
      alternatePhone: "",
      whatsapp: "",
      address: "",
      languages: "",
      notes: "",
      priority: "50",
      verified: true,
      available24Hours: false,
      supportsSos: true,
      supportsInquiry: true,
    });
  }

  function getDiscoveryPayloadFromForm() {
    return {
      type: discoveryForm.type,
      destination: discoveryForm.destination.trim(),
      name: discoveryForm.name.trim(),
      provider: discoveryForm.provider.trim(),
      category: discoveryForm.category.trim(),
      shortDescription: discoveryForm.shortDescription.trim(),
      price: Number(discoveryForm.price),
      pricingUnit: discoveryForm.pricingUnit.trim(),
      durationHours: Number(discoveryForm.durationHours || 0),
      capacity: Number(discoveryForm.capacity || 1),
      pickupLocation: discoveryForm.pickupLocation.trim(),
      contactPhone: discoveryForm.contactPhone.trim(),
      features: discoveryForm.features.split(",").map((x) => x.trim()).filter(Boolean),
      languages: discoveryForm.languages.split(",").map((x) => x.trim()).filter(Boolean),
      priority: Number(discoveryForm.priority || 50),
      verified: discoveryForm.verified,
      available: discoveryForm.available,
    };
  }

  function resetDiscoveryForm() {
    setEditingDiscoveryItemId("");
    setDiscoveryForm({
      type: "vehicle-rental",
      destination: "Cox's Bazar",
      name: "",
      provider: "",
      category: "",
      shortDescription: "",
      price: "",
      pricingUnit: "",
      durationHours: "",
      capacity: "1",
      pickupLocation: "",
      contactPhone: "",
      features: "",
      languages: "",
      priority: "50",
      verified: true,
      available: true,
    });
  }

  function getDestinationPayloadFromForm() {
    return {
      name: destinationForm.name.trim(),
      description: destinationForm.description.trim(),
      imageUrl: destinationForm.imageUrl.trim(),
      cost: Number(destinationForm.cost || 0),
      tags: destinationForm.tags.split(",").map((x) => x.trim()).filter(Boolean),
      coordinates: {
        lat: Number(destinationForm.lat || 0),
        lng: Number(destinationForm.lng || 0),
      },
    };
  }

  function resetDestinationForm() {
    setEditingDestinationId("");
    setDestinationForm({
      name: "",
      description: "",
      imageUrl: "",
      cost: "",
      tags: "",
      lat: "",
      lng: "",
    });
  }

  function fillTicketForm(ticket) {
    setEditingTicketId(ticket._id);
    setForm({
      mode: ticket.mode || "flight",
      title: ticket.title || "",
      operator: ticket.operator || "",
      origin: ticket.origin || "",
      destination: ticket.destination || "",
      travelDate: ticket.travelDate || "",
      departureTime: ticket.departureTime || "",
      arrivalTime: ticket.arrivalTime || "",
      price: ticket.price || "",
      seatTypes: (ticket.seatTypes || []).join(", "),
      seatsAvailable: ticket.seatsAvailable ?? "",
    });
  }

  function fillContactForm(contact) {
    setEditingContactId(contact.id || contact._id);
    setContactForm({
      destination: contact.destination || "Cox's Bazar",
      category: contact.category || "tourist-police",
      name: contact.name || "",
      organization: contact.organization || "",
      phone: contact.phone || "",
      alternatePhone: contact.alternatePhone || "",
      whatsapp: contact.whatsapp || "",
      address: contact.address || "",
      languages: (contact.languages || []).join(", "),
      notes: contact.notes || "",
      priority: String(contact.priority ?? 50),
      verified: Boolean(contact.verified),
      available24Hours: Boolean(contact.available24Hours),
      supportsSos: Boolean(contact.supportsSos),
      supportsInquiry: Boolean(contact.supportsInquiry),
    });
  }

  function fillDiscoveryForm(item) {
    setEditingDiscoveryItemId(item.id || item._id);
    setDiscoveryForm({
      type: item.type || "vehicle-rental",
      destination: item.destination || "Cox's Bazar",
      name: item.name || "",
      provider: item.provider || "",
      category: item.category || "",
      shortDescription: item.shortDescription || "",
      price: String(item.price ?? ""),
      pricingUnit: item.pricingUnit || "",
      durationHours: String(item.durationHours ?? ""),
      capacity: String(item.capacity ?? 1),
      pickupLocation: item.pickupLocation || "",
      contactPhone: item.contactPhone || "",
      features: (item.features || []).join(", "),
      languages: (item.languages || []).join(", "),
      priority: String(item.priority ?? 50),
      verified: Boolean(item.verified),
      available: Boolean(item.available),
    });
  }

  function fillDestinationForm(destination) {
    setEditingDestinationId(destination.id || destination._id);
    setDestinationForm({
      name: destination.name || "",
      description: destination.description || "",
      imageUrl: destination.imageUrl || "",
      cost: String(destination.cost ?? ""),
      tags: (destination.tags || []).join(", "),
      lat: String(destination.coordinates?.lat ?? ""),
      lng: String(destination.coordinates?.lng ?? ""),
    });
  }

  async function verifyAdminAccess() {
    try {
      const result = await getMyProfile();

      if (result.user.role !== "admin") {
        setAdminStatus("You are logged in, but this account does not have admin permission.");
        setIsAllowed(false);
        return;
      }

      setAdminStatus(`Welcome ${result.user.name}. You can manage tickets, safety contacts, rentals, and workshops here.`);
      setIsAllowed(true);
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || "Unable to connect to the server.");
      setIsAllowed(false);
    }
  }

  async function loadTicketList() {
    setListMessage("Loading tickets...");

    try {
      const result = await searchTransportTickets();

      const nextTickets = Array.isArray(result.tickets) ? result.tickets : [];
      setTickets(nextTickets);

      if (nextTickets.length === 0) {
        setListMessage("No transport tickets found. Create one from the form.");
      } else {
        setListMessage("");
      }
    } catch (error) {
      setTickets([]);
      setListMessage(error?.response?.data?.message || error?.response?.data?.error || "Unable to load tickets.");
    }
  }

  async function loadContactList() {
    setContactMessage("Loading safety contacts...");

    try {
      const result = await searchSafetyContacts();
      const nextContacts = Array.isArray(result.contacts) ? result.contacts.filter((item) => item.source !== "fallback") : [];
      setContacts(nextContacts);

      if (nextContacts.length === 0) {
        setContactMessage("No custom safety contacts found. Add one from the form.");
      } else {
        setContactMessage("");
      }
    } catch (error) {
      setContacts([]);
      setContactMessage(error?.response?.data?.message || error?.response?.data?.error || "Unable to load safety contacts.");
    }
  }

  async function loadDiscoveryItems() {
    setDiscoveryMessage("Loading rentals and workshops...");

    try {
      const result = await searchLocalDiscoveryItems();
      const nextItems = Array.isArray(result.items) ? result.items.filter((item) => item.source !== "fallback") : [];
      setDiscoveryItems(nextItems);

      if (nextItems.length === 0) {
        setDiscoveryMessage("No custom rentals or workshops found. Add one from the form.");
      } else {
        setDiscoveryMessage("");
      }
    } catch (error) {
      setDiscoveryItems([]);
      setDiscoveryMessage(error?.response?.data?.message || error?.response?.data?.error || "Unable to load rentals and workshops.");
    }
  }

  async function loadAnalytics() {
    try {
      const result = await getAdminAnalytics();
      setAnalytics(result.analytics || null);
    } catch {
      setAnalytics(null);
    }
  }

  async function loadUsers() {
    setUsersMessage("Loading users...");
    try {
      const result = await getAdminUsers();
      const nextUsers = Array.isArray(result.users) ? result.users : [];
      setUsers(nextUsers);
      setUsersMessage(nextUsers.length ? "" : "No users found.");
    } catch (error) {
      setUsers([]);
      setUsersMessage(error?.response?.data?.message || "Unable to load users.");
    }
  }

  async function loadModerationReviews() {
    setModerationMessage("Loading reviews...");
    try {
      const result = await getAdminReviews();
      const nextReviews = Array.isArray(result.reviews) ? result.reviews : [];
      setModerationReviews(nextReviews);
      setModerationMessage(nextReviews.length ? "" : "No reviews found.");
    } catch (error) {
      setModerationReviews([]);
      setModerationMessage(error?.response?.data?.message || "Unable to load moderation reviews.");
    }
  }

  async function loadDestinations() {
    setDestinationMessage("Loading tour spots...");
    try {
      const result = await getAdminDestinations();
      const nextDestinations = Array.isArray(result.destinations) ? result.destinations : [];
      setDestinations(nextDestinations);
      setDestinationMessage(nextDestinations.length ? "" : "No tour spots found.");
    } catch (error) {
      setDestinations([]);
      setDestinationMessage(error?.response?.data?.message || "Unable to load tour spots.");
    }
  }

  async function deleteTicket(ticketId) {
    const ok = window.confirm("Delete this ticket?");
    if (!ok) {
      return;
    }

    try {
      await deleteTransportTicket(ticketId);
      setAdminStatus("Ticket deleted successfully.");
      if (editingTicketId === ticketId) {
        resetTicketForm();
      }
      loadTicketList();
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || error?.response?.data?.error || "Delete failed.");
    }
  }

  async function deleteContact(contactId) {
    const ok = window.confirm("Delete this safety contact?");
    if (!ok) {
      return;
    }

    try {
      await deleteSafetyContact(contactId);
      setAdminStatus("Safety contact deleted successfully.");
      if (editingContactId === contactId) {
        resetContactForm();
      }
      loadContactList();
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || error?.response?.data?.error || "Delete failed.");
    }
  }

  async function deleteDiscoveryItem(itemId) {
    const ok = window.confirm("Delete this rental or workshop?");
    if (!ok) {
      return;
    }

    try {
      await deleteLocalDiscoveryItem(itemId);
      setAdminStatus("Rental or workshop deleted successfully.");
      if (editingDiscoveryItemId === itemId) {
        resetDiscoveryForm();
      }
      loadDiscoveryItems();
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || error?.response?.data?.error || "Delete failed.");
    }
  }

  async function deleteDestination(destinationId) {
    const ok = window.confirm("Delete this tour spot?");
    if (!ok) {
      return;
    }

    try {
      await deleteAdminDestination(destinationId);
      setAdminStatus("Tour spot deleted successfully.");
      if (editingDestinationId === destinationId) {
        resetDestinationForm();
      }
      loadDestinations();
      loadAnalytics();
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || error?.response?.data?.error || "Delete failed.");
    }
  }

  async function removeModerationReview(reviewId) {
    const ok = window.confirm("Delete this review from the platform?");
    if (!ok) {
      return;
    }

    try {
      await deleteAdminReview(reviewId);
      setAdminStatus("Review removed successfully.");
      loadModerationReviews();
      loadAnalytics();
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || error?.response?.data?.error || "Delete failed.");
    }
  }

  async function toggleUserSuspension(user) {
    const shouldSuspend = !user.isSuspended;
    const reason = shouldSuspend ? window.prompt("Enter suspension reason", user.suspensionReason || "Policy violation") || "" : "";

    try {
      await updateUserModeration(user.id || user._id, {
        isSuspended: shouldSuspend,
        suspensionReason: reason,
      });
      setAdminStatus(shouldSuspend ? "User suspended successfully." : "User restored successfully.");
      loadUsers();
      loadAnalytics();
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || error?.response?.data?.error || "Unable to update user.");
    }
  }

  async function submitTicketForm(event) {
    event.preventDefault();

    const payload = getTicketPayloadFromForm();
    const isEdit = Boolean(editingTicketId);

    try {
      if (isEdit) {
        await updateTransportTicket(editingTicketId, payload);
      } else {
        await createTransportTicket(payload);
      }

      setAdminStatus(isEdit ? "Ticket updated successfully." : "Ticket created successfully.");
      resetTicketForm();
      loadTicketList();
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || error?.response?.data?.error || "Unable to connect to the server.");
    }
  }

  async function submitContactForm(event) {
    event.preventDefault();

    const payload = getContactPayloadFromForm();
    const isEdit = Boolean(editingContactId);

    try {
      if (isEdit) {
        await updateSafetyContact(editingContactId, payload);
      } else {
        await createSafetyContact(payload);
      }

      setAdminStatus(isEdit ? "Safety contact updated successfully." : "Safety contact created successfully.");
      resetContactForm();
      loadContactList();
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || error?.response?.data?.error || "Unable to connect to the server.");
    }
  }

  async function submitDiscoveryForm(event) {
    event.preventDefault();

    const payload = getDiscoveryPayloadFromForm();
    const isEdit = Boolean(editingDiscoveryItemId);

    try {
      if (isEdit) {
        await updateLocalDiscoveryItem(editingDiscoveryItemId, payload);
      } else {
        await createLocalDiscoveryItem(payload);
      }

      setAdminStatus(isEdit ? "Rental or workshop updated successfully." : "Rental or workshop created successfully.");
      resetDiscoveryForm();
      loadDiscoveryItems();
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || error?.response?.data?.error || "Unable to connect to the server.");
    }
  }

  async function submitDestinationForm(event) {
    event.preventDefault();

    const payload = getDestinationPayloadFromForm();
    const isEdit = Boolean(editingDestinationId);

    try {
      if (isEdit) {
        await updateAdminDestination(editingDestinationId, payload);
      } else {
        await createAdminDestination(payload);
      }

      setAdminStatus(isEdit ? "Tour spot updated successfully." : "Tour spot created successfully.");
      resetDestinationForm();
      loadDestinations();
      loadAnalytics();
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || error?.response?.data?.error || "Unable to connect to the server.");
    }
  }

  useEffect(() => {
    (async () => {
      await verifyAdminAccess();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAllowed) {
      loadAnalytics();
      loadTicketList();
      loadContactList();
      loadDiscoveryItems();
      loadUsers();
      loadModerationReviews();
      loadDestinations();
    }
  }, [isAllowed]);

  return (
    <main>
      <section className="section">
        <div className="section-title compact">
          <p className="sub-title">Admin</p>
          <h2>Operations, Management and Analytics</h2>
        </div>

        <div className="result-box">{adminStatus}</div>
      </section>

      {isAllowed && analytics && (
        <section className="section">
          <div className="card-grid">
            <article className="card">
              <h3>Total Checkouts</h3>
              <p><strong>{analytics.totalCheckouts || 0}</strong></p>
              <p>Completed itinerary checkouts across the platform.</p>
            </article>
            <article className="card">
              <h3>Total Revenue</h3>
              <p><strong>BDT {analytics.totalRevenue || 0}</strong></p>
              <p>Combined transport and local experience booking value.</p>
            </article>
            <article className="card">
              <h3>Total Booked Items</h3>
              <p><strong>{analytics.totalBookedItems || 0}</strong></p>
              <p>Transport, rentals, and workshops included in checkouts.</p>
            </article>
            <article className="card">
              <h3>Tour Spots</h3>
              <p><strong>{analytics.totalTourSpots || 0}</strong></p>
              <p>Predefined destination entries available for recommendations.</p>
            </article>
            <article className="card">
              <h3>Reviews</h3>
              <p><strong>{analytics.totalReviews || 0}</strong></p>
              <p>{analytics.hiddenReviews || 0} hidden or moderated review records.</p>
            </article>
            <article className="card">
              <h3>Account Moderation</h3>
              <p><strong>{analytics.suspendedUsers || 0}</strong></p>
              <p>Suspended user accounts out of {analytics.totalUsers || 0} total users.</p>
            </article>
          </div>
        </section>
      )}

      {isAllowed && (
        <section className="section">
          <div className="admin-panel-grid">
            <article className="card">
              <h3>{editingDestinationId ? "Edit Tour Spot" : "Create Tour Spot"}</h3>
              <form onSubmit={submitDestinationForm}>
                <label htmlFor="destination-name">Name</label>
                <input id="destination-name" type="text" required value={destinationForm.name} onChange={(event) => setDestinationForm((prev) => ({ ...prev, name: event.target.value }))} />

                <label htmlFor="destination-description">Description</label>
                <textarea id="destination-description" rows="4" value={destinationForm.description} onChange={(event) => setDestinationForm((prev) => ({ ...prev, description: event.target.value }))} />

                <label htmlFor="destination-image">Image URL</label>
                <input id="destination-image" type="text" value={destinationForm.imageUrl} onChange={(event) => setDestinationForm((prev) => ({ ...prev, imageUrl: event.target.value }))} />

                <label htmlFor="destination-cost">Estimated Cost</label>
                <input id="destination-cost" type="number" min="0" step="1" required value={destinationForm.cost} onChange={(event) => setDestinationForm((prev) => ({ ...prev, cost: event.target.value }))} />

                <label htmlFor="destination-tags">Tags (comma separated)</label>
                <input id="destination-tags" type="text" value={destinationForm.tags} onChange={(event) => setDestinationForm((prev) => ({ ...prev, tags: event.target.value }))} />

                <label htmlFor="destination-lat">Latitude</label>
                <input id="destination-lat" type="number" step="any" required value={destinationForm.lat} onChange={(event) => setDestinationForm((prev) => ({ ...prev, lat: event.target.value }))} />

                <label htmlFor="destination-lng">Longitude</label>
                <input id="destination-lng" type="number" step="any" required value={destinationForm.lng} onChange={(event) => setDestinationForm((prev) => ({ ...prev, lng: event.target.value }))} />

                <div className="button-row">
                  <button className="button-main" type="submit">{editingDestinationId ? "Update Tour Spot" : "Create Tour Spot"}</button>
                  {editingDestinationId && (
                    <button className="button-light" type="button" onClick={resetDestinationForm}>Cancel Edit</button>
                  )}
                </div>
              </form>
            </article>

            <article className="card">
              <h3>Tour Spots</h3>
              <button className="button-light" type="button" onClick={loadDestinations}>Refresh List</button>

              <div className="result-box">
                {destinationMessage && <p>{destinationMessage}</p>}

                {destinations.map((destination) => (
                  <div className="result-item admin-ticket-item" key={destination.id || destination._id}>
                    <p><strong>{destination.name}</strong></p>
                    <p>Cost: {destination.cost} | Tags: {(destination.tags || []).join(", ") || "None"}</p>
                    <p>Lat/Lng: {destination.coordinates?.lat}, {destination.coordinates?.lng}</p>
                    <div className="button-row">
                      <button className="button-light" type="button" onClick={() => fillDestinationForm(destination)}>Edit</button>
                      <button className="button-light" type="button" onClick={() => deleteDestination(destination.id || destination._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      {isAllowed && (
        <section className="section">
          <div className="admin-panel-grid">
            <article className="card">
              <h3>User Moderation</h3>
              <button className="button-light" type="button" onClick={loadUsers}>Refresh Users</button>

              <div className="result-box">
                {usersMessage && <p>{usersMessage}</p>}

                {users.map((user) => (
                  <div className="result-item admin-ticket-item" key={user.id || user._id}>
                    <p><strong>{user.name}</strong> ({user.role})</p>
                    <p>{user.email}</p>
                    <p>Status: {user.isSuspended ? `Suspended${user.suspensionReason ? ` - ${user.suspensionReason}` : ""}` : "Active"}</p>
                    {user.role !== "admin" && (
                      <div className="button-row">
                        <button className="button-light" type="button" onClick={() => toggleUserSuspension(user)}>
                          {user.isSuspended ? "Restore Account" : "Suspend Account"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>

            <article className="card">
              <h3>Review Moderation</h3>
              <button className="button-light" type="button" onClick={loadModerationReviews}>Refresh Reviews</button>

              <div className="result-box">
                {moderationMessage && <p>{moderationMessage}</p>}

                {moderationReviews.map((review) => (
                  <div className="result-item admin-ticket-item" key={review.id || review._id}>
                    <p><strong>{review.targetName}</strong> ({review.targetType})</p>
                    <p>By: {review.userName || review.userId} | Rating: {review.rating}</p>
                    <p>{review.reviewText}</p>
                    <div className="button-row">
                      <button className="button-light" type="button" onClick={() => removeModerationReview(review.id || review._id)}>
                        Delete Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      {isAllowed && (
        <section className="section">
          <div className="admin-panel-grid">
            <article className="card">
              <h3>{editingTicketId ? "Edit Transport Ticket" : "Create Transport Ticket"}</h3>
              <form onSubmit={submitTicketForm}>
                <label htmlFor="mode">Mode</label>
                <select id="mode" required value={form.mode} onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value }))}>
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="bus">Bus</option>
                </select>

                <label htmlFor="title">Title</label>
                <input id="title" type="text" placeholder="Dhaka to Sylhet Air Express" required value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />

                <label htmlFor="operator">Operator</label>
                <input id="operator" type="text" placeholder="SkyRoute" required value={form.operator} onChange={(event) => setForm((prev) => ({ ...prev, operator: event.target.value }))} />

                <label htmlFor="origin">Origin</label>
                <select id="origin" required value={form.origin} onChange={(event) => setForm((prev) => ({ ...prev, origin: event.target.value }))}>
                  <option value="">Select district</option>
                  {bangladeshDistricts.map((district) => (
                    <option value={district} key={`origin-${district}`}>{district}</option>
                  ))}
                </select>

                <label htmlFor="destination">Destination</label>
                <select id="destination" required value={form.destination} onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value }))}>
                  <option value="">Select district</option>
                  {bangladeshDistricts.map((district) => (
                    <option value={district} key={`dest-${district}`}>{district}</option>
                  ))}
                </select>

                <label htmlFor="travelDate">Travel Date</label>
                <input id="travelDate" type="date" required value={form.travelDate} onChange={(event) => setForm((prev) => ({ ...prev, travelDate: event.target.value }))} />

                <label htmlFor="departureTime">Departure Time</label>
                <input id="departureTime" type="time" required value={form.departureTime} onChange={(event) => setForm((prev) => ({ ...prev, departureTime: event.target.value }))} />

                <label htmlFor="arrivalTime">Arrival Time</label>
                <input id="arrivalTime" type="time" required value={form.arrivalTime} onChange={(event) => setForm((prev) => ({ ...prev, arrivalTime: event.target.value }))} />

                <label htmlFor="price">Price</label>
                <input id="price" type="number" min="0" step="1" required value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} />

                <label htmlFor="seatTypes">Seat Types (comma separated)</label>
                <input id="seatTypes" type="text" placeholder="Window, Aisle, Business" required value={form.seatTypes} onChange={(event) => setForm((prev) => ({ ...prev, seatTypes: event.target.value }))} />

                <label htmlFor="seatsAvailable">Seats Available</label>
                <input id="seatsAvailable" type="number" min="0" step="1" required value={form.seatsAvailable} onChange={(event) => setForm((prev) => ({ ...prev, seatsAvailable: event.target.value }))} />

                <div className="button-row">
                  <button className="button-main" type="submit">{editingTicketId ? "Update Ticket" : "Create Ticket"}</button>
                  {editingTicketId && (
                    <button className="button-light" type="button" onClick={resetTicketForm}>Cancel Edit</button>
                  )}
                </div>
              </form>
            </article>

            <article className="card">
              <h3>Transport Tickets</h3>
              <button className="button-light" type="button" onClick={loadTicketList}>Refresh List</button>

              <div className="result-box">
                {listMessage && <p>{listMessage}</p>}

                {tickets.map((ticket) => (
                  <div className="result-item admin-ticket-item" key={ticket._id}>
                    <p><strong>{ticket.title}</strong> ({ticket.mode})</p>
                    <p>{ticket.origin} -&gt; {ticket.destination} | {ticket.travelDate}</p>
                    <p>Price: {ticket.price} | Duration: {formatDuration(ticket.duration)} | Seats: {ticket.seatsAvailable}</p>
                    <div className="button-row">
                      <button className="button-light" type="button" onClick={() => fillTicketForm(ticket)}>Edit</button>
                      <button className="button-light" type="button" onClick={() => deleteTicket(ticket._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      {isAllowed && (
        <section className="section">
          <div className="admin-panel-grid">
            <article className="card">
              <h3>{editingContactId ? "Edit Safety Contact" : "Create Safety Contact"}</h3>
              <form onSubmit={submitContactForm}>
                <label htmlFor="contact-destination">Destination</label>
                <select id="contact-destination" required value={contactForm.destination} onChange={(event) => setContactForm((prev) => ({ ...prev, destination: event.target.value }))}>
                  {bangladeshDistricts.map((district) => (
                    <option value={district} key={`contact-destination-${district}`}>{district}</option>
                  ))}
                </select>

                <label htmlFor="contact-category">Category</label>
                <select id="contact-category" required value={contactForm.category} onChange={(event) => setContactForm((prev) => ({ ...prev, category: event.target.value }))}>
                  {safetyCategoryOptions.map((option) => (
                    <option value={option.value} key={`contact-category-${option.value}`}>{option.label}</option>
                  ))}
                </select>

                <label htmlFor="contact-name">Contact Name</label>
                <input id="contact-name" type="text" required value={contactForm.name} onChange={(event) => setContactForm((prev) => ({ ...prev, name: event.target.value }))} />

                <label htmlFor="contact-organization">Organization</label>
                <input id="contact-organization" type="text" value={contactForm.organization} onChange={(event) => setContactForm((prev) => ({ ...prev, organization: event.target.value }))} />

                <label htmlFor="contact-phone">Primary Phone</label>
                <input id="contact-phone" type="text" required value={contactForm.phone} onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))} />

                <label htmlFor="contact-alt-phone">Alternate Phone</label>
                <input id="contact-alt-phone" type="text" value={contactForm.alternatePhone} onChange={(event) => setContactForm((prev) => ({ ...prev, alternatePhone: event.target.value }))} />

                <label htmlFor="contact-whatsapp">WhatsApp</label>
                <input id="contact-whatsapp" type="text" value={contactForm.whatsapp} onChange={(event) => setContactForm((prev) => ({ ...prev, whatsapp: event.target.value }))} />

                <label htmlFor="contact-address">Address</label>
                <input id="contact-address" type="text" value={contactForm.address} onChange={(event) => setContactForm((prev) => ({ ...prev, address: event.target.value }))} />

                <label htmlFor="contact-languages">Languages (comma separated)</label>
                <input id="contact-languages" type="text" value={contactForm.languages} onChange={(event) => setContactForm((prev) => ({ ...prev, languages: event.target.value }))} />

                <label htmlFor="contact-priority">Priority</label>
                <input id="contact-priority" type="number" min="1" max="100" required value={contactForm.priority} onChange={(event) => setContactForm((prev) => ({ ...prev, priority: event.target.value }))} />

                <label htmlFor="contact-notes">Notes</label>
                <textarea id="contact-notes" rows="4" value={contactForm.notes} onChange={(event) => setContactForm((prev) => ({ ...prev, notes: event.target.value }))} />

                <label className="admin-check-row">
                  <input type="checkbox" checked={contactForm.verified} onChange={(event) => setContactForm((prev) => ({ ...prev, verified: event.target.checked }))} />
                  Verified
                </label>

                <label className="admin-check-row">
                  <input type="checkbox" checked={contactForm.available24Hours} onChange={(event) => setContactForm((prev) => ({ ...prev, available24Hours: event.target.checked }))} />
                  Available 24/7
                </label>

                <label className="admin-check-row">
                  <input type="checkbox" checked={contactForm.supportsSos} onChange={(event) => setContactForm((prev) => ({ ...prev, supportsSos: event.target.checked }))} />
                  Supports SOS
                </label>

                <label className="admin-check-row">
                  <input type="checkbox" checked={contactForm.supportsInquiry} onChange={(event) => setContactForm((prev) => ({ ...prev, supportsInquiry: event.target.checked }))} />
                  Supports general inquiry
                </label>

                <div className="button-row">
                  <button className="button-main" type="submit">{editingContactId ? "Update Contact" : "Create Contact"}</button>
                  {editingContactId && (
                    <button className="button-light" type="button" onClick={resetContactForm}>Cancel Edit</button>
                  )}
                </div>
              </form>
            </article>

            <article className="card">
              <h3>Safety Contacts</h3>
              <button className="button-light" type="button" onClick={loadContactList}>Refresh List</button>

              <div className="result-box">
                {contactMessage && <p>{contactMessage}</p>}

                {contacts.map((contact) => (
                  <div className="result-item admin-ticket-item" key={contact.id || contact._id}>
                    <p><strong>{contact.name}</strong> ({contact.category})</p>
                    <p>{contact.destination} | {contact.organization || "No organization listed"}</p>
                    <p>Phone: {contact.phone} | Priority: {contact.priority} | Verified: {contact.verified ? "Yes" : "No"}</p>
                    <div className="button-row">
                      <button className="button-light" type="button" onClick={() => fillContactForm(contact)}>Edit</button>
                      <button className="button-light" type="button" onClick={() => deleteContact(contact.id || contact._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      {isAllowed && (
        <section className="section">
          <div className="admin-panel-grid">
            <article className="card">
              <h3>{editingDiscoveryItemId ? "Edit Rental or Workshop" : "Create Rental or Workshop"}</h3>
              <form onSubmit={submitDiscoveryForm}>
                <label htmlFor="discovery-type">Type</label>
                <select id="discovery-type" required value={discoveryForm.type} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, type: event.target.value }))}>
                  {discoveryTypeOptions.map((option) => (
                    <option value={option.value} key={`discovery-type-${option.value}`}>{option.label}</option>
                  ))}
                </select>

                <label htmlFor="discovery-destination">Destination</label>
                <select id="discovery-destination" required value={discoveryForm.destination} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, destination: event.target.value }))}>
                  {bangladeshDistricts.map((district) => (
                    <option value={district} key={`discovery-destination-${district}`}>{district}</option>
                  ))}
                </select>

                <label htmlFor="discovery-name">Title</label>
                <input id="discovery-name" type="text" required value={discoveryForm.name} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, name: event.target.value }))} />

                <label htmlFor="discovery-provider">Provider</label>
                <input id="discovery-provider" type="text" required value={discoveryForm.provider} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, provider: event.target.value }))} />

                <label htmlFor="discovery-category">Category</label>
                <input id="discovery-category" type="text" required placeholder="car, microbus, art-workshop..." value={discoveryForm.category} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, category: event.target.value }))} />

                <label htmlFor="discovery-description">Short Description</label>
                <textarea id="discovery-description" rows="4" value={discoveryForm.shortDescription} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, shortDescription: event.target.value }))} />

                <label htmlFor="discovery-price">Price</label>
                <input id="discovery-price" type="number" min="0" step="1" required value={discoveryForm.price} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, price: event.target.value }))} />

                <label htmlFor="discovery-unit">Pricing Unit</label>
                <input id="discovery-unit" type="text" placeholder="per day, per person..." value={discoveryForm.pricingUnit} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, pricingUnit: event.target.value }))} />

                <label htmlFor="discovery-duration">Duration Hours</label>
                <input id="discovery-duration" type="number" min="0" step="0.5" value={discoveryForm.durationHours} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, durationHours: event.target.value }))} />

                <label htmlFor="discovery-capacity">Capacity</label>
                <input id="discovery-capacity" type="number" min="1" step="1" value={discoveryForm.capacity} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, capacity: event.target.value }))} />

                <label htmlFor="discovery-pickup">Pickup / Venue</label>
                <input id="discovery-pickup" type="text" value={discoveryForm.pickupLocation} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, pickupLocation: event.target.value }))} />

                <label htmlFor="discovery-phone">Contact Phone</label>
                <input id="discovery-phone" type="text" value={discoveryForm.contactPhone} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, contactPhone: event.target.value }))} />

                <label htmlFor="discovery-features">Features (comma separated)</label>
                <input id="discovery-features" type="text" value={discoveryForm.features} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, features: event.target.value }))} />

                <label htmlFor="discovery-languages">Languages (comma separated)</label>
                <input id="discovery-languages" type="text" value={discoveryForm.languages} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, languages: event.target.value }))} />

                <label htmlFor="discovery-priority">Priority</label>
                <input id="discovery-priority" type="number" min="1" max="100" required value={discoveryForm.priority} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, priority: event.target.value }))} />

                <label className="admin-check-row">
                  <input type="checkbox" checked={discoveryForm.verified} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, verified: event.target.checked }))} />
                  Verified
                </label>

                <label className="admin-check-row">
                  <input type="checkbox" checked={discoveryForm.available} onChange={(event) => setDiscoveryForm((prev) => ({ ...prev, available: event.target.checked }))} />
                  Available for booking
                </label>

                <div className="button-row">
                  <button className="button-main" type="submit">{editingDiscoveryItemId ? "Update Item" : "Create Item"}</button>
                  {editingDiscoveryItemId && (
                    <button className="button-light" type="button" onClick={resetDiscoveryForm}>Cancel Edit</button>
                  )}
                </div>
              </form>
            </article>

            <article className="card">
              <h3>Vehicle Rentals and Workshops</h3>
              <button className="button-light" type="button" onClick={loadDiscoveryItems}>Refresh List</button>

              <div className="result-box">
                {discoveryMessage && <p>{discoveryMessage}</p>}

                {discoveryItems.map((item) => (
                  <div className="result-item admin-ticket-item" key={item.id || item._id}>
                    <p><strong>{item.name}</strong> ({item.type})</p>
                    <p>{item.destination} | {item.provider} | {item.category}</p>
                    <p>Price: {item.price} | Capacity: {item.capacity} | Verified: {item.verified ? "Yes" : "No"}</p>
                    <div className="button-row">
                      <button className="button-light" type="button" onClick={() => fillDiscoveryForm(item)}>Edit</button>
                      <button className="button-light" type="button" onClick={() => deleteDiscoveryItem(item.id || item._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}
    </main>
  );
}
