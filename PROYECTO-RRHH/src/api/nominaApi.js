const BASE_URL = 'http://localhost:4000/api';

export const fetchData = async (endpoint) => {
    try {
        const response = await fetch(`${BASE_URL}/${endpoint}`);
        const result = await response.json();
        return result.ok ? result.data : [];
    } catch (error) {
        console.error(`Error en API (${endpoint}):`, error);
        return [];
    }
};