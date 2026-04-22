import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCart, startCheckoutSession } from "../services/cartCheckoutService";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const result = await getMyCart();
        const nextCart = result.cart || { items: [], totalAmount: 0 };
        setCart(nextCart);
        if (!nextCart.items?.length) {
          setMessage("Your cart is empty. Add a ticket first.");
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Could not load checkout data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalItems = useMemo(
    () => (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart.items]
  );

  async function handleProceedToStripe() {
    setError("");

    try {
      const result = await startCheckoutSession();
      if (!result.checkoutUrl) {
        throw new Error("Checkout URL missing");
      }
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Could not start Stripe checkout");
    }
  }

  if (loading) {
    return (
      <main>
        <section className="card review-card-shell">
          <h2>Checkout</h2>
          <p>Loading checkout details...</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="card review-card-shell">
        <h2>Checkout</h2>
        <p className="section-intro">Review your cart and continue to secure Stripe payment.</p>

        {message ? <p>{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {!cart.items?.length ? (
          <div className="button-row">
            <button type="button" className="button-main" onClick={() => navigate("/")}>Back to Search</button>
          </div>
        ) : (
          <>
            <div className="cart-stats-row">
              <div className="result-item">
                <span>Total Items</span>
                <strong>{totalItems}</strong>
              </div>
              <div className="result-item">
                <span>Grand Total (BDT)</span>
                <strong>{Number(cart.totalAmount || 0).toFixed(2)}</strong>
              </div>
            </div>

            <div className="module-table-wrap">
              <table className="module-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Provider</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item._id}>
                      <td>{item.serviceType}</td>
                      <td>{item.providerName}</td>
                      <td>{item.itemName}</td>
                      <td>{item.quantity}</td>
                      <td>{Number(item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="button-row">
              <button type="button" className="button-light" onClick={() => navigate("/cart")}>Back to Cart</button>
              <button type="button" className="button-main" onClick={handleProceedToStripe}>Pay with Stripe</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
