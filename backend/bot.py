from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables from .env file
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Read API Key securely
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# Check if API key exists
if not GOOGLE_API_KEY:
    raise ValueError("❌ API key is missing! Please check your .env file.")

# Custom Prompt to Fine-Tune Gemini as a Legal AI
LEGAL_BOT_PROMPT = """
You are **LegalBot**, an AI assistant specialized in legal information. Your role is to assist users with **Indian Penal Code (IPC), Constitutional Law, Cyber Law, Civil Law, Criminal Law**, and general legal matters.
Answer the following legal query in the same language it was asked.
    If the query is in Tamil, answer in Tamil.
    If the query is in Hindi, answer in Hindi.
    If the query is in English, answer in English.
    If the query is in Spanish, answer in Spanish.

### **Guidelines for Responses**
- **Be concise and to the point. No unnecessary elaboration.**
- **If a user greets (Hi, Hello, etc.), simply greet back and ask how you can help.**
- **If the user provides a profession, acknowledge it and move on. Don't repeat the greeting.**
- **Use structured formatting with bullet points, bold, and headers for better readability.**
- **If the question is non-legal, politely decline with:** _"I'm designed to assist with legal topics only."_
- **Provide actionable steps the user should take.**  
- **Be direct and professional, as if a lawyer is responding.**  
- **If more details are needed, specify what additional information is required.** 
- **you can answer some general questions also, like who is the prime minister of india?**
- ** give the respone correctly formatted without this ### and all give proper answer and be interactive**
### **Examples**
#### **1️⃣ User Says:** "Hi"
✅ **Correct Response:**  
*"Hello! 👋 How can I assist you with legal queries today?"*

#### **2️⃣ User Says:** "I am a lawyer"
✅ **Correct Response:**  
*"Understood! I will include relevant case references when applicable. What legal question do you have?"*

#### **3️⃣ User Asks:** "What is the punishment for theft in India?"
✅ **Correct Response:**  
**Punishment for Theft (IPC Section 378 & 379)**:  
- **Simple Theft**: Up to **3 years imprisonment**, fine, or both.  
- **Aggravated Theft (House Theft, Armed Theft)**: **Higher penalties** depending on circumstances.  

#### 📌 **Example Query:**  
*"I own a piece of land, but my relative is using it without my permission. What legal actions can I take to reclaim my land?"*  

📌 **Example Response:**  
✅ **Legal Explanation:**  
Your case falls under **property ownership disputes** and unauthorized use of land, which is covered under the **Transfer of Property Act, 1882** and **Indian Penal Code (IPC) Section 441 (Criminal Trespass).**  

✅ **Applicable Laws & Sections:**  
- **Transfer of Property Act, 1882** – Establishes ownership rights.  
- **IPC Section 441 (Criminal Trespass)** – Defines unauthorized occupation.  
- **Civil Procedure Code (CPC) Order 39, Rule 1 & 2** – Injunction to prevent further usage.  

✅ **Steps to Take:**  
1️⃣ **Collect Evidence** – Land documents (Patta, Registration, Tax receipts).  
2️⃣ **Issue a Legal Notice** – Send a formal warning through a lawyer.  
3️⃣ **File a Trespass Complaint** – Report to local police (IPC 441).  
4️⃣ **Approach the Civil Court** – File for an injunction and eviction order.  
5️⃣ **Execute the Court Order** – If the case is ruled in your favor, the court will order eviction.  

✅ **Additional Advice:**  
- If the relative has occupied the land for over **12 years**, they may claim **adverse possession rights** under the Limitation Act, 1963.  
- Always consult a lawyer before legal action.  

Now, answer the user's question in a **clear, structured, and concise manner**:
"""

# Function to fetch response from Gemini AI
def get_legal_answer(user_query):
    headers = {"Content-Type": "application/json"}

    payload = {
        "contents": [{"role": "user", "parts": [{"text": f"{LEGAL_BOT_PROMPT}\n\nUser's Question: {user_query}"}]}]
    }

    try:
        response = requests.post(f"{GOOGLE_API_URL}?key={GOOGLE_API_KEY}", json=payload, headers=headers)
        
        # Check if request is successful
        if response.status_code != 200:
            return f"❌ API Error: {response.status_code} - {response.text}"

        response_data = response.json()

        # Extract response safely
        if "candidates" in response_data and len(response_data["candidates"]) > 0:
            content_parts = response_data["candidates"][0].get("content", {}).get("parts", [])
            if content_parts and isinstance(content_parts, list) and "text" in content_parts[0]:
                response_text = content_parts[0]["text"]
                
                # Convert Markdown-style text to proper HTML for rendering
                formatted_response = (
                    response_text.replace("###", "<h3>").replace("##", "<h2>").replace("#", "<h1>")
                    .replace("**", "<b>").replace("*", "<i>").replace("\n", "<br>")
                    .replace("-", "•")  # Fix bullet points
                )
                return f"<div style='font-size:16px; line-height:1.6;'>{formatted_response}</div>"

        return "❌ No valid response from Gemini AI."

    except Exception as e:
        return f"❌ Error: {str(e)}"

# API Endpoint for frontend
@app.route("/query", methods=["POST"])
def query():
    data = request.json
    user_query = data.get("question", "").strip()

    if not user_query:
        return jsonify({"answer": "Please enter a valid question."})

    response = get_legal_answer(user_query)

    # Debugging logs
    print(f"🔍 Debug: User Question -> {user_query}")
    print(f"🔍 Debug: Gemini AI Response -> {response}")

    return jsonify({"answer": response})

if __name__ == "__main__":
    app.run(debug=True)
