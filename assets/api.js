const api = {
    async getProducts(page = 1, sortOrder = '', filters = {}) {
        const params = new URLSearchParams({
            page: page,
            per_page: CONFIG.ITEMS_PER_PAGE,
            api_key: CONFIG.API_KEY
        });

        if (sortOrder) {
            params.append('sort_order', sortOrder);
        }

        if(filters.categories && filters.categories.length > 0) {
            filters.categories.forEach(category => params.append('category', category));
        }

        if(filters.priceMin) {
            params.append('price_min', filters.priceMin);
        }

        if(filters.priceMax) {
            params.append('price_max', filters.priceMax);
        }

        if(filters.discount) {
            params.append('discount', 'true');
        }

        const response = await fetch(`${CONFIG.API_URL}/goods?${params}`); // Изменено здесь
        return await response.json();
    },

   async getProduct(id) {
        const params = new URLSearchParams({
            api_key: CONFIG.API_KEY
        });

        const response = await fetch(`${CONFIG.API_URL}/goods/${id}?${params}`); // Изменено здесь
        return await response.json();
   }
};
const CONFIG = {
        API_URL: 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api',
        API_KEY: '51b2819e-4751-42cf-b166-e18bf8f957cb',
        ITEMS_PER_PAGE: 10
    };