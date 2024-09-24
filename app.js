
import express from "express"
import bodyParser from "body-parser";
import fetch from "node-fetch"
import axios from 'axios';

const app = express();
const port = 3001;

// Parse incoming requests
app.use(bodyParser.json());

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Serve static files (for CSS/JS)
app.use(express.static('public'));

// Your Gemini API Key
const GEMINI_API_KEY = 'AIzaSyAQjKow6GEnxhVKxHHknyBTS2qsIS5z6QM';

// Render the chatbot page
app.get('/', (req, res) => {
    res.render('chatbot');
});

// Handle chatbot interaction
const handleQuery = async () => {
    const queryUser = ""

    // Send message to Gemini API
    let gres;
    try {
        const getResponse = await axios.post('http://127.0.0.1:7000/gemini', {
        sentence: queryUser
        });
        gres = getResponse.data.new_sentence
    } catch (error) {
        console.error('Error:', error);
    }
    console.log(gres)



    // try {
    //     const response = await fetch('http://127.0.0.1:7000/home', {
    //         method: 'POST',
    //         headers: {
    //             'Authorization': `Bearer ${GEMINI_API_KEY}`,
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({ message: userMessage })
    //     });

    //     const data = await response.json();
    //     res.json({ response: data.reply || 'No response from Gemini' });
    // } catch (error) {
    //     console.error('Error communicating with Gemini API:', error);
    //     res.status(500).json({ response: 'Error communicating with Gemini' });
    // }
};

app.listen(port, () => {
    console.log(`Chatbot server is running on http://localhost:${port}`);
});