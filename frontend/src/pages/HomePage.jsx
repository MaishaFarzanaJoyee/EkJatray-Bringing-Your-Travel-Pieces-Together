import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { searchLocalDiscoveryItems } from "../services/localDiscoveryService";
import { searchSafetyContacts } from "../services/safetyService";
import { bangladeshDistricts } from "../utils/bangladeshDistricts";

export default function HomePage() {
  const safetyCategoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "tourist-police", label: "Tourist Police" },
    { value: "hospital", label: "Hospital" },
    { value: "guide", label: "Guide" },
    { value: "embassy", label: "Embassy" },
    { value: "transport-help", label: "Transport Help" },
    { value: "general-emergency", label: "General Emergency" },
  ];
  const localDiscoveryPlanKey = "ekjatrayLocalDiscoveryPlan";
  const [localDiscoveryForm, setLocalDiscoveryForm] = useState({
    destination: "Cox's Bazar",
    type: "all",
    category: "",
    search: "",
    maxPrice: "",
  });
  const [localLoading, setLocalLoading] = useState(false);
  const [localSummary, setLocalSummary] = useState("Search local rentals and workshops for your destination.");
  const [localItems, setLocalItems] = useState([]);
  const [localPlan, setLocalPlan] = useState(() => {
    try {
      const stored = sessionStorage.getItem(localDiscoveryPlanKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  });

  const [safetyForm, setSafetyForm] = useState({
    destination: "Cox's Bazar",
    category: "all",
    search: "",
  });
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetySummary, setSafetySummary] = useState("Search trusted local contacts for your destinations.");
  const [safetyContacts, setSafetyContacts] = useState([]);

  const localDiscoveryTypeOptions = [
    { value: "all", label: "All" },
    { value: "car", label: "Car Rental" },
    { value: "microbus", label: "Microbus" },
    { value: "workshop", label: "Workshop" },
    { value: "tour", label: "Tour Experience" },
  ];

  function getLocalTypeLabel(value) {
    if (!value) return "Local";
    const option = localDiscoveryTypeOptions.find((item) => item.value === value);
    return option ? option.label : value.charAt(0).toUpperCase() + value.slice(1);
  }

  function getLocalItemKey(item) {
    return item?.planId || item?.id || `${item?.type || "local"}-${item?.destination || "unknown"}`;
  }

  function getSafetyCategoryLabel(category) {
    if (!category) return "Support";
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  function getPhoneHref(phone) {
    if (!phone) return "#";
    const cleaned = phone.toString().replace(/[^0-9+]/g, "");
    return `tel:${cleaned}`;
  }

  function getWhatsappHref(whatsapp, destination) {
    if (!whatsapp) return "#";
    const cleaned = whatsapp.toString().replace(/[^0-9]/g, "");
    const text = encodeURIComponent(`Hello, I would like help for ${destination || "my trip"}.`);
    return `https://wa.me/${cleaned}?text=${text}`;
  }

  function getSosHref(phone, destination) {
    return getWhatsappHref(phone, destination);
  }

  useEffect(() => {
    sessionStorage.setItem(localDiscoveryPlanKey, JSON.stringify(localPlan));
  }, [localPlan]);

  function updateSafetyField(name, value) {
    setSafetyForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateLocalField(name, value) {
    setLocalDiscoveryForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetSafetySearch() {
    const nextForm = {
      destination: "Cox's Bazar",
      category: "all",
      search: "",
    };
    setSafetyForm(nextForm);
    loadSafetyContacts(nextForm);
  }

  async function loadSafetyContacts(formOverride) {
    const form = formOverride || safetyForm;
    setSafetyLoading(true);
    setSafetySummary("Loading trusted local contacts...");

    try {
      const result = await searchSafetyContacts({
        destination: form.destination,
        category: form.category,
        search: form.search.trim(),
      });

      const nextContacts = Array.isArray(result.contacts) ? result.contacts : [];
      setSafetyContacts(nextContacts);

      const summaryParts = [];
      if (form.destination) summaryParts.push(form.destination);
      if (form.category && form.category !== "all") summaryParts.push(getSafetyCategoryLabel(form.category));
      if (form.search.trim()) summaryParts.push(`matching "${form.search.trim()}"`);

      const nextSummary = nextContacts.length
        ? `Showing ${nextContacts.length} verified support contact${nextContacts.length === 1 ? "" : "s"}${summaryParts.length ? ` for ${summaryParts.join(", ")}` : ""}.`
        : `No contacts found${summaryParts.length ? ` for ${summaryParts.join(", ")}` : ""}.`;

      setSafetySummary(nextSummary);
    } catch (error) {
      setSafetyContacts([]);
      setSafetySummary(error?.response?.data?.message || error?.response?.data?.error || "Unable to load safety contacts right now.");
    } finally {
      setSafetyLoading(false);
    }
  }

  function runSafetySearch(event) {
    event.preventDefault();
    loadSafetyContacts();
  }

  function resetLocalSearch() {
    const nextForm = {
      destination: "Cox's Bazar",
      type: "all",
      category: "",
      search: "",
      maxPrice: "",
    };
    setLocalDiscoveryForm(nextForm);
    loadLocalDiscoveryItems(nextForm);
  }

  function addLocalItemToPlan(item) {
    const planId = item.id;
    if (!planId) {
      return;
    }

    const exists = localPlan.some((entry) => getLocalItemKey(entry) === planId);
    if (exists) {
      setLocalSummary("That rental or workshop is already in your trip plan.");
      return;
    }

    setLocalPlan((prev) => [
      ...prev,
      {
        planId,
        id: item.id,
        type: item.type,
        destination: item.destination,
        name: item.name,
        provider: item.provider,
        price: item.price,
        pricingUnit: item.pricingUnit,
        durationHours: item.durationHours,
        contactPhone: item.contactPhone,
        pickupLocation: item.pickupLocation,
        scheduledDate: "",
        scheduledTime: "",
      },
    ]);
    setLocalSummary(`${item.name} was added to your trip plan.`);
  }

  function updateLocalPlanItem(planId, field, value) {
    setLocalPlan((prev) =>
      prev.map((entry) => (getLocalItemKey(entry) === planId ? { ...entry, [field]: value } : entry))
    );
  }

  function removeLocalItem(planId) {
    setLocalPlan((prev) => prev.filter((entry) => getLocalItemKey(entry) !== planId));
  }

  async function loadLocalDiscoveryItems(formOverride) {
    const form = formOverride || localDiscoveryForm;
    setLocalLoading(true);
    setLocalSummary("Loading local rentals and workshops...");

    try {
      const result = await searchLocalDiscoveryItems({
        destination: form.destination,
        type: form.type,
        category: form.category.trim(),
        search: form.search.trim(),
        maxPrice: form.maxPrice,
      });

      const nextItems = Array.isArray(result.items) ? result.items : [];
      setLocalItems(nextItems);

      const summaryParts = [];
      if (form.destination) summaryParts.push(form.destination);
      if (form.type !== "all") summaryParts.push(getLocalTypeLabel(form.type));
      if (form.category.trim()) summaryParts.push(form.category.trim());
      if (form.maxPrice) summaryParts.push(`under BDT ${form.maxPrice}`);
      if (form.search.trim()) summaryParts.push(`matching "${form.search.trim()}"`);

      setLocalSummary(
        nextItems.length
          ? `Showing ${nextItems.length} rental or workshop option${nextItems.length === 1 ? "" : "s"}${summaryParts.length ? ` for ${summaryParts.join(", ")}` : ""}.`
          : `No rentals or workshops found${summaryParts.length ? ` for ${summaryParts.join(", ")}` : ""}.`
      );
    } catch (error) {
      setLocalItems([]);
      setLocalSummary(error?.response?.data?.message || error?.response?.data?.error || "Unable to load local rentals and workshops right now.");
    } finally {
      setLocalLoading(false);
    }
  }

  function runLocalSearch(event) {
    event.preventDefault();
    loadLocalDiscoveryItems();
  }

  const safetyCards = useMemo(() => {
    if (!safetyContacts.length) {
      return <p className="transport-empty">No verified contacts match the current destination or category.</p>;
    }

    return safetyContacts.map((contact) => (
      <article className="safety-card" key={contact.id}>
        <div className="transport-ticket-top">
          <div>
            <p className="transport-mode-tag">{getSafetyCategoryLabel(contact.category)}</p>
            <h4>{contact.name}</h4>
            <p className="transport-muted">
              {contact.organization || "Local support network"} | {contact.destination}
            </p>
          </div>
          <div className="safety-badges">
            {contact.verified && <span className="transport-badge">Verified</span>}
            {contact.available24Hours && <span className="transport-badge">24/7</span>}
          </div>
        </div>

        <div className="transport-ticket-meta safety-meta">
          <span><strong>Primary:</strong> {contact.phone}</span>
          <span><strong>Alternate:</strong> {contact.alternatePhone || "Not listed"}</span>
          <span><strong>Languages:</strong> {contact.languages?.length ? contact.languages.join(", ") : "Local language support"}</span>
          <span><strong>Address:</strong> {contact.address || "Destination support desk"}</span>
        </div>

        <p className="safety-notes">{contact.notes || "Use this contact for urgent support or trusted local guidance."}</p>

        <div className="safety-actions">
          <a className="button-main" href={getPhoneHref(contact.phone)}>
            Call Now
          </a>

          {contact.supportsSos ? (
            <a className="button-light" href={getSosHref(contact.phone, contact.destination, contact.name)}>
              Send SOS
            </a>
          ) : (
            <a
              className="button-light"
              href={contact.whatsapp ? getWhatsappHref(contact.whatsapp, contact.destination) : getPhoneHref(contact.phone)}
              target={contact.whatsapp ? "_blank" : undefined}
              rel={contact.whatsapp ? "noreferrer" : undefined}
            >
              {contact.whatsapp ? "Message on WhatsApp" : "Call for Help"}
            </a>
          )}
        </div>
      </article>
    ));
  }, [safetyContacts]);

  const localDiscoveryCards = useMemo(() => {
    if (!localItems.length) {
      return <p className="transport-empty">No vehicle rentals or workshops match the current filters.</p>;
    }

    return localItems.map((item) => (
      <article className="local-card" key={item.id}>
        <div className="transport-ticket-top">
          <div>
            <p className="transport-mode-tag">{getLocalTypeLabel(item.type)}</p>
            <h4>{item.name}</h4>
            <p className="transport-muted">{item.provider} | {item.destination}</p>
          </div>
          <div className="safety-badges">
            {item.verified && <span className="transport-badge">Verified</span>}
            {item.available && <span className="transport-badge">Available</span>}
          </div>
        </div>

        <div className="transport-ticket-meta">
          <span><strong>Category:</strong> {item.category}</span>
          <span><strong>Price:</strong> BDT {item.price} {item.pricingUnit ? `/${item.pricingUnit}` : ""}</span>
          <span><strong>Duration:</strong> {item.durationHours ? `${item.durationHours}h` : "Flexible"}</span>
          <span><strong>Capacity:</strong> {item.capacity}</span>
          <span><strong>Pickup:</strong> {item.pickupLocation || "Provider confirms on booking"}</span>
          <span><strong>Contact:</strong> {item.contactPhone || "Available after confirmation"}</span>
        </div>

        <p className="safety-notes">{item.shortDescription || "Reserve before arrival and keep this part of the trip organized with the rest of your planning."}</p>

        {!!item.features?.length && (
          <div className="local-feature-row">
            {item.features.map((feature) => (
              <span className="transport-badge" key={`${item.id}-${feature}`}>{feature}</span>
            ))}
          </div>
        )}

        <div className="safety-actions">
          <button className="button-main" type="button" onClick={() => addLocalItemToPlan(item)}>
            Reserve in Plan
          </button>
          {item.contactPhone && (
            <a className="button-light" href={getPhoneHref(item.contactPhone)}>
              Call Provider
            </a>
          )}
        </div>
      </article>
    ));
  }, [localItems, localPlan]);

  return (
    <main>
      <section className="hero">
        <div>
          <p className="sub-title">Travel planning, organized</p>
          <h1>Turn scattered trip ideas into a single, calm plan.</h1>
          <p className="description">
            EkJatray helps travelers coordinate transport, budgets, and destination planning without jumping between tools.
            Keep the journey clear for solo trips or group adventures.
          </p>

          <div className="button-row">
            <Link className="button-main" to="/budget">Open Budget Manager</Link>
            <Link className="button-light" to="/transport">Search Transport Tickets</Link>
            <a className="button-light" href="#safety-connect-hub">Open Safety Hub</a>
            <a className="button-light" href="#local-discovery-hub">Explore Rentals and Workshops</a>
          </div>

          <div className="stat-row" aria-label="Project highlights">
            <div>
              <strong>Shared</strong>
              <span>trip budgeting</span>
            </div>
            <div>
              <strong>Unified</strong>
              <span>transport search</span>
            </div>
            <div>
              <strong>Simple</strong>
              <span>expense tracking</span>
            </div>
          </div>
        </div>
      </section>

      <section id="local-discovery-hub" className="section">
        <div className="section-title">
          <p className="sub-title">Vehicle rentals and local experiences</p>
          <h2>Reserve your ride and book hands-on workshops before arrival.</h2>
          <p className="description transport-intro">
            Search local car rentals, microbuses, artisan classes, and other destination-specific experiences.
            Keep them alongside your trip planning instead of hunting for providers at the last minute.
          </p>
        </div>

        <div className="transport-shell">
          <form className="transport-form" onSubmit={runLocalSearch}>
            <div className="transport-grid transport-grid-4">
              <div>
                <label htmlFor="local-destination">Destination</label>
                <select id="local-destination" value={localDiscoveryForm.destination} onChange={(event) => updateLocalField("destination", event.target.value)}>
                  {bangladeshDistricts.map((district) => (
                    <option value={district} key={`local-destination-${district}`}>{district}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="local-type">Type</label>
                <select id="local-type" value={localDiscoveryForm.type} onChange={(event) => updateLocalField("type", event.target.value)}>
                  {localDiscoveryTypeOptions.map((option) => (
                    <option value={option.value} key={`local-type-${option.value}`}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="local-category">Category</label>
                <input id="local-category" type="text" placeholder="car, microbus, art-workshop..." value={localDiscoveryForm.category} onChange={(event) => updateLocalField("category", event.target.value)} />
              </div>

              <div>
                <label htmlFor="local-search">Search</label>
                <input id="local-search" type="text" placeholder="airport pickup, artisan, eco..." value={localDiscoveryForm.search} onChange={(event) => updateLocalField("search", event.target.value)} />
              </div>

              <div>
                <label htmlFor="local-price">Max Price</label>
                <input id="local-price" type="number" min="0" step="100" value={localDiscoveryForm.maxPrice} onChange={(event) => updateLocalField("maxPrice", event.target.value)} />
              </div>
            </div>

            <div className="transport-actions transport-search-actions">
              <button className="button-main" type="submit">Search Rentals and Workshops</button>
              <button className="button-light" type="button" onClick={resetLocalSearch}>Reset</button>
            </div>
          </form>

          <div className="safety-layout">
            <div className="card transport-results-panel">
              <div className="transport-panel-header">
                <div>
                  <h3>Available Local Options</h3>
                  <p className="transport-muted">{localSummary}</p>
                </div>
                <span className="transport-badge">Pre-trip booking</span>
              </div>

              <div className="transport-results">
                {localLoading ? <p className="transport-empty">Loading local rentals and workshops...</p> : localDiscoveryCards}
              </div>
            </div>

            <aside className="card safety-side-panel">
              <div className="transport-panel-header">
                <div>
                  <h3>Trip Plan Add-ons</h3>
                  <p className="transport-muted">Save rentals and experiences you want to lock in.</p>
                </div>
                <span className="transport-badge">{localPlan.length} saved</span>
              </div>

              <div className="transport-cart">
                {!localPlan.length && <p className="transport-empty">No rentals or workshops saved yet.</p>}

                {localPlan.map((item) => (
                  <div className="transport-cart-item" key={getLocalItemKey(item)}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{getLocalTypeLabel(item.type)} | {item.destination}</p>
                      <p>{item.provider} | BDT {item.price} {item.pricingUnit ? `/${item.pricingUnit}` : ""}</p>
                    </div>
                    <div className="transport-cart-meta">
                      <strong>{item.durationHours ? `${item.durationHours}h` : "Flexible"}</strong>
                      <button className="button-light transport-mini-btn" type="button" onClick={() => removeLocalItem(getLocalItemKey(item))}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!!localPlan.length && (
                <div className="transport-results">
                  {localPlan.map((item) => (
                    <div className="trip-plan-schedule" key={`${getLocalItemKey(item)}-schedule`}>
                      <strong>{item.name}</strong>
                      <div className="trip-plan-schedule-grid">
                        <label className="transport-seat-label">
                          Planned date
                          <input
                            type="date"
                            value={item.scheduledDate || ""}
                            onChange={(event) => updateLocalPlanItem(getLocalItemKey(item), "scheduledDate", event.target.value)}
                          />
                        </label>
                        <label className="transport-seat-label">
                          Planned time
                          <input
                            type="time"
                            value={item.scheduledTime || ""}
                            onChange={(event) => updateLocalPlanItem(getLocalItemKey(item), "scheduledTime", event.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="transport-cart-footer">
                <p className="transport-muted">
                  Use this shortlist to keep pre-booked mobility and artisan sessions visible with the rest of your trip.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="safety-connect-hub" className="section">
        <div className="section-title">
          <p className="sub-title">Safety and local connect hub</p>
          <h2>Keep trusted emergency and local help contacts ready before you need them.</h2>
          <p className="description transport-intro">
            Search destination-specific tourist police, hospital desks, emergency hotlines, and registered guides.
            Every card is organized by category and built for immediate calling or SOS outreach.
          </p>
        </div>

        <div className="transport-shell">
          <form className="transport-form safety-form" onSubmit={runSafetySearch}>
            <div className="transport-grid transport-grid-4">
              <div>
                <label htmlFor="safety-destination">Destination</label>
                <select
                  id="safety-destination"
                  value={safetyForm.destination}
                  onChange={(event) => updateSafetyField("destination", event.target.value)}
                >
                  {bangladeshDistricts.map((district) => (
                    <option value={district} key={`safety-destination-${district}`}>{district}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="safety-category">Category</label>
                <select
                  id="safety-category"
                  value={safetyForm.category}
                  onChange={(event) => updateSafetyField("category", event.target.value)}
                >
                  {safetyCategoryOptions.map((option) => (
                    <option value={option.value} key={`safety-category-${option.value}`}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="safety-search">Search by organization or note</label>
                <input
                  id="safety-search"
                  type="text"
                  value={safetyForm.search}
                  placeholder="Hospital, beach, guide..."
                  onChange={(event) => updateSafetyField("search", event.target.value)}
                />
              </div>
            </div>

            <div className="transport-actions transport-search-actions">
              <button className="button-main" type="submit">Find Trusted Contacts</button>
              <button className="button-light" type="button" onClick={resetSafetySearch}>Reset</button>
            </div>
          </form>

          <div className="safety-layout">
            <div className="card transport-results-panel">
              <div className="transport-panel-header">
                <div>
                  <h3>Verified Local Directory</h3>
                  <p className="transport-muted">{safetySummary}</p>
                </div>
                <span className="transport-badge">Quick access</span>
              </div>

              <div className="transport-results">
                {safetyLoading ? <p className="transport-empty">Loading local support contacts...</p> : safetyCards}
              </div>
            </div>

            <aside className="card safety-side-panel">
              <div className="transport-panel-header">
                <div>
                  <h3>Immediate Support Tips</h3>
                  <p className="transport-muted">Use the quickest channel based on the situation.</p>
                </div>
                <span className="transport-badge">SOS ready</span>
              </div>

              <div className="safety-tip-list">
                <div className="safety-tip">
                  <strong>For emergencies</strong>
                  <p>Use `999` or a tourist police contact first when safety is at risk or you need urgent help navigating a local response.</p>
                </div>
                <div className="safety-tip">
                  <strong>For medical issues</strong>
                  <p>Call the listed hospital desk directly, then use the address block for faster transport coordination.</p>
                </div>
                <div className="safety-tip">
                  <strong>For local guidance</strong>
                  <p>Registered guide contacts are better for route advice, translation help, and trusted nearby recommendations.</p>
                </div>
              </div>

              <div className="transport-cart-footer">
                <a className="button-main" href="tel:999">Call 999</a>
                <p className="transport-muted">
                  The hub mixes admin-managed records with built-in fallback contacts so travelers still see essential help lines.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="section-title">
          <p className="sub-title">Features</p>
          <h2>Everything needed to shape a trip that feels under control.</h2>
        </div>

        <div className="card-grid">
          <article className="card">
            <h3>Plan faster</h3>
            <p>Keep trip details in one place and avoid switching between tools.</p>
          </article>
          <article className="card">
            <h3>Search transport</h3>
            <p>Compare flights, trains, and buses by date, price, duration, and seat.</p>
          </article>
          <article className="card">
            <h3>Track spending</h3>
            <p>Add expenses and keep your budget visible while planning together.</p>
          </article>
          <article className="card">
            <h3>Book local experiences</h3>
            <p>Reserve workshops and reliable rentals before arrival instead of scrambling on the ground.</p>
          </article>
        </div>
      </section>

      <section className="cta-box">
        <div>
          <p className="sub-title">Ready to start</p>
          <h2>Open transport search or the budget manager and begin shaping your next trip.</h2>
        </div>
        <div className="button-row">
          <Link className="button-main button-dark" to="/transport">Search Tickets</Link>
          <Link className="button-light" to="/budget">Go to Budget Manager</Link>
        </div>
      </section>
    </main>
  );
}
