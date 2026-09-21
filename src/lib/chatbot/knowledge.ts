/** Read-only public website facts for the chatbot. No database access. */

export type ChatLink = {
  label: string;
  href: string;
};

export type KnowledgeTopic = {
  id: string;
  keywords: string[];
  answer: string;
  links?: ChatLink[];
};

export const CHAT_SUGGESTIONS = [
  "What products do you offer?",
  "Tell me about AAC blocks",
  "How do I download a brochure?",
  "Where are you located?",
] as const;

export const COMPANY_NAME = "Renacon (Renaatus Procon Private Limited)";

export const topics: KnowledgeTopic[] = [
  {
    id: "greeting",
    keywords: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "namaste"],
    answer:
      "Hello, I am the Renacon assistant. I can help with our AAC blocks, Renabond, Renaplast, Renafix products, locations, and how to request a brochure. What would you like to know?",
    links: [
      { label: "Our products", href: "/our-products/" },
      { label: "Contact us", href: "/contact-us/" },
    ],
  },
  {
    id: "company",
    keywords: [
      "about",
      "company",
      "who are you",
      "renacon",
      "renaatus",
      "manufacturer",
      "igbc",
      "green pro",
      "bis",
      "why renacon",
      "capacity",
      "factory",
    ],
    answer:
      "Renacon is the brand of Renaatus Procon Private Limited, a South India AAC (autoclaved aerated concrete) manufacturer with decades of construction-industry experience. We make green building materials that are BIS accredited, Green Pro certified, and IGBC members. Plants are in Arcot (Ranipet), Perundurai, and Tirunelveli, with capacity of at least 200,000 AAC blocks a day. The Perundurai unit is described on our site as India’s largest AAC block manufacturing unit.",
    links: [
      { label: "About us", href: "/about-us/" },
      { label: "Why Renacon", href: "/why-renacon/" },
    ],
  },
  {
    id: "contact",
    keywords: [
      "contact",
      "phone",
      "mobile",
      "email",
      "call",
      "whatsapp",
      "address",
      "office",
      "chennai",
      "nungambakkam",
      "marketing",
      "talk to",
      "enquiry",
      "inquire",
      "sales",
    ],
    answer:
      "You can reach Renacon at +91 73738 73738 or marketing@renacon.in. Head office: No. 139, VIBGYOR, Kodambakkam High Road, Nungambakkam, Chennai 600034. For a quote or site visit, use Contact Us or WhatsApp — this chat does not send enquiries into our lead forms.",
    links: [
      { label: "Contact us", href: "/contact-us/" },
      { label: "WhatsApp", href: "https://wa.link/r5dd4i" },
    ],
  },
  {
    id: "locations",
    keywords: [
      "location",
      "located",
      "plant",
      "plants",
      "unit",
      "units",
      "erode",
      "arcot",
      "ranipet",
      "tirunelveli",
      "perundurai",
      "gangaikondan",
      "sipcot",
      "where",
    ],
    answer:
      "Head office is in Nungambakkam, Chennai. Manufacturing and related sites listed on our Contact page: Erode (Mullamparappu, N.G. Palayam), Arcot / Ranipet (Kadappanthangal), Tirunelveli SIPCOT (Gangaikondan), and Perundurai SIPCOT (Ingur). Full addresses are on the Contact page.",
    links: [{ label: "Contact & locations", href: "/contact-us/" }],
  },
  {
    id: "products",
    keywords: ["product", "products", "range", "catalogue", "catalog", "materials", "portfolio"],
    answer:
      "Renacon products include AAC blocks, Renabond AAC joint mortar, Renaplast readymix plaster, wall putty, cement mortar, floor top hardener, Renafix tile adhesives (201, 211, 222, 333, 444), tile grout, GP grout, and Rapid Wall panels. Open a product page for details, or use the calculator for quantities.",
    links: [
      { label: "Our products", href: "/our-products/" },
      { label: "Calculator", href: "/calculator/" },
    ],
  },
  {
    id: "aac-blocks",
    keywords: [
      "aac",
      "block",
      "blocks",
      "autoclaved",
      "aerated",
      "brick",
      "bricks",
      "wall material",
      "thermal",
      "lightweight",
    ],
    answer:
      "Renacon AAC Blocks are autoclaved aerated concrete wall units — a lighter, more insulating alternative to red bricks for homes, hospitals, schools, hotels, and commercial buildings. They are made from fly ash, cement, lime and other materials, then steam-cured. Benefits described on our site include thermal insulation, energy saving, fire rating, low water absorption, and load-bearing capacity. Fill the brochure form on the AAC Blocks page to download that product’s PDF after a successful submit.",
    links: [
      { label: "AAC Blocks", href: "/renacon-aac-blocks/" },
      { label: "Why Renacon", href: "/why-renacon/" },
    ],
  },
  {
    id: "renabond",
    keywords: ["renabond", "joint mortar", "aac mortar", "thin joint", "block adhesive"],
    answer:
      "Renabond is a factory-made AAC joint adhesive — a cementitious polymer-modified mortar for laying AAC, ALC, and cellular concrete blocks with thin joints.",
    links: [{ label: "Renabond", href: "/renabond-aac-joint-mortar/" }],
  },
  {
    id: "renaplast",
    keywords: ["renaplast", "plaster", "readymix", "ready mix", "rmp", "render"],
    answer:
      "Renaplast Readymix Plaster (RMP) is a polymer-modified plaster with graded aggregates for internal and external AAC, brick, and concrete walls. It is mixed on site and is intended for a fine, durable finish.",
    links: [{ label: "Renaplast", href: "/renaplast-readymix-plaster/" }],
  },
  {
    id: "wall-putty",
    keywords: ["putty", "wall putty", "smooth wall"],
    answer:
      "Renacon Wall Putty is used on interior and exterior cement plaster, concrete, asbestos sheets, and AAC to create a smooth surface before painting. It is described as helping coverage, reducing flaking and cracks, and improving paint life.",
    links: [{ label: "Wall Putty", href: "/renacon-wall-putty/" }],
  },
  {
    id: "floor-hardener",
    keywords: ["floor hardener", "floor top", "dry shake", "abrasion", "industrial floor"],
    answer:
      "Renafix Floor Top Hardener is a pre-blended dry-shake hardener applied over freshly floated concrete for a dense, non-slip floor with higher abrasion and impact resistance.",
    links: [{ label: "Floor Top Hardener", href: "/renafix-floor-top-hardener/" }],
  },
  {
    id: "cement-mortar",
    keywords: ["cement mortar", "masonry mortar"],
    answer:
      "Renafix Cement Mortar is part of the Renafix range. Open the product page for the current description and, after submitting the brochure form, the matching product PDF.",
    links: [{ label: "Cement Mortar", href: "/cement-mortar/" }],
  },
  {
    id: "renafix-201",
    keywords: ["201", "thin set", "renafix 201"],
    answer:
      "Renafix 201 is a thin-set tile adhesive (add water) for ceramic tiles on interior and exterior floors, with strong adhesion and low shrinkage. Suitable substrates listed on the product page include concrete, masonry, mortar beds, and plaster.",
    links: [{ label: "Renafix 201", href: "/renafix-201-tile-adhesive/" }],
  },
  {
    id: "renafix-211",
    keywords: ["211", "renafix 211"],
    answer:
      "Renafix 211 is a cementitious thin-set powder mixed with water to install tiles and stone on a range of interior floor and wall substrates.",
    links: [{ label: "Renafix 211", href: "/renafix-211/" }],
  },
  {
    id: "renafix-222",
    keywords: ["222", "renafix 222", "polymer modified adhesive"],
    answer:
      "Renafix 222 is a high-strength, polymer-modified tile adhesive for floors and walls. The product page lists water and shock resistance and a wide range of cementitious substrates.",
    links: [{ label: "Renafix 222", href: "/renafix-222-tile-adhesive/" }],
  },
  {
    id: "renafix-333",
    keywords: ["333", "renafix 333", "large format"],
    answer:
      "Renafix 333 is a polymer-modified adhesive for large-format stones on interior and exterior floors and walls. Add water; the page highlights high strength and substrate versatility.",
    links: [{ label: "Renafix 333", href: "/renafix-333/" }],
  },
  {
    id: "renafix-444",
    keywords: ["444", "renafix 444", "fiber", "deformable"],
    answer:
      "Renafix 444 is a polymer-modified, fibre-reinforced deformable adhesive for large-format tiles and stones on interior and exterior floors and walls. It is described as water- and shock-resistant and aligned with EN/ISO classes on the product page.",
    links: [{ label: "Renafix 444", href: "/renafix-tile-adhesive-444/" }],
  },
  {
    id: "tile-adhesive",
    keywords: ["tile adhesive", "tile glue", "renafix adhesive", "tiling"],
    answer:
      "Renafix tile adhesives cover different jobs: 201 (thin-set floors), 211 (tiles and stone), 222 (high-strength polymer modified), 333 (large-format stone), and 444 (fibre-reinforced large format). Pick the grade on Our Products or the Tile Adhesive hub.",
    links: [
      { label: "Tile adhesives", href: "/renafix-tile-adhesive/" },
      { label: "Our products", href: "/our-products/" },
    ],
  },
  {
    id: "tile-grout",
    keywords: ["tile grout", "unsanded", "grouting", "joint filler"],
    answer:
      "Renafix Tile Grout is mixed with water for narrow joints up to 5 mm and is suited to porous, absorbent tiles. The page notes easy mixing, low shrinkage, and straightforward cleanup.",
    links: [{ label: "Tile Grout", href: "/renafix-tile-grout/" }],
  },
  {
    id: "gp-grout",
    keywords: ["gp grout", "precision grout", "non shrink", "grout"],
    answer:
      "Renafix GP Grout is a high-strength, non-shrink, free-flowing precision grout. Mix and place as described on the product page after preparing a clean, sound substrate.",
    links: [{ label: "GP Grout", href: "/renafix-gp-grout/" }],
  },
  {
    id: "rapid-wall",
    keywords: ["rapid wall", "panel", "wall panel", "aac panel", "precast panel"],
    answer:
      "Rapid Wall panels are lightweight cement-based sandwich panels with fibre-reinforced cement skins and a lightweight concrete core. Features listed include strength, weather and fire resistance, and space-saving installation.",
    links: [{ label: "Rapid Wall", href: "/rapid-wall-installation/" }],
  },
  {
    id: "brochure",
    keywords: ["brochure", "pdf", "download brochure", "datasheet", "spec sheet", "tds"],
    answer:
      "Each product page has a DOWNLOAD BROCHURE form. After your name, phone, and email are validated and saved, that page’s PDF downloads. We do not email or attach a brochure from this chat, and we never send another product’s file as a stand-in. Technical data sheets for some adhesives are linked from those product pages.",
    links: [
      { label: "AAC Blocks brochure form", href: "/renacon-aac-blocks/" },
      { label: "Our products", href: "/our-products/" },
    ],
  },
  {
    id: "calculator",
    keywords: ["calculator", "quantity", "how many blocks", "estimate", "coverage"],
    answer:
      "Use the on-site Calculator to estimate product quantities for your project. It does not place an order. For pricing and delivery, contact the team.",
    links: [
      { label: "Calculator", href: "/calculator/" },
      { label: "Contact us", href: "/contact-us/" },
    ],
  },
  {
    id: "price",
    keywords: ["price", "cost", "rate", "quotation", "quote", "discount", "dealer price"],
    answer:
      "Prices depend on product, quantity, and delivery location, so they are not listed in this chat. Share your requirement on Contact Us or WhatsApp for a quotation.",
    links: [
      { label: "Contact us", href: "/contact-us/" },
      { label: "WhatsApp", href: "https://wa.link/r5dd4i" },
    ],
  },
  {
    id: "careers",
    keywords: ["career", "careers", "job", "jobs", "vacancy", "hiring", "recruitment", "apply"],
    answer:
      "Open roles and applications are handled on the Careers page. Submit the application form there — this chat cannot send or change applications.",
    links: [{ label: "Careers", href: "/careers/" }],
  },
  {
    id: "projects",
    keywords: ["project", "projects", "gallery", "work", "site photos"],
    answer:
      "See completed work and updates on Projects, Gallery, and News.",
    links: [
      { label: "Projects", href: "/projects-2/" },
      { label: "Gallery", href: "/gallery/" },
      { label: "News", href: "/news/" },
    ],
  },
];

export const FALLBACK_ANSWER =
  "I can help with Renacon products, plants, and how to request a brochure from a product page. For orders, pricing, or a site visit, please use Contact Us or WhatsApp. This assistant does not change any of your existing enquiries.";

export const FALLBACK_LINKS: ChatLink[] = [
  { label: "Our products", href: "/our-products/" },
  { label: "Contact us", href: "/contact-us/" },
  { label: "WhatsApp", href: "https://wa.link/r5dd4i" },
];
