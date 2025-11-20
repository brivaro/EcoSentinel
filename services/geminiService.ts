import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash";

export const getAiResponse = async (userPrompt: string, contextData: any): Promise<string> => {
  try {
    // Safe access to process.env for browser environments
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
    
    if (!apiKey) {
      console.warn("API Key is missing or process.env is unavailable.");
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
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + "\n\nUser Query: " + userPrompt }] }
      ]
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm currently offline. Please check your internet connection or API key quota.";
  }
};