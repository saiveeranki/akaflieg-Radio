
import { GoogleGenAI, Type } from "@google/genai";
import { FlightScenario } from "../types";

export const generateScenario = async (): Promise<FlightScenario> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Generate a realistic flight radio communication practice scenario for a student pilot, specifically set in Austria (e.g., airports like Vienna LOWW, Innsbruck LOWI, Salzburg LOWS, Graz LOWG, or Linz LOWL). Include callsign, aircraft type, location, a clear mission, current ATIS info, and objectives. Be specific about the phase of flight.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          callsign: { type: Type.STRING },
          aircraftType: { type: Type.STRING },
          location: { type: Type.STRING },
          mission: { type: Type.STRING },
          atis: { type: Type.STRING },
          currentPhase: { type: Type.STRING, enum: ['PRE-FLIGHT', 'TAXI', 'TAKEOFF', 'ENROUTE', 'APPROACH', 'LANDING'] },
          objectives: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["callsign", "aircraftType", "location", "mission", "atis", "currentPhase", "objectives"]
      }
    }
  });

  return JSON.parse(response.text.trim()) as FlightScenario;
};

export const generateAtisAudio = async (atisText: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this aviation ATIS information clearly and professionally: ${atisText}` }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data received for ATIS");
  return base64Audio;
};

export const getSystemInstruction = (scenario: FlightScenario) => {
  return `
    You are an Air Traffic Controller (ATC) simulator based in Austria. Your goal is to help a student pilot practice radio communication.
    
    SCENARIO CONTEXT (Austrian Setting):
    - Callsign: ${scenario.callsign}
    - Aircraft: ${scenario.aircraftType}
    - Location: ${scenario.location}
    - Current Mission: ${scenario.mission}
    - ATIS: ${scenario.atis}
    
    INSTRUCTIONS:
    1. Act as the appropriate Austrian controller (e.g., Wien Ground, Innsbruck Tower, Salzburg Approach) based on the scenario location.
    2. Use standard ICAO aviation phraseology.
    3. Be professional, concise, and occasionally corrective if the student makes a major error.
    4. Maintain the persona. Do not break character.
    5. Ensure your audio responses sound like a real radio (short, crisp, clear).
  `;
};
