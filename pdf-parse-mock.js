// Mock implementation of pdf-parse
module.exports = function(dataBuffer, options) {
  return Promise.resolve({
    numpages: 1,
    numrender: 1,
    info: {
      PDFFormatVersion: '1.3',
      IsAcroFormPresent: false,
      IsXFAPresent: false,
    },
    metadata: null,
    text: "This is mock text extracted from a PDF file."
  });
};