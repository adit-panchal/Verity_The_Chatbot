const pdf = require("pdf-parse");
console.log("Main export type:", typeof pdf);
for (const key in pdf) {
  console.log(`Key: ${key}, Type: ${typeof pdf[key]}`);
}

try {
  const dataBuffer = Buffer.from("dummy");
  // Try calling common function names
  if (typeof pdf === "function") {
    console.log("pdf is a function");
  } else if (pdf.default && typeof pdf.default === "function") {
    console.log("pdf.default is a function");
  } else if (pdf.PDFParse && typeof pdf.PDFParse === "function") {
    console.log("pdf.PDFParse is a function");
  }
} catch (e) {}
