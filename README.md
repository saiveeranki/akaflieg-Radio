
# SkyTalk: Akaflieg Graz Radio Simulator

SkyTalk is an advanced aviation radio communication trainer designed for student pilots. It leverages the **Gemini 2.5 Flash Native Audio** model to provide a realistic, low-latency ATC interaction experience within a professional GUI.

## 🚀 Key Features

### 1. Gemini-Powered Flight Scenarios
- **Dynamic Context**: Generates realistic flight missions specifically set in Austrian airports (LOWW, LOWI, LOWS, LOWG, LOWL).
- **Mission Briefing**: Provides specific callsigns, aircraft types (Diamond DA40, Cessna 172, etc.), current weather (ATIS), and training objectives.
- **Phase-Specific Training**: Practice communications for Pre-flight, Taxi, Takeoff, Enroute, Approach, and Landing.

### 2. High-Fidelity Radio Interface
- **Dual Frequency Stack**: Professional Active and Standby frequency management.
- **Frequency Flip**: Instant ↔ swap logic, mirroring real Garmin or BendixKing COM radios.
- **Manual Tuning**: 1MHz and 25kHz spacing tuning knobs for precise frequency selection.
- **Push-to-Talk (PTT)**: Interactive PTT logic that streams raw PCM audio to the Gemini Live API.

### 3. Real-Time ATC Interaction
- **Live Voice Response**: Speak to a simulated Austrian controller who responds with standard ICAO phraseology.
- **ATIS Audio**: One-click TTS generation of ATIS information to practice weather comprehension.
- **Transcription Log**: View a real-time text log of both your transmissions and the controller's responses for review.

### 4. Technical Architecture
- **AI Model**: `gemini-2.5-flash-native-audio-preview-12-2025` for natural voice conversation.
- **Audio Pipeline**: Custom PCM encoding/decoding for raw audio streams via Web Audio API.
- **Frontend**: React 19 with Tailwind CSS for a high-contrast, aviation-grade dark mode UI.

## 🛩 Usage Protocol (Akaflieg Graz)

1. **Briefing**: Read the mission objectives and listen to the ATIS broadcast.
2. **Frequency Management**: Tune the correct service (Ground/Tower) into Standby and flip to Active.
3. **Transmission**: Hold the PTT button, state your callsign and request, then release to listen.
4. **Review**: Check the transcription log to ensure you followed correct phraseology.

---
*Developed for Akaflieg Graz. Educational tool for simulated radio communication only.*
