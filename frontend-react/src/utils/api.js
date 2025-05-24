import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${yourToken}`  <- optionally add token here
  }
});

api.interceptors.response.use(
  response => response,
  error => {
    // Handle errors globally
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getMovies = (id = null) =>
  id ? api.get(`/movies/${id}/`) : api.get('/movies/');

export const createMovie = (formData) =>
  api.post('/movies/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const updateMovie = (id, formData) =>
  api.put(`/movies/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const deleteMovies =(id) => api.delete(`/movies/${id}/`);

export default api;
