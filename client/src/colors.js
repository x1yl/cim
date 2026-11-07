// Small color helpers shared by the theme and avatar contrast logic.

export function hexToRgb(hex) {
  if (typeof hex !== "string") return null;
  const m = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(m)) return null;
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function relativeLuminance({ r, g, b }) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// Dark text on bright accents (yellow/green/cyan), white on dark accents.
export function readableText(hex, dark = "#05050a", light = "#ffffff") {
  const rgb = hexToRgb(hex);
  if (!rgb) return light;
  return relativeLuminance(rgb) > 0.45 ? dark : light;
}
