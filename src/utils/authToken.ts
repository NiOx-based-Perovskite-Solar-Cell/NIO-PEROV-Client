import * as jwtDecode from "jwt-decode";
import jwt from 'jsonwebtoken';

export const setToken = (token: string): void => {
  if (typeof window !== "undefined") {
    let expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // fallback: 30 days
    try {
      const decoded = jwt.decode(token) as { exp?: number } | null;
      if (decoded?.exp) {
        expiresAt = decoded.exp * 1000;
      }
    } catch (e) {
      console.error("Failed to decode token:", e);
    }
    localStorage.setItem("nio_perov_token", JSON.stringify({ token, expiresAt }));
  }
};

export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("nio_perov_token");
    if (raw) {
      try {
        const { token, expiresAt } = JSON.parse(raw);
        if (!expiresAt || Date.now() < expiresAt) {
          return token;
        } else {
          localStorage.removeItem("nio_perov_token"); // หมดอายุแล้ว ลบทิ้ง
        }
      } catch (e) {
        console.error("Failed to parse token:", e);
        localStorage.removeItem("nio_perov_token");
      }
    }
  }
  return null;
};

export const decodeToken = (): any => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwt.decode(token); // หรือ jwtDecode(token) ถ้าใช้ 'jwt-decode'
    return decoded;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};


export const removeToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("nio_perov_token");
  }
};