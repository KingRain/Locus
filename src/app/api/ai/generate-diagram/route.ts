import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, category } = await req.json();

    const systemInstruction = `You are an expert diagram generator for a collaborative canvas application called Locus.
Your task is to generate a diagram based on the user's prompt.
The user selected the category: ${category || "General Diagram"}.

Available ElementTypes:
- "rect", "ellipse", "diamond": standard shapes.
- "text": for standalone text.
- "sticky": for notes.
- "connector": to connect two shapes using their IDs.

Important Rules:
- Return an array of diagram elements.
- Generate a unique ID (uuid format or string) for each element.
- Do NOT modify or delete existing elements. You must generate a completely new diagram, offset to a new location on the canvas (e.g. x: 800, y: 100) to avoid overlapping with existing elements.
- Ensure the 'type' is one of: "rect", "ellipse", "diamond", "text", "sticky", "connector", "line", "arrow".
- Default width is usually 120-200, height 50-100.
- Connectors MUST specify 'fromId' and 'toId' using the generated IDs of the shapes they connect.
- Fill colors: stickies are usually "#fedf89", others "#ffffff" or hex colors.
- Stroke colors: usually "#151b31" or "#e8eaf2" for dark mode, default to "#151b31".
- zIndex: set to an incrementing number.`;

    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-3.1-pro-preview",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];

    let textResult = "";
    let lastError: unknown = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string" },
                  x: { type: "number" },
                  y: { type: "number" },
                  width: { type: "number" },
                  height: { type: "number" },
                  rotation: { type: "number" },
                  fill: { type: "string" },
                  stroke: { type: "string" },
                  text: { type: "string" },
                  textAlign: { type: "string", enum: ["left", "center", "right"] },
                  fromId: { type: "string", nullable: true },
                  toId: { type: "string", nullable: true },
                  zIndex: { type: "integer" }
                },
                required: ["id", "type", "x", "y", "width", "height", "text", "fill", "stroke"]
              }
            }
          }
        });

        if (response.text) {
          textResult = response.text;
          console.log(`Successfully generated diagram using ${model}`);
          break;
        }
      } catch (error: unknown) {
        console.warn(`Model ${model} failed:`, error instanceof Error ? error.message : "Unknown error");
        lastError = error;
      }
    }

    if (!textResult) {
      if (lastError) throw lastError;
      return NextResponse.json({ error: "No content generated" }, { status: 500 });
    }

    const elements = JSON.parse(textResult);
    return NextResponse.json({ elements });

  } catch (error: unknown) {
    console.error("AI diagram generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate diagram";
    const status = error && typeof error === "object" && "status" in error && typeof (error as { status: unknown }).status === "number" ? (error as { status: number }).status : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
