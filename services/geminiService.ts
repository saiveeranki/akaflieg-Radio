
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { FlightScenario, InteractiveShowcase } from "../types";

export const VFR_SHOWCASE_LIST: InteractiveShowcase[] = [
  {
    title: "VFR Departure Graz",
    description: "Standard VFR departure from Stand 12 at LOWG.",
    scenario: {
      callsign: "OE-KAG",
      aircraftType: "Diamond DA40",
      location: "Graz Airport (LOWG)",
      mission: "VFR departure via Whiskey. Information Alpha is current.",
      atis: "Graz Information Alpha, Runway 35. Wind 340 degrees 05 knots. QNH 1013.",
      currentPhase: 'PRE-FLIGHT',
      objectives: ["Request Taxi", "Read back route", "Report ready"]
    },
    steps: [
      { id: 'taxi', phase: 'GROUND', frequency: '121.700', pilotPrompt: "Graz Ground, OSCAR ECHO KILO ALPHA GOLF, Diamond 40, Stand 12, Information Alpha, Request Taxi for VFR departure via Whiskey.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Graz Ground, Hello. Taxi to holding point Runway 35 via Mike and Bravo. QNH 1013." },
      { id: 'ready', phase: 'TOWER', frequency: '118.100', pilotPrompt: "Taxi to holding point Runway 35 via Mike and Bravo, QNH 1013, OSCAR ECHO KILO ALPHA GOLF. Ready for departure.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Read back correct. Wind 340 degrees 5 knots, Runway 35, Cleared for takeoff. Departure Whiskey approved." }
    ]
  },
  {
    title: "Salzburg Touch-and-Go",
    description: "Circuit training in the Salzburg Control Zone.",
    scenario: {
      callsign: "OE-KAG",
      aircraftType: "Cessna 172",
      location: "Salzburg (LOWS)",
      mission: "Perform touch-and-go on Runway 15.",
      atis: "Salzburg Information Bravo, Runway 15. Wind variable 3 knots. QNH 1020.",
      currentPhase: 'TAXI',
      objectives: ["Obtain takeoff clearance", "Report downwind", "Read back landing/option"]
    },
    steps: [
      { id: 'takeoff', phase: 'TOWER', frequency: '118.100', pilotPrompt: "Salzburg Tower, OSCAR ECHO KILO ALPHA GOLF, holding point Runway 15, request takeoff for left-hand circuits.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Salzburg Tower, cleared for takeoff Runway 15, left hand circuit approved. Report downwind." },
      { id: 'downwind', phase: 'TOWER', frequency: '118.100', pilotPrompt: "Downwind Runway 15, OSCAR ECHO KILO ALPHA GOLF, for touch and go.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Read back correct. Number 1. Wind calm. Runway 15, cleared touch and go." }
    ]
  },
  {
    title: "Vienna CTR Crossing",
    description: "Crossing Class C airspace south of Schwechat.",
    scenario: {
      callsign: "OE-KAG",
      aircraftType: "Diamond DA40",
      location: "Vienna (LOWW)",
      mission: "Transit through the CTR from South to North.",
      atis: "Vienna Info current, wind 290/10.",
      currentPhase: 'TRANSIT',
      objectives: ["Request crossing", "Read back transponder", "Confirm exit"]
    },
    steps: [
      { id: 'crossing', phase: 'APPROACH', frequency: '134.500', pilotPrompt: "Wien Director, OSCAR ECHO KILO ALPHA GOLF, Diamond 40, south of Guntramsdorf, 3000 feet, request transit to the North via Sierra.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Wien Director, Hello. Transit approved via Sierra, maintain 3000 feet or below. Squawk 4521." },
      { id: 'confirm', phase: 'APPROACH', frequency: '134.500', pilotPrompt: "Transit via Sierra, 3000 feet or below, Squawk 4521, OSCAR ECHO KILO ALPHA GOLF.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Read back correct. Report Sierra 1." }
    ]
  },
  {
    title: "Innsbruck Visual Arrival",
    description: "Mountain approach via Mike points.",
    scenario: {
      callsign: "OE-KAG",
      aircraftType: "DA40",
      location: "Innsbruck (LOWI)",
      mission: "Arrival from the West via reporting point Mike.",
      atis: "Innsbruck Information Charlie, Runway 26. QNH 1008.",
      currentPhase: 'APPROACH',
      objectives: ["Report Mike 1", "Join downwind", "Read back landing"]
    },
    steps: [
      { id: 'mike', phase: 'TOWER', frequency: '120.100', pilotPrompt: "Innsbruck Tower, OSCAR ECHO KILO ALPHA GOLF, at Mike 1, 4500 feet, Information Charlie, for landing.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Innsbruck Tower, Hello. Join left-hand downwind Runway 26. Wind 250 degrees 8 knots." },
      { id: 'land', phase: 'TOWER', frequency: '120.100', pilotPrompt: "Join left-hand downwind Runway 26, OSCAR ECHO KILO ALPHA GOLF.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Read back correct. Continue approach, number 2 behind a Dash 8 on final." }
    ]
  },
  {
    title: "Pan-Pan Emergency",
    description: "Engine vibration near Klagenfurt.",
    scenario: {
      callsign: "OE-KAG",
      aircraftType: "C172",
      location: "Klagenfurt (LOWK)",
      mission: "Declare urgency due to engine roughness.",
      atis: "Weather CAVOK.",
      currentPhase: 'EMERGENCY',
      objectives: ["Declare Pan-Pan", "State intentions", "Read back priority"]
    },
    steps: [
      { id: 'pan', phase: 'TOWER', frequency: '118.100', pilotPrompt: "PAN PAN, PAN PAN, PAN PAN. Klagenfurt Tower, OSCAR ECHO KILO ALPHA GOLF, Engine vibration, request immediate landing.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Klagenfurt Tower, Roger the Pan Pan. You are cleared for a straight-in approach Runway 28L. Wind calm." },
      { id: 'final', phase: 'TOWER', frequency: '118.100', pilotPrompt: "Cleared straight-in Runway 28L, OSCAR ECHO KILO ALPHA GOLF.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Read back correct. Fire services are on standby, report 2 miles final." }
    ]
  },
  {
    title: "Zeltweg Military Transit",
    description: "Crossing a restricted military area.",
    scenario: {
      callsign: "OE-KAG",
      aircraftType: "DA40",
      location: "Zeltweg (LOXZ)",
      mission: "VFR crossing to the East.",
      atis: "Active military ops.",
      currentPhase: 'TRANSIT',
      objectives: ["Establish contact", "Obtain crossing", "Read back restrictions"]
    },
    steps: [
      { id: 'zelt', phase: 'TOWER', frequency: '122.100', pilotPrompt: "Zeltweg Tower, OSCAR ECHO KILO ALPHA GOLF, Diamond 40, north of Knittelfeld, 4000 feet, request crossing to the East.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Zeltweg Tower, Hello. Crossing approved, maintain north of the runway at all times. Squawk 7000." },
      { id: 'confirm', phase: 'TOWER', frequency: '122.100', pilotPrompt: "Crossing approved, maintain north of the runway, Squawk 7000, OSCAR ECHO KILO ALPHA GOLF.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Read back correct. Report clear of the zone." }
    ]
  },
  {
    title: "Bad Vöslau Info Arrival",
    description: "Communication with a non-towered Flight Info service.",
    scenario: {
      callsign: "OE-KAG",
      aircraftType: "DA40",
      location: "Bad Vöslau (LOAV)",
      mission: "Standard arrival at an uncontrolled field.",
      atis: "None (Info service).",
      currentPhase: 'APPROACH',
      objectives: ["Initial call", "Report overhead", "State intentions"]
    },
    steps: [
      { id: 'info', phase: 'INFO', frequency: '118.930', pilotPrompt: "Vöslau INFO, OSCAR ECHO KILO ALPHA GOLF, DA40, 5 minutes south, 2500 feet, for landing with information.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Vöslau INFO, Hello. Runway 31 in use. Wind 300 degrees 10 knots. QNH 1015. 2 aircraft in the circuit." },
      { id: 'intent', phase: 'INFO', frequency: '118.930', pilotPrompt: "Runway 31, QNH 1015, OSCAR ECHO KILO ALPHA GOLF. Will join overhead.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Read back correct. Report overhead Runway 31." }
    ]
  },
  {
    title: "Linz Entry VFR",
    description: "Entering the Control Zone from reporting points.",
    scenario: {
      callsign: "OE-KAG",
      aircraftType: "C172",
      location: "Linz (LOWL)",
      mission: "Entry via Reporting Point November.",
      atis: "Info Delta, Runway 08.",
      currentPhase: 'APPROACH',
      objectives: ["Initial call", "Entry clearance", "Read back altitude"]
    },
    steps: [
      { id: 'entry', phase: 'TOWER', frequency: '118.800', pilotPrompt: "Linz Tower, OSCAR ECHO KILO ALPHA GOLF, C172, over Enns, 2000 feet, Information Delta, for landing via November.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Linz Tower, Hello. Cleared to enter the CTR via November 1. Maintain 2000 feet or below. Squawk 3412." },
      { id: 'confirm', phase: 'TOWER', frequency: '118.800', pilotPrompt: "Cleared to enter via November 1, maintain 2000 feet or below, Squawk 3412, OSCAR ECHO KILO ALPHA GOLF.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Read back correct. Report November 1." }
    ]
  },
  {
    title: "Lost in the Alps (FIS)",
    description: "Requesting assistance from Flight Information Service.",
    scenario: {
      callsign: "OE-KAG",
      aircraftType: "DA40",
      location: "Alps (Wien Information)",
      mission: "Unsure of position due to clouds.",
      atis: "None.",
      currentPhase: 'ENROUTE',
      objectives: ["Request position", "Read back squawk", "Accept guidance"]
    },
    steps: [
      { id: 'lost', phase: 'INFO', frequency: '124.400', pilotPrompt: "Wien Information, OSCAR ECHO KILO ALPHA GOLF, Diamond 40, unsure of position near Ennstal, request position assistance.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Wien Information, Roger. Squawk 7000 and Ident. Say again altitude and endurance." },
      { id: 'confirm', phase: 'INFO', frequency: '124.400', pilotPrompt: "Squawk 7000 and Ident, OSCAR ECHO KILO ALPHA GOLF. Altitude 5500 feet, endurance 3 hours.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Read back correct. Radar contact 5 miles south of Liezen. Heading 090 for better terrain clearance." }
    ]
  },
  {
    title: "Final Approach Graz",
    description: "Coming home to LOWG.",
    scenario: {
      callsign: "OE-KAG",
      aircraftType: "DA40",
      location: "Graz (LOWG)",
      mission: "Final approach and landing.",
      atis: "Info Alpha, Runway 35.",
      currentPhase: 'APPROACH',
      objectives: ["Report final", "Read back landing", "Confirm vacated"]
    },
    steps: [
      { id: 'final', phase: 'TOWER', frequency: '118.100', pilotPrompt: "Graz Tower, OSCAR ECHO KILO ALPHA GOLF, on final Runway 35.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Graz Tower. Wind 340 degrees 5 knots, Runway 35, cleared to land." },
      { id: 'vacate', phase: 'TOWER', frequency: '118.100', pilotPrompt: "Cleared to land Runway 35, OSCAR ECHO KILO ALPHA GOLF.", atcResponse: "OSCAR ECHO KILO ALPHA GOLF, Read back correct. After landing vacate via Bravo and contact Ground on 121.700, servus!" }
    ]
  }
];

export const generateScenario = async (): Promise<FlightScenario> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Generate a realistic VFR flight radio practice scenario for a student pilot. Set in Austria. Use standard ICAO phraseology. Include callsign, aircraft type, location, mission, ATIS, and objectives.",
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
          currentPhase: { type: Type.STRING, enum: ['PRE-FLIGHT', 'TAXI', 'TAKEOFF', 'ENROUTE', 'APPROACH', 'LANDING', 'EMERGENCY'] },
          objectives: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["callsign", "aircraftType", "location", "mission", "atis", "currentPhase", "objectives"]
      }
    }
  });

  return JSON.parse(response.text.trim()) as FlightScenario;
};

export const generateAtisAudio = async (atisText: string, voice: string = 'Kore'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this aviation ATIS strictly in a clear English voice. MANDATORY: ALWAYS expand all letters and callsigns into the full ICAO phonetic alphabet. Use a professional broadcast pace. Content: ${atisText}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};

export const generateSpeech = async (text: string, voice: string = 'Charon'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `You are an Air Traffic Controller. Speak this phraseology crisply and professionally. MANDATORY: EXPAND the callsign to its full phonetic equivalent (e.g. OSCAR ECHO KILO ALPHA GOLF). NEVER just say the letters. Text: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};

export const getSystemInstruction = (scenario: FlightScenario) => {
  return `
    You are an Air Traffic Controller (ATC) simulator in Austria. 
    Respond ONLY in ENGLISH using strict ICAO aviation phraseology. 
    MANDATORY: ALWAYS speak using the full ICAO phonetic alphabet for ALL callsigns (e.g., "Oscar Echo Kilo Alpha Golf").
    THE READ-BACK RULE: You must verify the pilot's read-back. 
    - If correct, start with "[Callsign], Read back correct."
    - If incorrect, say "[Callsign], negative, read back [missing part]."
    
    CONTEXT:
    - Callsign: ${scenario.callsign}
    - Location: ${scenario.location}
    - Mission: ${scenario.mission}
  `;
};
