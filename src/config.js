const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'; // Assuming backend runs on 5001
const AI_API_BASE_URL = process.env.REACT_APP_AI_API_BASE_URL || 'http://localhost:5000/api'; // Assuming AI service runs on 5000

export { API_BASE_URL, AI_API_BASE_URL };