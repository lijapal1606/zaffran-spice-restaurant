# 🍛 Zaffran & Spice — Restaurant Reservation & Table Management System

A modern, responsive, production-ready full-stack web application designed for **"Zaffran & Spice"**, a royal Indian restaurant serving authentic Awadhi, Mughlai, and Coastal delicacies.

Built with a **React** frontend and a **Vanilla PHP 8+ (PDO)** REST API backend.

---

## 🌟 Key Features

1. **Interactive Dining Floor Plan (`/tables`)**:
   - Visual floor nodes grouped across **3 authentic dining zones**:
     - 🏛️ **Main Dining Hall** (Tables `T-1` to `T-4` — capacities 2, 4, 6)
     - 🌿 **Courtyard Veranda** (Tables `T-5` to `T-7` — open-air patio, capacities 2, 4, 8)
     - 👑 **Royal Majlis** (Tables `T-8` to `T-10` — private luxury booths, capacities 6, 8)
   - Real-time chair icons corresponding to table capacity (2, 4, 6, 8 seats).
   - Dynamic status badges & glow dots:
     - 🟢 **Available** (`#10B981`)
     - 🔴 **Occupied** (`#E11D48`)
     - 🟡 **Reserved** (`#D97706`)
   - One-click status override modal and quick seating actions.

2. **Smart Automated Table Assignment & Capacity Matching**:
   - Algorithms ensure closest-capacity matching (`capacity >= party_size` ordered by `capacity ASC`) to prevent empty-seat wastage.
   - Prevents overbooking and rejects parties exceeding table limits.
   - Automatic status lifecycle:
     - Booking created ➔ Table marked **Reserved**.
     - Guest seated ➔ Table marked **Occupied**.
     - Booking completed/cancelled ➔ Table freed to **Available**.

3. **Reservations Management (`/reservations`)**:
   - Real-time instant search by guest name, 10-digit phone number, email, or table number.
   - Date picker filter + Status tabs (`All`, `Confirmed`, `Seated`, `Completed`, `Cancelled`) with live counters.
   - Quick action buttons: `Seat Guest`, `Complete & Free Table`, `Cancel`, `Edit`, `Delete`.
   - Comprehensive Edit Modal for guest details, date, time, and table reassignment.

4. **Split-Screen Dashboard (`/`)**:
   - Top 4 metrics: Available Tables, Occupied Tables, Reserved Tables, Expected Covers Today.
   - Left side: Fast reservation form with input validation and dietary tags (*Strict Jain*, *Vegan*, *Halal*, *Anniversary Decor*, *Window Seat*).
   - Right side: Visual live table floor overview.

5. **Snappy & Resilient State Management**:
   - Context API + `useReducer` with actions (`SET_DATA`, `ADD_RESERVATION`, `UPDATE_RESERVATION`, `DELETE_RESERVATION`, `TOGGLE_TABLE_STATUS`).
   - `localStorage` caching fallback guarantees that the UI stays snappy, resilient, and fully functional even offline.
   - Elegant toast notification system for instant feedback.

---

## 🗂️ Project Structure

```
fs_project/
├── backend/
│   ├── api/
│   │   ├── tables.php           # GET all tables with guest info; PUT table status
│   │   └── reservations.php     # GET, POST (auto-assign), PUT (seat/complete), DELETE
│   ├── config/
│   │   └── db.php               # PDO connection, CORS headers, error handling & SQLite fallback
│   ├── database/
│   │   └── zaffran_spice.sqlite # Embedded SQLite database fallback for instant run
│   └── database.sql             # MySQL schema & seed script (tables & reservations)
├── frontend/
│   ├── public/
│   │   └── favicon.svg          # Saffron culinary emblem
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx       # Brand logo, navigation, live table counter, manager profile
│   │   │   ├── Footer.jsx       # Dining hours, heritage info, tech badges
│   │   │   ├── MetricsCards.jsx # Top metric stat cards with progress bars
│   │   │   ├── ReservationForm.jsx # Controlled validation, dietary tags, table dropdown
│   │   │   ├── TableFloorPlan.jsx  # Visual chair floor nodes & status modal
│   │   │   └── Toast.jsx        # Floating feedback alerts
│   │   ├── context/
│   │   │   └── ReservationContext.jsx # useReducer + Context + localStorage cache
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Split-screen overview
│   │   │   ├── ReservationsPage.jsx # Full searchable reservations table/cards
│   │   │   ├── FloorPlanPage.jsx    # Dedicated floor plan architecture
│   │   │   └── NewReservationPage.jsx # Full-page booking experience
│   │   ├── styles/
│   │   │   └── index.css        # Warm hospitality design system & status badges
│   │   ├── App.jsx              # React Router setup
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended) & **npm**
- **PHP** (v8.0+ with PDO extension)
- **MySQL / MariaDB** (via XAMPP, WAMP, Laragon, or standalone MySQL)

---

### Step 1: Database Setup (MySQL / phpMyAdmin)

#### Option A: Via phpMyAdmin (XAMPP / WAMP)
1. Start Apache and MySQL from your **XAMPP Control Panel**.
2. Open your browser and navigate to `http://localhost/phpmyadmin/`.
3. Click on the **Import** tab in the top navigation bar.
4. Click **Choose File** and select `backend/database.sql`.
5. Click **Import** at the bottom.
   > The script automatically creates the `zaffran_spice_db` database, creates `tables` and `reservations`, and populates them with 10 tables and 4 realistic Indian guest bookings.

#### Option B: Via MySQL Command Line
```bash
mysql -u root -p < backend/database.sql
```

> **Note on Zero-Configuration Fallback:**  
> The backend `config/db.php` includes an automatic SQLite fallback (`backend/database/zaffran_spice.sqlite`). If MySQL is not running or credentials differ, the REST API and React frontend will automatically work with full data persistence!

---

### Step 2: Start the PHP Backend Server

In your terminal, navigate to the project root and start the PHP built-in web server:

```bash
# From workspace root:
php -S localhost:8000 -t backend
```

Your REST API endpoints will be accessible at:
- `http://localhost:8000/api/tables.php`
- `http://localhost:8000/api/reservations.php`

---

### Step 3: Start the React Frontend

Open a second terminal window, navigate to the `frontend` folder, and start the Vite dev server:

```bash
cd frontend
npm run dev
```

Open your browser at:
👉 **`http://localhost:3000`** (or the port Vite provides)

---

## 📡 REST API Reference

### 1. Dining Tables (`/api/tables.php`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tables.php` | Returns all 10 dining tables with current active guest details, capacities, and zones. |
| `PUT` | `/api/tables.php` | Updates a table's status (`available`, `occupied`, `reserved`). Payload: `{ "id": 1, "status": "occupied" }`. |

### 2. Reservations (`/api/reservations.php`)
| Method | Endpoint | Query / Body | Description |
|---|---|---|---|
| `GET` | `/api/reservations.php` | Optional: `?date=YYYY-MM-DD`, `?status=...`, `?search=...` | Fetches filtered reservations list. |
| `POST` | `/api/reservations.php` | Body: `{ customer_name, phone, email, reservation_date, reservation_time, party_size, special_requests, table_id }` | Validates input, automatically assigns best-fitting table, updates table status to `reserved`. |
| `PUT` | `/api/reservations.php` | Body: `{ id, status, customer_name, ... }` | Updates details or transitions status (`seated` ➔ table `occupied`; `completed`/`cancelled` ➔ table `available`). |
| `DELETE`| `/api/reservations.php?id=...` | Query `?id=5` or body `{ id: 5 }` | Deletes/cancels reservation and automatically frees assigned table. |

---

## 🎨 Design & Aesthetics
- **Color Palette**:
  - Background: Soft warm off-white (`#FAF9F6`)
  - Cards: Crisp white with subtle borders (`#E7E5E4`) and soft elevation shadows
  - Primary Action: Deep Saffron / Terracotta (`#C2410C` / `#EA580C`)
  - Secondary Action: Charcoal Slate (`#1E293B`)
  - Royal Accent: Imperial Navy (`#1E3A8A`)
  - Badges: Emerald Green (Available), Crimson (Occupied), Amber (Reserved)
- **Typography**: Google Fonts *Playfair Display* (headings & table numbers) & *Plus Jakarta Sans* (interface body).

---

## 🛡️ Security & Best Practices
- **SQL Injection Prevention**: All queries execute using PDO Prepared Statements with bound parameters.
- **Input Sanitization**: Email filtering (`FILTER_SANITIZE_EMAIL`), phone regex sanitization, and date/time format validation.
- **CORS Configured**: Preflight `OPTIONS` headers properly resolved.
- **Transaction Safety**: Atomic database transactions (`beginTransaction`, `commit`, `rollBack`) ensure consistent table assignments.
