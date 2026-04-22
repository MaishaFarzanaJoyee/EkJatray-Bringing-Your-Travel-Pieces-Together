import React from 'react';
import WellnessBooking from './wellness-booking';
import Recommendation from './recommendation'; // Import your second page!

function App() {
  return (
    <div>
      {/* 1. This will render your Recommendation page at the top */}
      <Recommendation />
      
      
      {/* 3. This will render your Wellness page at the bottom */}
      <WellnessBooking />
    </div>
  );
}

export default App;