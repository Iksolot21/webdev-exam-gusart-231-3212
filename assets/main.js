import api from './api.js';
import { CONFIG } from './config.js';
import LocalStorageService from './localStorage.js';

let currentPage = 1;
let hasMore = true;
let currentFilters = {};
let allProducts = [];
let categories = new Set();
let minPrice = Infinity;
let maxPrice = -Infinity;



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
        <button class="button button--primary">
            Добавить в корзину
        </button>
    `;

    const addToCartButton = card.querySelector('.button--primary');
    addToCartButton.addEventListener('click', () => {
        handleAddToCart(product);
    });

    return card;
}

function handleAddToCart(product) {
    LocalStorageService.addItem(product);
    notifications.show('Товар добавлен в корзину', 'success');
        updateCartCount();
}


async function loadProducts() {
    try {
        const sortSelect = document.getElementById('sort');
        const data = await api.getProducts(currentPage, sortSelect.value, currentFilters);
        console.log(data)
        const productsContainer = document.getElementById('products');
        const loadMoreButton = document.getElementById('load-more');


       if (currentPage === 1) {
           allProducts = [];
           productsContainer.innerHTML = '';
       }


       allProducts.push(...data.goods);
        // Добавляем товары на страницу
        data.goods.forEach(product => {
           productsContainer.appendChild(createProductCard(product));
           categories.add(product.main_category);
            // Определяем min/max цены
            const price = product.discount_price || product.actual_price;
                if (price < minPrice) {
                minPrice = price;
            }
                if (price > maxPrice) {
                    maxPrice = price;
                }
        });
        // Проверяем, есть ли еще товары
        hasMore = currentPage * CONFIG.ITEMS_PER_PAGE < data._pagination.total_count;
        loadMoreButton.style.display = hasMore ? 'block' : 'none';

    } catch (error) {
        notifications.show('Ошибка при загрузке товаров', 'error');
    }
}



function handleLoadMore() {
    if (hasMore) {
        currentPage++;
        loadProducts();
    }
}


function handleSortChange() {
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';
    allProducts = [];
    currentPage = 1;
    loadProducts();
}

function handleFilterSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
     const categories = formData.getAll('category').join(',');

    const filters = {
        categories: categories || undefined,
        priceMin: formData.get('price_min'),
        priceMax: formData.get('price_max'),
        discount: formData.get('discount') === 'on'
    };

    localStorage.setItem('filters', JSON.stringify(filters));
    currentFilters = filters;
    applyFilters();
}


async function applyFilters() {
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';
    currentPage = 1;

     minPrice = Infinity;
     maxPrice = -Infinity;


    const sortSelect = document.getElementById('sort');
    const data = await api.getProducts(1, sortSelect.value);

       if (data && data.goods) {
              allProducts = data.goods
       } else {
              allProducts = [];
              productsContainer.innerHTML = '<p class="no-results">Товары не найдены</p>';
              return;
          }


      let filteredProducts = [...allProducts];
      if (currentFilters.categories) {
          const selectedCategories = currentFilters.categories.split(',');
          filteredProducts = filteredProducts.filter(product =>
              selectedCategories.includes(product.main_category)
          );
    }

    if (currentFilters.priceMin) {
        filteredProducts = filteredProducts.filter(product =>
            (product.discount_price || product.actual_price) >= parseFloat(currentFilters.priceMin)
        );
    }

    if (currentFilters.priceMax) {
          filteredProducts = filteredProducts.filter(product =>
            (product.discount_price || product.actual_price) <= parseFloat(currentFilters.priceMax)
        );
    }


     if (currentFilters.discount) {
          filteredProducts = filteredProducts.filter(product => product.discount_price);
     }


    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = '<p class="no-results">Товары не найдены</p>';
        document.getElementById('load-more').style.display = 'none';
        return;
    }

    filteredProducts.forEach(product => {
          const price = product.discount_price || product.actual_price;
                if (price < minPrice) {
                    minPrice = price;
                }
                if (price > maxPrice) {
                    maxPrice = price;
                }
           productsContainer.appendChild(createProductCard(product));

        });
    document.getElementById('load-more').style.display = 'none';
}


function handleResetFilters() {
    currentFilters = {};
    localStorage.removeItem('filters');

    const form = document.getElementById('filters-form');
    form.reset();
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';
    currentPage = 1;
    allProducts = [];
    loadProducts();
    document.getElementById('load-more').style.display = 'block';
}


async function loadCategories() {
    try {
        const data = await api.getProducts(1);
        const categoriesContainer = document.getElementById('categories-container');
        const uniqueCategories = new Set();

        data.goods.forEach(product => {
            uniqueCategories.add(product.main_category);
        });
         if (uniqueCategories.size > 0) {
            uniqueCategories.forEach(category => {
               const checkboxDiv = document.createElement('div');
               checkboxDiv.className = 'checkbox';

               const checkbox = document.createElement('input');
               checkbox.type = 'checkbox';
               checkbox.id = `category-${category}`;
               checkbox.name = 'category';
               checkbox.value = category;

               const label = document.createElement('label');
                label.htmlFor = `category-${category}`;
               label.textContent = category;

               checkboxDiv.appendChild(checkbox);
              checkboxDiv.appendChild(label);

               categoriesContainer.appendChild(checkboxDiv);
           });
       } else {
             categoriesContainer.innerHTML = '<p class="no-results">Категории не найдены</p>';
       }
    } catch (error) {
        notifications.show('Ошибка при загрузке категорий', 'error');
    }
}


document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadProducts();
    updateCartCount();


    document.getElementById('load-more').addEventListener('click', handleLoadMore);
    document.getElementById('sort').addEventListener('change', handleSortChange);
    document.getElementById('filters-form').addEventListener('submit', handleFilterSubmit);
    document.getElementById('reset-filters').addEventListener('click', handleResetFilters);

    const savedFilters = JSON.parse(localStorage.getItem('filters') || '{}');

     if (savedFilters.categories && typeof savedFilters.categories === 'string') {
        savedFilters.categories.split(',').forEach(category => {
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
     // Добавляем обработчик для кнопки поиска
    const searchButton = document.querySelector('.search__button');
    searchButton.addEventListener('click', function() {
        const query = document.querySelector('.search__input').value;
       searchProducts(query);
    });

});



const notifications = {
    container: document.getElementById('notifications'),
    show: function(message, type) {
        const notification = document.createElement('div');
        notification.classList.add('notification', `notification--${type}`);
        notification.textContent = message;

        this.container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};


async function searchProducts(query) {
  if (!query.trim()) {
        document.querySelector('.autocomplete-list').innerHTML = '';
        loadProducts()
        return;
    }

  try {
        const productsContainer = document.getElementById('products');
        productsContainer.innerHTML = '';
        allProducts = [];
        const sortSelect = document.getElementById('sort');
        const data = await api.getProducts(1, sortSelect.value, { query: query });

        if (data.goods && data.goods.length > 0) {
            data.goods.forEach(product => {
               productsContainer.appendChild(createProductCard(product));
                 const price = product.discount_price || product.actual_price;
                if (price < minPrice) {
                    minPrice = price;
                }
                if (price > maxPrice) {
                    maxPrice = price;
                }
            });
        } else {
           productsContainer.innerHTML = '<p class="no-results">Товары не найдены</p>';
        }

        document.getElementById('load-more').style.display = 'none';
  } catch (error) {
        notifications.show('Ошибка при поиске товаров', 'error');
    }
}


async function autocomplete(query) {
  if (!query.trim()) {
      const autocompleteList = document.querySelector('.autocomplete-list');
         autocompleteList.innerHTML = '';
          autocompleteList.classList.remove('active');
      return;
  }
    try {
        const data = await api.autocomplete(query);
        const autocompleteList = document.querySelector('.autocomplete-list');
        autocompleteList.innerHTML = '';

         if (data && data.length > 0) {
            data.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.textContent = item;
                itemElement.classList.add('autocomplete-item');
                  itemElement.addEventListener('click', () => {
                        document.querySelector('.search__input').value = item;
                       autocompleteList.innerHTML = '';
                        autocompleteList.classList.remove('active');
                       searchProducts(item);
                    });
                 autocompleteList.appendChild(itemElement);

            });
           autocompleteList.classList.add('active');
             }
            else {
               autocompleteList.innerHTML = '';
                 autocompleteList.classList.remove('active');
           }

    } catch (error) {
        console.error('Autocomplete Error:', error);
        document.querySelector('.autocomplete-list').innerHTML = '';
         autocompleteList.classList.remove('active');
    }
}

let searchTimeout;
const searchInput = document.querySelector('.search__input');
searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
      const query = this.value;
    autocomplete(query);
    searchTimeout = setTimeout(() => {
      searchProducts(query);
    }, 500);
});



function handleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const filters = document.querySelector('.filters');

    if (window.innerWidth <= 768) {
        if (!document.querySelector('.filters-toggle')) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'button button--secondary filters-toggle';
            toggleButton.textContent = 'Фильтры';
            toggleButton.onclick = () => filters.classList.toggle('filters--active');

            document.querySelector('.catalog__header').appendChild(toggleButton);
        }
    }
}

window.addEventListener('resize', handleMobileMenu);
handleMobileMenu();

function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
     const fullOrder = LocalStorageService.getFullOrder() || [];
   cartCountElement.textContent = fullOrder.length;
}