import React from 'react';
import MetricsCards from '../components/MetricsCards';
import ReservationForm from '../components/ReservationForm';
import TableFloorPlan from '../components/TableFloorPlan';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  return (
    <div className="animate-fade-in">
      {/* Top 4 Summary Cards */}
      <MetricsCards />

      {/* Split-Screen: Quick Booking on Left, Live Floor Layout on Right */}
      <div className={styles.splitLayout}>
        <div className={styles.leftCol}>
          <ReservationForm compact={true} />
        </div>
        <div className={styles.rightCol}>
          <TableFloorPlan />
        </div>
      </div>
    </div>
  );
}
