import { GoogleGenAI } from "@google/genai";

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateLuxuryGreeting = async (): Promise<string> => {
  const ai = getGeminiClient();
  if (!ai) return "Wishing you a Golden Season.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "You are the lead copywriter for 'Winnie', an ultra-luxury brand. Write a single, short, opulent sentence (max 12 words) wishing the user a magnificent Christmas. Use words like 'Golden', 'Radiance', 'Timeless'. No quotation marks.",
    });
    
    return response.text.trim() || "Radiance in every moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Elegance is the only beauty that never fades.";
  }
};