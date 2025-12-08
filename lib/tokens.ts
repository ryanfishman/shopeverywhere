import crypto from "crypto";

export const generateToken = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

export const generateNumericCode = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

export const getAppUrl = () => process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";








