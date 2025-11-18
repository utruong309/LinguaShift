const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function authHeaders(token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function getAuthToken() {
  // Try to get from localStorage as fallback
  return localStorage.getItem("authToken");
}

export async function apiFetch(path, options = {}) {
  const method = options.method || "GET";
  const body = options.body;
  // Use provided token, or try to get from localStorage
  const token = options.token || getAuthToken();

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorText;
      } catch {
        // If not JSON, use the text as is
      }
      throw new Error(errorMessage);
    }
    return res.json();
  } catch (err) {
    // Handle network errors
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new Error(
        `Cannot connect to server. Please make sure the backend is running at ${API_URL}. ` +
        `If you're running locally, start the backend with: cd backend && npm run dev`
      );
    }
    // Re-throw other errors
    throw err;
  }
}