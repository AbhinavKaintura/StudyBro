from flask import Flask, request, jsonify
from flask_cors import CORS # CROSS-ORIGIN-RESOURCE-SHARING
import google.generativeai as genai

app = Flask(__name__)
CORS(app)


# Configuring the API key for Google's generative AI service
genai.configure(api_key='Enter the gemini api key') #API
    
# Initializing the generative model with a specific model name
model = genai.GenerativeModel( model_name="gemini-1.5-flash")
    
# Starting a new chat session
chat = model.start_chat(history=[])


@app.route("/gemini", methods=["POST"])
async def make_agent_call():
    print("Query received")
    try:
        req_data = request.json
        sentence = req_data.get('message')
        print (sentence)
        # Get user input
        user_message = sentence
            
            # Check if the user wants to quit the conversation
        if user_message.lower() == 'quit':
                return "Exiting chat session."
                
        try :
            # Send the message to the chat session and receive a streamed response
                response = chat.send_message(user_message, stream=True)
        except Exception:
                response = "I don't understand. Please clearify."
            
            # Initialize an empty string to accumulate the response text
        full_response_text = ""
            
            # Accumulate the chunks of text
        try:
                for chunk in response:
                    full_response_text += chunk.text
            
        except Exception:
                full_response_text = "Key is corrupted. Please reopen the server"
                
            # Print the accumulated response as a single paragraph
        message = full_response_text
        return jsonify({"new_sentence": message})
            
    except Exception as e:
        return jsonify({"message": f"unsuccessful agent call - error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=7000)
