"use client";
import React, { useState } from 'react';
import axios from 'axios'; // Import Axios
import styles from "../styles/weightbalance.module.css"; // Assuming you will create this CSS file

// Lookup tables for ground roll and 50ft distance, including negative temperatures
const groundRollTable = {
  '0': { '-25': 154, '0': 203, '25': 262, '50': 331 },
  '1000': { '-25': 169, '0': 223, '25': 287, '50': 364 },
  '2000': { '-25': 186, '0': 245, '25': 316, '50': 401 },
  '3000': { '-25': 204, '0': 269, '25': 348, '50': 442 },
  '4000': { '-25': 225, '0': 296, '25': 383, '50': 487 },
  '5000': { '-25': 247, '0': 327, '25': 423, '50': 538 },
  '6000': { '-25': 272, '0': 360, '25': 466, '50': 594 },
  '7000': { '-25': 300, '0': 397, '25': 515, '50': 657 },
  '8000': { '-25': 331, '0': 439, '25': 570, '50': 727 },
  '9000': { '-25': 366, '0': 486, '25': 631, '50': 806 },
  '10000': { '-25': 405, '0': 538, '25': 700, '50': 895 },
};

const distance50ftTable = {
  '0': { '-25': 252, '0': 335, '25': 434, '50': 553 },
  '1000': { '-25': 277, '0': 368, '25': 478, '50': 610 },
  '2000': { '-25': 305, '0': 405, '25': 526, '50': 672 },
  '3000': { '-25': 336, '0': 446, '25': 580, '50': 742 },
  '4000': { '-25': 370, '0': 492, '25': 641, '50': 820 },
  '5000': { '-25': 408, '0': 543, '25': 708, '50': 907 },
  '6000': { '-25': 450, '0': 600, '25': 783, '50': 1005 },
  '7000': { '-25': 498, '0': 664, '25': 867, '50': 1114 },
  '8000': { '-25': 551, '0': 735, '25': 962, '50': 1236 },
  '9000': { '-25': 610, '0': 815, '25': 1068, '50': 1374 },
  '10000': { '-25': 676, '0': 905, '25': 1186, '50': 1529 },
};

// Lookup tables for landing distances
const landingGroundRollTable = {
  '0': { '-25': 141, '0': 155, '25': 170, '50': 184 },
  '1000': { '-25': 146, '0': 161, '25': 176, '50': 191 },
  '2000': { '-25': 152, '0': 167, '25': 183, '50': 198 },
  '3000': { '-25': 158, '0': 173, '25': 189, '50': 205 },
  '4000': { '-25': 164, '0': 180, '25': 196, '50': 213 },
  '5000': { '-25': 170, '0': 187, '25': 204, '50': 221 },
  '6000': { '-25': 176, '0': 194, '25': 212, '50': 230 },
  '7000': { '-25': 183, '0': 201, '25': 220, '50': 238 },
  '8000': { '-25': 190, '0': 209, '25': 228, '50': 248 },
  '9000': { '-25': 198, '0': 217, '25': 237, '50': 257 },
  '10000': { '-25': 205, '0': 226, '25': 247, '50': 267 },
};

const landing50ftTable = {
  '0': { '-25': 277, '0': 305, '25': 333, '50': 361 },
  '1000': { '-25': 288, '0': 317, '25': 345, '50': 374 },
  '2000': { '-25': 298, '0': 328, '25': 358, '50': 388 },
  '3000': { '-25': 309, '0': 341, '25': 372, '50': 403 },
  '4000': { '-25': 321, '0': 353, '25': 386, '50': 418 },
  '5000': { '-25': 333, '0': 367, '25': 400, '50': 434 },
  '6000': { '-25': 346, '0': 381, '25': 416, '50': 451 },
  '7000': { '-25': 359, '0': 396, '25': 432, '50': 468 },
  '8000': { '-25': 373, '0': 411, '25': 449, '50': 486 },
  '9000': { '-25': 388, '0': 427, '25': 466, '50': 505 },
  '10000': { '-25': 403, '0': 444, '25': 484, '50': 525 },
};

// Function to perform linear interpolation
const interpolate = (lowerValue, upperValue, lowerTemp, upperTemp, currentTemp) => {
  return lowerValue + ((currentTemp - lowerTemp) / (upperTemp - lowerTemp)) * (upperValue - lowerValue);
};

const TakeoffAndLandingCalculator = ({onResult}) => {
  const [inputs, setInputs] = useState({ QNH: '', temperature: '', fieldElevation: '', metar: '' });
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [id]: value,
    }));
  };
  const findClosestTemperatures = (temp) => {
    const temperatureKeys = [-25, 0, 25, 50];
    let lowerTemp = null;
    let upperTemp = null;

    for (const key of temperatureKeys) {
      if (key <= temp) {
        lowerTemp = key;
      } else if (key > temp && upperTemp === null) {
        upperTemp = key;
        break;
      }
    }

    return { lowerTemp, upperTemp };
  };

  const calculateTakeoffDistance = async () => {
    const QNH = Number(inputs.QNH) || 0;
    const temperature = Number(inputs.temperature) || 0;
    const fieldElevation = Number(inputs.fieldElevation) || 0;

    // Calculate Pressure Altitude
    let pressureAltitude = (1013 - QNH) * 30 + fieldElevation;
    

    // If pressure altitude is negative, set it to 0
    if (pressureAltitude < 0) {
      pressureAltitude = 0;
    }
    let modifiedPressureAltitude = pressureAltitude.length === 4 ? pressureAltitude.slice(1) : pressureAltitude;
    
    // Determine lower and upper altitudes for interpolation
    const lowerAltitude = Math.floor(pressureAltitude / 1000) * 1000;
    const upperAltitude = lowerAltitude + 1000;

    // Find the closest temperatures for interpolation
    const { lowerTemp, upperTemp } = findClosestTemperatures(temperature);

    // Interpolate for ground roll and distance at lower altitude
    const interpolatedGroundRoll = interpolate(
      groundRollTable[`${lowerAltitude}`][lowerTemp],
      groundRollTable[`${lowerAltitude}`][upperTemp],
      lowerTemp,
      upperTemp,
      temperature
    );    
    
    
    const interpolatedDistance50ft = interpolate(
      distance50ftTable[`${lowerAltitude}`][lowerTemp],
      distance50ftTable[`${lowerAltitude}`][upperTemp],
      lowerTemp,
      upperTemp,
      temperature
    );
    
    
    const interpolatedLandingGroundRoll = interpolate(
      landingGroundRollTable[`${lowerAltitude}`][lowerTemp],
      landingGroundRollTable[`${lowerAltitude}`][upperTemp],
      lowerTemp,
      upperTemp,
      temperature
    );
    
    
    const interpolatedLandingDistance50ft = interpolate(
      landing50ftTable[`${lowerAltitude}`][lowerTemp],
      landing50ftTable[`${lowerAltitude}`][upperTemp],
      lowerTemp,
      upperTemp,
      temperature
    );
    
    let upperInterpolatedGroundRoll, upperInterpolatedDistance50ft; // Declare the variables

    if (pressureAltitude > 0) {
      // Upper altitude calculations
      upperInterpolatedDistance50ft = interpolate(
        distance50ftTable[`${upperAltitude}`][lowerTemp],
        distance50ftTable[`${upperAltitude}`][upperTemp],
        Number(lowerTemp),
        Number(upperTemp),
        temperature
      
      );
      upperInterpolatedGroundRoll = interpolate(
        groundRollTable[`${upperAltitude}`][lowerTemp],
        groundRollTable[`${upperAltitude}`][upperTemp],
        Number(lowerTemp),
        Number(upperTemp),
        temperature
        
      );
    }
    let upperInterpolatedLandingGroundRoll, upperInterpolatedLandingDistance50ft; // Declare the variables

    if (pressureAltitude > 0) {
      // Upper altitude calculations
      upperInterpolatedLandingDistance50ft = interpolate(
        landing50ftTable[`${upperAltitude}`][lowerTemp],
        landing50ftTable[`${upperAltitude}`][upperTemp],
        Number(lowerTemp),
        Number(upperTemp),
        temperature
      );
      
      upperInterpolatedLandingGroundRoll = interpolate(
        landingGroundRollTable[`${upperAltitude}`][lowerTemp],
        landingGroundRollTable[`${upperAltitude}`][upperTemp],
        Number(lowerTemp),
        Number(upperTemp),
        temperature
      );
    }
            // used for calculation output for PDF
    const calcPressureAltitude = `(1013 - ${QNH}) * 30 + ${fieldElevation}`;
    const calcLowerValue = groundRollTable[`${lowerAltitude}`][lowerTemp]
    const calcHigherValue = groundRollTable[`${lowerAltitude}`][upperTemp]
    const calcCombinedValue = `${calcHigherValue} - ${calcLowerValue}`;
    const testtt = (((calcHigherValue - calcLowerValue) / 25 * temperature))
    const calcdividedValue = `${calcCombinedValue} = ${calcHigherValue - calcLowerValue} / 25 * ${temperature} = ${testtt.toFixed(3)} + ${calcLowerValue} = ${(testtt + calcLowerValue).toFixed(3)}`

      // USED FOR calculation the 50ft above
      const calcLower50ftValue = distance50ftTable[`${lowerAltitude}`][lowerTemp]
      const calcHigher50ftValue = distance50ftTable[`${lowerAltitude}`][upperTemp]
      const calcCombined50ftValue = `${calcHigher50ftValue} - ${calcLower50ftValue}`;
      const testtt50ft = (((calcHigher50ftValue - calcLower50ftValue) / 25 * temperature))
      const calcdividedValue50ft = `${calcCombined50ftValue} = ${calcHigher50ftValue - calcLower50ftValue} / 25 * ${temperature} = ${testtt50ft.toFixed(3)} + ${calcLower50ftValue} = ${(testtt50ft + calcLower50ftValue).toFixed(3)}`


      const landingcalcLowerValue = landingGroundRollTable[`${lowerAltitude}`][lowerTemp]
      const landingcalcHigherValue = landingGroundRollTable[`${lowerAltitude}`][upperTemp]
      const landingcalcCombinedValue = `${landingcalcHigherValue} - ${landingcalcLowerValue}`;
      const landingtesttt = (((landingcalcHigherValue - landingcalcLowerValue) / 25 * temperature))
      const landingcalcdividedValue = `${landingcalcCombinedValue} = ${landingcalcHigherValue - landingcalcLowerValue} / 25 * ${temperature} = ${landingtesttt.toFixed(3)} + ${landingcalcLowerValue} = ${(landingtesttt + landingcalcLowerValue).toFixed(3)}`
  
        // USED FOR calculation the 50ft above
        const landingcalcLower50ftValue = landing50ftTable[`${lowerAltitude}`][lowerTemp]
        const landingcalcHigher50ftValue = landing50ftTable[`${lowerAltitude}`][upperTemp]
        const landingcalcCombined50ftValue = `${landingcalcHigher50ftValue} - ${landingcalcLower50ftValue}`;
        const landingtesttt50ft = (((landingcalcHigher50ftValue - landingcalcLower50ftValue) / 25 * temperature))
        const landingcalcdividedValue50ft = `${landingcalcCombined50ftValue} = ${landingcalcHigher50ftValue - landingcalcLower50ftValue} / 25 * ${temperature} = ${landingtesttt50ft.toFixed(3)} + ${landingcalcLower50ftValue} = ${(landingtesttt50ft + landingcalcLower50ftValue).toFixed(3)}`
  



        let LandingfinalcalcHigherdividedValue;
        let LandingfinalcalcinterpolatedGR;
        let LandingfinalcalchigherdividedValue50ft;
        let LandingfinalCalculation;
  
        if (upperInterpolatedLandingGroundRoll > 0) {
        const LandingcalchighHigherValue = landingGroundRollTable[`${upperAltitude}`][lowerTemp]
        const LandingcalcLowerHigherValue = landingGroundRollTable[`${upperAltitude}`][upperTemp]
        const LandingcalcHigherCombinedValue = `${LandingcalcLowerHigherValue} - ${LandingcalchighHigherValue}`;
        const Landingtestt = (((LandingcalcLowerHigherValue - LandingcalchighHigherValue) / 25 * temperature));
        const LandingcalcHigherdividedValue = `${LandingcalcHigherCombinedValue} = ${LandingcalcLowerHigherValue - LandingcalchighHigherValue} / 25 * ${temperature} = ${Landingtestt.toFixed(3)} + ${LandingcalchighHigherValue} = ${(Landingtestt + LandingcalchighHigherValue).toFixed(3)}` 
        // USed for 50ft above ground!
        
        const LandingcalchighHigher50ftValue = landing50ftTable[`${upperAltitude}`][lowerTemp]
        const LandingcalcLowerHigher50ftValue = landing50ftTable[`${upperAltitude}`][upperTemp]
        const LandingcalcHigherCombined50ftValue = `${LandingcalcLowerHigher50ftValue} - ${LandingcalchighHigher50ftValue}`;
        const Landingtestt50ft = (((LandingcalcLowerHigher50ftValue - LandingcalchighHigher50ftValue) / 25 * temperature));
        const LandingcalcHigherdividedValue50ft = `${LandingcalcHigherCombined50ftValue} = ${LandingcalcLowerHigher50ftValue - LandingcalchighHigher50ftValue} / 25 * ${temperature} = ${Landingtestt50ft.toFixed(3)} + ${LandingcalchighHigher50ftValue} = ${(Landingtestt50ft + LandingcalchighHigher50ftValue).toFixed(3)}` 
        
        //interpolate between altitudes
  
        const LandinginterpolatedValue = (Landingtestt + LandingcalchighHigherValue) - (landingtesttt + landingcalcLowerValue)
        
        const LandingcalcinterpolatedGR = `${Landingtestt + LandingcalchighHigherValue} - ${landingtesttt + landingcalcLowerValue} = ${LandinginterpolatedValue.toFixed(3)} / ${(1000 / modifiedPressureAltitude).toFixed(3) } (1000 / Pressure altitude) = ${(LandinginterpolatedValue/(1000 / modifiedPressureAltitude)).toFixed(3)} + ${landingtesttt + landingcalcLowerValue} = (${(landingtesttt + landingcalcLowerValue + LandinginterpolatedValue / (1000 / modifiedPressureAltitude)).toFixed(3)}) * 0.02 = ${((landingtesttt + landingcalcLowerValue + (LandinginterpolatedValue) / (1000 / modifiedPressureAltitude)) * 0.02).toFixed(3)}`      
  
        const LandingaddedVal = (landingtesttt + landingcalcLowerValue + (LandinginterpolatedValue) / (1000 / modifiedPressureAltitude)) * 0.02
        const Landinginterpolated50ftValue = (Landingtestt50ft + LandingcalchighHigher50ftValue) - (landingtesttt50ft + landingcalcLower50ftValue)
        const Landingcalcinterpolated50ft = `${Landingtestt50ft + LandingcalchighHigher50ftValue} - ${landingtesttt50ft + landingcalcLower50ftValue} = ${Landinginterpolated50ftValue.toFixed(3)} / ${(1000 / modifiedPressureAltitude).toFixed(3) } (1000 / Pressure altitude) = ${(Landinginterpolated50ftValue/(1000 / modifiedPressureAltitude)).toFixed(3)} + ${landingtesttt50ft + landingcalcLower50ftValue } - ${LandingaddedVal} = ${(landingtesttt50ft + landingcalcLower50ftValue + Landinginterpolated50ftValue / (1000 / modifiedPressureAltitude)-LandingaddedVal).toFixed(3)}`      
        
        LandingfinalCalculation = Landingcalcinterpolated50ft; 
        LandingfinalcalcinterpolatedGR = LandingcalcinterpolatedGR;
        LandingfinalcalcHigherdividedValue = LandingcalcHigherdividedValue; 
        LandingfinalcalchigherdividedValue50ft = LandingcalcHigherdividedValue50ft;
          }
        else {
          const Landingcalculated = (landingtesttt + landingcalcLowerValue) * 0.02
          const Landingfinalwithoutalt = `(${landingtesttt + landingcalcLowerValue}) = ${Landingcalculated}`
          const LandingfinalCalcwithAlt = `${landingcalcLower50ftValue + landingtesttt50ft} - ${Landingcalculated} = ${landingtesttt50ft + landingcalcLower50ftValue - Landingcalculated} `
  
         LandingfinalcalcHigherdividedValue = Landingfinalwithoutalt;
          LandingfinalcalchigherdividedValue50ft = LandingfinalCalcwithAlt; 
        }      
  
      // used for calc if there is altitude for PDF
      let finalcalcHigherdividedValue;
      let finalcalcinterpolatedGR;
      let finalcalchigherdividedValue50ft;
      let finalcalcinterpolated50ft;
      let finalCalculation;

      if (upperInterpolatedLandingGroundRoll > 0) {
      const calchighHigherValue = groundRollTable[`${upperAltitude}`][lowerTemp]
      const calcLowerHigherValue = groundRollTable[`${upperAltitude}`][upperTemp]
      const calcHigherCombinedValue = `${calcLowerHigherValue} - ${calchighHigherValue}`;
      const testt = (((calcLowerHigherValue - calchighHigherValue) / 25 * temperature));
      const calcHigherdividedValue = `${calcHigherCombinedValue} = ${calcLowerHigherValue - calchighHigherValue} / 25 * ${temperature} = ${testt.toFixed(3)} + ${calchighHigherValue} = ${(testt + calchighHigherValue).toFixed(3)}` 
      // USed for 50ft above ground!
      
      const calchighHigher50ftValue = distance50ftTable[`${upperAltitude}`][lowerTemp]
      const calcLowerHigher50ftValue = distance50ftTable[`${upperAltitude}`][upperTemp]
      const calcHigherCombined50ftValue = `${calcLowerHigher50ftValue} - ${calchighHigher50ftValue}`;
      const testt50ft = (((calcLowerHigher50ftValue - calchighHigher50ftValue) / 25 * temperature));
      const calcHigherdividedValue50ft = `${calcHigherCombined50ftValue} = ${calcLowerHigher50ftValue - calchighHigher50ftValue} / 25 * ${temperature} = ${testt50ft.toFixed(3)} + ${calchighHigher50ftValue} = ${(testt50ft + calchighHigher50ftValue).toFixed(3)}` 
      
      //interpolate between altitudes

      const interpolatedValue = (testt + calchighHigherValue) - (testtt + calcLowerValue)
      
      const calcinterpolatedGR = `${testt + calchighHigherValue} - ${testtt + calcLowerValue} = ${interpolatedValue.toFixed(3)} / ${(1000 / modifiedPressureAltitude).toFixed(3) } (1000 / Pressure altitude) = ${(interpolatedValue/(1000 / modifiedPressureAltitude)).toFixed(3)} + ${testtt + calcLowerValue} = (${(testtt + calcLowerValue + interpolatedValue / (1000 / modifiedPressureAltitude)).toFixed(3)} + 50) * 0.06 = ${((testtt + calcLowerValue + (interpolatedValue) / (1000 / modifiedPressureAltitude) + 50) * 0.06).toFixed(3)}`      

      const addedVal = (testtt + calcLowerValue + (interpolatedValue) / (1000 / modifiedPressureAltitude) + 50) * 0.06
      const interpolated50ftValue = (testt50ft + calchighHigher50ftValue) - (testtt50ft + calcLower50ftValue)
      const calcinterpolated50ft = `${testt50ft + calchighHigher50ftValue} - ${testtt50ft + calcLower50ftValue} = ${interpolated50ftValue.toFixed(3)} / ${(1000 / modifiedPressureAltitude).toFixed(3) } (1000 / Pressure altitude) = ${(interpolated50ftValue/(1000 / modifiedPressureAltitude)).toFixed(3)} + ${testtt50ft + calcLower50ftValue } - ${addedVal} = ${(testtt50ft + calcLower50ftValue + interpolated50ftValue / (1000 / modifiedPressureAltitude)-addedVal).toFixed(3)}`      
      
      finalCalculation = calcinterpolated50ft; 
      finalcalcinterpolatedGR = calcinterpolatedGR;
      finalcalcHigherdividedValue = calcHigherdividedValue; 
      finalcalchigherdividedValue50ft = calcHigherdividedValue50ft;
        }
      else {
        const calculated = (testtt + calcLowerValue + 50) * 0.06
        const finalwithoutalt = `(${testtt + calcLowerValue} + ${50}) * 0.06 = ${calculated}`
        const finalCalcwithAlt = `${calcLower50ftValue + testtt50ft} - ${calculated} = ${testtt50ft + calcLower50ftValue - calculated} `

        finalcalcHigherdividedValue = finalwithoutalt;
        finalcalchigherdividedValue50ft = finalCalcwithAlt; 
      }      

    let finaladjustedtakeoff; // Declare it outside the if statement

    if (modifiedPressureAltitude > 0) {
        // const upperadjustedGroundRolls = ((((upperInterpolatedGroundRoll - interpolatedGroundRoll) / 1000 * modifiedPressureAltitude) + 50 )* 0.06);
        const deltaRolls = upperInterpolatedGroundRoll - interpolatedGroundRoll;
        const scaledDelta = deltaRolls / 1000;
        const altitudeEffect = (scaledDelta * modifiedPressureAltitude) + interpolatedGroundRoll;

        const finalAdjustment = (altitudeEffect + 50) * 0.06;
        const upperadjusted50ft = ((((upperInterpolatedDistance50ft - interpolatedDistance50ft) / 1000) * modifiedPressureAltitude) + interpolatedDistance50ft - finalAdjustment);
        finaladjustedtakeoff = upperadjusted50ft; // Assign value to finaladjustedtakeoff
    } else {
        const adjustedGroundRolls = ((interpolatedGroundRoll + 50) * 0.06);
        const adjust50ft = (interpolatedDistance50ft - adjustedGroundRolls);
        finaladjustedtakeoff = adjust50ft; // Assign value for the else case
        // console.log("Final Adjusted Takeoff (else case):", finaladjustedtakeoff); // Log the result for debugging
    }


    let finalLandingadjustedtakeoff;
    if (upperInterpolatedLandingGroundRoll > 0) {
      const deltaLandingGroundRoll = upperInterpolatedLandingGroundRoll - interpolatedLandingGroundRoll;
      const scaledDeltaLanding = deltaLandingGroundRoll / 1000 * modifiedPressureAltitude;
      const adjustedLanding = scaledDeltaLanding + interpolatedLandingGroundRoll;
      const upperadLandingjustedGroundRolls = adjustedLanding * 0.02;
      
      const upperadLandingjusted50ft = ((((upperInterpolatedLandingDistance50ft - interpolatedLandingDistance50ft) / 1000) * modifiedPressureAltitude) + interpolatedLandingDistance50ft);
      
      finalLandingadjustedtakeoff =  upperadLandingjusted50ft - upperadLandingjustedGroundRolls; // Assign value to finaladjustedtakeoff
      // console.log("Final Adjusted Takeoff (upper case):", finalLandingadjustedtakeoff); // Log the result for debugging
  } else {
      const adjustedLandingGroundRolls = ((interpolatedLandingGroundRoll) * 0.02);
      const adjustLanding50ft = (interpolatedLandingDistance50ft - adjustedLandingGroundRolls);
      finalLandingadjustedtakeoff = adjustLanding50ft; // Assign value for the else case
      // console.log("Final Adjusted Takeoff (else case):", finalLandingadjustedtakeoff); // Log the result for debugging
  }
  
    // Move the calculation of lastCalcTakeOff outside of the if-else block
    const lastCalcTakeOff = finaladjustedtakeoff;
    const lastLanding = finalLandingadjustedtakeoff;
    
    setResult((prev) => ({
      ...prev,
      LandingcalcdividedValue50ft: landingcalcdividedValue50ft,
      LandingcalcdividedValue: landingcalcdividedValue,
      LandingfinalcalcHigherdividedValue: LandingfinalcalcHigherdividedValue,
      LandingfinalcalcinterpolatedGR: LandingfinalcalcinterpolatedGR,
      LandingfinalcalchigherdividedValue50ft: LandingfinalcalchigherdividedValue50ft,
      LandingfinalCalculation: LandingfinalCalculation,
      finalCalculation: finalCalculation,
      finalcalchigherdividedValue50ft: finalcalchigherdividedValue50ft,
      finalcalcinterpolated50ft: finalcalcinterpolated50ft,
      finalcalcinterpolatedGR: finalcalcinterpolatedGR,
      finalcalcHigherdividedValue: finalcalcHigherdividedValue,
      calcPressureAltitudes: calcPressureAltitude,
      calcdividedValue50ft: calcdividedValue50ft,
      calcdividedValue: calcdividedValue,
      pressureAltitude: pressureAltitude,
      takeoffDistanceWithoutSafetyFactor: lastCalcTakeOff,
      takeoffDistanceWithIncreasedRotationSpeed: lastCalcTakeOff + 50,
      correctedTakeoffDistance: (lastCalcTakeOff + 50) * 1.25,

      landingDistanceWithoutSafetyFactor: lastLanding,
      landingDistanceWithIncreasedRotationSpeed:lastLanding + 55,
      correctedLandingDistance: (lastLanding + 55) * 1.43,
    }));
    if (onResult) { 
      onResult({
        LandingcalcdividedValue50ft: landingcalcdividedValue50ft,
        LandingcalcdividedValue: landingcalcdividedValue,
        LandingfinalcalcHigherdividedValue: LandingfinalcalcHigherdividedValue,
        LandingfinalcalcinterpolatedGR: LandingfinalcalcinterpolatedGR,
        LandingfinalcalchigherdividedValue50ft: LandingfinalcalchigherdividedValue50ft,
        LandingfinalCalculation: LandingfinalCalculation,
        finalCalculation: finalCalculation,
        finalcalchigherdividedValue50ft: finalcalchigherdividedValue50ft,
        finalcalcinterpolated50ft: finalcalcinterpolated50ft,
        finalcalcHigherdividedValue: finalcalcHigherdividedValue,
        finalcalcinterpolatedGR: finalcalcinterpolatedGR,
        calcPressureAltitudes: calcPressureAltitude,
        calcdividedValue50ft: calcdividedValue50ft,
        calcdividedValue: calcdividedValue,
        takeoffDistanceWithoutSafetyFactor: lastCalcTakeOff,
        takeoffDistanceWithIncreasedRotationSpeed: lastCalcTakeOff + 50,
        correctedTakeoffDistance: (lastCalcTakeOff + 50) * 1.25,
        landingDistanceWithoutSafetyFactor: lastLanding,
        landingDistanceWithIncreasedRotationSpeed: lastLanding + 55,
        correctedLandingDistance: (lastLanding + 55) * 1.43,
      });
    }
  
  }
  
  // Similar logic can be applied to the calculateLandingDistance function...

  const fetchMetarData = async () => {
    const metarCode = inputs.metar.trim();
    if (!metarCode) {
      alert("Please enter a METAR code.");
      return;
    }

    try {
      const response = await axios.get(`https://api.checkwx.com/metar/${metarCode}/decoded`, {
        headers: {
          'X-API-Key': '7c51fbc2b1894418b09782a443',
        },
      });

      // Extracting relevant data from the API response
      const { hpa: pressure } = response.data.data[0].barometer || {};
      const { celsius: temp } = response.data.data[0].temperature || {};
      const { feet: elevation } = response.data.data[0].elevation || {};

      // Update the inputs with fetched data
      setInputs({
        ...inputs,
        QNH: pressure || '',
        temperature: temp || '',
        fieldElevation: elevation || '',
      });
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Failed to fetch METAR data. Please try again.");
    }
  };

  const isButtonBlocked = !inputs.QNH || !inputs.temperature || !inputs.fieldElevation;

  return (
    <div className={styles.calculatorcontainer}>
      <h1>Takeoff & Landing </h1>
      <div className={styles.inputgroup}>
        <label htmlFor="metar">Get Info from Metar:</label>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input 
            type="text" 
            id="metar" 
            value={inputs.metar} 
            onChange={handleInputChange} 
            placeholder="Enter METAR Code"
            style={{ flex: 1, marginRight: '10px' }}
            className={styles.metarinput}
          />
          <button className={styles.metarbutton} onClick={fetchMetarData}>Fetch</button>
        </div>
      </div>
      <div className={styles.inputgroup}>
        <label htmlFor="QNH">QNH (hPa):</label>
        <input 
          type="number" 
          id="QNH" 
          value={inputs.QNH} 
          onChange={handleInputChange} 
          placeholder="Enter QNH"
          required
        />
      </div>
      <div className={styles.inputgroup}>
        <label htmlFor="temperature">Temperature (°C):</label>
        <input 
          type="number" 
          id="temperature" 
          value={inputs.temperature} 
          onChange={handleInputChange} 
          placeholder="Enter Temperature"
          required
        />
      </div>
      <div className={styles.inputgroup}>
        <label htmlFor="fieldElevation">Field Elevation (ft):</label>
        <input 
          type="number" 
          id="fieldElevation" 
          value={inputs.fieldElevation} 
          onChange={handleInputChange} 
          placeholder="Enter Field Elevation"
          required
        />
      </div>
      <button 
        className={styles.calculatebutton} 
        onClick={() => { calculateTakeoffDistance(); }} 
        disabled={isButtonBlocked}
        style={{
          backgroundColor: isButtonBlocked ? '#ccc' : '#007bff',
          cursor: isButtonBlocked ? 'not-allowed' : 'pointer',
          color: isButtonBlocked ? '#666' : '#fff',
        }}
      >
        Calculate
      </button>

      {result && (
        <div className={styles.resultcontainer}>
          <h3>Calculation Results</h3>
          <p>Pressure Altitude: {result.pressureAltitude.toFixed(2)} ft</p>
          <h4>Takeoff Distance</h4>
          <p>Takeoff Distance without Safety Factor:  {result.takeoffDistanceWithoutSafetyFactor.toFixed(2)}m</p>
          <p>Takeoff Distance with Increased Rotation Speed: {result.takeoffDistanceWithIncreasedRotationSpeed.toFixed(2)} m</p>
          <p>Corrected Takeoff Distance (with Safety Factor): {result.correctedTakeoffDistance.toFixed(2)} m</p>
          <h4>Landing Distance</h4>
          <p>Landing Distance without Safety Factor:  {result.landingDistanceWithoutSafetyFactor.toFixed(2)}m</p>
          <p>Landing Distance with Increased Rotation Speed: {result.landingDistanceWithIncreasedRotationSpeed.toFixed(2)} m</p>
          <p>Corrected Landing Distance (with Safety Factor): {result.correctedLandingDistance.toFixed(2)} m</p>
        </div>
      )}
    </div>
  );
};

export default TakeoffAndLandingCalculator;
