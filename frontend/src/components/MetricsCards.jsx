import React from 'react';
import { useReservations } from '../context/ReservationContext';
import styles from './MetricsCards.module.css';

export default function MetricsCards() {
  const { tables, availableCount, occupiedCount, reservedCount, expectedGuestsToday } = useReservations();
  const totalTables = tables.length || 10;
  const occupancyRate = Math.round(((occupiedCount + reservedCount) / totalTables) * 100);

  return (
    <div className={styles.grid}>
      {/* 1. Available Tables */}
      <div className={`${styles.metricCard} ${styles.availableTheme}`}>
        <div className={styles.cardTop}>
          <span className={styles.label}>Available Tables</span>
          <div className={styles.iconWrapper}>🪑</div>
        </div>
        <div className={styles.value}>{availableCount}</div>
        <div className={styles.subText}>{totalTables - availableCount} of {totalTables} currently committed</div>
        <div className={styles.progressBarBg}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${(availableCount / totalTables) * 100}%` }}
          />
        </div>
      </div>

      {/* 2. Occupied Tables */}
      <div className={`${styles.metricCard} ${styles.occupiedTheme}`}>
        <div className={styles.cardTop}>
          <span className={styles.label}>Occupied Tables</span>
          <div className={styles.iconWrapper}>🍽️</div>
        </div>
        <div className={styles.value}>{occupiedCount}</div>
        <div className={styles.subText}>Active dining service in progress</div>
        <div className={styles.progressBarBg}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${(occupiedCount / totalTables) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. Reserved Tables */}
      <div className={`${styles.metricCard} ${styles.reservedTheme}`}>
        <div className={styles.cardTop}>
          <span className={styles.label}>Reserved Tables</span>
          <div className={styles.iconWrapper}>📅</div>
        </div>
        <div className={styles.value}>{reservedCount}</div>
        <div className={styles.subText}>Awaiting confirmed guest arrivals</div>
        <div className={styles.progressBarBg}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${(reservedCount / totalTables) * 100}%` }}
          />
        </div>
      </div>

      {/* 4. Expected Guests Today */}
      <div className={`${styles.metricCard} ${styles.guestsTheme}`}>
        <div className={styles.cardTop}>
          <span className={styles.label}>Expected Covers Today</span>
          <div className={styles.iconWrapper}>👥</div>
        </div>
        <div className={styles.value}>{expectedGuestsToday}</div>
        <div className={styles.subText}>{occupancyRate}% overall floor capacity booked</div>
        <div className={styles.progressBarBg}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
