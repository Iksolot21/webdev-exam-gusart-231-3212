import LocalStorageService from './localStorage.js';

let selectedItems = [];


document.addEventListener('DOMContentLoaded', () => {
    const fullOrder = LocalStorageService.getFullOrder();
    
    if (fullOrder && fullOrder.length > 0) {
        displayOrderSummary(fullOrder);
    } else {
        document.getElementById('orderSummary').innerHTML = '<p><b>Корзина пуста. Чтобы добавить товары в заказ, перейдите на главную страницу</b></p>';
        document.getElementById('cards-display').innerHTML = '<p> </p><p>Добавьте товары, чтобы они появились здесь.</p>';
    }
    
    document.getElementById('orderForm').addEventListener('submit', handleOrderSubmit);
});

function isEmptyOrder(order) {
    return !order || order.length === 0;
}

function displayOrderSummary(fullOrder) {
    const orderSummary = document.getElementById('orderSummary');
    const cardsDisplay = document.getElementById('cards-display');
    
    // Очищаем содержимое перед обновлением
    orderSummary.innerHTML = '';
    cardsDisplay.innerHTML = '';
    
    if (isEmptyOrder(fullOrder)) {
        // Если заказ пустой, отображаем сообщение
        orderSummary.innerHTML = '<p><b>Корзина пуста. Чтобы добавить товары в заказ, перейдите на главную страницу</b></p>';
         cardsDisplay.innerHTML = '<p> </p><p>Добавьте товары, чтобы они появились здесь.</p>';
        return;
    }
    
    let totalPrice = 0;

        fullOrder.forEach(item => {
        // Создаём карточку и добавляем её в верхний контейнер
        const cardForDisplay = createDishCard(item);
        cardsDisplay.appendChild(cardForDisplay);

        // Добавляем информацию в состав заказа
         const orderSection = document.createElement('div');
          orderSection.className = 'order-section';

            const sectionTitle = document.createElement('h3');
            sectionTitle.textContent = `${item.name}`;
            orderSection.appendChild(sectionTitle);


         const dishInfo = document.createElement('p');
        dishInfo.textContent = `${item.discount_price ? item.discount_price : item.actual_price} ₽`;
        orderSection.appendChild(dishInfo);
         orderSummary.appendChild(orderSection);
        
            totalPrice += (item.discount_price || item.actual_price);

        });
    
    if (totalPrice > 0) {
        const totalPriceDisplay = document.createElement('div');
        totalPriceDisplay.className = 'total-price';
        totalPriceDisplay.innerHTML = `<h3>Итого: <span id="totalPriceDisplay">${totalPrice}</span> ₽</h3>`;
        orderSummary.appendChild(totalPriceDisplay);
    } else {
        orderSummary.innerHTML = '<p><b>Корзина пуста. Чтобы добавить товары в заказ, перейдите на главную страницу</b></p>';
        cardsDisplay.innerHTML = '<p> </p><p>Добавьте товары, чтобы они появились здесь.</p>';
    }
}


function calculateTotalPrice(fullOrder) {
    let totalPrice = 0;
    if(fullOrder) {
      fullOrder.forEach(item => {
          totalPrice += (item.discount_price || item.actual_price);
      })
    }

    return totalPrice;
}

function createDishCard(dish) {
    const card = document.createElement('div');
    card.className = 'dish-card';
    card.dataset.id = dish.id;
    console.log('Путь к изображению:', dish.image_url);
    card.innerHTML = `
        <img src="${dish.image_url || 'https://via.placeholder.com/100'}" alt="${dish.name}">
        <div class="dish-card-info">
            <h3>${dish.name}</h3>
             <p>${dish.discount_price ? dish.discount_price : dish.actual_price} ₽</p>
            <button class="remove-dish" data-id="${dish.id}"><i class="fa-solid fa-trash"></i></button>
        </div>
    `;

    const removeButton = card.querySelector('.remove-dish');
    removeButton.addEventListener('click', () => removeDish(dish.id, card));

    return card;
}

function removeDish(dishId) {
     const fullOrder = LocalStorageService.getFullOrder() || [];
    const updatedOrder = fullOrder.filter(item => item.id !== dishId);


  // Пересчитываем общую стоимость
   const totalPrice = calculateTotalPrice(updatedOrder);

    // Сохраняем обновленный заказ
    LocalStorageService.saveFullOrder(updatedOrder);

    // Обновляем отображение только текущей карточки
    const cardToRemove = document.querySelector(`.dish-card[data-id="${dishId}"]`);
     if (cardToRemove) {
        cardToRemove.remove(); // Удаляем карточку из DOM
    }

     // Обновляем состав заказа
    displayOrderSummary(updatedOrder);

    // Проверяем, если все карточки удалены, отображаем сообщение
    if (isEmptyOrder(updatedOrder)) {
        const cardsDisplay = document.getElementById('cards-display');
        cardsDisplay.innerHTML = '<p> </p><p>Добавьте товары, чтобы они появились здесь.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    orderForm.addEventListener('submit', handleOrderSubmit);
});

function handleOrderSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const subscribeCheckbox = form.querySelector('input[name="subscribe"]');
    const subscribeValue = subscribeCheckbox ? subscribeCheckbox.checked : false;
    // Получаем выбранный тип доставки
    const deliveryType = form.querySelector('input[name="delivery_type"]:checked');

    if (!deliveryType) {
        alert('Выберите тип доставки.');
        return;
    }

    // Учитываем время доставки
    const deliveryTime = form.querySelector('#delivery_time').value;

    if (deliveryType.value === 'by_time' && !deliveryTime) {
        alert('Укажите время доставки для варианта "К указанному времени".');
        return;
    }

    if (deliveryType.value === 'now' && deliveryTime) {
        alert('Время доставки не требуется для варианта "Как можно скорее". Уберите его.');
        return;
    }

    const fullOrder = LocalStorageService.getFullOrder() || [];
    const goodIds = fullOrder.map(item => item.id);

    const commentValue = document.getElementById('comment').value;

    // Создаем объект с данными заказа
    const orderData = {
        full_name: form.querySelector('#full_name').value.trim(),
        email: form.querySelector('#email').value.trim(),
        subscribe: subscribeValue,
        phone: form.querySelector('#phone').value.trim(),
        delivery_address: form.querySelector('#delivery_address').value.trim(),
        delivery_type: deliveryType.value,
        delivery_time: deliveryType.value === 'by_time' ? deliveryTime : '',
        good_ids: goodIds,
        comment: commentValue,
    };
  console.log('JSON данных заказа:', orderData);
    const formData = new FormData();
    for (const key in orderData) {
        formData.append(key, orderData[key]);
    }

    console.log('FormData для отправки:', formData);
    const apiKey = "51b2819e-4751-42cf-b166-e18bf8f957cb";
    const apiUrl = `https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders?api_key=${apiKey}`;

    fetch(apiUrl, {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                  throw new Error(err.error || 'Ошибка при оформлении заказа');
               });
            }
           return response.json();
        })
        .then(data => {
           alert('Ваш заказ успешно оформлен! Спасибо!');
            console.log('Комментарий:', commentValue);
            LocalStorageService.clearFullOrder();
        })
        .catch(error => {
            console.error('Ошибка при отправке заказа:', error);
           alert(`Произошла ошибка: ${error.message}`);
        });
}

function validateCombo(fullOrder) {
    if(fullOrder && fullOrder.length === 0) {
        return "Ничего не выбрано. Выберите товары для заказа";
    }
   return "";
}