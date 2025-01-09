const api = {
    async getProducts(page = 1, sortOrder = '') {
        const params = new URLSearchParams({
            page: page,
            per_page: CONFIG.ITEMS_PER_PAGE,
            api_key: CONFIG.API_KEY
        });

        if (sortOrder) {
            params.append('sort_order', sortOrder);
        }

        const response = await fetch(`${CONFIG.API_URL}/products?${params}`);
        return await response.json();
    },

    async getProduct(id) {
        const params = new URLSearchParams({
            api_key: CONFIG.API_KEY
        });

        const response = await fetch(`${CONFIG.API_URL}/products/${id}?${params}`);
        return await response.json();
    }
};