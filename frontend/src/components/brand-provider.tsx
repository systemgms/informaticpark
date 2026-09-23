"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { BrandSettings } from "@/lib/types";
import { api } from "@/lib/api";

interface BrandContextType {
  brand: BrandSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const sanitized = hex.replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(sanitized)) return null;

  const r = parseInt(sanitized.slice(0, 2), 16) / 255;
  const g = parseInt(sanitized.slice(2, 4), 16) / 255;
  const b = parseInt(sanitized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function applyBrandMeta(brand: BrandSettings) {
  if (typeof document === "undefined") return;
  document.title = brand.appName;
}

function applyBrandCss(brand: BrandSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const primary = hexToHsl(brand.primaryColor);
  const secondary = hexToHsl(brand.secondaryColor);
  const accent = hexToHsl(brand.accentColor);

  if (primary) {
    root.style.setProperty("--primary", `${primary.h} ${primary.s}% ${primary.l}%`);
    root.style.setProperty(
      "--ring",
      `${primary.h} ${primary.s}% ${primary.l}%`
    );
    // foreground primario siempre blanco para simplificar; se puede mejorar con luminosidad
    root.style.setProperty("--primary-foreground", "0 0% 100%");
  }

  if (secondary) {
    root.style.setProperty(
      "--secondary",
      `${secondary.h} ${secondary.s}% ${secondary.l}%`
    );
    root.style.setProperty(
      "--secondary-foreground",
      "0 0% 100%"
    );
  }

  if (accent) {
    root.style.setProperty(
      "--accent",
      `${accent.h} ${accent.s}% ${accent.l}%`
    );
    root.style.setProperty(
      "--accent-foreground",
      `${accent.h} ${accent.s}% ${Math.max(20, accent.l - 40)}%`
    );
  }
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.brandSettings.get();
      setBrand(data);
      applyBrandCss(data);
      applyBrandMeta(data);
    } catch {
      // Fall back to defaults silently; auth guard handles redirects if needed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <BrandContext.Provider value={{ brand, loading, refresh: load }}>
      {children}
    </BrandContext.Provider>
  );
}

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
};
