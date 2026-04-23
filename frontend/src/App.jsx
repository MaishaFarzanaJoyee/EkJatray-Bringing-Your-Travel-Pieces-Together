import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";
import AdminPage from "./pages/AdminPage";
import BudgetPage from "./pages/BudgetPage";
import HomePage from "./pages/HomePage";
import ItineraryPage from "./pages/ItineraryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ReviewPage from "./pages/ReviewPage";
import CartCheckoutPage from "./pages/CartCheckoutPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import RecommendationPage from "./pages/RecommendationPage";
import WeatherPlannerPage from "./pages/WeatherPlannerPage";
import WellnessBookingPage from "./pages/WellnessBookingPage";
import NotificationsPage from "./pages/NotificationsPage";
import TransportPage from "./pages/TransportPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <div className="container">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reviews" element={<ReviewPage />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartCheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/success"
          element={
            <ProtectedRoute>
              <CheckoutSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/budget"
          element={
            <ProtectedRoute>
              <BudgetPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itinerary/:itineraryId"
          element={
            <ProtectedRoute>
              <ItineraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="/recommendations" element={<RecommendationPage />} />
        <Route path="/transport" element={<TransportPage />} />
        <Route path="/weather" element={<WeatherPlannerPage />} />
        <Route
          path="/wellness"
          element={
            <ProtectedRoute>
              <WellnessBookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
