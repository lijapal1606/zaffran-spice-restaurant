import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useReservations } from '../context/ReservationContext';
import styles from './Header.module.css';

export default function Header() {
  const { availableCount, backendConnected, refreshData, loading } = useReservations();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link to="/" className={styles.brand}>
          <div className={styles.logoIcon}>Z&amp;S</div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Zaffran &amp; Spice</span>
            <span className={styles.brandSubtitle}>Royal Indian Dining &amp; Majlis</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/reservations"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            Reservations
          </NavLink>
          <NavLink
            to="/tables"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            Floor Plan
          </NavLink>
          <NavLink
            to="/new-reservation"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            + Book Table
          </NavLink>
        </nav>

        {/* Right Section: Counter Pill & Manager Profile */}
        <div className={styles.actions}>
          {/* Live Available Tables Counter */}
          <div className={styles.counterPill} title="Tables currently free for booking">
            <span className={`${styles.counterDot} pulse-dot`} />
            <span>{availableCount} Tables Free</span>
          </div>

          {/* Sync Button / Status */}
          <button
            onClick={() => refreshData(true)}
            disabled={loading}
            className={`${styles.syncPill} ${backendConnected ? styles.syncOnline : styles.syncCached}`}
            title={backendConnected ? 'Connected to PHP MySQL backend' : 'Running with local storage cache (Click to reconnect)'}
          >
            <span>{backendConnected ? '🟢 API Online' : '🟠 Local Cache'}</span>
          </button>

          {/* Manager Avatar */}
          <div className={styles.managerAvatar}>
            <div className={styles.avatarCircle}>VS</div>
            <div className={styles.managerInfo}>
              <span className={styles.managerName}>Vikram S.</span>
              <span className={styles.managerRole}>Duty Manager</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
