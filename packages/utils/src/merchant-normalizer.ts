/**
 * Merchant normalization map
 * Maps common variations to normalized names
 */
const MERCHANT_MAP: Record<string, string> = {
  // Entertainment / Webnovels
  "cloudary holdings": "Cloudary Holdings (Webnovel)",
  "cloudary holdings ho": "Cloudary Holdings (Webnovel)",
  "cloudary": "Cloudary Holdings (Webnovel)",

  // Education
  "pg *concursos": "Concursos Inteligentes",
  "concursos": "Concursos Inteligentes",
  "concurso inteligente": "Concursos Inteligentes",

  // E-commerce
  "amazon": "Amazon",
  "amazon.com.br": "Amazon",
  "mercado livre": "Mercado Livre",
  "magazine luiza": "Magazine Luiza",
  "americanas": "Lojas Americanas",

  // Food Delivery
  "ifood": "iFood",
  "uber eats": "Uber Eats",
  "rappi": "Rappi",

  // Transportation
  "uber": "Uber",
  "99": "99 Pop",
  "cabify": "Cabify",

  // Streaming
  "netflix": "Netflix",
  "spotify": "Spotify",
  "disney": "Disney+",
  "prime video": "Prime Video",

  // Utilities
  "oi": "OI",
  "vivo": "Vivo",
  "claro": "Claro",
  "tim": "TIM",
  "energia": "Concessionária de Energia",
  "agua": "Concessionária de Água",
  "saneamento": "Concessionária de Saneamento",

  // Banking
  "c6 bank": "C6 Bank",
  "nubank": "Nubank",
  "inter": "Banco Inter",
  "itau": "Itaú",
  "bradesco": "Bradesco",
  "santander": "Santander",

  // Supermarkets
  "carrefour": "Carrefour",
  "pao de acucar": "Pão de Açúcar",
  "extra": "Extra",
  "atacadao": "Atacadão",
  "assai": "Assaí",

  // Gas Stations
  "shell": "Shell",
  "ipiranga": "Ipiranga",
  "petrobras": "Petrobras",
  "texaco": "Texaco",

  // Fast Food
  "mcdonalds": "McDonald's",
  "burger king": "Burger King",
  "subway": "Subway",
  "pizza hut": "Pizza Hut",
  "dominos": "Domino's Pizza",

  // Retail
  "centauro": "Centauro",
  "nike": "Nike",
  "adidas": "Adidas",
  "zara": "Zara",
  "renner": "Renner",
  "riachuelo": "Riachuelo",

  // Pharmacies
  "drogasil": "Drogasil",
  "raia": "Raia Drogasil",
  "pacheco": "Pacheco",
  "ultrafarma": "Ultrafarma",
};

/**
 * Normalize merchant name to a standard format
 */
export function normalizeMerchant(merchant: string): string {
  if (!merchant || merchant.trim().length === 0) {
    return merchant;
  }

  // Normalize to lowercase for lookup
  const normalized = merchant.toLowerCase().trim();

  // Remove common prefixes/suffixes and clean up
  const cleaned = normalized
    .replace(/^(pg|pag|pago|pagamento|debito|credito)\s*\*?\s*/i, "")
    .replace(/\s+\*+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Direct match
  if (MERCHANT_MAP[cleaned]) {
    return MERCHANT_MAP[cleaned];
  }

  // Partial match (contains)
  for (const [key, value] of Object.entries(MERCHANT_MAP)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return value;
    }
  }

  // If no match found, return title-cased version
  return titleCase(merchant);
}

/**
 * Convert string to Title Case
 */
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

