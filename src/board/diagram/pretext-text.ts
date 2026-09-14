/**
 * Pretext Engine: Text layout calculation & dynamic container-responsive font scaling.
 * Computes optimal font size, line wrapping, and layout metrics for SVG notes & canvas elements.
 */

export interface PretextLayoutResult {
  fontSize: number;
  lineHeight: number;
  lines: string[];
  totalHeight: number;
}

export function computePretextLayout(
  text: string,
  containerWidth: number,
  containerHeight: number,
  options?: {
    minFontSize?: number;
    maxFontSize?: number;
    targetFontSize?: number;
    padding?: number;
    fontFamily?: string;
  }
): PretextLayoutResult {
  const target = options?.targetFontSize;
  const minFont = options?.minFontSize ?? (target ?? 10);
  const maxFont = options?.maxFontSize ?? (target ?? 32);
  const padding = options?.padding ?? 16;
  const availWidth = Math.max(20, containerWidth - padding * 2);
  const availHeight = Math.max(20, containerHeight - padding * 2);

  if (!text || !text.trim()) {
    return {
      fontSize: 14,
      lineHeight: 18,
      lines: [""],
      totalHeight: 18,
    };
  }

  // Binary search or iterative step to find optimal font size fitting container bounds
  let bestFontSize = minFont;
  let bestLines: string[] = [text];
  let bestLineHeight = 16;

  for (let fontSize = maxFont; fontSize >= minFont; fontSize -= 1) {
    const lineHeight = Math.round(fontSize * 1.3);
    const charWidth = fontSize * 0.58; // Average character width ratio for Inter/Sans
    const maxCharsPerLine = Math.max(1, Math.floor(availWidth / charWidth));

    const paragraphs = text.split("\n");
    const wrappedLines: string[] = [];

    for (const paragraph of paragraphs) {
      if (!paragraph) {
        wrappedLines.push("");
        continue;
      }
      const words = paragraph.split(" ");
      let currentLine = "";

      for (const word of words) {
        if (!currentLine) {
          currentLine = word;
        } else if ((currentLine + " " + word).length <= maxCharsPerLine) {
          currentLine += " " + word;
        } else {
          wrappedLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    }

    const totalHeight = wrappedLines.length * lineHeight;

    if (totalHeight <= availHeight) {
      bestFontSize = fontSize;
      bestLines = wrappedLines;
      bestLineHeight = lineHeight;
      break;
    }
  }

  return {
    fontSize: bestFontSize,
    lineHeight: bestLineHeight,
    lines: bestLines,
    totalHeight: bestLines.length * bestLineHeight,
  };
}
