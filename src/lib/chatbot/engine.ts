import {
  FALLBACK_ANSWER,
  FALLBACK_LINKS,
  type ChatLink,
  type KnowledgeTopic,
  topics,
} from "./knowledge";

export type ChatReply = {
  reply: string;
  links: ChatLink[];
  topicId: string;
};

const PAGE_HINTS: { match: string; topicId: string }[] = [
  { match: "renacon-aac-blocks", topicId: "aac-blocks" },
  { match: "renabond", topicId: "renabond" },
  { match: "renaplast", topicId: "renaplast" },
  { match: "wall-putty", topicId: "wall-putty" },
  { match: "floor-top-hardener", topicId: "floor-hardener" },
  { match: "cement-mortar", topicId: "cement-mortar" },
  { match: "renafix-201", topicId: "renafix-201" },
  { match: "renafix-211", topicId: "renafix-211" },
  { match: "renafix-222", topicId: "renafix-222" },
  { match: "renafix-333", topicId: "renafix-333" },
  { match: "tile-adhesive-444", topicId: "renafix-444" },
  { match: "tile-grout", topicId: "tile-grout" },
  { match: "gp-grout", topicId: "gp-grout" },
  { match: "rapid-wall", topicId: "rapid-wall" },
  { match: "calculator", topicId: "calculator" },
  { match: "careers", topicId: "careers" },
  { match: "contact-us", topicId: "contact" },
  { match: "about-us", topicId: "company" },
  { match: "why-renacon", topicId: "company" },
  { match: "our-products", topicId: "products" },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function topicById(id: string): KnowledgeTopic | undefined {
  return topics.find((topic) => topic.id === id);
}

function scoreTopic(haystack: string, topic: KnowledgeTopic): number {
  let score = 0;
  for (const keyword of topic.keywords) {
    const needle = normalize(keyword);
    if (!needle) continue;
    if (haystack === needle) {
      score += 12 + needle.length;
      continue;
    }
    if (haystack.includes(` ${needle} `) || haystack.startsWith(`${needle} `) || haystack.endsWith(` ${needle}`)) {
      score += 6 + needle.length;
      continue;
    }
    if (needle.includes(" ") && needle.split(" ").every((word) => haystack.includes(word))) {
      score += 3 + needle.length;
    }
  }
  return score;
}

function topicFromPath(pagePath: string): KnowledgeTopic | undefined {
  const path = pagePath.toLowerCase();
  const hint = PAGE_HINTS.find((item) => path.includes(item.match));
  return hint ? topicById(hint.topicId) : undefined;
}

/** Pure matcher over public website copy. Never reads or writes the database. */
export function answerFromPublicKnowledge(message: string, pagePath = ""): ChatReply {
  const haystack = ` ${normalize(message)} `;
  const brochureAsk = /brochure|pdf|download|tds|datasheet/.test(haystack);
  const pageTopic = topicFromPath(pagePath);
  if (brochureAsk && pageTopic && pageTopic.id !== "brochure") {
    return {
      reply: `${pageTopic.answer} To download this product’s brochure, fill the DOWNLOAD BROCHURE form on this page. The file is sent only after the form saves successfully.`,
      links: pageTopic.links ?? [],
      topicId: pageTopic.id,
    };
  }

  // Intent that should win over product names (e.g. "price of AAC blocks").
  const priorityIds = ["price", "careers", "brochure", "calculator"] as const;
  for (const id of priorityIds) {
    const topic = topicById(id);
    if (topic && scoreTopic(haystack, topic) >= 6) {
      return {
        reply: topic.answer,
        links: topic.links ?? [],
        topicId: topic.id,
      };
    }
  }

  let best: KnowledgeTopic | undefined;
  let bestScore = 0;

  for (const topic of topics) {
    const score = scoreTopic(haystack, topic);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }

  if (best && bestScore >= 6) {
    return {
      reply: best.answer,
      links: best.links ?? [],
      topicId: best.id,
    };
  }

  if (pageTopic) {
    return {
      reply: `${pageTopic.answer} Ask about another product, locations, or how to download a brochure if you need something else.`,
      links: pageTopic.links ?? [],
      topicId: pageTopic.id,
    };
  }

  return {
    reply: FALLBACK_ANSWER,
    links: FALLBACK_LINKS,
    topicId: "fallback",
  };
}
