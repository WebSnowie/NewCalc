"use client";
import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib'; // For generating and manipulating PDFs
import TakeoffCalculator from './components/weightupdated'; // Takeoff Calculator component
import WeightAndBalanceCalculator from './components/distance'; // Weight and Balance Calculator component
import styles from './page.module.css'; // CSS for styling

// PDF Download Button Component
const SavePDFButton = ({ takeoffResult, weightBalanceResult }) => {
  const handleDownloadPDF = async (event) => {
    event.preventDefault(); // Prevents any default button behavior

    const pdfUrl = `/form.pdf?t=${new Date().getTime()}`; // Path to the PDF
    try {
      const response = await fetch(pdfUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
      }

      const existingPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      // Log all form fields to see if they're being detected correctly
      const fields = form.getFields();
      fields.forEach((field) => {
        console.log(`Field name: ${field.getName()}`);
      });

      // Helper function to format values
      const formatValue = (value) => {
        if (typeof value === 'number' && !isNaN(value)) {
          return Number.isInteger(value) ? value.toString() : value.toFixed(3);
        }
      };

      // Populate the PDF with results from both calculators
      if (weightBalanceResult && takeoffResult) {
        const {
          weight,
          fuel,
          fuel_moment,
          pilot,
          pilot_moment,
          baggage,
          baggage_moment,
          total_balance,
          balanceArm,
          aircraftMoment
        } = weightBalanceResult;
        const totalW = weight + fuel + pilot + baggage;
        const totalB = aircraftMoment + fuel_moment + pilot_moment + baggage_moment;
        const {
          takeoffDistanceWithoutSafetyFactor,
          takeoffDistanceWithIncreasedRotationSpeed,
          correctedTakeoffDistance,
          landingDistanceWithoutSafetyFactor,
          landingDistanceWithIncreasedRotationSpeed,
          correctedLandingDistance
        } = takeoffResult;

        // Ensure correct field names and types in the PDF form
        form.getTextField('empty').setText(formatValue(weight));
        form.getTextField('FUEL').setText(formatValue(fuel));
        form.getTextField('fuel_moment').setText(formatValue(fuel_moment));
        form.getTextField('PILOT').setText(formatValue(pilot));
        form.getTextField('pilot_moment').setText(formatValue(pilot_moment));
        form.getTextField('BAGAGE').setText(formatValue(baggage));
        form.getTextField('bagage_moment').setText(formatValue(baggage_moment));
        
        form.getTextField('total_moment').setText(formatValue(totalB)); // Ensure field name matches PDF
        form.getTextField('total_balance').setText(formatValue(total_balance));
        form.getTextField('TOTAL').setText(formatValue(totalW)); // Ensure field name matches PDF
        form.getTextField('aircraft_balanceArm').setText(formatValue(balanceArm));
        form.getTextField('aircraft_Moment').setText(formatValue(aircraftMoment));

        // Takeoff Data
        form.getTextField('Take-offdistance').setText(formatValue(takeoffDistanceWithoutSafetyFactor));
        form.getTextField('Corrected take-off distance').setText(formatValue(takeoffDistanceWithIncreasedRotationSpeed));
        form.getTextField('Minimum runway length').setText(formatValue(correctedTakeoffDistance));

        // Landing Data
        form.getTextField('landingDistance').setText(formatValue(landingDistanceWithoutSafetyFactor));
        form.getTextField('CorrectedLanding').setText(formatValue(landingDistanceWithIncreasedRotationSpeed));
        form.getTextField('CorrectedLandingSafety').setText(formatValue(correctedLandingDistance));

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Pre-Flight Calculations.pdf';
        link.click();
      } else {
        alert("Results are not available. Please perform calculations first.");
      }
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert(`Failed to load PDF document: ${error.message}. Please check the file path and try again.`);
    }
  };

  return (
    <button className={styles.saveButton} onClick={handleDownloadPDF}>
      Save PDF
    </button>
  );
};

// Main Calculator Component
const MainCalculator = () => {
  const [takeoffResult, setTakeoffResult] = useState(null); // For takeoff results
  const [weightBalanceResult, setWeightBalanceResult] = useState(null); // For weight and balance results

  useEffect(() => {
    console.log("Takeoff Result:", takeoffResult);
    console.log("Weight and Balance Result:", weightBalanceResult);
  }, [takeoffResult, weightBalanceResult]);

  return (
    <div className={styles.mainContainer}>
      <h1>Flight Preparation Calculator</h1>

      {/* Takeoff Calculator */}
      <TakeoffCalculator onResult={setTakeoffResult} />

      {/* Weight and Balance Calculator */}
      <WeightAndBalanceCalculator onResult={setWeightBalanceResult} />

      {/* Save PDF Button - Show only if both calculators have results */}
      {takeoffResult && weightBalanceResult && (
        <div className={styles.buttonContainer}>
        <SavePDFButton takeoffResult={takeoffResult} weightBalanceResult={weightBalanceResult} />
        </div>
      )}
    </div>
  );
};

export default MainCalculator;
