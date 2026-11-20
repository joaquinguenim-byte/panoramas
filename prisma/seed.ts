import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const inDays = (d: number, h = 19) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  x.setUTCHours(h + 3, 0, 0, 0); // ~Chile local time
  return x;
};

async function main() {
  await db.message.deleteMany();
  await db.report.deleteMany();
  await db.participation.deleteMany();
  await db.event.deleteMany();
  await db.communityMember.deleteMany();
  await db.community.deleteMany();
  await db.rateHit.deleteMany();
  await db.auditLog.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("panoramas123", 10);
  const mk = (email: string, name: string, extra: Record<string, unknown> = {}) =>
    db.user.create({
      data: { email, name, passwordHash, birthDate: new Date("1992-05-10"), verifiedAt: new Date(), emailVerifiedAt: new Date(), idDocStatus: "approved", idType: "passport", idNumber: email.split("@")[0].toUpperCase() + "123", ...extra },
    });

  const camila = await mk("camila@demo.cl", "Camila Rojas", { gender: "woman", comuna: "Providencia", interests: "books,culture", bio: "Lectora compulsiva y fan del teatro.", contact: "@cami.lee" });
  const diego = await mk("diego@demo.cl", "Diego Muñoz", { gender: "man", comuna: "Las Condes", interests: "snow,sports,outdoors", bio: "Esquío desde chico. Siempre hay espacio en el auto.", contact: "+56 9 1234 5678" });
  const vale = await mk("vale@demo.cl", "Valentina Soto", { gender: "woman", lgbtq: true, vegan: true, comuna: "Ñuñoa", interests: "food,art", bio: "Cocina vegana y cerámica." });
  const tomas = await mk("tomas@demo.cl", "Tomás Fuentes", { gender: "man", comuna: "Viña del Mar", interests: "beach,music", bio: "Surf los fines de semana." });
  await mk("demo@demo.cl", "Demo Panoramas", { comuna: "Santiago Centro", interests: "tech,games", role: "admin" });

  const pledge = { hostPledgeAt: new Date() };
  const events = [
    { hostId: camila.id, title: "Club de lectura: «La amortajada»", description: "Conversamos sobre la novela de María Luisa Bombal con un café. No importa si no la terminaste.", category: "books", comuna: "Providencia", venue: "Café Literario, Parque Balmaceda", startsAt: inDays(4), capacity: 8, joinMode: "instant", chatMode: "both", costNote: "Tu café (~$3.000)" },
    { hostId: diego.id, title: "Día de esquí en Farellones", description: "Subimos temprano, esquiamos todo el día y bajamos al atardecer. Nivel intermedio. Compartimos auto desde Las Condes.", category: "snow", comuna: "Farellones", venue: "Punto de encuentro: Metro Manquehue", startsAt: inDays(9, 7), capacity: 5, joinMode: "review", chatMode: "both", shareContacts: true, costNote: "Ticket ~$60.000 + arriendo de equipo + bencina compartida" },
    { hostId: vale.id, title: "Almuerzo vegano en Ñuñoa", description: "Probamos el menú del día de un restaurante vegano nuevo. Para veganas/os y curiosos… bueno, este es solo veganos.", category: "food", comuna: "Ñuñoa", venue: "Restaurante Verde Raíz, Irarrázaval", startsAt: inDays(3, 13), capacity: 6, joinMode: "instant", chatMode: "before", audience: "vegan_only", costNote: "Menú ~$9.500" },
    { hostId: camila.id, title: "Teatro + vino después: «La Pérgola de las Flores»", description: "Vamos a la función y después a conversar sobre la obra. Cada uno compra su entrada.", category: "culture", comuna: "Santiago Centro", venue: "Teatro Municipal de Santiago", venuePublic: true, startsAt: inDays(6, 20), capacity: 6, joinMode: "review", chatMode: "both", costNote: "Entrada desde $15.000 + lo que tomes" },
    { hostId: tomas.id, title: "Mañana de surf en Reñaca", description: "Para principiantes que ya se han parado un par de veces. Después, empanadas en la playa.", category: "beach", comuna: "Viña del Mar", venue: "Playa Reñaca, sector 5", startsAt: inDays(5, 9), capacity: 6, joinMode: "instant", chatMode: "both", shareContacts: true, costNote: "Arriendo de tabla y traje ~$15.000" },
    { hostId: vale.id, title: "Taller de cerámica entre mujeres", description: "Tarde de modelado en un taller abierto. Nadie necesita saber nada.", category: "art", comuna: "Ñuñoa", venue: "Taller Barro Vivo", startsAt: inDays(7, 17), capacity: 6, joinMode: "review", chatMode: "both", audience: "women_only", costNote: "Uso del taller y arcilla ~$12.000" },
    { hostId: diego.id, title: "Trekking al Cerro Manquehue", description: "Subida de ~3 horas. Llevar agua y bloqueador. Ritmo tranquilo, conversación garantizada.", category: "outdoors", comuna: "Vitacura", venue: "Inicio sendero Club de Golf Santa Rosa", startsAt: inDays(2, 8), capacity: 10, joinMode: "instant", chatMode: "both", audience: "lgbtq_friendly", costNote: "" },
    { hostId: tomas.id, title: "Noche de juegos de mesa", description: "Catan, Dixit y lo que traigan. Ideal para conocer gente sin la presión de conversar todo el rato.", category: "games", comuna: "Valparaíso", venue: "Bar La Playa", startsAt: inDays(8, 20), capacity: 8, joinMode: "instant", chatMode: "after", costNote: "Lo que consumas" },
    { hostId: camila.id, title: "Intercambio de idiomas español-inglés", description: "Media hora en español, media en inglés. Para chilenos y extranjeros que quieran practicar.", category: "languages", comuna: "Providencia", venue: "Plaza Las Lilas", startsAt: inDays(10, 19), capacity: 10, joinMode: "instant", chatMode: "none", costNote: "" },
    // Vegan / animal-friendly plans (open to everyone, so non-vegans discover them too)
    { hostId: vale.id, title: "Voluntariado Santuario Clafiria + Almuerzo Vegano", description: "Mañana ayudando en el santuario: limpiar, alimentar y conocer a los animales rescatados. Después, almuerzo vegano compartido ahí mismo. Ropa cómoda y zapatos que se puedan ensuciar.", category: "volunteering", comuna: "Cajón del Maipo", venue: "Santuario Clafiria (punto de encuentro: Metro Bellavista de La Florida)", startsAt: inDays(11, 9), capacity: 8, joinMode: "review", chatMode: "both", shareContacts: true, costNote: "Aporte al almuerzo ~$6.000 + bencina compartida" },
    { hostId: vale.id, title: "Feria vegana + picnic en el Parque Bustamante", description: "Recorremos los puestos, cada uno compra algo rico y armamos un picnic para compartir.", category: "food", comuna: "Providencia", venue: "Parque Bustamante, frente a la pileta", startsAt: inDays(12, 12), capacity: 10, joinMode: "instant", chatMode: "both", costNote: "Lo que compres en la feria" },
    { hostId: camila.id, title: "Taller: pastel de choclo vegano", description: "Cocinamos juntos una versión vegana del clásico chileno y nos lo comemos. Sin experiencia necesaria.", category: "food", comuna: "Ñuñoa", venue: "Cocina comunitaria Villa Olímpica", startsAt: inDays(13, 18), capacity: 6, joinMode: "review", chatMode: "both", audience: "lgbtq_friendly", costNote: "Ingredientes ~$5.000 por persona" },
    { hostId: tomas.id, title: "Limpieza de playa + completos veganos", description: "Dos horas limpiando la playa con guantes y bolsas, después completos veganos frente al mar.", category: "volunteering", comuna: "Concón", venue: "Playa Amarilla", startsAt: inDays(14, 10), capacity: 12, joinMode: "instant", chatMode: "after", shareContacts: true, costNote: "Completos ~$4.000" },
  ];
  for (const e of events) await db.event.create({ data: { ...pledge, ...e } });

  // Communities: one closed professional society, one open neighborhood group.
  const demo = await db.user.findUniqueOrThrow({ where: { email: "demo@demo.cl" } });
  const cfa = await db.community.create({
    data: {
      slug: "cfa-society-chile",
      name: "CFA Society Chile",
      description: "Comunidad de profesionales de inversiones. Panoramas para miembros (almuerzos, charlas, deporte) y algunos abiertos a todos.",
      kind: "closed",
      whoCanPost: "members",
      createdById: camila.id,
      members: {
        create: [
          { userId: camila.id, role: "admin" },
          { userId: diego.id },
          { userId: demo.id },
          { userId: tomas.id, status: "pending", note: "Estoy dando el nivel II este año." },
        ],
      },
    },
  });
  const runners = await db.community.create({
    data: {
      slug: "corredores-de-nunoa",
      name: "Corredores de Ñuñoa",
      description: "Trotes tranquilos por el barrio, todos los ritmos. Después, café.",
      kind: "open",
      whoCanPost: "admins",
      createdById: vale.id,
      members: { create: [{ userId: vale.id, role: "admin" }, { userId: camila.id }] },
    },
  });
  await db.event.createMany({
    data: [
      { ...pledge, hostId: diego.id, communityId: cfa.id, visibility: "community", title: "Almuerzo de networking CFA en El Golf", description: "Almuerzo entre miembros para conocernos fuera de la oficina. Sin presentaciones formales.", category: "food", comuna: "Las Condes", venue: "Restaurante en Isidora Goyenechea", startsAt: inDays(6, 13), capacity: 8, joinMode: "instant", chatMode: "before", costNote: "Tu almuerzo (~$15.000)" },
      { ...pledge, hostId: camila.id, communityId: cfa.id, visibility: "public", title: "Charla abierta: finanzas personales para no financistas + café", description: "Una miembro de la comunidad explica lo básico de ahorro e inversión, sin vender nada. Después, café y conversación.", category: "tech", comuna: "Providencia", venue: "Café en Av. Providencia", startsAt: inDays(8, 19), capacity: 12, joinMode: "instant", chatMode: "both", costNote: "Tu café" },
      { ...pledge, hostId: vale.id, communityId: runners.id, visibility: "public", title: "Trote suave por el Parque Juan XXIII + desayuno", description: "5 km a ritmo de conversación y desayuno después.", category: "sports", comuna: "Ñuñoa", venue: "Parque Juan XXIII, entrada por Av. Ossa", startsAt: inDays(3, 8), capacity: 12, joinMode: "instant", chatMode: "both", costNote: "Tu desayuno" },
    ],
  });

  const ski = await db.event.findFirstOrThrow({ where: { category: "snow" } });
  await db.participation.create({ data: { eventId: ski.id, userId: tomas.id, status: "pending", note: "Nunca he esquiado en Chile, ¡me encantaría!" } });
  const book = await db.event.findFirstOrThrow({ where: { category: "books" } });
  await db.participation.create({ data: { eventId: book.id, userId: vale.id, status: "accepted" } });
  await db.message.create({ data: { eventId: book.id, userId: camila.id, body: "¡Hola! Yo llevo una copia extra por si alguien la necesita." } });

  console.log("Seeded. Demo login: demo@demo.cl / panoramas123 (admin; also camila@, diego@, vale@, tomas@demo.cl)");
}

main().finally(() => db.$disconnect());
