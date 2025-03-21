import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaMicrophone, FaTrash } from "react-icons/fa";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import "./App.css";

const languageOptions = [
  { code: "en-IN", label: "English", short: "EN" },
  { code: "ta-IN", label: "தமிழ் (Tamil)", short: "TA" },
  { code: "hi-IN", label: "हिन्दी (Hindi)", short: "HI" },
  { code: "bn-IN", label: "বাংলা (Bengali)", short: "BN" },
  { code: "ml-IN", label: "മലയാളം (Malayalam)", short: "ML" },
  { code: "te-IN", label: "తెలుగు (Telugu)", short: "TE" },
  { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)", short: "KN" },
];

const BACKEND_API_URL = "http://localhost:5000/query"; // Flask API URL

function App() {
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState([]); // Stores current chat messages
  const [chatHistory, setChatHistory] = useState([]); // Stores past chats
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]); // Default: English
  const [showDropdown, setShowDropdown] = useState(false);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const [thinking, setThinking] = useState(false); // Show "Thinking..." bubble
  const chatEndRef = useRef(null); // For auto-scrolling

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (transcript) {
      setQuestion(transcript);
    }
  }, [transcript]);


  const handleChange = (e) => {
    setQuestion(e.target.value);
  };

  const startListening = () => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    SpeechRecognition.startListening({ continuous: false, language: selectedLanguage.code });
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    // Add to chat messages and history
    setChatMessages((prev) => [...prev, { type: "question", text: question }]);
    setChatHistory((prev) => [...prev, getTopic(question)]);
    setThinking(true); // Show "Thinking..." bubble

    try {
      const response = await axios.post(BACKEND_API_URL, { question });

      console.log("Response from Backend:", response.data);

      const answer = response.data.answer || "Sorry, I couldn't fetch a response.";

      // Remove "Thinking..." and display formatted answer
      setThinking(false);
      setChatMessages((prev) => [
        ...prev,
        { type: "answer", text: formatAnswer(answer) },
      ]);
      
    } catch (error) {
      console.error("Error fetching response:", error);
      setThinking(false);
      alert("Failed to get response from Gemini AI.");
    }
    
    setQuestion("");
    resetTranscript();
  };

  const getTopic = (question) => {
    // Convert question to lowercase for consistency
    const questionLower = question.toLowerCase();
    
    // Define a list of common keywords related to actions or scenarios
    const actionKeywords = [
      "what should i do", "what to do", "how to", "actions to take", "steps to take", "what are the steps"
    ];
  
    // Define key scenario-related words to catch legal and action-based situations
    const scenarioKeywords = [
      "accident", "theft", "crime", "land dispute", "contract breach", "divorce", "trespass", "harassment"
    ];
  
    // Look for action keywords in the question
    let actionTopic = "";
    for (let action of actionKeywords) {
      if (questionLower.includes(action)) {
        actionTopic = action;
        break;
      }
    }
  
    // Look for scenario keywords to identify the issue
    let scenarioTopic = "";
    for (let scenario of scenarioKeywords) {
      if (questionLower.includes(scenario)) {
        scenarioTopic = scenario;
        break;
      }
    }
  
    // Construct the topic based on the found keywords
    if (actionTopic && scenarioTopic) {
      return `${actionTopic} after ${scenarioTopic}`;
    } else if (scenarioTopic) {
      return `actions to be taken in case of ${scenarioTopic}`;
    } else {
      // Fallback to a more general approach
      return question.split(" ").slice(0, 5).join(" "); // Get first 5 words as fallback
    }
  };
  

  // Format the bot's response for better readability
  const formatAnswer = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Convert **bold** to <strong>
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // Convert *italic* to <em>
      .replace(/\n/g, "<br>") // Convert new lines to <br> for proper spacing
      .replace(/- /g, "• "); // Convert list items "-" to bullet points "•"
  };

  return (
    <div className="app-container">
      {/* Chat History Sidebar */}
      <motion.div className="chat-history">
        <h2>📜 Chat History</h2>
        {chatHistory.length === 0 ? (
          <p className="no-history">No chats yet</p>
        ) : (
          chatHistory.map((chat, index) => (
            <motion.div key={index} className="chat-item">
              <span>{chat}</span>
              <FaTrash
                className="delete-icon"
                onClick={() => {
                  setChatHistory(chatHistory.filter((_, i) => i !== index));
                }}
              />
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Chat Interface */}
      <motion.div className="chat-container">
        <motion.div className="chat-header">
          <h2>⚖️ Legal Bot</h2>
        </motion.div>

        <div className="qa-container">
          {chatMessages.map((chat, index) => (
            <motion.div 
              key={index} 
              className={`chat-bubble ${chat.type}`} 
              dangerouslySetInnerHTML={{ __html: chat.text }} // Render formatted HTML
            />
          ))}
          {thinking && (
            <motion.div className="chat-bubble thinking">
              <span>🤔 Thinking...</span>
            </motion.div>
          )}
          <div ref={chatEndRef}></div> {/* Keeps chat auto-scrolled */}
        </div>

        {/* Input Field at Bottom */}
        <div className="input-container">
          <input
            type="text"
            className="question-input"
            placeholder="Ask a legal question..."
            value={transcript || question}
            onChange={handleChange}
          />

          {/* 🎤 Voice Input Button */}
          <motion.button className="voice-button" onClick={startListening} title="Use Voice Input">
            <FaMicrophone />
          </motion.button>

          {/* 🌍 Language Selector Icon */}
          <motion.div className="language-selector" onClick={() => setShowDropdown(!showDropdown)}>
            <span className="language-icon">{selectedLanguage.short}</span>
            {showDropdown && (
              <div className="dropdown">
                {languageOptions.map((lang) => (
                  <div key={lang.code} className="dropdown-item" onClick={() => {
                    setSelectedLanguage(lang);
                    setShowDropdown(false);
                  }}>
                    {lang.label}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* 🟢 Ask Button */}
          <motion.button className="ask-button" onClick={handleAsk}>
            Ask
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default App;
