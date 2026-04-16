import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div>
          <p className="sub-title">Travel planning, organized</p>
          <h1>Turn scattered trip ideas into a single, calm plan.</h1>
          <p className="description">
            EkJatray helps travelers coordinate transport, budgets, and destination planning without
            jumping between tools.
          </p>
          <div className="button-row">
            <Link className="button-main" to="/budget">
              Open Budget Manager
            </Link>
            <Link className="button-light" to="/login">
              Search Transport Tickets
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <p className="sub-title">Day 1 React Migration</p>
          <h2>Frontend moved to React Router with auth-aware navigation.</h2>
          <p className="description">
            Next, transport ticket search from your old index page will be migrated into reusable React
            components.
          </p>
        </div>
      </section>
    </main>
  );
}
