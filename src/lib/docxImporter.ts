import mammoth from "mammoth";
import { ImportResult } from "@/lib/excelImporter";

export async function importDocx(file: ArrayBuffer): Promise<ImportResult> {
  const warnings: string[] = [];

  try {
    const result = await mammoth.extractRawText({ arrayBuffer: file });
    const text = result.value;

    if (!text.trim()) {
      warnings.push("Document appears to be empty");
      return { steps: [], personas: [], resources: [], warnings };
    }

    warnings.push("DOCX import detected structured text. Please use Excel/CSV format for full scenario import.");
    warnings.push("The text content has been extracted but automatic mapping is not available for Word documents.");
    warnings.push(`Extracted ${text.length} characters from the document.`);

    return {
      steps: [],
      personas: [],
      resources: [],
      warnings,
    };
  } catch (error) {
    warnings.push(`Failed to parse DOCX file: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { steps: [], personas: [], resources: [], warnings };
  }
}
