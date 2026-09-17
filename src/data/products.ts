export type Product = {
  slug: string;
  name: string;
  shortName: string;
  href: string;
  category: "blocks" | "mortar" | "plaster" | "putty" | "adhesive" | "grout" | "panel";
  image: string;
  summary: string;
  features: string[];
  body: string[];
  methodology?: { title: string; steps: string[] }[];
  extra?: { title: string; items: string[] }[];
  tdsHref?: string;
  brochureName: string;
};

export const products: Product[] = [
  {
    slug: "renacon-aac-blocks",
    name: "Renacon AAC Blocks",
    shortName: "AAC Blocks",
    href: "/renacon-aac-blocks",
    category: "blocks",
    image: "https://renacon.in/wp-content/uploads/2023/02/cool.jpg",
    brochureName: "Renacon AAC Blocks Brochure",
    summary:
      "South India’s leading brand of Autoclaved Aerated Concrete (AAC) Blocks — a green, versatile wall material for schools, hospitals, corporates, hotels, individual housing and apartments.",
    features: [
      "Eco friendly certified green building material",
      "Fire resistant up to 1600°C (2–6 hours depending on wall thickness)",
      "Thermal insulation that reduces heating and cooling costs",
      "Acoustic insulation of about 42 dB",
      "3–4 times lighter than traditional bricks",
      "Reduces construction time by about 20%",
      "Seismic resistance and dimensional accuracy",
      "BIS accredited, GreenPro certified, IGBC member",
    ],
    body: [
      "Renacon AAC blocks are made from a blend of fly ash, cement, lime and other raw materials mixed with water and cast in moulds, then cured under high-pressure steam in an autoclave.",
      "Our green building products are eco-friendly and cost-effective, saving project time, money and resources. Manufacturing capacity is at least 200,000 AAC blocks per day across Arcot, Perundurai and Tirunelveli SIPCOT. The Perundurai factory is India’s largest AAC block manufacturing unit.",
      "Blocks can be easily cut, drilled, nailed, milled and grooved. Sanitary and electrical installations such as pipes or ducts can be installed after the main construction is complete.",
    ],
    extra: [
      {
        title: "Comparison",
        items: [
          "Manufacture: AAC Blocks yes · Solid Concrete Block no · Brick no",
          "Size consistency: AAC Blocks yes · Solid Concrete Block yes · Brick no",
          "Compressive strength and dimensional accuracy favour AAC over conventional clay bricks",
        ],
      },
    ],
  },
  {
    slug: "renabond-aac-joint-mortar",
    name: "Renabond AAC Joint Mortar",
    shortName: "Renabond",
    href: "/renabond-aac-joint-mortar",
    category: "mortar",
    image:
      "https://renacon.in/wp-content/uploads/2023/08/Untitled-design-1.png",
    brochureName: "Renabond AAC Joint Mortar Brochure",
    summary:
      "A factory-made cementitious polymer-modified adhesive used to lay AAC, ALC and cellular concrete blocks with thin joints — firmly, quickly and with up to 75% less bonding material.",
    features: [
      "Ready to use, just add water",
      "Easy mixing and application",
      "Flexible, shock and impact resistance",
      "Quick and economical",
      "Formulated with locally sourced minerals",
      "Contributes to LEED points",
    ],
    body: [
      "Renabond is specifically manufactured as an AAC joint adhesive. The mortar is highly efficient and reduces bonding materials by up to 75%. It consists of eco-friendly materials, making it a sustainable choice for builders.",
    ],
    methodology: [
      {
        title: "Application methodology",
        steps: [
          "Ready to mix: add water at the prescribed ratio.",
          "Clean the AAC block: wet the side layers with a soft sponge before laying.",
          "Lay the first line by the conventional method for a better result.",
          "From the second layer, apply Renabond both horizontally and vertically with a special trowel at 2–3 mm thickness.",
          "After laying AAC blocks for 4 feet, it is recommended to do sill concrete every 4 feet for bonding, strength and to avoid cracks.",
        ],
      },
    ],
  },
  {
    slug: "renaplast-readymix-plaster",
    name: "Renaplast Readymix Plaster",
    shortName: "Renaplast",
    href: "/renaplast-readymix-plaster",
    category: "plaster",
    image:
      "https://renacon.in/wp-content/uploads/2023/08/Untitled-design-2.png",
    brochureName: "Renaplast Readymix Plaster Brochure",
    summary:
      "A pre-modified cementitious mortar with finely graded natural aggregates and polymer additives for plastering AAC/red brick walls, concrete walls and surfaces — indoors and outdoors.",
    features: [
      "Crack-free wall finish",
      "Premixed — no mixing quality concerns",
      "Energy efficient and cost-effective",
      "Superior finish and durable strength",
      "Formulated with locally sourced minerals",
      "Contributes to LEED points",
    ],
    body: [
      "Renaplast makes the mason’s job simple. Mix one bag with 9–11 litres of clean water. Mechanical mixing is recommended over hand mix for an even paste. Use the paste within one hour.",
    ],
    methodology: [
      {
        title: "Application methodology",
        steps: [
          "Keep the application area free from oil, grease, silt and dust. Wet the wall with a soft sponge before applying.",
          "Paste Renaplast horizontally and vertically, then use a levelling mallet for an even surface.",
          "After plastering, leave until dry and cure 2 times a day for the next 3 days in normal weather (5–7 days in abnormal weather).",
        ],
      },
    ],
  },
  {
    slug: "renafix-floor-top-hardener",
    name: "Renafix Floor Top Hardener",
    shortName: "Floor Top Hardener",
    href: "/renafix-floor-top-hardener",
    category: "mortar",
    image:
      "https://renacon.in/wp-content/uploads/2023/08/Untitled-design-3.png",
    brochureName: "Renafix Floor Top Hardener Brochure",
    summary:
      "A non-metallic dry-shake floor hardener with specially graded hard-wearing natural aggregates. Applied over freshly floated concrete for a durable, non-slip monolithic floor.",
    features: [
      "Higher abrasion and impact resistance",
      "Dense surface resists grease, oils and most chemical stains",
      "Premixed, easy to use",
      "Cost-effective and durable",
      "Contributes to LEED points",
    ],
    body: [
      "Application can begin when the base concrete has stiffened so that light foot traffic leaves an imprint of about 3 mm and bleed water has evaporated. Apply in two stages using 50–70% of material first, float, then broadcast the remainder and finish with a power trowel when the floor has stiffened sufficiently.",
    ],
  },
  {
    slug: "cement-mortar",
    name: "Renafix Cement Mortar",
    shortName: "Cement Mortar",
    href: "/cement-mortar",
    category: "mortar",
    image:
      "https://renacon.in/wp-content/uploads/2023/08/Untitled-design-4.png",
    brochureName: "Renafix Cement Mortar Brochure",
    summary:
      "A construction-grade mortar mix designed for laying brick masonry, fly ash bricks, solid blocks and AAC blocks.",
    features: [
      "Premixed, easy mixing and application",
      "Superior finish and strength",
      "Suitable for red bricks, fly ash bricks, solid blocks and AAC blocks",
      "Formulated with locally sourced minerals",
    ],
    body: [
      "Renafix cement mortar is a construction grade mortar mix designed for laying all kinds of brick masonry with consistent quality on site.",
    ],
  },
  {
    slug: "renacon-wall-putty",
    name: "Renacon Wall Putty",
    shortName: "Wall Putty",
    href: "/renacon-wall-putty",
    category: "putty",
    image:
      "https://renacon.in/wp-content/uploads/2023/08/renacon-40-kg-wall-putty-500x500-1.webp",
    brochureName: "Renacon Wall Putty Brochure",
    summary:
      "A powder-based mix of super-fine cement, flexible polymer and additives for smooth, undulation-free interior and exterior walls, asbestos sheets, concrete and AAC blocks.",
    features: [
      "Improves tensile strength of the wall",
      "Increases paint lifespan",
      "Smooth, uniform finish on rough plaster",
      "Good water resistance and workability",
      "Resists algae and fungi",
      "Good inter-coat adhesion to emulsion paints",
    ],
    methodology: [
      {
        title: "Application methodology",
        steps: [
          "Mix until a consistent, uniform workable paste. Use within 2–3 hours.",
          "Clean and pre-wet the wall. Fill cracks before applying putty to avoid flaking.",
          "Apply the first coat from bottom to top with a putty blade. Maximum 1.5 mm total thickness for 2 coats. Wait at least 3 hours.",
          "Apply the second coat from top to bottom. Wait 12 hours. Clean with fine emery paper before painting.",
        ],
      },
    ],
    body: [
      "Renacon Wall Putty protects painted surfaces from flaking and crack formation, giving a smooth, glossy, durable finish with brilliant whiteness and superior coverage.",
    ],
  },
  {
    slug: "renafix-201-tile-adhesive",
    name: "Renafix 201 Tile Adhesive",
    shortName: "Renafix 201",
    href: "/renafix-201-tile-adhesive",
    category: "adhesive",
    image:
      "https://renacon.in/wp-content/uploads/2023/08/Untitled-design-11.png",
    brochureName: "Renafix 201 Brochure",
    tdsHref: "/renafix-201-tds",
    summary:
      "A cementitious polymer-modified thin-set powder for ceramic tiles and small-format natural stones on interior and exterior floors.",
    features: [
      "Ready to use, just add water",
      "Excellent adhesion, low shrinkage",
      "For ceramic tiles over floors and walls",
      "Mix approximately 5–6 L water per 20 kg powder",
    ],
    body: [
      "Suitable substrates include concrete masonry, cement mortar beds, concrete, cementitious plaster and render, brick masonry and cement terrazzo.",
      "Allow adhesive to slake 5–10 minutes. Spread only as much as can be covered in 10 minutes. Back-butter tiles larger than 12\"×12\". Fill joints with Renafix tile grout.",
    ],
  },
  {
    slug: "renafix-211",
    name: "Renafix 211 Tile Adhesive",
    shortName: "Renafix 211",
    href: "/renafix-211",
    category: "adhesive",
    image:
      "https://renacon.in/wp-content/uploads/2023/08/Untitled-design-11.png",
    brochureName: "Renafix 211 Brochure",
    tdsHref: "/renafix-211-tds",
    summary:
      "A multi-purpose polymer-modified premium floor and wall thin-set powder for tiles and stones on interior floor and wall installations.",
    features: [
      "Ready to use, just add water",
      "Excellent adhesion, low shrinkage",
      "Floor and wall utility",
      "Mix approximately 5–6 L water per 20 kg powder",
    ],
    body: [
      "Cementitious thin-set powder mixed only with water to install various tiles and stone on a variety of substrates using the thin-set method.",
    ],
  },
  {
    slug: "renafix-222-tile-adhesive",
    name: "Renafix 222 Tile Adhesive",
    shortName: "Renafix 222",
    href: "/renafix-222-tile-adhesive",
    category: "adhesive",
    image:
      "https://renacon.in/wp-content/uploads/2023/08/Untitled-design-11.png",
    brochureName: "Renafix 222 Brochure",
    tdsHref: "/renafix-222-tds",
    summary:
      "A multipurpose cementitious polymer-modified adhesive for tiles and stones on cement substrates, especially stone applications. Water and shock resistant.",
    features: [
      "High strength, polymer modified",
      "Excellent adhesion, low shrinkage",
      "Water and shock resistant",
      "Mix approximately 5–6 L water per 20 kg powder",
    ],
    body: [
      "Designed for installation of all tile and stones on a variety of cement substrates, including tile-on-stone applications.",
    ],
  },
  {
    slug: "renafix-333",
    name: "Renafix 333 Tile Adhesive",
    shortName: "Renafix 333",
    href: "/renafix-333",
    category: "adhesive",
    image:
      "https://renacon.in/wp-content/uploads/2023/08/Untitled-design-11.png",
    brochureName: "Renafix 333 Brochure",
    summary:
      "A highly polymer-modified adhesive for large-format stones on interior and exterior floors and walls. Exceeds IS 15477:2019 Type 3TE.",
    features: [
      "Single component, add water",
      "High strength for premium stones",
      "Recommended for wet areas including swimming pools",
      "Can be used for tile-on-tile and slurry bond (wet-on-wet)",
      "Open time 30 min · Adjustment 30 min · Pot life 4 hours · Heavy traffic 24 hours",
    ],
    body: [
      "Mix approximately 5.5–6 L of water for 20 kg of powder. Use a slow-speed mixer. Slake 5–10 minutes, then apply with a properly sized notched trowel.",
    ],
  },
  {
    slug: "renafix-tile-adhesive-444",
    name: "Renafix 444 Tile Adhesive",
    shortName: "Renafix 444",
    href: "/renafix-tile-adhesive-444",
    category: "adhesive",
    image:
      "https://renacon.in/wp-content/uploads/2023/08/Untitled-design-11.png",
    brochureName: "Renafix 444 Brochure",
    summary:
      "Premium white multipurpose, highly polymer-modified fibre-reinforced deformable tile and stone adhesive (EN/ISO C2TES1) for large-format tiles and sensitive stones.",
    features: [
      "Water and shock resistant",
      "Bed thickness 3 to 15 mm",
      "Open time 35 min · Pot life 4 hours",
      "Suitable for glass mosaic, ceramic, vitrified and natural stones",
      "For heavy foot-traffic areas, Mivan, Tremix and vacuum-dewatered flooring",
    ],
    body: [
      "Mix approximately 6–6.5 L of water for 20 kg of powder. Slake 5–10 minutes before application.",
    ],
  },
  {
    slug: "renafix-tile-grout",
    name: "Renafix Tile Grout",
    shortName: "Tile Grout",
    href: "/renafix-tile-grout",
    category: "grout",
    image:
      "https://renacon.in/wp-content/uploads/2022/12/Untitled-design-20-1-1.png",
    brochureName: "Renafix Tile Grout Brochure",
    summary:
      "Renafix 300S unsanded polymer-modified grout for narrow joints up to 5 mm. Suited for grouting porous and absorbent tiles.",
    features: [
      "Ready to use, just add water",
      "Creamy and easy to spread",
      "Free from cracks and shrinkage",
      "Mix about 300 ml water per 10 kg powder",
    ],
    methodology: [
      {
        title: "Application methodology",
        steps: [
          "Remove spacers and debris. Dampen tile; do not leave water standing in joints. Room temperature 4–32°C.",
          "Spread with a firm rubber grout float using diagonal strokes until joints are completely filled.",
          "Remove excess with the float at 90°, pulling at 45° across joints. Secondary clean with a damp (not wet) sponge. Polish when firm.",
        ],
      },
    ],
    body: [],
  },
  {
    slug: "renafix-gp-grout",
    name: "Renafix GP Grout",
    shortName: "GP Grout",
    href: "/renafix-gp-grout",
    category: "grout",
    image:
      "https://renacon.in/wp-content/uploads/2022/12/Untitled-design-20-1-1.png",
    brochureName: "Renafix GP Grout Brochure",
    summary:
      "Renafix GP2 is a factory-blended non-shrink cementitious precision grout with high early and ultimate strength for civil engineering works under static and dynamic loads.",
    features: [
      "Precision grouting, high strength, non-shrink",
      "Free-flowing consistency",
      "No metallic iron content",
      "About 4.0 litres water per 25 kg bag for flowable grout",
      "Place within 30 minutes of mixing (20 minutes at 30°C)",
    ],
    body: [
      "Can be placed in thicknesses up to 100 mm in a single pour as an underplate grout. For thicker sections, fill out with well-graded silt-free 10 mm aggregate (50–100% by weight). Curing is essential to prevent rapid drying and shrinkage.",
    ],
  },
  {
    slug: "rapid-wall-installation",
    name: "Renacon Rapid Wall Panels",
    shortName: "Rapid Wall Panel",
    href: "/rapid-wall-installation",
    category: "panel",
    image: "https://renacon.in/wp-content/uploads/2023/02/cool.jpg",
    brochureName: "Renacon Rapid Wall Brochure",
    summary:
      "Solid wall panels made of two fibre-reinforced cement sheets on either side of a lightweight concrete core — light, strong, fire resistant and reusable.",
    features: [
      "High axial compression and bending",
      "Extreme weather, fire, water and termite resistance",
      "Thinner walls for extra carpet area",
      "Faster installation, lesser labour, structural savings",
      "No site water needed; lesser dust; reusable",
    ],
    extra: [
      {
        title: "Typical sizes",
        items: [
          "Length: 2400 / 3000 mm",
          "Width: 600 mm",
          "Thickness: 50 / 75 mm",
          "Edge profile: tongue and groove",
          "50 mm: ~42 kg/m², axial compression 250 kg/m², density 831 kg/m³",
          "75 mm: ~47 kg/m², axial compression 270 kg/m², density 840 kg/m³",
        ],
      },
      {
        title: "Application areas",
        items: [
          "Accommodation units, site offices, security & store rooms, warehouses, army barracks, schools, low-cost housing",
          "Prefab offices, malls, hotels, industrial and defence installations",
          "Partitions, boundary walls, staircase enclosures and fire separation walls",
        ],
      },
    ],
    body: [
      "Meticulously designed to occupy less space while remaining lightweight, these panels are manufactured to be eco-friendly and sustainable. Renacon supports design & BOQ, product training and site visits.",
    ],
  },
];

export const productGroups = [
  {
    title: "Wall systems",
    items: products.filter((p) =>
      ["blocks", "mortar", "plaster", "putty", "panel"].includes(p.category),
    ),
  },
  {
    title: "Tile adhesives",
    items: products.filter((p) => p.category === "adhesive"),
  },
  {
    title: "Grouts",
    items: products.filter((p) => p.category === "grout"),
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
