import { ParsedTransaction } from "./types";

/**
 * Parse C6 Bank PDF statement
 * Each line should be a transaction with format: DD mon Description Amount
 */
export function parseC6BankStatement(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // Portuguese month abbreviations
  const monthMap: { [key: string]: string } = {
    jan: "01",
    fev: "02",
    mar: "03",
    abr: "04",
    mai: "05",
    jun: "06",
    jul: "07",
    ago: "08",
    set: "09",
    out: "10",
    nov: "11",
    dez: "12",
  };

  // Split text into lines first, then normalize each line
  // This preserves line structure while handling inconsistent spacing within lines
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter((line) => line.length > 0);

  // Date pattern to identify transaction boundaries
  const datePattern = /^(\d{1,2})\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s+/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line; // Already trimmed in map above

    // Skip empty lines
    if (!trimmedLine) {
      continue;
    }

    // Skip header/footer lines
    if (
      trimmedLine.includes("EXTRATO") ||
      trimmedLine.includes("C6 BANK") ||
      trimmedLine.includes("SALDO") ||
      trimmedLine.includes("PÁGINA") ||
      trimmedLine.match(/^Data\s+Descrição/i) || // Table headers
      trimmedLine.match(/^Date\s+Description/i)
    ) {
      continue;
    }

    // Check if this line starts with a date - this marks the start of a new transaction
    const dateMatch = trimmedLine.match(datePattern);

    if (!dateMatch) {
      continue; // Skip lines that don't start with a date
    }

    const day = dateMatch[1].padStart(2, "0");
    const monthAbbr = dateMatch[2].toLowerCase();
    const month = monthMap[monthAbbr];

    if (!month) {
      continue; // Invalid month abbreviation
    }

    // Collect all lines that belong to this transaction
    // A transaction continues until we hit another date or the end of the file
    const transactionLines: string[] = [];
    let j = i;
    
    // Start with the current line (after removing the date)
    const firstLineContent = trimmedLine.substring(dateMatch[0].length).trim();
    transactionLines.push(firstLineContent);
    j++;

    // Collect subsequent lines until we hit another date or end of file
    while (j < lines.length) {
      const nextLine = lines[j];
      // Check if next line starts with a date (new transaction)
      if (nextLine.match(datePattern)) {
        break; // Stop at next transaction
      }
      transactionLines.push(nextLine);
      j++;
    }

    // Combine all transaction lines into one string for processing
    const transactionText = transactionLines.join(" ");

    // Debug logging for Patreon transactions
    const isPatreon = transactionText.toUpperCase().includes("PATREON");
    if (isPatreon) {
      console.log("=== PATREON TRANSACTION DEBUG ===");
      console.log("Transaction lines:", transactionLines);
      console.log("Combined transaction text:", transactionText);
    }

    // Amount pattern: numbers with comma as decimal separator (e.g., "173,56", "1.234,56")
    // Pattern: optional thousands separator (dots), comma, 2 digits
    // Find ALL matches across all transaction lines and get the LAST one
    const amountPattern = /\d{1,3}(?:\.\d{3})*,\d{2}/g;
    const allMatches: Array<{ match: string; index: number }> = [];
    
    let match: RegExpExecArray | null;
    amountPattern.lastIndex = 0; // Reset regex
    while ((match = amountPattern.exec(transactionText)) !== null) {
      allMatches.push({ match: match[0], index: match.index });
    }

    if (isPatreon) {
      console.log("All number matches found:", allMatches);
    }

    if (allMatches.length === 0) {
      if (isPatreon) {
        console.log("ERROR: No amount found for Patreon transaction!");
      }
      i = j - 1; // Skip to the line after this transaction
      continue; // Skip if no amount found
    }

    // Get the match with the highest index (absolute last in the combined text)
    const lastMatch = allMatches.reduce((prev, current) => 
      current.index > prev.index ? current : prev
    );

    const amountStr = lastMatch.match;
    const amount = parseAmount(amountStr);

    // Extract merchant + observation: everything before the last amount
    const merchantAndObservation = transactionText.substring(0, lastMatch.index).trim();

    if (isPatreon) {
      console.log("Selected last match:", lastMatch);
      console.log("Selected amount:", amountStr);
      console.log("Parsed amount value:", amount);
      console.log("Merchant + observation:", merchantAndObservation);
    }

    if (!merchantAndObservation || merchantAndObservation.length === 0) {
      if (isPatreon) {
        console.log("ERROR: No merchant/observation found!");
      }
      i = j - 1; // Skip to the line after this transaction
      continue; // Skip if no merchant/observation
    }

    // Skip transactions containing "Inclusao de Pagamento"
    if (merchantAndObservation.toLowerCase().includes("inclusao de pagamento") || 
        transactionText.toLowerCase().includes("inclusao de pagamento")) {
      i = j - 1; // Skip to the line after this transaction
      continue;
    }

    // For now, use the entire merchantAndObservation as merchant
    // In the future, we could split this into merchant and observation if needed
    const merchant = merchantAndObservation;

    // Determine year (assume current year or previous year if month is in the future)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() is 0-indexed
    let year = currentYear;

    // If the month is in the future relative to current month, assume previous year
    if (parseInt(month) > currentMonth) {
      year = currentYear - 1;
    }

    const date = `${year}-${month}-${day}`;

    // Use the combined transaction text as raw description
    const rawDescription = transactionLines.join(" ");

    if (isPatreon) {
      console.log("Final transaction object:", {
        date,
        merchant,
        amount,
        rawDescription,
      });
      console.log("=== END PATREON DEBUG ===");
    }

    transactions.push({
      date,
      merchant,
      amount,
      rawDescription,
    });

    // Skip to the line after this transaction
    i = j - 1;
  }

  // Filter out invalid transactions
  return transactions.filter((t) => t.merchant && t.merchant.length > 0 && t.amount !== 0);
}

/**
 * Parse Brazilian currency amount (1.234,56 or 173,56) to number
 * Format: comma as decimal separator, dots as thousands separator
 */
function parseAmount(amountStr: string): number {
  // Remove any R$ prefix and spaces
  const clean = amountStr.replace(/R\$\s?/g, "").trim();

  // Handle negative
  const isNegative = clean.startsWith("-");
  const positive = clean.replace("-", "");

  // Replace dots (thousands separator) and comma (decimal separator) with standard format
  // Remove dots (thousands) and replace comma (decimal) with dot
  const normalized = positive.replace(/\./g, "").replace(",", ".");

  const value = parseFloat(normalized);
  return isNegative ? -value : value;
}

