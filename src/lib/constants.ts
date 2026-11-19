export const CATEGORIES = [
  "books",
  "food",
  "culture",
  "music",
  "outdoors",
  "sports",
  "beach",
  "snow",
  "games",
  "languages",
  "art",
  "tech",
  "volunteering",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_EMOJI: Record<string, string> = {
  books: "📚",
  food: "🍽️",
  culture: "🎭",
  music: "🎶",
  outdoors: "🥾",
  sports: "⚽",
  beach: "🏄",
  snow: "🎿",
  games: "🎲",
  languages: "🗣️",
  art: "🎨",
  tech: "💻",
  volunteering: "🤝",
};

// Pilot coverage: Gran Santiago + main cities / getaway spots.
export const COMUNAS = [
  "Santiago Centro",
  "Providencia",
  "Ñuñoa",
  "Las Condes",
  "Vitacura",
  "Lo Barnechea",
  "La Reina",
  "Macul",
  "Peñalolén",
  "San Miguel",
  "Estación Central",
  "Recoleta",
  "Independencia",
  "Maipú",
  "La Florida",
  "Puente Alto",
  "Quinta Normal",
  "Huechuraba",
  "Valparaíso",
  "Viña del Mar",
  "Concón",
  "Pichilemu",
  "Farellones",
  "Cajón del Maipo",
  "Rancagua",
  "Concepción",
  "La Serena",
  "Pucón",
  "Puerto Varas",
  "Antofagasta",
  "Temuco",
  "Valdivia",
  "Online",
] as const;

export const AUDIENCES = ["open", "women_only", "lgbtq_only", "lgbtq_friendly", "vegan_only"] as const;
export const JOIN_MODES = ["instant", "review"] as const;
export const CHAT_MODES = ["none", "before", "after", "both"] as const;
export const GENDERS = ["woman", "man", "nonbinary", "unspecified"] as const;

export const MIN_AGE = 18;
export const MIN_CAPACITY = 2;
export const MAX_CAPACITY = 12; // small groups by design
