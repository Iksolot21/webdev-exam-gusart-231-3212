let currentPage = 1;
let hasMore = true;
let currentFilters = {}; // Объект для хранения текущих фильтров

// Создание карточки товара
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  
  card.innerHTML = `
       <img src="${product.image_url}" alt="${product.name}" class="product-card__image">
       <h3 class="product-card__title">${product.name}</h3>
      <div class="product-card__rating">★ ${product.rating}</div>
       <div class="product-card__price">
          ${product.discount_price ? `
               <span class="product-card__price--old">$${product.actual_price}</span>
               <span class="product-card__price--new">$${product.discount_price}</span>
           ` : `
               <span class="product-card__price--new">$${product.actual_price}</span>
           `}
       </div>
      <button class="button button--primary" onclick="handleAddToCart(${JSON.stringify(product)})">
          Добавить в корзину
       </button>
   `;
  
   return card;
}

// Загрузка товаров
async function loadProducts() {
   try {
       const sortSelect = document.getElementById('sort');
       const data = await api.getProducts(currentPage, sortSelect.value, currentFilters);
      
       const productsContainer = document.getElementById('products');
       const loadMoreButton = document.getElementById('load-more');
      
       // Добавляем товары на страницу
       data.goods.forEach(product => {
           productsContainer.appendChild(createProductCard(product));
       });
       // Проверяем, есть ли еще товары
       hasMore = currentPage * CONFIG.ITEMS_PER_PAGE < data._pagination.total_count;
       loadMoreButton.style.display = hasMore ? 'block' : 'none';
      
   } catch (error) {
       notifications.show('Ошибка при загрузке товаров', 'error');
   }
}

// Обработчик добавления в корзину
function handleAddToCart(product) {
    cart.add(JSON.parse(product));
  notifications.show('Товар добавлен в корзину', 'success');
}

// Обработчик кнопки "Загрузить еще"
function handleLoadMore() {
   if (hasMore) {
       currentPage++;
       loadProducts();
   }
}

// Обработчик изменения сортировки
function handleSortChange() {
   const productsContainer = document.getElementById('products');
  productsContainer.innerHTML = ''; // Очищаем контейнер
  currentPage = 1;
   loadProducts();
}

// Обработчик отправки формы фильтров
function handleFilterSubmit(event) {
  event.preventDefault();
  
   const formData = new FormData(event.target);
   const filters = {
       categories: formData.getAll('category'),
       priceMin: formData.get('price_min'),
      priceMax: formData.get('price_max'),
       discount: formData.get('discount') === 'on'
   };
  
   // Сохраняем фильтры в localStorage
   localStorage.setItem('filters', JSON.stringify(filters));

      // Обновляем текущие фильтры
      currentFilters = filters;
  
   // Применяем фильтры
  const productsContainer = document.getElementById('products');
   productsContainer.innerHTML = '';
   currentPage = 1;
   loadProducts();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
   // Загружаем товары
   loadProducts();
  
   // Добавляем обработчики событий
  document.getElementById('load-more').addEventListener('click', handleLoadMore);
   document.getElementById('sort').addEventListener('change', handleSortChange);
   document.getElementById('filters-form').addEventListener('submit', handleFilterSubmit);
  
   // Восстанавливаем фильтры из localStorage
  const savedFilters = JSON.parse(localStorage.getItem('filters') || '{}');
   if (savedFilters.categories) {
       savedFilters.categories.forEach(category => {
           const checkbox = document.querySelector(`input[name="category"][value="${category}"]`);
          if (checkbox) checkbox.checked = true;
       });
   }
  if (savedFilters.priceMin) {
       document.querySelector('input[name="price_min"]').value = savedFilters.priceMin;
   }
   if (savedFilters.priceMax) {
      document.querySelector('input[name="price_max"]').value = savedFilters.priceMax;
  }
   if (savedFilters.discount) {
       document.querySelector('input[name="discount"]').checked = true;
   }
   currentFilters = savedFilters;
});

// Функция поиска товаров
async function searchProducts(query) {
  if (!query.trim()) return;
  
  try {
       const params = new URLSearchParams({
          query: query,
           api_key: CONFIG.API_KEY
       });
      
      const response = await fetch(`${CONFIG.API_URL}/goods/search?${params}`);
       const data = await response.json();
      
       const productsContainer = document.getElementById('products');
      productsContainer.innerHTML = '';
      
       if (data.goods && data.goods.length > 0) {
          data.goods.forEach(product => {
              productsContainer.appendChild(createProductCard(product));
          });
       } else {
          productsContainer.innerHTML = '<p class="no-results">Товары не найдены</p>';
       }
      
       // Скрываем кнопку "Загрузить еще" при поиске
      document.getElementById('load-more').style.display = 'none';
      
  } catch (error) {
      notifications.show('Ошибка при поиске товаров', 'error');
   }
}

// Добавляем обработчик поиска с debounce
let searchTimeout;
const searchInput = document.querySelector('.search__input');
searchInput.addEventListener('input', function() {
   clearTimeout(searchTimeout);
   searchTimeout = setTimeout(() => {
      searchProducts(this.value);
  }, 500);
});

// Обработка мобильной версии
function handleMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
   const filters = document.querySelector('.filters');
  
  if (window.innerWidth <= 768) {
       // Создаем кнопку для показа/скрытия фильтров
       if (!document.querySelector('.filters-toggle')) {
          const toggleButton = document.createElement('button');
          toggleButton.className = 'button button--secondary filters-toggle';
          toggleButton.textContent = 'Фильтры';
          toggleButton.onclick = () => filters.classList.toggle('filters--active');
          
          document.querySelector('.catalog__header').appendChild(toggleButton);
       }
  }
}

// Обработчик изменения размера окна
window.addEventListener('resize', handleMobileMenu);

// Вызываем обработчик при загрузке страницы
handleMobileMenu();