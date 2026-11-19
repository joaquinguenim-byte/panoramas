/**
 * "¿Qué organizo?" — plan ideas to help hosts get started.
 * Ideas are curated templates; `suggestIdeas` ranks them for a given user by
 * their interests, gaps in what's on offer near them, the season and diet,
 * and always mixes in one idea outside their bubble (same spirit as Sorpréndeme).
 */
import type { User } from "@prisma/client";
import { db } from "./db";
import { upcomingWhere } from "./events";
import type { Locale } from "./i18n";

type Text = { title: string; description: string; costNote: string };
export type Idea = {
  key: string;
  category: string;
  capacity: number;
  joinMode: "instant" | "review";
  season?: "summer" | "winter";
  vegan?: boolean;
  es: Text;
  en: Text;
};

export const IDEAS: Idea[] = [
  {
    key: "santuario-vegano",
    category: "volunteering",
    capacity: 8,
    joinMode: "review",
    vegan: true,
    es: { title: "Voluntariado en santuario animal + almuerzo vegano", description: "Una mañana ayudando en un santuario de animales rescatados y después un almuerzo vegano compartido.", costNote: "Aporte al almuerzo + bencina compartida" },
    en: { title: "Animal sanctuary volunteering + vegan lunch", description: "A morning helping at a rescued-animal sanctuary, then a shared vegan lunch.", costNote: "Lunch contribution + shared gas" },
  },
  {
    key: "feria-vegana",
    category: "food",
    capacity: 10,
    joinMode: "instant",
    vegan: true,
    es: { title: "Feria vegana + picnic", description: "Recorremos una feria vegana, cada uno compra algo y armamos un picnic para compartir.", costNote: "Lo que compres en la feria" },
    en: { title: "Vegan market + picnic", description: "We walk around a vegan market, everyone buys something and we share a picnic.", costNote: "Whatever you buy at the market" },
  },
  {
    key: "cocina-vegana",
    category: "food",
    capacity: 6,
    joinMode: "review",
    vegan: true,
    es: { title: "Cocinemos un clásico chileno en versión vegana", description: "Pastel de choclo, porotos granados o sopaipillas: lo cocinamos juntos y nos lo comemos.", costNote: "Ingredientes ~$5.000 por persona" },
    en: { title: "Cook a Chilean classic, vegan style", description: "Pastel de choclo, porotos granados or sopaipillas: we cook it together and eat it.", costNote: "Ingredients ~$5,000 each" },
  },
  {
    key: "almuerzo-oficina",
    category: "food",
    capacity: 6,
    joinMode: "instant",
    es: { title: "Almuerzo con gente nueva cerca de la oficina", description: "Una hora de almuerzo con gente que trabaja por la zona. Menú del día y buena conversación.", costNote: "Tu menú (~$8.000)" },
    en: { title: "Lunch with new people near the office", description: "A lunch hour with people who work nearby. Set menu and good conversation.", costNote: "Your lunch (~$8,000)" },
  },
  {
    key: "ruta-picadas",
    category: "food",
    capacity: 6,
    joinMode: "instant",
    es: { title: "Ruta de picadas del barrio", description: "Tres paradas: sopaipillas, empanadas y un mote con huesillo. Cada uno paga lo suyo.", costNote: "~$7.000 entre las tres paradas" },
    en: { title: "Neighborhood food crawl", description: "Three stops: sopaipillas, empanadas and mote con huesillo. Everyone pays their own.", costNote: "~$7,000 across the three stops" },
  },
  {
    key: "club-lectura",
    category: "books",
    capacity: 8,
    joinMode: "instant",
    es: { title: "Club de lectura de autoras chilenas", description: "Elegimos un libro corto (Bombal, Mistral, Zambra…) y lo conversamos con un café.", costNote: "Tu café" },
    en: { title: "Chilean authors book club", description: "We pick a short book (Bombal, Mistral, Zambra…) and talk about it over coffee.", costNote: "Your coffee" },
  },
  {
    key: "trueque-libros",
    category: "books",
    capacity: 10,
    joinMode: "instant",
    es: { title: "Trueque de libros en la plaza", description: "Trae un libro que te haya marcado, cuéntanos por qué y llévate otro.", costNote: "Nada, solo un libro" },
    en: { title: "Book swap in the park", description: "Bring a book that marked you, tell us why, and take another one home.", costNote: "Nothing, just a book" },
  },
  {
    key: "teatro-conversa",
    category: "culture",
    capacity: 6,
    joinMode: "review",
    es: { title: "Teatro y conversación después", description: "Vamos a una obra y después a comentarla con algo para tomar.", costNote: "Entrada + lo que consumas" },
    en: { title: "Theatre and a chat afterwards", description: "We see a play and then talk about it over a drink.", costNote: "Ticket + your drinks" },
  },
  {
    key: "museo-domingo",
    category: "culture",
    capacity: 8,
    joinMode: "instant",
    es: { title: "Domingo de museo", description: "Recorremos un museo con entrada liberada y terminamos con un helado.", costNote: "Tu helado" },
    en: { title: "Museum Sunday", description: "We visit a free-entry museum and finish with ice cream.", costNote: "Your ice cream" },
  },
  {
    key: "concierto-previa",
    category: "music",
    capacity: 6,
    joinMode: "review",
    es: { title: "Concierto con previa", description: "Nos juntamos antes a comer algo y vamos juntos al concierto.", costNote: "Entrada + comida" },
    en: { title: "Concert with a pre-meetup", description: "We grab a bite beforehand and go to the concert together.", costNote: "Ticket + food" },
  },
  {
    key: "atardecer-cerro",
    category: "outdoors",
    capacity: 10,
    joinMode: "instant",
    es: { title: "Atardecer en el cerro", description: "Subida tranquila para ver la puesta de sol sobre la ciudad. Trae agua y algo para compartir.", costNote: "Nada" },
    en: { title: "Sunset hike", description: "An easy climb to watch the sunset over the city. Bring water and something to share.", costNote: "Nothing" },
  },
  {
    key: "estrellas",
    category: "outdoors",
    capacity: 8,
    joinMode: "review",
    es: { title: "Noche de estrellas fuera de la ciudad", description: "Salimos de la ciudad a mirar el cielo. Compartimos auto y termo con té.", costNote: "Bencina compartida" },
    en: { title: "Stargazing outside the city", description: "We drive out of the city to look at the sky. Shared car and a thermos of tea.", costNote: "Shared gas" },
  },
  {
    key: "padel-mixto",
    category: "sports",
    capacity: 4,
    joinMode: "instant",
    es: { title: "Pádel para principiantes", description: "Partido relajado, rotamos parejas. Nadie juega bien, esa es la gracia.", costNote: "Cancha ~$5.000 por persona" },
    en: { title: "Beginner padel", description: "Relaxed match, we rotate pairs. Nobody's good, that's the point.", costNote: "Court ~$5,000 each" },
  },
  {
    key: "surf-principiantes",
    category: "beach",
    capacity: 6,
    joinMode: "instant",
    season: "summer",
    es: { title: "Día de surf para principiantes", description: "Clase o tablas arrendadas, olas chicas y once en la playa.", costNote: "Arriendo de tabla y traje" },
    en: { title: "Beginner surf day", description: "A class or rented boards, small waves and tea time on the beach.", costNote: "Board and wetsuit rental" },
  },
  {
    key: "limpieza-playa",
    category: "volunteering",
    capacity: 12,
    joinMode: "instant",
    season: "summer",
    es: { title: "Limpieza de playa + almuerzo", description: "Dos horas limpiando la playa y después almorzamos frente al mar.", costNote: "Tu almuerzo" },
    en: { title: "Beach clean-up + lunch", description: "Two hours cleaning the beach, then lunch by the sea.", costNote: "Your lunch" },
  },
  {
    key: "dia-esqui",
    category: "snow",
    capacity: 5,
    joinMode: "review",
    season: "winter",
    es: { title: "Día de nieve compartiendo auto", description: "Subimos temprano a la cordillera, esquí o snowboard, y bajamos al atardecer.", costNote: "Ticket + arriendo + bencina compartida" },
    en: { title: "Snow day, sharing a car", description: "We go up to the mountains early, ski or snowboard, and come down at sunset.", costNote: "Lift ticket + rental + shared gas" },
  },
  {
    key: "juegos-mesa",
    category: "games",
    capacity: 8,
    joinMode: "instant",
    es: { title: "Noche de juegos de mesa", description: "Catan, Dixit, cartas… Ideal para conocer gente sin presión.", costNote: "Lo que consumas" },
    en: { title: "Board game night", description: "Catan, Dixit, cards… A no-pressure way to meet people.", costNote: "Whatever you order" },
  },
  {
    key: "intercambio-idiomas",
    category: "languages",
    capacity: 10,
    joinMode: "instant",
    es: { title: "Intercambio de idiomas", description: "Media hora en un idioma, media en otro. Para chilenos y extranjeros.", costNote: "Tu café" },
    en: { title: "Language exchange", description: "Half an hour in one language, half in another. For locals and foreigners.", costNote: "Your coffee" },
  },
  {
    key: "sketching",
    category: "art",
    capacity: 8,
    joinMode: "instant",
    es: { title: "Dibujo en la calle", description: "Llevamos croquera y dibujamos un barrio con historia. Cero experiencia necesaria.", costNote: "Tu croquera" },
    en: { title: "Urban sketching", description: "Bring a sketchbook and draw a historic neighborhood. No experience needed.", costNote: "Your sketchbook" },
  },
  {
    key: "cowork-manana",
    category: "tech",
    capacity: 6,
    joinMode: "review",
    es: { title: "Mañana de cowork + almuerzo", description: "Trabajamos cada uno en lo suyo en un café y almorzamos juntos.", costNote: "Café y almuerzo" },
    en: { title: "Cowork morning + lunch", description: "Everyone works on their own thing at a café, then we have lunch together.", costNote: "Coffee and lunch" },
  },
];

export function ideaByKey(key?: string) {
  return IDEAS.find((i) => i.key === key);
}

export function ideaText(idea: Idea, locale: Locale): Text {
  return idea[locale];
}

/** Southern hemisphere: summer Dec–Mar, winter Jun–Sep (Chile). */
export function seasonOf(d = new Date()): "summer" | "winter" | null {
  const m = d.getUTCMonth() + 1;
  if (m === 12 || m <= 3) return "summer";
  if (m >= 6 && m <= 9) return "winter";
  return null;
}

export type IdeaReason = "interest" | "gap" | "season" | "vegan" | "wildcard";
export type Suggestion = { idea: Idea; reason: IdeaReason };

export async function suggestIdeas(user: Pick<User, "interests" | "comuna" | "vegan"> | null, count = 6): Promise<Suggestion[]> {
  const interests = new Set((user?.interests ?? "").split(",").filter(Boolean));
  const season = seasonOf();
  const upcoming = await db.event.findMany({
    where: { ...upcomingWhere(), ...(user?.comuna ? { comuna: user.comuna } : {}) },
    select: { category: true },
  });
  const offered = new Set(upcoming.map((e) => e.category));

  const scored = IDEAS.filter((i) => !i.season || i.season === season).map((idea) => {
    const r: { reason: IdeaReason; w: number }[] = [];
    if (user?.vegan && idea.vegan) r.push({ reason: "vegan", w: 3 });
    if (interests.has(idea.category)) r.push({ reason: "interest", w: 2.5 });
    if (!offered.has(idea.category)) r.push({ reason: "gap", w: 2 });
    if (idea.season && idea.season === season) r.push({ reason: "season", w: 1.5 });
    r.sort((a, b) => b.w - a.w);
    const score = r.reduce((acc, x) => acc + x.w, 0) + Math.random() * 1.5;
    return { idea, reason: (r[0]?.reason ?? "wildcard") as IdeaReason, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const picked: Suggestion[] = [];
  const seenCat = new Set<string>();
  for (const s of scored) {
    if (picked.length >= count - 1) break;
    if (seenCat.has(s.idea.category)) continue; // variety
    seenCat.add(s.idea.category);
    picked.push({ idea: s.idea, reason: s.reason });
  }
  // One idea from outside the bubble.
  const outside = scored.filter((s) => !interests.has(s.idea.category) && !seenCat.has(s.idea.category));
  const wild = outside[Math.floor(Math.random() * outside.length)];
  if (wild) picked.push({ idea: wild.idea, reason: "wildcard" });
  return picked;
}
