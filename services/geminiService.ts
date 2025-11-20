import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash";

export const getAiResponse = async (userPrompt: string, contextData: any): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn("API Key is missing.");
      return "Error: API Key configuration issue. AI features are disabled.";
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
      You are an expert Shelly IoT Engineer for EcoSentinel. 
      Diagnose problems using the technical manual logic and live telemetry.
      Be concise, professional, and helpful. Always answer in the same language of the question.
      
      CURRENT DEVICE CONTEXT:
      ${JSON.stringify(contextData, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: systemPrompt + "\n\nUser Query: " + userPrompt,
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm currently offline. Please check your internet connection or API key quota.";
  }
};
