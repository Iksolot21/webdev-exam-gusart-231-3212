import LocalStorageService from './localStorage.js';

document.addEventListener('DOMContentLoaded', () => {
    const fullOrder = LocalStorageService.getFullOrder();
    console.log("Товары в корзине:", fullOrder);
    generateTimeIntervals();
    if (fullOrder && fullOrder.length > 0) {
        displayOrderSummary(fullOrder);
    } else {
        document.getElementById('cards-display').innerHTML = '<p> </p><p>Добавьте товары, чтобы они появились здесь.</p>';
    }
    document.getElementById('delivery_date').addEventListener('change', generateTimeIntervals);
});
function generateTimeIntervals() {
   const deliveryDateInput = document.getElementById('delivery_date');
    const selectedDate = new Date(deliveryDateInput.value);
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();


    const now = new Date();
    const currentHour = isToday ? now.getHours() : 0;
    const deliveryTimeSelect = document.getElementById('delivery_time');
  
   deliveryTimeSelect.innerHTML = '<option value="">Выберите время</option>';


   const validIntervals = ["08:00-12:00", "12:00-14:00", "14:00-18:00", "18:00-22:00"];
   for (const interval of validIntervals) {
      const option = document.createElement('option');
      option.value = interval;
       option.textContent = interval;
         deliveryTimeSelect.appendChild(option);
   }
}
function isEmptyOrder(order) {
    return !order || order.length === 0;
}

function displayOrderSummary(fullOrder) {
    const cardsDisplay = document.getElementById('cards-display');
    const totalPriceDisplay = document.getElementById('totalPriceDisplay');

    cardsDisplay.innerHTML = '';
    let totalPrice = 0;
    if (isEmptyOrder(fullOrder)) {
       cardsDisplay.innerHTML = '<p> </p><p>Добавьте товары, чтобы они появились здесь.</p>';
        totalPriceDisplay.textContent = '0';
        return;
    }
   

    fullOrder.forEach(item => {
        const cardForDisplay = createProductCard(item);
        cardsDisplay.appendChild(cardForDisplay);
        totalPrice += (item.discount_price || item.actual_price);
     });

    totalPriceDisplay.textContent = totalPrice;
    
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = `product-card product-card-${product.id}`;

    let priceContent;
    let discountPercentage = '';

    if (product.discount_price) {
        const discount = ((product.actual_price - product.discount_price) / product.actual_price) * 100;
        discountPercentage = `
            <span class="product-card__discount-percentage">-${Math.round(discount)}%</span>
        `;
       priceContent = `
            <span class="product-card__price--old">$${product.actual_price}</span>
            <span class="product-card__price--new">$${product.discount_price}</span>
            ${discountPercentage}
        `;
    } else {
       priceContent = `
            <span class="product-card__price--new">$${product.actual_price}</span>
        `;
    }


    card.innerHTML = `
        <img src="${product.image_url}" alt="${product.name}" class="product-card__image">
        <h3 class="product-card__title">${product.name}</h3>
        <div class="product-card__rating">★ ${product.rating}</div>
        <div class="product-card__price">
            ${priceContent}
        </div>
         <button class="button button--secondary remove-dish" data-id="${product.id}">Удалить</button>
    `;

    const removeButton = card.querySelector('.remove-dish');
    removeButton.addEventListener('click', () => removeDish(product.id, card));

    return card;
}

function calculateTotalPrice(fullOrder) {
    let totalPrice = 0;
    if (fullOrder) {
        fullOrder.forEach(item => {
            totalPrice += (item.discount_price || item.actual_price);
        })
    }

    return totalPrice;
}

function removeDish(dishId, card) {
   const fullOrder = LocalStorageService.getFullOrder() || [];
     const indexToRemove = fullOrder.findIndex(item => item.id === dishId);


   if (indexToRemove !== -1) {
    fullOrder.splice(indexToRemove, 1);
  }
    const totalPrice = calculateTotalPrice(fullOrder);

    LocalStorageService.saveFullOrder(fullOrder);

    if (card) {
        card.remove(); 
    }
    displayOrderSummary(fullOrder);
    if (isEmptyOrder(fullOrder)) {
        const cardsDisplay = document.getElementById('cards-display');
        cardsDisplay.innerHTML = '<p> </p><p>Добавьте товары, чтобы они появились здесь.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    orderForm.addEventListener('submit', handleOrderSubmit);

  const resetButton = document.querySelector('button[type="reset"]');
    resetButton.addEventListener('click', handleResetForm);
});

function handleOrderSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const subscribeCheckbox = form.querySelector('input[name="subscribe"]');
    const subscribeValue = subscribeCheckbox ? subscribeCheckbox.checked : false;

    const deliveryDate = form.querySelector('#delivery_date').value;
    const deliveryTime = form.querySelector('#delivery_time').value;


    if (!deliveryTime) {
        alert('Выберите временной интервал доставки.');
        return;
    }

    const fullOrder = LocalStorageService.getFullOrder() || [];
    const goodIds = fullOrder.map(item => item.id);
    const commentValue = document.getElementById('comment').value;

    const formattedDate = new Date(deliveryDate);
    const day = String(formattedDate.getDate()).padStart(2, '0');
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const year = formattedDate.getFullYear();
    const formattedDeliveryDate = `${day}.${month}.${year}`;


    const orderData = {
        full_name: form.querySelector('#full_name').value.trim(),
        email: form.querySelector('#email').value.trim(),
        subscribe: subscribeValue,
        phone: form.querySelector('#phone').value.trim(),
        delivery_address: form.querySelector('#delivery_address').value.trim(),
        delivery_date: formattedDeliveryDate,
        delivery_interval: deliveryTime,
    };

    console.log('JSON данных заказа:', JSON.stringify(orderData, null, 2));
    const formData = new FormData();
    for (const key in orderData) {
        formData.append(key, orderData[key]);
    }
     formData.append('comment', commentValue);


   goodIds.forEach(id => {
    formData.append('good_ids', id);
   });

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
             window.location.reload();
            const currentOrder = LocalStorageService.getFullOrder() || [];
            const remainingItems = currentOrder.filter(item => !goodIds.includes(item.id));
            LocalStorageService.saveFullOrder(remainingItems);

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

function handleResetForm() {
    document.getElementById('orderForm').reset();
    document.getElementById('deliveryForm').reset();
    generateTimeIntervals();
}