"use client";
import React, { useState, useEffect } from 'react';
import styles from '../styles/distance.module.css'; // Assuming you have CSS for this

// Aircraft data
const aircraftData = [
  { reg: "OY-GBE", weight: 403.5, balanceArm: 1.689, moment: 681.5115 },
  { reg: "OY-EJM", weight: 406, balanceArm: 1.712, moment: 695.072 },
  { reg: "OY-GBD", weight: 408.25, balanceArm: 1.694, moment: 691.5755 },
  { reg: "OY-MEJ", weight: 400.5, balanceArm: 1.722, moment: 689.661 },
  { reg: "OY-MJE", weight: 398, balanceArm: 1.671, moment: 665.058 },
  { reg: "OY-GBI", weight: 404.5, balanceArm: 1.688, moment: 682.796 },
  { reg: "OY-EMJ", weight: 398.245, balanceArm: 1.687, moment: 671.83932 },



];

// Instructor data
const instructorData = [
  { name: "No Instructor", weight: 0 },
  { name: "Stefàn", weight: 72 },
  { name: "TOR", weight: 76 },
  { name: "Johanna", weight: 72 },
  { name: "Emil", weight: 80 },
  { name: "Dan", weight: 88 },


];

const WeightAndBalanceCalculator = ({ onResult }) => {
  const [selectedAircraft, setSelectedAircraft] = useState(aircraftData[0]);
  const [fuelLiters, setFuelLiters] = useState(0); // Use liters for the slider
  const [pilot, setPilot] = useState('');
  const [instructor, setInstructor] = useState(instructorData[0]);
  const [copilot, setCopilot] = useState('');
  const [baggage, setBaggage] = useState('');
  const [fuelType, setFuelType] = useState(0.754);

  const handleAircraftChange = (e) => {
    const aircraft = aircraftData.find(a => a.reg === e.target.value);
    setSelectedAircraft(aircraft);
  };

  const handleInstructorChange = (e) => {
    const selectedInstructor = instructorData.find(i => i.name === e.target.value);
    setInstructor(selectedInstructor);
  };

  const calculateTotal = () => {
    // Ensure all input values are converted to numbers
    const totalFuel = Number((fuelLiters) * fuelType); // Convert liters to kg
    const totalPilot = Number(pilot) || 0;
    const totalCopilot = instructor.weight > 0 ? instructor.weight : Number(copilot) || 0;
    const totalBaggage = Number(baggage) || 0;
  
    // Calculate total weight and moment
    const totalWeight = (selectedAircraft.weight + totalFuel + totalPilot + totalCopilot + totalBaggage).toFixed(3);
    const fuelMoment = totalFuel * 1.53;
    const pilotMoment = totalPilot * 1.8;
    const copilotMoment = totalCopilot * 1.8;
    const baggageMoment = totalBaggage * 2.26;
    
    const totalMoment = (selectedAircraft.moment + fuelMoment + pilotMoment + copilotMoment + baggageMoment).toFixed(3);
  
    // Return necessary values
    return { 
      totalWeight, 
      totalMoment, 
      totalFuel, 
      totalPilot, 
      totalCopilot, 
      totalBaggage, 
      fuelMoment, 
      pilotMoment, 
      copilotMoment, 
      baggageMoment, 
      selectedAircraftWeight: selectedAircraft.weight, 
      selectedAircraftBalanceArm: selectedAircraft.balanceArm, 
      selectedAircraftMoment: selectedAircraft.moment
    };
  };
  
  // Run this effect to send data when total weight, fuel, etc. changes
  useEffect(() => {
    const { 
      totalMoment, 
      totalWeight, 
      totalFuel, 
      totalPilot, 
      totalCopilot, 
      totalBaggage, 
      fuelMoment, 
      pilotMoment, 
      copilotMoment, 
      baggageMoment, 
      selectedAircraftWeight, 
      selectedAircraftBalanceArm, 
      selectedAircraftMoment 
    } = calculateTotal();
  
    if (onResult) {
      // Pass relevant data via the onResult prop
      onResult({
        weight: selectedAircraftWeight,
        fuel: totalFuel,
        fuel_moment: fuelMoment,
        pilot: totalPilot + totalCopilot,
        pilot_moment: pilotMoment + copilotMoment,
        baggage: totalBaggage,
        baggage_moment: baggageMoment,
        total_moment: totalMoment, // Balance arm = total moment / total weight
        balanceArm: selectedAircraftBalanceArm, // Including balance arm in the result
        aircraftMoment: selectedAircraftMoment, 
        totalWeight: totalWeight,
        total_balance: totalMoment / totalWeight,
      });
    }
    
  }, [fuelLiters, pilot, copilot, baggage, selectedAircraft, instructor, onResult]);
  

  const { totalWeight, totalMoment} = calculateTotal();

  // Calculate the balance arm in millimeters, rounded to the nearest integer
  const balanceArm = totalWeight !== 0 ? Math.round((totalMoment / totalWeight) * 1000) : 0;

  // Determine color conditions
  const isWeightBelowLimit = totalWeight < 620;
  const isWeightAboveLimit = totalWeight > 620;
  const isBalanceArmTooLow = balanceArm < 1693;
  const isBalanceArmTooHigh = balanceArm > 1782;

  // Container style based on weight and balance arm conditions
  const containerStyle = (totalWeight <= 620 && balanceArm >= 1693 && balanceArm <= 1782) ? styles.successContainer : styles.calculatorContainer;

  return (
    <div className={containerStyle}>
      <h1>Weight and Balance</h1>
      
      <div className={styles.inputGroupRow}>
        <div className={styles.inputGroup}>
          <label htmlFor="aircraft">Select Aircraft:</label>
          <select id="aircraft" onChange={handleAircraftChange}>
            {aircraftData.map((aircraft) => (
              <option key={aircraft.reg} value={aircraft.reg}>
                {aircraft.reg}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="instructor">Select Instructor:</label>
          <select id="instructor" onChange={handleInstructorChange}>
            {instructorData.map((instructor) => (
              <option key={instructor.name} value={instructor.name}>
                {instructor.name} ({instructor.weight} kg)
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.inputGroup}>
        <label>Fuel Type:</label>
        <button 
          className={fuelType === 0.754 ? styles.selectedButton : styles.button} 
          onClick={() => setFuelType(0.754)}
        >
          Mogas (0.754 kg/L)
        </button>
        <button 
          className={fuelType === 0.72 ? styles.selectedButton : styles.button} 
          onClick={() => setFuelType(0.72)}
        >
          Avgas (0.72 kg/L)
        </button>
      </div>
      {/* Slider for Fuel Input */}
      <div className={styles.inputGroup}>
        <label htmlFor="fuel">Fuel (liters):</label>
        <input 
          type="range" 
          id="fuel" 
          min="0" 
          max="100" // Set the maximum liters as per your requirement
          value={fuelLiters}
          onChange={(e) => setFuelLiters(e.target.value)} 
        />
        <span>{fuelLiters} L</span> {/* Display the current fuel in liters */}
      </div>
      
      <div className={styles.inputGroup}>
        <label htmlFor="pilot">Pilot Weight (kg):</label>
        <input 
          type="number" 
          id="pilot" 
          value={pilot} 
          onChange={(e) => setPilot(e.target.value)} 
          placeholder="Enter Pilot Weight"
        />
      </div>

      {instructor.name === "No Instructor" && (
        <div className={styles.inputGroup}>
          <label htmlFor="copilot">Copilot Weight (kg):</label>
          <input 
            type="number" 
            id="copilot" 
            value={copilot} 
            onChange={(e) => setCopilot(e.target.value)} 
            placeholder="Enter Copilot Weight"
          />
        </div>
      )}

      <div className={styles.inputGroup}>
        <label htmlFor="baggage">Baggage Weight (kg):</label>
        <input 
          type="number" 
          id="baggage" 
          value={baggage} 
          onChange={(e) => setBaggage(e.target.value)} 
          placeholder="Enter Baggage Weight"
        />
      </div>

      <div className={styles.resultContainer}>
        <h3>Calculation Results</h3>
        <p style={{ color: isWeightAboveLimit ? 'red' : (isWeightBelowLimit ? 'green' : 'black') }}>
          Total Weight: {totalWeight} kg
        </p>
        <p>Total Moment: {totalMoment} kg·m</p>
        <p style={{ color: isBalanceArmTooLow || isBalanceArmTooHigh ? 'red' : (isWeightBelowLimit && balanceArm >= 1693 && balanceArm <= 1782 ? 'green' : 'black') }}>
          Balance Arm: {balanceArm} mm
        </p>
      </div>
    </div>
  );
};

export default WeightAndBalanceCalculator;
