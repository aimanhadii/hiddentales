// api.js

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const apiFetch = (endpoint, options = {}) => {
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "ngrok-skip-browser-warning": "true",
    },
  });
};
