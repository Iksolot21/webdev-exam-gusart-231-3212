 // assets/api.js
 import { CONFIG } from './config.js';

 const api = {
   async getProducts(page = 1, sort = 'rating_desc', filters = {}) {
         const params = new URLSearchParams({
             page: page,
             per_page: CONFIG.ITEMS_PER_PAGE,
             api_key: CONFIG.API_KEY,
             sort_order: sort, 
             ...filters 
         });
 
 
          for (const [key, value] of params.entries()) {
             if (value === null || value === undefined || value === '') {
                 params.delete(key);
             }
         }
          console.log('API Request URL:', `${CONFIG.API_URL}/goods?${params.toString()}`);
 
         const response = await fetch(`${CONFIG.API_URL}/goods?${params}`);
         if (!response.ok) {
             const errorData = await response.json();
             console.error('API Error:', errorData);
             throw new Error(`API request failed with status ${response.status}`);
         }
         return await response.json();
     },
     async getProduct(id) {
         const params = new URLSearchParams({
             api_key: CONFIG.API_KEY
         });
 
         const response = await fetch(`${CONFIG.API_URL}/goods/${id}?${params}`);
         if (!response.ok) {
             const errorData = await response.json();
             console.error('API Error:', errorData);
               throw new Error(`API request failed with status ${response.status}`);
         }
         return await response.json();
     },
     async getGoods() {
       const params = new URLSearchParams({
           api_key: CONFIG.API_KEY
       });
 
        const response = await fetch(`${CONFIG.API_URL}/goods?${params}`);
        if (!response.ok) {
             const errorData = await response.json();
             console.error('API Error:', errorData);
               throw new Error(`API request failed with status ${response.status}`);
         }
       return await response.json();
     },
     async autocomplete(query) {
         const params = new URLSearchParams({
             query: query,
             api_key: CONFIG.API_KEY
         });
 
         const response = await fetch(`${CONFIG.API_URL}/autocomplete?${params}`);
           if (!response.ok) {
             const errorData = await response.json();
             console.error('API Error:', errorData);
               throw new Error(`API request failed with status ${response.status}`);
         }
         return await response.json();
     }
 };
 
 export default api;