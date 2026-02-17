
# SkyTalk: Akaflieg Graz Radio Simulator

SkyTalk is an advanced aviation radio communication trainer designed for student pilots. It leverages the **Gemini 2.5 Flash Native Audio** model to provide a realistic, low-latency ATC interaction experience within a professional GUI.

## 🚀 Key Features
- **Dynamic Context**: Realistic flight missions set in Austrian airports.
- **High-Fidelity Radio Stack**: Professional Active/Standby frequency management.
- **Native Audio Interaction**: Direct audio-to-audio conversation.
- **Real-time Visualization**: Mic activity meters and radio status lights.

## 🎓 Why the Paid Version is "Perfect"
While the **Showcase Mode** provides a static preview, the **Live API (Paid Version)** introduces the **Logic Engine**:

1. **Intelligent Read-Back Verification**: The AI controller actively listens to your response. If you forget to repeat a crucial instruction (like a holding point or a squawk code), it will stop you and demand a correct read-back.
2. **Standardized English (ICAO)**: We have implemented strict system prompts to prevent "hallucinations" or non-English responses. The ATC is locked to International Aviation English.
3. **Contextual Memory**: The AI remembers your previous calls. If you reported "Ready for Departure" 2 minutes ago, it won't ask you for your intentions again.

## 🔑 API Configuration
This app requires a **Paid API Key** from Google AI Studio. 
- Use the **"Select API Key"** button to link your key.
- Ensure your Google Cloud Project has **Billing Enabled**.
- **Important**: Gemini Live features are only available on paid-tier projects.

---
*Developed for Akaflieg Graz. Educational tool for simulated radio communication only.*
