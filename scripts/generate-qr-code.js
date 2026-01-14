#!/usr/bin/env node

const QRCode = require("qrcode");
const path = require("path");

const url = "fmz.pw/s/c";
const outputDir = path.join(__dirname, "..", "static", "out");

const options = {
  width: 256,
  margin: 2,
  errorCorrectionLevel: "M",
};

const lightOptions = {
  ...options,
  color: {
    dark: "#000000",
    light: "#FFFFFF",
  },
};

const darkOptions = {
  ...options,
  color: {
    dark: "#FFFFFF",
    light: "#000000",
  },
};

QRCode.toFile(
  path.join(outputDir, "card-qr-light.png"),
  url,
  lightOptions,
  (err) => {
    if (err) throw err;
    console.log("Generated card-qr-light.png");
  }
);

QRCode.toFile(
  path.join(outputDir, "card-qr-dark.png"),
  url,
  darkOptions,
  (err) => {
    if (err) throw err;
    console.log("Generated card-qr-dark.png");
  }
);
