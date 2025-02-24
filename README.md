# Base Theme

A developer-first Shopify theme that prioritizes clean code, maintainability, and straightforward customization. Built with the modern developer workflow in mind, this theme serves as an ideal starting point for your Shopify projects.

## Introduction

StarterTheme is crafted for developers who appreciate clean, well-structured code and minimal complexity. This theme strips away the bloat commonly found in marketplace themes to provide a solid foundation that you can build upon. The theme leverages custom web components for 90% of its JavaScript functionality, providing a modern, encapsulated, and maintainable approach to component development.

### Developer Benefits

- **Clean Architecture**: Organized, logical file structure with clear separation of concerns
- **Minimal Dependencies**: Only essential libraries and tools included
- **Modern Development**: Built using Shopify CLI 3.0 and Online Store 2.0 features
- **Simplified Customization**: Well-documented sections and blocks for easy modifications
- **Performance First**: Lightweight base with no unnecessary JavaScript or CSS
- **Developer Experience**: Quick setup, clear naming conventions, and intuitive component structure
- **Zero Build Tools**: No complex build process or tooling required - just pure JavaScript and CSS

The theme follows KISS (Keep It Simple, Stupid) principles, making it an excellent choice for both rapid development and teaching/learning Shopify theme development.

### Third-Party Libraries

The theme uses a carefully selected set of third-party libraries to provide essential functionality while maintaining performance:

- **Alpine.js** ([Documentation](https://alpinejs.dev/))
  - Lightweight JavaScript framework for component behavior
  - Used for UI state management and interactivity
  - Perfect for declarative DOM manipulation

- **Liquid AJAX Cart** ([Documentation](https://liquid-ajax-cart.js.org/))
  - Cart functionality without custom JavaScript
  - Real-time cart updates and synchronization
  - Built specifically for Shopify themes

- **Swiper** ([Documentation](https://swiperjs.com/))
  - Modern mobile touch slider
  - Used for product image galleries
  - Supports touch gestures and various navigation options

These libraries were chosen for their minimal footprint, excellent documentation, and specific utility in solving common Shopify theme challenges.

## Theme Components

This theme is a work in progress, built with a focus on creating clean, efficient components. We've built several key components from scratch while temporarily leveraging some components from Dawn theme as we continue development.

### Built From Scratch
- Header
- Cart drawer
- Cart notification
- Cart page
- Collection page
- Product page
- Search page
- Predictive search

### Currently Using Dawn Components
- Blog and article pages
- Footer
- Customer account pages

Note: Our roadmap includes gradually replacing the Dawn-based components with our own implementations to maintain our minimalist, developer-friendly approach throughout the entire theme.

## Component Code Walkthrough

### Header Implementation

The header combines Alpine.js for UI state management and Liquid AJAX Cart for cart functionality. Here's how these libraries are used:

#### Alpine.js Implementation
The header uses Alpine.js for managing search functionality:

File: `sections/header.liquid`
```liquid
<header
  x-data="{ searchOpen: false, searchTerm: '' }"
  @click.outside="searchOpen = false"
  @input="searchTerm = $event.target.value"
>
```

The search toggle uses Alpine's `$nextTick` for focus management:

File: `sections/header.liquid`
```liquid
<div id="header-actions_search" 
  @click="searchOpen = !searchOpen; $nextTick(() => { if (searchOpen) $refs.searchInput.focus() })">
  {{ 'icon-search.svg' | inline_asset_content }}
</div>
```

The search form uses Alpine's x-model and x-ref for input handling:

File: `sections/header.liquid`
```liquid
<input
  type="search"
  name="q"
  x-model="searchTerm"
  x-ref="searchInput"
  x-show="searchOpen"
  @focus="$event.target.select()"
>
```
The cart toggle behavior changes based on the cart type setting:

File: `sections/header.liquid`
```liquid
<a
  id="header-cart-bubble"
  {%- if settings.cart_type == 'drawer' -%}
    @click.prevent="toggleCartDrawer"
  {%- else -%}
    href="{{ routes.cart_url }}"
  {%- endif -%}
>
```

#### Liquid AJAX Cart Integration
The cart count in the header automatically updates through Liquid AJAX Cart bindings:

File: `sections/header.liquid`
```liquid
<div data-cart-count data-ajax-cart-bind="item_count">
  {{ cart.item_count }}
</div>
```

### Product Page Implementation

The product page tells an interesting story of how variant selection works. Let's follow the flow:

#### The Variant Selection Journey

It starts with the `<variant-selector>` element, which can be rendered in two ways:

File: `sections/main-product.liquid`
```liquid
<variant-selector data-picker-type="{{ block.settings.picker_type }}">
  {% if block.settings.picker_type == 'dropdown' %}
    <!-- Dropdown lists for each option -->
  {% else %}
    <!-- Radio buttons for each option -->
  {% endif %}
</variant-selector>
```

When a user interacts with either the dropdowns or radio buttons, it triggers our variant change flow:

File: `assets/component-product-info.js`
```js
class ProductInfo extends HTMLElement {
  constructor() {
    super();
    // Listen for any variant changes
    this.variantSelector?.addEventListener('change', this.onVariantChange.bind(this));
  }

  onVariantChange(e) {
    // Kick off the section render process
    this.renderSection();
  }
}
```

The `renderSection` method is where the magic happens. It:
1. Collects the currently selected options
2. Makes a request to Shopify's Section Rendering API
3. Updates specific parts of the page with the response:

File: `assets/component-product-info.js`
```js
renderSection() {
  // Request the section with current variant selections
  fetch(`${this.dataset.url}?option_values=${this.selectedOptionValues}&section_id=${this.dataset.section}`)
    .then((response) => response.text())
    .then((responseText) => {
      // Parse the returned HTML
      const html = new DOMParser().parseFromString(responseText, 'text/html');
      
      // Get the new variant data
      const variant = this.getSelectedVariant(html);

      // Update various parts of the page
      this.updateMedia(variant?.featured_media?.id);        // Update gallery
      this.updateURL(variant?.id);                         // Update URL
      this.updateVariantInputs(variant?.id);              // Update form inputs
      
      // Update specific sections using the new HTML
      this.updateSourceFromDestination(html, `price-${this.dataset.section}`);
      this.updateSourceFromDestination(html, `sku-${this.dataset.section}`);
      this.updateSourceFromDestination(html, `inventory-${this.dataset.section}`);
      this.updateSourceFromDestination(html, `add-to-cart-container-${this.dataset.section}`);
    });
}
```

This creates a seamless experience where selecting a new variant:
1. Triggers the change event
2. Fetches fresh HTML for the new variant
3. Updates multiple parts of the page (price, SKU, inventory, etc.)
4. All without a full page reload

The beauty of this approach is that it leverages Shopify's section rendering while maintaining a smooth user experience. Each part of the page updates independently, and the URL updates to reflect the selected variant, making it shareable and maintaining browser history.

#### Cart Event item-added-to-cart

The product page also handles cart interactions through a custom event. When an item is added to the cart, we need to notify other components (like the cart drawer) about this change:

File: `assets/component-product-info.js`
```js
class ProductInfo extends HTMLElement {
  
  onCartUpdate(e) {
    const { requestState } = e.detail;
    
    // Only handle successful "add to cart" requests
    if (requestState.requestType === 'add' && requestState.responseData?.ok) {
      // Show cart drawer
      document.body.classList.add('js-show-ajax-cart');
      
      // Dispatch event for other components
      document.dispatchEvent(
        new CustomEvent('item-added-to-cart', {
          detail: requestState?.responseData?.body
        })
      );
    }
  }
}
```

This event allows for:
1. Automatic cart drawer opening when items are added
2. Other components to react to cart changes
3. Passing cart data to interested components

#### Liquid AJAX Cart Integration

The product page leverages [Liquid AJAX Cart](https://liquid-ajax-cart.js.org/v2/product-forms/):

File: `sections/main-product.liquid`
```liquid
<ajax-cart-product-form>
  {% form 'product', product, id: product_form_id, novalidate: 'novalidate' %}
    <input type="hidden" name="id" value="{{ selected_variant.id }}">
    <div id="add-to-cart-container-{{ section.id }}">
      <button
        id="AddToCart-{{ section.id }}"
        type="submit"
        name="add"
        {% if selected_variant.available == false %}disabled{% endif %}
      >
        {% if selected_variant.available == false %}
          Sold out
        {% else %}
          Add to cart
        {% endif %}
      </button>
    </div>
  {% endform %}
</ajax-cart-product-form>
```

The integration provides:
1. Automatic form submission handling
2. Real-time cart updates without page reloads
3. Cart state synchronization across components

When a product is added:
1. Liquid AJAX Cart intercepts the form submission
2. Handles the cart addition via AJAX
3. Triggers the `liquid-ajax-cart:request-end` event
4. Our code then handles the UI updates and notifications

This creates a seamless cart experience where:
- The cart updates instantly
- The UI responds immediately
- All components stay in sync
- The user gets immediate feedback

### Collection Page Implementation

The collection page tells an interesting story of how filtering, sorting, and pagination work together through two main event handlers. Let's follow the flow:

#### Event Handling Flow

The `<collection-info>` element manages two primary events:

File: `assets/component-collection-info.js`
```js
class CollectionInfo extends HTMLElement {
  constructor() {
    super();
    this.debounceOnChange = debounce((event) => this.onChangeHandler(event), 800);
    this.addEventListener('change', this.debounceOnChange.bind(this));
    this.addEventListener('click', this.onClickHandler.bind(this));
  }
}
```

1. **Filter Changes (`onChangeHandler`)**
   - Triggered by filter form changes (checkboxes, price range, etc.)
   - Debounced to prevent rapid consecutive updates
   File: `assets/component-collection-info.js`
```js
onChangeHandler = (event) => {
  if (!event.target.matches('[data-render-section]')) return;

  const form = event.target.closest('form') || document.querySelector('#filters-form') || document.querySelector('#filters-form-drawer');
  const formData = new FormData(form);
  let searchParams = new URLSearchParams(formData).toString();

  // Preserve search query if it exists
  if (window.location.search.includes('?q=')) {
    const existingParams = new URLSearchParams(window.location.search);
    const qValue = existingParams.get('q');
    searchParams = `q=${qValue}&${searchParams}`;
  }

  this.fetchSection(searchParams);
};
```
   This handler:
   - Checks if the changed element is meant to trigger a section update
   - Finds the closest filter form (supports multiple form locations)
   - Collects all filter values and converts to URL parameters
   - Preserves search query if present
   - Triggers section update with new parameters

2. **Navigation Changes (`onClickHandler`)**
   - Handles sorting and pagination and active filters badges clicks through data attributes
   File: `assets/component-collection-info.js`
```js
onClickHandler = (event) => {
  if (event.target.matches('[data-render-section-url]')) {
    event.preventDefault();
    const searchParams = new URLSearchParams(event.target.dataset.renderSectionUrl.split('?')[1]).toString()
    
    this.fetchSection(searchParams);
  }
};
```
   This handler:
   - Checks for elements with `data-render-section-url` attribute
   - Extracts search parameters from the URL in the data attribute
   - Prevents default link behavior
   - Triggers section update with the extracted parameters

   Used by elements like active filters and pagination:
   File: `sections/main-collection.liquid`
```liquid
<!-- Active filter removal -->
<div class="filter active-filter-item"
  data-render-section-url="{{ v.url_to_remove }}"
>
  <span>{{ f.label }}: {{ v.label }}</span>
  <div class="filter-close">
    {{- 'icon-close.svg' | inline_asset_content -}}
  </div>
</div>

<!-- Clear all filters -->
<div class="filter active-filter-item active-filter-clear-all"
  data-render-section-url="{{ collection.url }}"
>
  <span>Clear all filters</span>
</div>
```