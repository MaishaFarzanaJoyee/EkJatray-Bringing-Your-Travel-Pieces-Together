import { useEffect, useState } from "react";
import {
  bookLodging,
  bookWellness,
  deleteLodging,
  getUnifiedItinerary,
  searchAccommodations,
  searchWellnessCenters,
} from "../services/joyeeService";

export default function WellnessBookingPage() {
  const [lodgingLocation, setLodgingLocation] = useState("");
  const [wellnessLocation, setWellnessLocation] = useState("");
  const [lodgingResults, setLodgingResults] = useState([]);
  const [wellnessResults, setWellnessResults] = useState([]);
  const [tripPlan, setTripPlan] = useState({ accommodations: [], wellnessConsultations: [] });
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    loadUnifiedPlan();
  }, []);

  const loadUnifiedPlan = async () => {
    try {
      const plan = await getUnifiedItinerary();
      setTripPlan(plan);
    } catch (error) {
      setStatusMessage("Unable to load your trip plan at the moment.");
    }
  };

  const handleSearchLodging = async () => {
    const data = await searchAccommodations(lodgingLocation);
    setLodgingResults(data || []);
  };

  const handleSearchWellness = async () => {
    const data = await searchWellnessCenters(wellnessLocation);
    setWellnessResults(data || []);
  };

  const handleBookLodging = async (hotelId) => {
    await bookLodging(hotelId);
    setStatusMessage("Accommodation added to your trip plan.");
    loadUnifiedPlan();
  };

  const handleBookWellness = async (wellnessId) => {
    await bookWellness(wellnessId);
    setStatusMessage("Wellness booking added to your trip plan.");
    loadUnifiedPlan();
  };

  const handleDelete = async (itemId) => {
    await deleteLodging(itemId);
    setStatusMessage("Item removed from your plan.");
    loadUnifiedPlan();
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
              <input
                value={lodgingLocation}
                onChange={(e) => setLodgingLocation(e.target.value)}
                placeholder="Search city for lodging"
                className="input-field"
              />
              <button className="button-primary" onClick={handleSearchLodging}>
                Search Lodging
              </button>
            </div>
            <div className="space-y-4">
              {lodgingResults.map((hotel) => (
                <div key={hotel._id || hotel.id} className="result-card">
                  <div>
                    <h3>{hotel.name}</h3>
                    <p className="text-muted">BDT {hotel.price}/night • {hotel.amenities?.join(", ")}</p>
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
              <input
                value={wellnessLocation}
                onChange={(e) => setWellnessLocation(e.target.value)}
                placeholder="Search city for wellness"
                className="input-field"
              />
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
          <h2>Your Unified Trip Plan</h2>
          <p className="text-muted">Review the accommodations and wellness bookings added to your itinerary.</p>

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
