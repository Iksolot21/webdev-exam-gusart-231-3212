const LocalStorageService = {
    getFullOrder() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    },
    addItem(item) {
        const cart = this.getFullOrder();
        cart.push(item); // Добавляем новый товар
        localStorage.setItem('cart', JSON.stringify(cart));
    },
  saveFullOrder(order) {
       localStorage.setItem('cart', JSON.stringify(order));
    },
  clearFullOrder() {
        localStorage.removeItem('cart');
    }
};

export default LocalStorageService;