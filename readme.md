# StarterTheme

A developer-first Shopify theme that prioritizes clean code, maintainability, and straightforward customization. Built with the modern developer workflow in mind, this theme serves as an ideal starting point for your Shopify projects.

## Introduction

StarterTheme is crafted for developers who appreciate clean, well-structured code and minimal complexity. This theme strips away the bloat commonly found in marketplace themes to provide a solid foundation that you can build upon.

### Developer Benefits

- **Clean Architecture**: Organized, logical file structure with clear separation of concerns
- **Minimal Dependencies**: Only essential libraries and tools included
- **Modern Development**: Built using Shopify CLI 3.0 and Online Store 2.0 features
- **Simplified Customization**: Well-documented sections and blocks for easy modifications
- **Performance First**: Lightweight base with no unnecessary JavaScript or CSS
- **Developer Experience**: Quick setup, clear naming conventions, and intuitive component structure

The theme follows KISS (Keep It Simple, Stupid) principles, making it an excellent choice for both rapid development and teaching/learning Shopify theme development.

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
```liquid
<header
  x-data="{ searchOpen: false, searchTerm: '' }"
  @click.outside="searchOpen = false"
  @input="searchTerm = $event.target.value"
>
```

The search toggle uses Alpine's `$nextTick` for focus management:
```liquid
<div id="header-actions_search" 
  @click="searchOpen = !searchOpen; $nextTick(() => { if (searchOpen) $refs.searchInput.focus() })">
  {{ 'icon-search.svg' | inline_asset_content }}
</div>
```

The search form uses Alpine's x-model and x-ref for input handling:
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
```liquid
<div data-cart-count data-ajax-cart-bind="item_count">
  {{ cart.item_count }}
</div>
```

### Product Page Implementation

The product page tells an interesting story of how variant selection works. Let's follow the flow:

#### The Variant Selection Journey

It starts with the `<variant-selector>` element, which can be rendered in two ways:
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
   - The filters are wrapped in form elements:
   ```liquid
   <form id="filters-form">
     {% for f in results.filters %}
       <!-- Filter inputs -->
     {% endfor %}
   </form>
   ```
   - Collects all filter values from the form
   - Converts them to URL parameters
   - Preserves search query if present (`?q=` parameter)

2. **Navigation Changes (`onClickHandler`)**
   - Handles sorting and pagination clicks
   - Looks for elements with `data-render-section-url`
   - Uses the URL from the element's data attribute

Both events ultimately call `fetchSection`, which updates the page:

```js
fetchSection(searchParams) {
  // Show loading state
  this.showLoadingOverlay();
  
  // Fetch updated section content
  fetch(`${window.location.pathname}?section_id=${this.dataset.section}&${searchParams}`)
    .then((response) => response.text())
    .then((responseText) => {
      const html = new DOMParser().parseFromString(responseText, 'text/html');
      
      // Update multiple sections of the page
      this.updateSourceFromDestination(html, `product-grid-${this.dataset.section}`);
      this.updateSourceFromDestination(html, `results-count-${this.dataset.section}`);
      this.updateSourceFromDestination(html, `active-filter-group-${this.dataset.section}`);
      // ... update other sections
      
      this.updateURL(searchParams);
      this.hideLoadingOverlay();
    });
}
```

#### Filter UI with Alpine.js

The theme offers three filter layouts, each powered by Alpine.js for state management:

1. **Drawer Filters**
```liquid
<div
  x-data="{ open: false }"
  class="drawer-main-wrapper"
  :class="{ 'drawer-active': open }"
>
  <!-- Drawer content -->
  <div class="drawer__facets-wrapper" x-data="{ openFilter: $persist(true) }">
    <!-- Filter groups -->
  </div>
</div>
```

2. **Sidebar Filters**
```liquid
<div class="filter-section" x-data="{ open: {{ collapse_filters }} }">
  <details x-bind:open="open" @toggle="open = $event.target.open">
    <!-- Filter content -->
    <div x-data="{ showMore: $persist(false).as('sm-{{ f.param_name }}') }">
      <!-- Filter values with show more/less -->
    </div>
  </details>
</div>
```

3. **Horizontal Filters**
```liquid
<div class="facets__wrapper" x-data="{ open: false }">
  <button x-on:click="open = !open">
    {{ f.label }}
  </button>
  <div x-show="open" @click.away="open = false" x-transition>
    <!-- Filter content -->
  </div>
</div>
```

Alpine.js provides:
- Persistent filter group state (`$persist`)
- Show/hide filter values
- Smooth transitions
- Click-outside handling
- Mobile-friendly drawer interactions

This implementation creates a seamless filtering experience where:
1. Filter changes immediately trigger section updates
2. The URL reflects the current filter state
3. The UI stays responsive with loading states
4. Filter preferences persist between page loads


