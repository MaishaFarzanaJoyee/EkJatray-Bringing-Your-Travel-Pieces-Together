# EkJatray – Bringing Your Travel Pieces Together

**CSE471: System Analysis and Design** **Semester:** Spring 2026 | **Group No:** 10 | **Lab Section:** 01  

---

## Project Overview

EkJatray is a comprehensive, MERN-stack web platform designed to bridge the gap between disorganized travel planning and a seamless user experience. Planning a trip often involves juggling multiple platforms for tickets, accommodations, and budgets, creating inefficiencies. 

This system provides an all-in-one platform where users can manage destinations, bookings, budgets, and recommendations. It facilitates seamless ticket and hotel booking, provides a secure platform for budget management, and offers personalized recommendations, all supported by a robust payment system and real-time external API integrations.

---

## Tech Stack

### Core Technologies
* **Language:** JavaScript / TypeScript
* **Frontend:** React.js, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database & ODM:** MongoDB, Mongoose
* **State Management:** Redux Toolkit / Context API
* **Utilities:** `qrcode.react` (for generating offline booking passes)

### External APIs
* **Mapbox API / Google Maps API:** Interactive maps, pinning tourist spots, wellness centers, and hotel locations.
* **OpenWeatherMap API:** Real-time weather forecasts for dynamic packing checklists.
* **Sunrise-Sunset API:** Accurate local times for sunrise, sunset, and the photographic golden hour.
* **Google Street View API:** Interactive 360-degree 3D virtual previews of destinations.
* **Stripe API:** Secure online payment processing for unified checkouts.
* **SendGrid API / Gmail API:** Automated email delivery for booking confirmations, receipts, and itineraries.

### Deployment Architecture
* **Frontend:** Vercel
* **Backend:** Render / DigitalOcean
* **Database Cluster:** MongoDB Atlas

---

## User Roles

1. **Traveler:** The primary users who can register, set travel budgets, search for transport and accommodations, book services, and leave reviews.
2. **Service Provider:** Verified businesses (hotels, car rentals, local artisans, wellness centers) that manage their listings, availability, and receive booking confirmations.
3. **Admin:** A system super-user responsible for managing tour plans, verifying service providers, monitoring platform activity, and maintaining tourist spot data.

---

## System Features & Modules

### Common Workflows
* **Registration, Login & Profile Management:** Secure, role-based authentication for Travelers and Service Providers, including business verification forms for providers.
* **Admin Access Management:** Dedicated panel for administrators to review, approve, or reject pending service provider applications to ensure platform safety.

### Module 1: Budgeting, Recommendations, and Planning
* **Collaborative Budgeting & Expense Tracking:** Set personal or shared "Group Trip" budgets. The system automatically deducts costs as items are carted, providing real-time financial breakdowns.
* **Recommendation Engine & 3D Preview:** Analyzes user preferences and budgets to suggest optimal tour plans, offering an immersive 3D virtual preview of recommended spots using WebGL/Google Street View.
* **Comprehensive Safety & Local Connect Hub:** A centralized destination directory displaying verified emergency contacts (tourist police, local hospitals, guides) with SOS messaging capabilities.

### Module 2: Search, Booking, and Niche Integration
* **Transport Ticket Search & Booking:** A unified search interface for flights, trains, and buses with advanced filters for price, duration, and seat selection.
* **Accommodation & Wellness Booking:** Search for reliable lodging alongside verified local wellness centers and homeopathy practitioners, safely adding both to a unified trip plan.
* **Vehicle Rental & Local Experience Integration:** Rent local transport or book specialized workshops with local artisans (e.g., upcycled art classes) prior to arrival.

### Module 3: Checkout, Itinerary, and Admin Operations
* **Unified Cart & Secure Checkout:** Aggregates transport, lodging, and experiences into a single Stripe-powered payment gateway for reduced transaction fees.
* **Dynamic Itinerary & Offline QR Pass:** Automatically generates a chronological trip timeline upon checkout, including a scannable offline QR code for network-free schedule access.
* **Contextual Weather, Packing, & Location Integration:** Generates AI-driven packing checklists based on real-time weather data and visualizes distances between booked hotels and attractions.
* **Automated Notifications & Alerts:** Dispatches automated in app notifications for booking confirmations, payment receipts, and critical itinerary changes.
* **Review & Rating System:** Allows travelers to evaluate completed trips with a 1-to-5 star rating and text review system for public provider profiles.
* **Admin Operations & Analytics:** Dashboard for tracking bookings, revenue, managing predefined tour spots, and moderating reviews or non-compliant accounts.

---

## Team Contributors

| SL | Student ID | Name |
|:---:|:---:|:---|
| 1 | `21201240` | Abdullah Al Fahad |
| 2 | `21201065` | Maisha Farzana Joyee |
| 3 | `21201708` | Fariha Rahman |
