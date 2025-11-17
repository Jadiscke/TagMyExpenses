import pdfParse from "pdf-parse";
import * as pdfjsLib from "pdfjs-dist";

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPdf(
  buffer: Buffer,
  password?: string
): Promise<string> {
  // Only include password in options if it's actually provided
  const parseOptions: any = {};
  if (password && password.length > 0) {
    parseOptions.password = password;
  }
  
  try {
    const data = await pdfParse(buffer, parseOptions);
    return data.text;
  } catch (error: any) {
    // If password protected and no password provided, try to detect
    if (error.message?.includes("password") && !password) {
      throw new Error("PDF is password protected");
    }
    // If password was provided but still failed, try with pdfjs-dist
    if (password && password.length > 0) {
      try {
        return await extractTextWithPdfJs(buffer, password);
      } catch (fallbackError: any) {
        // If pdfjs also fails with password error, the password might be wrong
        if (fallbackError.message?.includes("password") || fallbackError.message?.includes("Password")) {
          throw new Error("Incorrect password or PDF is password protected");
        }
        throw new Error(`Failed to parse PDF: ${fallbackError.message || error.message}`);
      }
    }
    // Fallback to pdfjs-dist for better compatibility
    try {
      return await extractTextWithPdfJs(buffer, password);
    } catch (fallbackError) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }
}

/**
 * Alternative PDF text extraction using pdfjs-dist
 * Improved to better preserve line structure
 */
async function extractTextWithPdfJs(
  buffer: Buffer,
  password?: string
): Promise<string> {
  // Convert Buffer to Uint8Array for pdfjs-dist
  const uint8Array = new Uint8Array(buffer);
  
  const docOptions: any = {
    data: uint8Array,
  };
  
  // Only add password if provided (don't use empty string)
  if (password && password.length > 0) {
    docOptions.password = password;
  }
  
  const loadingTask = pdfjsLib.getDocument(docOptions);

  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Group text items by their y-coordinate (line) to preserve line structure
    const lines: { [key: number]: string[] } = {};
    let lastY = -1;
    let currentLine = "";
    
    for (const item of textContent.items) {
      const y = Math.round((item as any).transform[5] || 0);
      const text = (item as any).str || "";
      
      // If y-coordinate changed significantly (new line), add previous line
      if (lastY !== -1 && Math.abs(y - lastY) > 2) {
        if (currentLine.trim()) {
          fullText += currentLine.trim() + "\n";
        }
        currentLine = text;
      } else {
        // Same line, add space if needed
        if (currentLine && text) {
          currentLine += " " + text;
        } else {
          currentLine += text;
        }
      }
      
      lastY = y;
    }
    
    // Add the last line
    if (currentLine.trim()) {
      fullText += currentLine.trim() + "\n";
    }
  }

  return fullText;
}

