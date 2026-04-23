import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  deleteLodging,
  getUnifiedItinerary,
  searchAccommodations,
  searchWellnessCenters,
} from "../services/joyeeService";
import { addAccommodationToCart, addWellnessToCart, getMyCart } from "../services/cartCheckoutService";
import { bangladeshDistricts } from "../utils/bangladeshDistricts";

function asArray(value, fallbackKeys = []) {
  if (Array.isArray(value)) {
    return value;
  }

  for (const key of fallbackKeys) {
    if (Array.isArray(value?.[key])) {
      return value[key];
    }
  }

  return [];
}

function normalizeTripPlan(value) {
  const source = value?.plan || value || {};
  return {
    accommodations: asArray(source.accommodations),
    wellnessConsultations: asArray(source.wellnessConsultations),
  };
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export default function WellnessBookingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [lodgingLocation, setLodgingLocation] = useState("");
  const [wellnessLocation, setWellnessLocation] = useState("");
  const [lodgingResults, setLodgingResults] = useState([]);
  const [wellnessResults, setWellnessResults] = useState([]);
  const [tripPlan, setTripPlan] = useState({ accommodations: [], wellnessConsultations: [] });
  const [statusMessage, setStatusMessage] = useState("");
  const [wellnessCartItems, setWellnessCartItems] = useState([]);
  const [wellnessCartTotal, setWellnessCartTotal] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    loadUnifiedPlan();
  }, []);

  useEffect(() => {
    loadWellnessCartPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const calculateCartTotal = (items = []) => items.reduce(
    (sum, item) => sum + Number(item?.price || 0) * Number(item?.quantity || 0),
    0
  );

  const isWellnessBookingCartItem = (item) => item?.sourceModule === "booking" && (
    item?.providerType === "hotel" || item?.providerType === "localArtisan"
  );

  const loadWellnessCartPreview = async () => {
    if (!isAuthenticated) {
      setWellnessCartItems([]);
      setWellnessCartTotal(0);
      return;
    }

    setCartLoading(true);
    try {
      const data = await getMyCart();
      const allItems = asArray(data?.cart?.items);
      const bookingItems = allItems.filter(isWellnessBookingCartItem);
      setWellnessCartItems(bookingItems);
      setWellnessCartTotal(calculateCartTotal(bookingItems));
    } catch (error) {
      setWellnessCartItems([]);
      setWellnessCartTotal(0);
    } finally {
      setCartLoading(false);
    }
  };

  const loadUnifiedPlan = async () => {
    try {
      const plan = await getUnifiedItinerary();
      setTripPlan(normalizeTripPlan(plan));
    } catch (error) {
      setStatusMessage("Unable to load your trip plan at the moment.");
    }
  };

  const handleSearchLodging = async () => {
    try {
      setStatusMessage("");
      const data = await searchAccommodations(lodgingLocation);
      setLodgingResults(asArray(data, ["hotels", "accommodations", "items"]));
    } catch (error) {
      setLodgingResults([]);
      setStatusMessage("Unable to search lodging right now.");
    }
  };

  const handleSearchWellness = async () => {
    try {
      setStatusMessage("");
      const data = await searchWellnessCenters(wellnessLocation);
      setWellnessResults(asArray(data, ["centers", "wellnessCenters", "items"]));
    } catch (error) {
      setWellnessResults([]);
      setStatusMessage("Unable to search wellness centers right now.");
    }
  };

  const handleBookLodging = async (hotelId) => {
    if (!hotelId) {
      setStatusMessage("Could not add accommodation: missing hotel id.");
      return;
    }

    try {
      try {
        await addAccommodationToCart({ accommodationId: hotelId, quantity: 1 });
        setStatusMessage("Accommodation added to cart. It will appear in the trip plan after checkout confirmation.");
      } catch (cartError) {
        const cartErrorMessage = getErrorMessage(cartError, "Unable to add accommodation to cart.");
        setStatusMessage(`Accommodation could not be added to cart: ${cartErrorMessage}`);
      }

      await loadWellnessCartPreview();
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Could not add accommodation to cart."));
    }
  };

  const handleBookWellness = async (wellnessId) => {
    if (!wellnessId) {
      setStatusMessage("Could not add wellness booking: missing center id.");
      return;
    }

    try {
      try {
        await addWellnessToCart({ wellnessId, quantity: 1 });
        setStatusMessage("Wellness booking added to cart. It will appear in the trip plan after checkout confirmation.");
      } catch (cartError) {
        const cartErrorMessage = getErrorMessage(cartError, "Unable to add wellness booking to cart.");
        setStatusMessage(`Wellness booking could not be added to cart: ${cartErrorMessage}`);
      }

      await loadWellnessCartPreview();
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Could not add wellness booking to cart."));
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await deleteLodging(itemId);
      setStatusMessage("Item removed from your plan.");
      loadUnifiedPlan();
    } catch (error) {
      setStatusMessage("Could not remove this item right now.");
    }
  };

  const handleOpenCart = () => {
    navigate("/cart");
  };

  return (
    <div className="page-content">
      <section className="page-section">
        <div className="section-header">
          <h1>Booking & Wellness Hub</h1>
          <p>Search verified accommodations and wellness centers, then add them to your trip plan.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card card-highlight">
            <h2>Find Lodging</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <select
                value={lodgingLocation}
                onChange={(e) => setLodgingLocation(e.target.value)}
                className="input-field"
              >
                <option value="">Select district for lodging</option>
                {bangladeshDistricts.map((district) => (
                  <option key={`lodging-${district}`} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              <button className="button-primary" onClick={handleSearchLodging}>
                Search Lodging
              </button>
            </div>
            <div className="space-y-4">
              {lodgingResults.map((hotel) => (
                <div key={hotel._id || hotel.id} className="result-card">
                  <div>
                    <h3>{hotel.name}</h3>
                    <p className="text-muted">BDT {hotel.price}/night • {(Array.isArray(hotel.amenities) ? hotel.amenities : []).join(", ")}</p>
                  </div>
                  <button className="button-secondary" onClick={() => handleBookLodging(hotel._id || hotel.id)}>
                    Book
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-highlight">
            <h2>Wellness Centers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <select
                value={wellnessLocation}
                onChange={(e) => setWellnessLocation(e.target.value)}
                className="input-field"
              >
                <option value="">Select district for wellness</option>
                {bangladeshDistricts.map((district) => (
                  <option key={`wellness-${district}`} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              <button className="button-primary" onClick={handleSearchWellness}>
                Search Wellness
              </button>
            </div>
            <div className="space-y-4">
              {wellnessResults.map((center) => (
                <div key={center._id || center.id} className="result-card result-card-green">
                  <div>
                    <h3>{center.centerName}</h3>
                    <p className="text-muted">{center.practitionerName} • {center.specialty}</p>
                    <p className="text-muted">BDT {center.consultationFee}</p>
                  </div>
                  <button className="button-secondary" onClick={() => handleBookWellness(center._id || center.id)}>
                    Book
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card card-form mt-8">
          <div className="transport-panel-header">
            <div>
              <h2>Live Cart Preview</h2>
              <p className="transport-muted">Items from this Wellness module are shown here instantly.</p>
            </div>
            <span className="transport-badge">BDT {Math.round(wellnessCartTotal)}</span>
          </div>

          <div className="transport-cart">
            {!isAuthenticated ? (
              <p className="transport-empty">Log in to view your cart preview.</p>
            ) : cartLoading ? (
              <p className="transport-empty">Loading cart preview...</p>
            ) : !wellnessCartItems.length ? (
              <p className="transport-empty">No lodging or wellness items in cart yet.</p>
            ) : (
              wellnessCartItems.map((item) => (
                <div className="transport-cart-item" key={item._id || `${item.sourceId}-${item.itemName}`}>
                  <div>
                    <strong>{item.itemName}</strong>
                    <p>{item.providerType === "hotel" ? "Accommodation" : "Wellness"}</p>
                    <p>{item.route || "Location not set"}</p>
                  </div>
                  <div className="transport-cart-meta">
                    <strong>x{item.quantity || 1}</strong>
                    <strong>BDT {Math.round(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="transport-cart-footer">
            <button className="button-light" type="button" onClick={loadWellnessCartPreview}>
              Refresh Cart
            </button>
            <button className="button-main" type="button" onClick={handleOpenCart}>
              Open Full Cart
            </button>
          </div>
        </div>

        <div className="card card-form mt-8">
          <h2>Your Unified Trip Plan</h2>
          <p className="text-muted">Confirmed bookings will appear here after checkout/payment succeeds.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="card card-mini">
              <h3>Accommodations</h3>
              {tripPlan.accommodations?.length ? (
                tripPlan.accommodations.map((item) => (
                  <div key={item._id || item.id} className="plan-item">
                    <div>
                      <span>{item.name}</span>
                      <p className="text-muted">{item.location}</p>
                    </div>
                    <button className="button-text" onClick={() => handleDelete(item._id || item.id)}>
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-muted">No accommodations booked yet.</p>
              )}
            </div>

            <div className="card card-mini">
              <h3>Wellness Bookings</h3>
              {tripPlan.wellnessConsultations?.length ? (
                tripPlan.wellnessConsultations.map((item) => (
                  <div key={item._id || item.id} className="plan-item">
                    <div>
                      <span>{item.centerName}</span>
                      <p className="text-muted">{item.practitionerName} • {item.specialty}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No wellness bookings yet.</p>
              )}
            </div>
          </div>
        </div>

        {statusMessage && <div className="status-message mt-4">{statusMessage}</div>}
      </section>
    </div>
  );
}
