// Quick test for coordinate extraction
const { extractCoordinatesFromGoogleMapsLink, generateGoogleMapsLink, isValidGoogleMapsUrl } = require('./lib/google-maps-utils.ts');

// Test cases
const testUrls = [
  'https://maps.google.com/maps?q=41.3275,19.8187',
  'https://www.google.com/maps/place/Tirana/@41.3275,19.8187,15z',
  'https://maps.google.com/?q=41.3275,19.8187',
  'https://goo.gl/maps/abc123',
  'invalid-url'
];

console.log('Testing coordinate extraction:');
testUrls.forEach(url => {
  const coords = extractCoordinatesFromGoogleMapsLink(url);
  const isValid = isValidGoogleMapsUrl(url);
  console.log(`URL: ${url}`);
  console.log(`Valid: ${isValid}`);
  console.log(`Coords: ${coords.lat}, ${coords.lng}`);
  console.log('---');
});

// Test coordinate generation
const testCoords = generateGoogleMapsLink(41.3275, 19.8187);
console.log('Generated link:', testCoords);




