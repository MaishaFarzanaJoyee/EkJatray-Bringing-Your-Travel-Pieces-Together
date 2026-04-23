import React from 'react';
import WellnessBooking from './wellness-booking';
import Recommendation from './recommendation'; 
import WeatherPlanner from './weatherplanner';
import InAppNotifications from './InAppNotifications';

function App() {
  return (
    <div>
      <div className="flex justify-end p-4 bg-gray-100 shadow-sm">
         <InAppNotifications />
      </div>
      <Recommendation />
      <WellnessBooking />
      <WeatherPlanner />

    </div>
  );
}

export default App;