const API_KEY = "51b2819e-4751-42cf-b166-e18bf8f957cb"; // Замените на свой API Key

const API_URL = "https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api"; // Укажите url здесь

const ITEMS_PER_PAGE = 10; // Количество элементов на странице

const api = {
    async getProducts(page = 1, sortOrder = '', filters = {}) {
        const params = new URLSearchParams({
            page: page,
            per_page: ITEMS_PER_PAGE,
            api_key: API_KEY
        });

        if (sortOrder) {
            params.append('sort_order', sortOrder);
        }
          if (filters.categories) {
            params.append('category', filters.categories);
        }

        if(filters.priceMin) {
            params.append('price_min', filters.priceMin);
        }

        if(filters.priceMax) {
            params.append('price_max', filters.priceMax);
        }
        if (filters.discount) {
             params.append('discount', 1);
        }


        
         console.log('API Request URL:', `${API_URL}/goods?${params.toString()}`);


        const response = await fetch(`${API_URL}/goods?${params}`);
            if (!response.ok) {
               const errorData = await response.json();
               console.error('API Error:', errorData);
              throw new Error(`API request failed with status ${response.status}`);
         }
        return await response.json();
    },

    async getProduct(id) {
        const params = new URLSearchParams({
            api_key: API_KEY
        });

        const response = await fetch(`${API_URL}/goods/${id}?${params}`);
        return await response.json();
    },

    async getGoods() {
        const params = new URLSearchParams({
            api_key: API_KEY
        });

        const response = await fetch(`${API_URL}/goods?${params}`);
        return await response.json();
    }
};