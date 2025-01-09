document.addEventListener('DOMContentLoaded', () => {
    const ordersTableBody = document.getElementById('ordersTableBody');
    const profileForm = document.getElementById('profile-form');
    const editOrderForm = document.getElementById('editOrderForm');

    let dishes = [];
    let orders = [];

    // Функция загрузки всех блюд
    async function loadDishDetails() {
        try {
            const dishesResponse = await fetch(`${CONFIG.API_URL}/dishes?api_key=${CONFIG.API_KEY}`);
            dishes = await dishesResponse.json();
        } catch (error) {
            notifications.show('Ошибка при загрузке блюд', 'error');
           console.error("Error loading dishes:", error);
        }
    }
    // Функция для загрузки всех заказов
   async function loadOrderDetails() {
        try {
            const ordersResponse = await fetch(`${CONFIG.API_URL}/orders?api_key=${CONFIG.API_KEY}`);
            orders = await ordersResponse.json();
            console.log("orders loaded:", orders);
        } catch (error) {
            notifications.show('Ошибка при загрузке заказов', 'error');
           console.error("Error loading orders:", error);
        }
    }
     // Функция для получения блюда по ID
    function getDish(dishId) {
        return dishes.find(dish => dish.id === dishId);
    }
    // Функция для получения заказа по ID
    function getOrder(orderId) {
      return orders.find(order => order.id === orderId);
    }
    // Функция для обработки null значений
    function perebor(id) {
         if (id == null) {
           return "Не выбрано"
         }
         let dish = getDish(id)
         return { name: dish.name || 'Не выбрано', price: dish.price || 0 };
    }
      // Функция для расчета полной стоимости заказа
     async function calculateOrderPrice(order) {
       const dishIds = [
         order.soup_id,
         order.main_course_id,
         order.drink_id,
         order.salad_id,
         order.dessert_id
        ].filter(Boolean);

       const uniqueDishes = new Set();
       let totalPrice = 0;
       for (const dishId of dishIds) {
          const dish = getDish(dishId)
          totalPrice += dish.price || 0;
         uniqueDishes.add(dishId);
        }
        return totalPrice;
    }
     // Функция для открытия модального окна
    function openModal(modalId) {
       document.getElementById(modalId).style.display = 'block';
     }

     // Функция для закрытия модального окна
     function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
     }

   // Функция для просмотра заказа
      async function viewOrderDetails(orderId) {
            const order = getOrder(orderId);
            // Получение данных всех блюд заказа
            const soup = perebor(order.soup_id);
            const mainCourse = perebor(order.main_course_id);
            const drink = perebor(order.drink_id);
           const salad = perebor(order.salad_id);
          const dessert = perebor(order.dessert_id);
          // Состав заказа для отображения в модальном окне
            const dishes = [
                { category: 'Суп', ...soup },
                { category: 'Основное блюдо', ...mainCourse },
               { category: 'Напиток', ...drink },
              { category: 'Салат', ...salad },
              { category: 'Десерт', ...dessert },
            ];
            // Расчет итоговой стоимости
            const totalPrice = dishes.reduce((sum, dish) => sum + (dish.price || 0), 0);

           // Отображение атрибутов заказа в модальном окне
            document.getElementById('viewOrderDate').textContent = `Дата оформления: ${new Date(order.created_at).toLocaleDateString()}`;
            document.getElementById('viewOrderFullName').textContent = `Имя получателя: ${order.full_name}`;
           document.getElementById('viewOrderEmail').textContent = `Email: ${order.email}`;
            document.getElementById('viewOrderPhone').textContent = `Телефон: ${order.phone}`;
            document.getElementById('viewOrderAddress').textContent = `Адрес доставки: ${order.delivery_address}`;
            document.getElementById('viewOrderDeliveryTime').textContent = `Время доставки: ${order.delivery_time || 'Как можно скорее (с 07:00 до 23:00) '}`;
           document.getElementById('viewOrderComment').textContent = `Комментарий: ${order.comment || 'Отсутствует'}`;

            // Обновление списка блюд в модальном окне
           const orderItemsList = document.getElementById('orderItemsView');
           orderItemsList.innerHTML = ''; // Очистка списка
           dishes.forEach(dish => {
               if (dish.name && dish.name !== 'Не выбрано') {
                   const listItem = document.createElement('li');
                   listItem.innerHTML = `<strong>${dish.category}:</strong> ${dish.name} (${dish.price}₽)`;
                   orderItemsList.appendChild(listItem);
               }
           });

            // Отображение итоговой стоимости
           const totalPriceElement = document.getElementById('totalPriceView');
            totalPriceElement.textContent = `Итоговая стоимость: ${totalPrice}₽`;

            // Открытие модального окна для просмотра заказа
            openModal('viewOrderModal');
    }
   // Функция для редактирования заказа
    async function editOrder(orderId) {
         // Получение данных заказа
       const order = getOrder(orderId);

        // Заполнение данных в форме редактирования
        document.getElementById('editFullName').value = order.full_name;
        document.getElementById('editEmail').value = order.email;
        document.getElementById('editPhone').value = order.phone;
        document.getElementById('editAddress').value = order.delivery_address;
        document.getElementById('delivery_time').value = order.delivery_time || '';

        document.getElementById('editComment').value = order.comment || '';
       window.editOrderId = orderId;
        const orderDate = new Date(order.created_at);
       const formattedOrderDate = orderDate.toLocaleDateString() + ' ' + orderDate.toLocaleTimeString();
        document.getElementById('editOrderDate').textContent = `Дата оформления: ${formattedOrderDate}`;
        // Отображение времени доставки, если оно указано
       if (order.delivery_time) {
          document.getElementById('delivery_time').value = order.delivery_time;
        } else {
            document.getElementById('delivery_time').value = '';
       }

        // Получение данных всех блюд заказа
       const soup = perebor(order.soup_id);
        const mainCourse = perebor(order.main_course_id);
       const drink = perebor(order.drink_id);
      const salad = perebor(order.salad_id);
       const dessert = perebor(order.dessert_id);
        // Состав заказа для отображения в модальном окне
      const dishes = [
          { category: 'Суп', ...soup },
         { category: 'Основное блюдо', ...mainCourse },
          { category: 'Напиток', ...drink },
           { category: 'Салат', ...salad },
            { category: 'Десерт', ...dessert },
       ];

        // Обновление списка блюд в модальном окне редактирования
       const orderItemsList = document.getElementById('orderItems2');
       orderItemsList.innerHTML = ''; // Очистка списка
      dishes.forEach(dish => {
            if (dish.name && dish.name !== 'Не выбрано') {
              const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>${dish.category}:</strong> ${dish.name} (${dish.price}₽)`;
                orderItemsList.appendChild(listItem);
            }
        });

        // Расчет итоговой стоимости
       const totalPrice = dishes.reduce((sum, dish) => sum + (dish.price || 0), 0);

        // Отображение итоговой стоимости
        const totalPriceElement = document.getElementById('totalPrice2');
       totalPriceElement.textContent = `Итоговая стоимость: ${totalPrice}₽`;

        // Открытие модального окна для редактирования заказа
        openModal('orderEditModal');
    }

    // Функция для сохранения изменений в заказе
     function saveEditedOrder(event) {
        event.preventDefault();

        const editedOrder = new FormData();

        editedOrder.append('full_name', document.getElementById('editFullName').value);
        editedOrder.append('email', document.getElementById('editEmail').value);
        editedOrder.append('phone', document.getElementById('editPhone').value);
        editedOrder.append('delivery_address', document.getElementById('editAddress').value);
         editedOrder.append('comment', document.getElementById('editComment').value);
        editedOrder.append('delivery_time', document.getElementById('delivery_time').value)

        fetch(`${CONFIG.API_URL}/orders/${window.editOrderId}?api_key=${CONFIG.API_KEY}`, {
            method: 'PUT',
             body: editedOrder
        })
        .then(response => {
              if (!response.ok) {
                throw new Error('Произошла ошибка при сохранении изменений заказа');
            }
            return response.json();
        })
        .then(data => {
            notifications.show('Заказ успешно изменен', 'success')
            closeModal('orderEditModal');
           location.reload();
       })
        .catch(error => {
           console.error('Ошибка при сохранении изменений заказа:', error);
            notifications.show('Произошла ошибка при сохранении изменений заказа', 'error')
        });
    }
  // Функция для подтверждения удаления заказа
    function confirmDeleteOrder(orderId) {
        window.deleteOrderId = orderId;
        openModal('deleteConfirmationModal');
    }

    // Функция для удаления заказа
   function deleteOrder() {
        fetch(`${CONFIG.API_URL}/orders/${window.deleteOrderId}?api_key=${CONFIG.API_KEY}`, {
          method: 'DELETE'
        })
          .then(response => response.json())
         .then(data => {
                notifications.show('Заказ удален', 'success')
              closeModal('deleteConfirmationModal');
               location.reload();
           })
          .catch(error => {
               console.error('Ошибка при удалении заказа:', error);
            notifications.show('Произошла ошибка при удалении заказа', 'error')
       });
    }
   // Функция загрузки заказов
  async function fetchOrders() {
    try {
        await loadOrderDetails();
         await loadDishDetails();

         const orders = orders || [];

          // Sort orders by created_at in descending order (newest first)
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

         if (orders.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Нет заказов для отображения.</td></tr>';
            return;
          }

           // Process orders with dish names and prices
         for (const order of orders) {
            const row = document.createElement('tr');

           // Fetch dish names
           const soupName = getDish(order.soup_id) != null ? getDish(order.soup_id).name : "";;
            const mainCourseName = getDish(order.main_course_id) != null ? getDish(order.main_course_id).name : "";;
            const drinkName = getDish(order.drink_id) != null ? getDish(order.drink_id).name : "";;
           const saladName = getDish(order.salad_id) != null ? getDish(order.salad_id).name : "";
           const dessertName = getDish(order.dessert_id) != null ? getDish(order.dessert_id).name : "";

           // Calculate total price
             const totalPrice = await calculateOrderPrice(order);

            row.innerHTML = `
                <td>${order.id}</td>
               <td>${new Date(order.created_at).toLocaleString()}</td>
               <td>
                  ${[
                soupName,
                 mainCourseName,
                  drinkName,
                saladName,
                 dessertName
                ]
                .filter(dish => dish && dish !== 'Не выбрано')
                .join(', ')}
                </td>
                 <td class="text-right">${totalPrice}₽</td>
                <td>${order.delivery_time ? order.delivery_time : 'Как можно скорее<br>(с 07:00 до 23:00)'}</td>
                <td class="btn-container">
                 <button onclick="viewOrderDetails(${order.id})" class="btn"><i class="fa-regular fa-eye"></i></button>
                    <button onclick="editOrder(${order.id})" class="btn"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="confirmDeleteOrder(${order.id})" class="btn"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            ordersTableBody.appendChild(row);
          }
      }
     catch (error) {
          console.error('Ошибка при получении заказов для таблицы:', error);
        ordersTableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Произошла ошибка при загрузке данных.</td></tr>';
      }
    }
    // Загрузка данных профиля из localStorage
    function loadProfileData() {
        const profileData = JSON.parse(localStorage.getItem('profile') || '{}');
         if (profileData) {
            document.getElementById('profileName').value = profileData.profileName || '';
            document.getElementById('profileEmail').value = profileData.profileEmail || '';
           document.getElementById('profilePhone').value = profileData.profilePhone || '';
           document.getElementById('profileAddress').value = profileData.profileAddress || '';
       }
     }
    // Сохранение данных профиля
    function handleProfileSubmit(event) {
          event.preventDefault();

        const profileData = {
              profileName: document.getElementById('profileName').value,
             profileEmail: document.getElementById('profileEmail').value,
             profilePhone: document.getElementById('profilePhone').value,
              profileAddress: document.getElementById('profileAddress').value
         }
       localStorage.setItem('profile', JSON.stringify(profileData));
        notifications.show('Профиль успешно сохранён', 'success');
    }

       loadProfileData();
      fetchOrders();
      profileForm.addEventListener('submit', handleProfileSubmit);
      editOrderForm.addEventListener('submit', saveEditedOrder)

});