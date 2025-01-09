// Утилиты для работы с уведомлениями
const notifications = {
    show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        document.getElementById('notifications').appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
};

// Утилиты для работы с корзиной
const cart = {
    add(product) {
        const items = this.getItems();
        items.push(product);
        localStorage.setItem('cart', JSON.stringify(items));
    },

    remove(productId) {
        const items = this.getItems();
        const index = items.findIndex(item => item.id === productId);
        if (index > -1) {
            items.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(items));
        }
    },

    getItems() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    }
};