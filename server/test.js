// Test data with both Western and Arabic numerals
const testCases = [
    "Error 1234: Connection failed",
    "Error ١٢٣٤: Connection failed",  // Arabic digits
    "خطأ ٥٦٧٨: فشل الاتصال",         // Arabic text and digits
    "Warning 9012",
    "تحذير ٩٠١٢",                    // Arabic text and digits
  ];
  
  // Updated regex pattern that matches both Western and Arabic digits
  // \d matches [0-9]
  // [\u0660-\u0669] matches Arabic digits ٠-٩
  const regex = /([\d\u0660-\u0669]{4})/;
  
  // Test function
  function testErrorCodeExtraction(message) {
    const match = message.match(regex);
    console.log(`Input: ${message}`);
    console.log(`Matched code: ${match ? match[1] : 'No match'}\n`);
    return match ? match[1] : null;
  }
  
  // Run tests
  testCases.forEach(testErrorCodeExtraction);
  
  // Utility function to convert Arabic digits to Western digits if needed
  function normalizeDigits(str) {
    return str.replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + '0'.charCodeAt(0)));
  }
  
  // Example of normalization
  const arabicNumber = "١٢٣٤";
  console.log(`Original Arabic number: ${arabicNumber}`);
  console.log(`Normalized to Western: ${normalizeDigits(arabicNumber)}`);