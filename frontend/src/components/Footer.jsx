import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <div className={styles.footerTitle}>Zaffran &amp; Spice</div>
          <p className={styles.footerDesc}>
            Authentic Awadhi, Mughlai, and Coastal Indian culinary heritage. Curated dining spaces, royal majlis alcoves, and live tandoor artistry.
          </p>
        </div>

        <div>
          <div className={styles.heading}>Dining Hours</div>
          <ul className={styles.list}>
            <li><strong>Lunch Service:</strong> 12:00 PM – 3:30 PM</li>
            <li><strong>Dinner Service:</strong> 7:00 PM – 11:30 PM</li>
            <li><strong>Weekend High Tea:</strong> 4:30 PM – 6:30 PM</li>
            <li>Open 7 Days a Week</li>
          </ul>
        </div>

        <div>
          <div className={styles.heading}>Dining Ambiance</div>
          <ul className={styles.list}>
            <li>🏛️ <strong>Main Dining:</strong> Grand Chandeliers</li>
            <li>🌿 <strong>Courtyard:</strong> Open-air Veranda</li>
            <li>👑 <strong>Royal Majlis:</strong> Luxury Private Booths</li>
            <li>🍷 Sommelier &amp; Mocktail Bar</li>
          </ul>
        </div>

        <div>
          <div className={styles.heading}>Concierge &amp; Location</div>
          <ul className={styles.list}>
            <li>📍 42 Heritage Palace Avenue</li>
            <li>📞 Desk: +91 98765 00123</li>
            <li>✉️ concierge@zaffranspice.com</li>
            <li>Valet Parking Available</li>
          </ul>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <span>&copy; {new Date().getFullYear()} Zaffran &amp; Spice Hospitality Group. All rights reserved.</span>
        <div className={styles.techPills}>
          <span className={styles.techPill}>React 18</span>
          <span className={styles.techPill}>React Router 6</span>
          <span className={styles.techPill}>PHP 8+ REST API</span>
          <span className={styles.techPill}>MySQL / PDO</span>
        </div>
      </div>
    </footer>
  );
}
