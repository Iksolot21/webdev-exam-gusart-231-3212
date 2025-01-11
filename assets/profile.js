import { CONFIG } from './config.js';
import LocalStorageService from './localStorage.js';

let goods = [];
let orders = [];

function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
     const fullOrder = LocalStorageService.getFullOrder() || [];
   cartCountElement.textContent = fullOrder.length;
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    initializeEventListeners();
     updateCartCount(); 
});

function init() {
    fetch(`${CONFIG.API_URL}/goods?api_key=${CONFIG.API_KEY}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при загрузке товаров');
            }
            return response.json();
        })
        .then(data => {
            if (!data || !Array.isArray(data)) {
                throw new Error('Неверный формат данных товаров');
            }
            goods = data; 
            console.log("Товары загружены:", goods);

            return loadOrders();
        })
        .catch(error => {
            console.error("Ошибка при загрузке товаров:", error);
            showError("Ошибка при загрузке данных о товарах");
        });
}

function loadOrders() {
    return fetch(`${CONFIG.API_URL}/orders?api_key=${CONFIG.API_KEY}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при загрузке заказов');
            }
            return response.json();
        })
        .then(data => {
            if (!data) {
                throw new Error('Неверный формат данных заказов');
            }
            orders = data.map(order => {
                if (order.delivery_interval) {
                    order.delivery_time = order.delivery_interval;
                    delete order.delivery_interval;
                }
                return order;
            });
            console.log("Заказы загружены:", orders);

            updateOrdersTable();
        })
        .catch(error => {
            console.error("Ошибка при загрузке заказов:", error);
            showError("Ошибка при загрузке данных о заказах");
        });
}

function updateOrdersTable() {
    const ordersTableBody = document.getElementById('ordersTableBody');

    if (!orders || orders.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Нет заказов для отображения.</td></tr>';
        return;
    }

    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    ordersTableBody.innerHTML = '';

    orders.forEach(order => {
        if (!order || !order.good_ids) {
            console.error('Некорректные данные заказа:', order);
            return;
        }

        const row = document.createElement('tr');

        const totalPrice = calculateOrderPrice(order.good_ids
            .map(goodId => {
                const good = getGood(goodId);
                return good;
            })
            .filter(Boolean));
        const orderDate = new Date(order.created_at).toLocaleString();

        const viewButton = document.createElement('button');
        viewButton.innerHTML = '👁️';
        viewButton.addEventListener('click', () => viewOrderDetails(order.id));

        const editButton = document.createElement('button');
        editButton.innerHTML = '✏️';
        editButton.addEventListener('click', () => editOrder(order.id));

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '❌';
        deleteButton.addEventListener('click', () => confirmDeleteOrder(order.id));

        const deliveryTime = order.delivery_time ? order.delivery_time : 'Как можно скорее<br>(с 07:00 до 23:00)';
        const deliveryDateTime = deliveryTime + '<br>' + new Date(order.delivery_date).toLocaleDateString();

        const goodsNames = order.good_ids
            .map(goodId => {
                const good = getGood(goodId);
                if (good) {
                    return good.name;
                }
                return null;

            })
            .filter(Boolean);

        row.innerHTML = `
        <td>${order.id}</td>
        <td>${orderDate}</td>
        <td>${goodsNames.join(', ') || 'Товары не найдены'}</td>
        <td class="text-right">${totalPrice}$</td>
        <td class="text-center">${deliveryDateTime}</td>
        <td class="btn-container"></td>
    `;
        const buttonContainer = row.querySelector('.btn-container');
        buttonContainer.appendChild(viewButton);
        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);

        ordersTableBody.appendChild(row);
    });
}

window.viewOrderDetails = viewOrderDetails;
window.editOrder = editOrder;
window.confirmDeleteOrder = confirmDeleteOrder;
window.deleteOrder = deleteOrder;

function initializeEventListeners() {
    const editForm = document.getElementById('editOrderForm');
    if (editForm) {
        editForm.addEventListener('submit', saveEditedOrder);
    }

    document.querySelectorAll('.modal .close-modal-btn').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    document.querySelectorAll('.modal .cancel-modal-btn').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    const deleteConfirmButton = document.querySelector('#deleteConfirmationModal .confirm-delete');
    if (deleteConfirmButton) {
        deleteConfirmButton.addEventListener('click', deleteOrder);
    }


    const deleteCancelButton = document.querySelector('#deleteConfirmationModal .cancel-delete');
    if (deleteCancelButton) {
        deleteCancelButton.addEventListener('click', function (event) {
            event.preventDefault();
            closeModal('deleteConfirmationModal');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    initializeEventListeners();
    
});
function getGood(goodId) {
    if (!goods || !Array.isArray(goods)) {
        console.error('Массив товаров не инициализирован или имеет неверный формат');
        return null;
    }
    return goods.find(good => good && good.id === goodId) || null;
}

function getOrder(orderId) {
    if (!orders || !Array.isArray(orders)) {
        console.error('Массив заказов не инициализирован или имеет неверный формат');
        return null;
    }
    return orders.find(order => order && order.id === orderId) || null;
}

function calculateOrderPrice(orderGoods) {
    if (!Array.isArray(orderGoods)) {
        console.error('Неверный формат данных товаров для расчета стоимости');
        return 0;
    }

    return orderGoods.reduce((total, good) => {
        if (!good) return total;
        const price = good.discount_price || good.actual_price || 0;
        return total + price;
    }, 0);
}

function viewOrderDetails(orderId) {
    console.log("Вызвана функция viewOrderDetails с orderId:", orderId);

    const order = getOrder(orderId);
    if (!order) {
        showError('Заказ не найден');
        return;
    }
  console.log("Данные заказа:", order);


    const orderGoods = order.good_ids
        .map(goodId => {
          const good = getGood(goodId);
          console.log('Товар с id ' + goodId + ':', good);
          return good;
        })
        .filter(Boolean);

     console.log("Товары в заказе:", orderGoods);


    const totalPrice = calculateOrderPrice(orderGoods);

    const container = document.getElementById('viewOrderDetailsContainer');
    container.innerHTML = '';

    const fields = {
        'Дата оформления': new Date(order.created_at).toLocaleString(),
        'Имя': order.full_name,
        'Номер телефона': order.phone,
        'Email': order.email,
        'Адрес доставки': order.delivery_address,
        'Дата доставки': new Date(order.delivery_date).toLocaleDateString(),
        'Время доставки': order.delivery_time || 'Как можно скорее (с 07:00 до 23:00)',
        'Комментарий': order.comment || 'Отсутствует',
    };

    for (const key in fields) {
        const p = document.createElement('p');
        p.innerHTML = `<b>${key}:</b> ${fields[key]}`;
        container.appendChild(p);
    }

    const orderItemsList = document.getElementById('orderItemsView');
    orderItemsList.innerHTML = '';

    orderGoods.forEach(good => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `${good.name} (${good.discount_price || good.actual_price}$)`;
        orderItemsList.appendChild(listItem);
    });

    document.getElementById('totalPriceView').textContent = `${totalPrice}$`;
    openModal('viewOrderModal');
}
function editOrder(orderId) {
    const order = getOrder(orderId);
    if (!order) {
        showError('Заказ не найден');
        return;
    }

    const orderGoods = order.good_ids
        .map(goodId => getGood(goodId))
        .filter(Boolean);

    const totalPrice = calculateOrderPrice(orderGoods);

    const container = document.getElementById('editOrderDetailsContainer');
    container.innerHTML = '';

    const orderDate = new Date(order.created_at);
    const formattedOrderDate = `${orderDate.toLocaleString()}`;

    const fields = [
        { label: 'Дата оформления', value: formattedOrderDate, type: 'text', element: 'span', id: 'editOrderDate' },
        { label: 'Имя', value: order.full_name, type: 'text', element: 'input', id: 'editFullName', required: true },
        { label: 'Номер телефона', value: order.phone, type: 'tel', element: 'input', id: 'editPhone', required: true },
        { label: 'Email', value: order.email, type: 'email', element: 'input', id: 'editEmail', required: true },
        { label: 'Адрес доставки', value: order.delivery_address, type: 'text', element: 'input', id: 'editAddress', required: true },
        { label: 'Дата доставки', value: new Date(order.delivery_date).toLocaleDateString(), type: 'date', element: 'input', id: 'delivery_date' },
        { label: 'Время доставки', type: 'select', element: 'select', id: 'delivery_time', options: ["Как можно скорее", "08:00-12:00", "12:00-14:00", "14:00-18:00", "18:00-22:00"] },
        { label: 'Комментарий', value: order.comment || '', type: 'textarea', element: 'textarea', id: 'editComment' },
    ];


    fields.forEach(field => {
        const label = document.createElement('label');
        label.textContent = field.label;

        let element;

        if (field.element === 'input') {
            element = document.createElement(field.element);
            element.value = field.value;
            element.id = field.id;
            if (field.required) {
                element.required = true;
            }
            if (field.type) {
                element.type = field.type;
            }


        } else if (field.element === 'select') {
            element = document.createElement(field.element);
            element.id = field.id;
            field.options.forEach(optionValue => {
                const option = document.createElement('option');
                option.value = optionValue;
                option.text = optionValue;
                if (optionValue === (order.delivery_time || 'Как можно скорее')) {
                    option.selected = true;
                }
                element.appendChild(option);
            })
        } else if (field.element === 'textarea') {
            element = document.createElement(field.element);
            element.value = field.value;
            element.id = field.id;

        } else {
            element = document.createElement(field.element);
            element.textContent = field.value;
            element.id = field.id;
        }

        container.appendChild(label);
        container.appendChild(element);
    });


    window.editOrderId = orderId;


    const orderItemsList = document.getElementById('orderItems2');
    orderItemsList.innerHTML = '';

    orderGoods.forEach(good => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `${good.name} (${good.discount_price || good.actual_price}$)`;
        orderItemsList.appendChild(listItem);
    });
    document.getElementById('totalPrice2').textContent = `Итоговая стоимость: ${totalPrice}$`;
    openModal('orderEditModal');
}

function saveEditedOrder(event) {
    event.preventDefault();

    const editedOrder = new FormData();
    editedOrder.append('full_name', document.getElementById('editFullName').value);
    editedOrder.append('email', document.getElementById('editEmail').value);
    editedOrder.append('phone', document.getElementById('editPhone').value);
    editedOrder.append('delivery_address', document.getElementById('editAddress').value);
    editedOrder.append('comment', document.getElementById('editComment').value);


    const deliveryDateInput = document.getElementById('delivery_date');
    const deliveryTimeSelect = document.getElementById('delivery_time');

    editedOrder.append('delivery_date', deliveryDateInput.value);
    editedOrder.append('delivery_interval', deliveryTimeSelect.value);

    fetch(`${CONFIG.API_URL}/orders/${window.editOrderId}?api_key=${CONFIG.API_KEY}`, {
        method: 'PUT',
        body: editedOrder
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Ошибка при сохранении изменений заказа');
                });
            }
            return response.json();
        })
        .then(() => {
            notifications.show('Заказ успешно изменен', 'success');
            closeModal('orderEditModal');
             loadOrders();
        })
        .catch(error => {
            console.error('Ошибка при сохранении изменений заказа:', error);
            notifications.show(error.message, 'error');
        });
}

function confirmDeleteOrder(orderId) {
    window.deleteOrderId = orderId;
    openModal('deleteConfirmationModal');
}

function deleteOrder() {
    fetch(`${CONFIG.API_URL}/orders/${window.deleteOrderId}?api_key=${CONFIG.API_KEY}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Ошибка при удалении заказа');
                });
            }
            return response.json();
        })
        .then(() => {
            notifications.show('Заказ удален', 'success');
            closeModal('deleteConfirmationModal');
             loadOrders();
        })
        .catch(error => {
            console.error('Ошибка при удалении заказа:', error);
            notifications.show(error.message, 'error');
        });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function showError(message) {
    const ordersTableBody = document.getElementById('ordersTableBody');
    if (ordersTableBody) {
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-4 text-red-500">
                    ${message}
                </td>
            </tr>
        `;
    }
    notifications.show(message, 'error');
}

document.addEventListener('DOMContentLoaded', init);
document.getElementById('editOrderForm').addEventListener('submit', saveEditedOrder);

document.querySelectorAll('.modal .close').forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
        }
    });
});