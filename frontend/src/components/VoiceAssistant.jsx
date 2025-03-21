import React, { useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

function VoiceAssistant({ onVoiceInput }) {
  const [isListening, setIsListening] = useState(false);
  const { transcript, resetTranscript, listening } = useSpeechRecognition();

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return <p>❌ Your browser does not support speech recognition.</p>;
  }

  const startListening = () => {
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true, language: "en-IN" });
  };

  const stopListening = () => {
    setIsListening(false);
    SpeechRecognition.stopListening();
    onVoiceInput(transcript); // Send transcribed text to chatbot
  };

  return (
    <div className="voice-container">
      <p className="status">Listening: {listening ? "ON 🎙️" : "OFF ❌"}</p>
      <div className="button-group">
        <button className="start-btn" onClick={startListening} disabled={isListening}>
          Start Listening
        </button>
        <button className="stop-btn" onClick={stopListening} disabled={!isListening}>
          Stop Listening
        </button>
        <button className="clear-btn" onClick={resetTranscript}>
          Clear
        </button>
      </div>
    </div>
  );
}

export default VoiceAssistant;
