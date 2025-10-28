import axios from 'axios';
export const BASE_URL = `http://192.168.1.6:8000/api`;
const BASE_URL = 'https://your-backend.com/api'; // replace with your backend URL

export const sendFeedback = async ({ category, message }) => {
  try {
    const response = await axios.post(`${BASE_URL}/feedback`, { category, message });
    return response.data;
  } catch (error) {
    console.error('Error sending feedback:', error.response || error.message);
    throw error;
  }
};
