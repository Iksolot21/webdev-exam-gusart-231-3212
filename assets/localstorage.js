const LocalStorageService = {
    getFullOrder() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    },
    saveFullOrder(order) {
       localStorage.setItem('cart', JSON.stringify(order));
    },
   clearFullOrder() {
        localStorage.removeItem('cart');
    }
};

export default LocalStorageService;