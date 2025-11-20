/**
 * Calculates Dew Point using the Magnus formula.
 * @param t Temperature in Celsius
 * @param rh Relative Humidity (0-100)
 */
export const calculateDewPoint = (t: number, rh: number): number => {
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * t) / (b + t) + Math.log(rh / 100.0);
  const dewPoint = (b * alpha) / (a - alpha);
  return parseFloat(dewPoint.toFixed(1));
};

/**
 * Calculates Heat Index using the NOAA formula (simplified for standard range).
 * @param t Temperature in Celsius
 * @param rh Relative Humidity (0-100)
 */
export const calculateHeatIndex = (t: number, rh: number): number => {
  // Heat Index usually requires Temp >= 27C (80F).
  // Converting to Fahrenheit for the standard formula
  const T = (t * 9) / 5 + 32;
  const R = rh;

  const c1 = -42.379;
  const c2 = 2.04901523;
  const c3 = 10.14333127;
  const c4 = -0.22475541;
  const c5 = -6.83783 * 10 ** -3;
  const c6 = -5.481717 * 10 ** -2;
  const c7 = 1.22874 * 10 ** -3;
  const c8 = 8.5282 * 10 ** -4;
  const c9 = -1.99 * 10 ** -6;

  let HI =
    c1 +
    c2 * T +
    c3 * R +
    c4 * T * R +
    c5 * T * T +
    c6 * R * R +
    c7 * T * T * R +
    c8 * T * R * R +
    c9 * T * T * R * R;

  // Convert back to Celsius
  const hiC = (HI - 32) * 5 / 9;
  
  // If it's not hot enough, Heat Index is just the Temperature
  if (t < 26) return t;
  
  return parseFloat(hiC.toFixed(1));
};

export const getComfortStatus = (temp: number, heatIndex: number, dewPoint: number): string => {
  if (dewPoint > 20) return "Bochnorno (Riesgo Moho)";
  if (heatIndex > temp + 3) return "Sensación Térmica Alta";
  if (temp < 18) return "Fresco";
  if (temp > 28) return "Caluroso";
  return "Confortable";
};