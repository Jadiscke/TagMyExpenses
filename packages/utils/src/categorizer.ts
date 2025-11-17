import { CategorizationRule, Transaction } from "./types";

/**
 * Categorization rules for Brazilian merchants
 * Rules are applied in order, first match wins
 */
const CATEGORIZATION_RULES: CategorizationRule[] = [
  // Entertainment / Webnovels
  {
    pattern: /cloudary|webnovel/i,
    category: "Entertainment/Webnovels",
    priority: 1,
  },

  // Education
  {
    pattern: /concurso|curso|educacao|ensino|estudo|preparatorio/i,
    category: "Education/Exam Prep",
    priority: 1,
  },

  // E-commerce
  {
    pattern: /amazon|mercado livre|magazine luiza|americanas|casas bahia|shoptime/i,
    category: "Shopping/E-commerce",
    priority: 1,
  },

  // Food Delivery
  {
    pattern: /ifood|uber eats|rappi|i food/i,
    category: "Food/Delivery",
    priority: 1,
  },

  // Restaurants
  {
    pattern: /restaurante|lanchonete|padaria|confeitaria|buffet/i,
    category: "Food/Restaurant",
    priority: 2,
  },

  // Fast Food
  {
    pattern: /mcdonalds|burger king|subway|pizza hut|dominos|habibs|spoleto/i,
    category: "Food/Fast Food",
    priority: 1,
  },

  // Transportation
  {
    pattern: /uber|99|cabify|taxi|transporte/i,
    category: "Transportation/Ride Share",
    priority: 1,
  },

  // Public Transportation
  {
    pattern: /metro|onibus|bilhete unico|metroviario/i,
    category: "Transportation/Public",
    priority: 1,
  },

  // Gas Station
  {
    pattern: /posto|combustivel|gasolina|etanol|shell|ipiranga|petrobras|texaco/i,
    category: "Transportation/Gas",
    priority: 1,
  },

  // Streaming Services
  {
    pattern: /netflix|spotify|disney|prime video|hbo|paramount|youtube premium|apple music/i,
    category: "Entertainment/Streaming",
    priority: 1,
  },

  // Gaming
  {
    pattern: /steam|playstation|xbox|nintendo|epic games/i,
    category: "Entertainment/Gaming",
    priority: 1,
  },

  // Utilities - Phone
  {
    pattern: /^(oi|vivo|claro|tim|nextel)/i,
    category: "Utilities/Phone",
    priority: 1,
  },

  // Utilities - Internet
  {
    pattern: /internet|banda larga|fibra|tim|vivo|claro|oi|net/i,
    category: "Utilities/Internet",
    priority: 1,
  },

  // Utilities - Energy
  {
    pattern: /energia|eletrica|light|cemig|copel|ceb|cpfl/i,
    category: "Utilities/Energy",
    priority: 1,
  },

  // Utilities - Water
  {
    pattern: /agua|saneamento|sabesp|copasa|caesb/i,
    category: "Utilities/Water",
    priority: 1,
  },

  // Banking / Fees
  {
    pattern: /taxa|anuidade|tarifa|manutencao|juros|iof/i,
    category: "Financial/Fees",
    priority: 1,
  },

  // Supermarkets
  {
    pattern: /carrefour|pao de acucar|extra|atacadao|assai|walmart|big|supermercado/i,
    category: "Shopping/Supermarket",
    priority: 1,
  },

  // Pharmacies
  {
    pattern: /drogasil|raia|pacheco|ultrafarma|drogaria|farmacia/i,
    category: "Health/Pharmacy",
    priority: 1,
  },

  // Healthcare
  {
    pattern: /hospital|clinica|medico|dentista|laboratorio|unimed|amil|bradesco saude/i,
    category: "Health/Medical",
    priority: 1,
  },

  // Retail - Clothing
  {
    pattern: /zara|renner|riachuelo|c&a|h&m|gucci|nike|adidas/i,
    category: "Shopping/Clothing",
    priority: 1,
  },

  // Retail - Electronics
  {
    pattern: /extra|fast shop|casas bahia|magazine|multilaser|positivo/i,
    category: "Shopping/Electronics",
    priority: 1,
  },

  // Retail - Sports
  {
    pattern: /centauro|decathlon|artwalk|netshoes/i,
    category: "Shopping/Sports",
    priority: 1,
  },

  // Fuel / Auto
  {
    pattern: /auto pecas|ferragem|oficina|troca de oleo|pneus/i,
    category: "Transportation/Auto Maintenance",
    priority: 1,
  },

  // Insurance
  {
    pattern: /seguro|insurance|porto seguro|sul america/i,
    category: "Financial/Insurance",
    priority: 1,
  },

  // Investment
  {
    pattern: /investimento|tesouro|cdb|lci|lca|acoes|b3/i,
    category: "Financial/Investment",
    priority: 1,
  },
];

/**
 * Categorize a single transaction
 */
export function categorizeTransaction(transaction: Transaction | { merchant: string }): string {
  const merchant = transaction.merchant || "";
  const description = "rawDescription" in transaction ? transaction.rawDescription || "" : "";

  // Combine merchant and description for matching
  const searchText = `${merchant} ${description}`.toLowerCase();

  // Sort rules by priority (lower number = higher priority)
  const sortedRules = [...CATEGORIZATION_RULES].sort((a, b) => {
    const priorityA = a.priority || 999;
    const priorityB = b.priority || 999;
    return priorityA - priorityB;
  });

  // Find first matching rule
  for (const rule of sortedRules) {
    const pattern = typeof rule.pattern === "string" ? new RegExp(rule.pattern, "i") : rule.pattern;
    if (pattern.test(searchText)) {
      return rule.category;
    }
  }

  // Default category
  return "Other";
}

/**
 * Categorize multiple transactions
 */
export function categorizeTransactions(
  transactions: Array<Transaction | { merchant: string }>
): Array<Transaction & { category: string }> {
  return transactions.map((transaction) => ({
    ...transaction,
    category: categorizeTransaction(transaction),
  }));
}

