if (!customElements.get('product-monogram-popup')) {
  class ProductMonogramPopup extends HTMLElement {
    constructor() {
      super();
      this.isOpen = false;
      this.selectedStyle = 'AB'; // Default style
      this.selectedColor = 'white'; // Default color
      this.monogramText = 'A'; // Default text
      this.acknowledgeNoReturn = false;

      // Style-specific character limits
      this.styleCharacterLimits = {
        'AB': 2,
        'ABC': 3,
        'GDC': 5,
        'KATIE': 7
      };

      // Set initial max characters based on default style
      this.maxCharacters = this.styleCharacterLimits[this.selectedStyle] || 2;
      console.log('ProductMonogramPopup constructor initialized');
      
      // Ensure the modal is moved to the body element for consistent behavior
      //document.body.appendChild(this);
    }

    connectedCallback() {
      this.setupEventListeners();

      // Initialize the max characters display
      const maxCharsDisplay = this.querySelector('.product-monogram__max-chars');
      if (maxCharsDisplay) {
        maxCharsDisplay.textContent = this.maxCharacters;
      }

      // Update the input maxlength attribute
      const textInput = this.querySelector('.product-monogram__text-input');
      if (textInput) {
        textInput.maxLength = this.maxCharacters;
      }

      this.updatePreview(); // Initialize preview
    }

    setupEventListeners() {

      // Close button event
      const closeButton = this.querySelector('[id^="MonogramModalClose-"]');
      if (closeButton) {
        closeButton.addEventListener('click', this.hide.bind(this));
      } else {
        console.error('Close button not found');
      }

      // Style selection
      const styleOptions = this.querySelectorAll('.product-monogram__style-option');
      styleOptions.forEach(option => {
        option.addEventListener('click', this.handleStyleSelection.bind(this));
      });

      // Color selection
      const colorOptions = this.querySelectorAll('.product-monogram__color-option');
      console.log('Color options found:', colorOptions.length);
      colorOptions.forEach(option => {
        option.addEventListener('click', this.handleColorSelection.bind(this));
      });

      // Text input
      const textInput = this.querySelector('.product-monogram__text-input');
      if (textInput) {
        textInput.addEventListener('input', this.handleTextInput.bind(this));
        console.log('Text input listener added');
      } else {
        console.error('Text input not found');
      }

      // Checkbox
      const checkbox = this.querySelector('#monogram-acknowledge');
      if (checkbox) {
        checkbox.addEventListener('change', this.handleAcknowledgement.bind(this));
        console.log('Checkbox listener added');
      } else {
        console.error('Checkbox not found');
      }

      // Add to cart button
      const addToCartButton = this.querySelector('.product-monogram__add-to-cart');
      if (addToCartButton) {
        addToCartButton.addEventListener('click', this.handleAddToCart.bind(this));
        console.log('Add to cart button listener added');
      } else {
        console.error('Add to cart button not found');
      }

      // Modal backdrop click to close
      this.addEventListener('click', (event) => {
        if (event.target === this) this.hide();
      });

      // Escape key to close
      this.addEventListener('keyup', (event) => {
        if (event.code.toUpperCase() === 'ESCAPE') this.hide();
      });
    }

    disconnectedCallback() {
      // No need for document level event listeners as we're using element-level now
    }

    // Renamed to align with QuickAdd convention
    show(opener) {
      this.isOpen = true;
      document.body.classList.add('overflow-hidden');
      this.setAttribute('open', '');
      
      // Store the opener reference if provided
      if (opener) {
        this.openedBy = opener;
      }
    }

    // Renamed to align with QuickAdd convention
    hide() {
      this.isOpen = false;
      document.body.classList.remove('overflow-hidden');
      this.removeAttribute('open');
    }

    handleStyleSelection(event) {
      const style = event.currentTarget.dataset.style;

      // Remove selected class from all style options
      this.querySelectorAll('.product-monogram__style-option').forEach(options => options.classList.remove('product-monogram__selected'));

      // Add selected class to clicked option
      event.currentTarget.classList.add('product-monogram__selected');
      this.selectedStyle = style;

      // Update max characters based on selected style
      this.maxCharacters = this.styleCharacterLimits[style] || 2;

      // Update max characters display in the heading
      const maxCharsDisplay = this.querySelector('.product-monogram__max-chars');
      if (maxCharsDisplay) {
        maxCharsDisplay.textContent = this.maxCharacters;
      }

      // Update input field maxlength
      const textInput = this.querySelector('.product-monogram__text-input');
      if (textInput) {
        textInput.maxLength = this.maxCharacters;

        // If current text is longer than new max, truncate it
        if (textInput.value.length > this.maxCharacters) {
          textInput.value = textInput.value.slice(0, this.maxCharacters);
          this.monogramText = textInput.value;
        }

        // Update character counter
        const counter = this.querySelector('.product-monogram__character-count');
        if (counter) {
          const remaining = this.maxCharacters - textInput.value.length;
          counter.textContent = `${remaining} characters left`;
        }
      }

      this.updatePreview();
      this.validateForm();
    }

    handleColorSelection(event) {
      const color = event.currentTarget.dataset.color;
      console.log('Color selected:', color);

      // Remove selected class from all color options
      this.querySelectorAll('.product-monogram__color-option').forEach(option => {
        option.classList.remove('product-monogram__selected');
      });

      // Add selected class to clicked option
      event.currentTarget.classList.add('product-monogram__selected');
      this.selectedColor = color;

      this.updatePreview();
      this.validateForm();

      // Log color selection for debugging
      console.log(`Selected color: ${color} - Element: `, event.currentTarget);
    }

    handleTextInput(event) {
      const input = event.target;
      const value = input.value;

      // Enforce character limit
      if (value.length > this.maxCharacters) {
        input.value = value.slice(0, this.maxCharacters);
      }

      this.monogramText = input.value || 'A'; // Default to 'A' if empty
      console.log('Text input updated:', this.monogramText);

      // Update character counter
      const counter = this.querySelector('.product-monogram__character-count');
      if (counter) {
        const remaining = this.maxCharacters - input.value.length;
        counter.textContent = `${remaining} characters left`;
      }

      this.updatePreview();
      this.validateForm();
    }

    updatePreview() {
      const previewText = this.querySelector('#monogram-preview-text');
      if (previewText) {
        previewText.textContent = this.monogramText || 'A';

        // Update the style of the preview based on selected style
        previewText.className = ''; // Clear existing classes

        switch (this.selectedStyle) {
          case 'AB':
            previewText.style.fontFamily = 'Georgia, serif';
            previewText.style.fontSize = '5rem';
            previewText.style.fontWeight = 'bold';
            previewText.style.fontStyle = 'normal';
            previewText.style.textDecoration = 'none';
            // Remove any previous decorations
            previewText.style.border = 'none';
            previewText.style.borderRadius = '0';
            previewText.style.padding = '0';
            previewText.style.boxShadow = 'none';
            break;
          case 'ABC':
            previewText.style.fontFamily = 'Helvetica, sans-serif';
            previewText.style.fontSize = '5rem';
            previewText.style.fontWeight = 'normal';
            previewText.style.fontStyle = 'normal';
            previewText.style.letterSpacing = '0.1em';
            // Remove any previous decorations
            previewText.style.border = 'none';
            previewText.style.borderRadius = '0';
            previewText.style.padding = '0';
            previewText.style.boxShadow = 'none';
            break;
          case 'GDC':
            previewText.style.fontFamily = 'Times New Roman, serif';
            previewText.style.fontSize = '4rem';
            previewText.style.fontStyle = 'normal';
            // Add circular border
            previewText.style.border = '2px solid';
            previewText.style.borderColor = this.selectedColor === 'white' ? 'black' : this.selectedColor;
            previewText.style.borderRadius = '50%';
            previewText.style.padding = '10px 15px';
            previewText.style.display = 'flex';
            previewText.style.justifyContent = 'center';
            previewText.style.alignItems = 'center';
            previewText.style.width = '80px';
            previewText.style.height = '80px';
            break;
          case 'KATIE':
            previewText.style.fontFamily = 'Brush Script MT, cursive';
            previewText.style.fontSize = '4.5rem';
            previewText.style.fontStyle = 'italic';
            previewText.style.textTransform = 'capitalize';
            // Remove any previous decorations
            previewText.style.border = 'none';
            previewText.style.borderRadius = '0';
            previewText.style.padding = '0';
            previewText.style.boxShadow = 'none';
            break;
        }

        // Update the color of the preview based on selected color
        previewText.style.color = this.selectedColor;

        // If color is white, add shadow for visibility on light backgrounds
        if (this.selectedColor === 'white') {
          previewText.style.textShadow = '0 0 2px rgba(0,0,0,0.5)';
        } else {
          previewText.style.textShadow = 'none';
        }
      }
    }

    handleAcknowledgement(event) {
      this.acknowledgeNoReturn = event.target.checked;
      console.log('Acknowledgment updated:', this.acknowledgeNoReturn);
      this.validateForm();
    }

    validateForm() {
      const addToCartButton = this.querySelector('.product-monogram__add-to-cart');
      if (!addToCartButton) return false;

      const isValid =
        this.selectedStyle &&
        this.selectedColor &&
        this.monogramText &&
        this.acknowledgeNoReturn;

      console.log('Form validation:', {
        style: this.selectedStyle,
        color: this.selectedColor,
        text: this.monogramText,
        acknowledge: this.acknowledgeNoReturn,
        isValid: isValid
      });

      if (isValid) {
        addToCartButton.removeAttribute('disabled');
      } else {
        addToCartButton.setAttribute('disabled', '');
      }

      return isValid;
    }

    handleAddToCart() {
      if (!this.validateForm()) return;

      // Get the selected variant ID from product-info component
      const productInfo = document.querySelector('product-info');
      if (!productInfo) {
        console.error('Product info component not found');
        return;
      }

      // Find the selected variant ID
      const variantId = productInfo.querySelector('input[name="id"]').value;
      if (!variantId) {
        console.error('No variant selected');
        return;
      }

      // Prepare monogram properties
      const properties = {
        style: this.selectedStyle,
        color: this.selectedColor,
        text: this.monogramText
      };

      // Get quantity from product-info component
      const quantityInput = productInfo.querySelector('quantity-selector input[type="number"]');
      const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

      // Check for selling plan (subscription) selection
      let sellingPlanId = null;
      const sellingPlanInput = productInfo.querySelector('.selected-selling-plan-id');
      if (sellingPlanInput && sellingPlanInput.value) {
        sellingPlanId = sellingPlanInput.value;
        console.log('Found selling plan ID:', sellingPlanId);
      }

      // Show loading spinner
      const addToCartButton = this.querySelector('.product-monogram__add-to-cart');
      const originalButtonText = addToCartButton.textContent;

      addToCartButton.innerHTML = `
        <span class="loading-spinner">
          <svg aria-hidden="true" focusable="false" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
            <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
          </svg>
        </span>
        <span class="add-to-cart-text">Adding...</span>
      `;
      addToCartButton.disabled = true;

      // Use Liquid Ajax Cart to add the item
      if (window.liquidAjaxCart) {
        // Prepare the cart item
        const cartItem = {
          id: variantId,
          quantity: quantity,
          properties: properties
        };

        // Add selling plan if selected
        if (sellingPlanId) {
          cartItem.selling_plan = sellingPlanId;
        }

        console.log('Adding to cart with Liquid Ajax Cart:', cartItem);

        try {
          // Add item to cart using Liquid Ajax Cart
          window.liquidAjaxCart.add({
            items: [cartItem]
          });

          // Listen for the request-end event to know when the request completes
          const handleRequestEnd = (event) => {
            const { requestState } = event.detail;

            // Check if this is our add request and it succeeded
            if (requestState.requestType === 'add' && requestState.responseData?.ok) {
              console.log('Item added successfully with monogram:', requestState.responseData);

              // Reset the form to default values
              this.resetForm();

              // Show cart drawer by adding the class that component-product-info.js uses
              document.body.classList.add('js-show-ajax-cart');

              // Hide the modal
              this.hide();
            } else if (requestState.requestType === 'add' && !requestState.responseData?.ok) {
              // Show error
              console.error('Error adding item with monogram:', requestState.responseData?.body);
              alert('Could not add the item to your cart. Please try again.');
            }

            // Reset button state
            addToCartButton.innerHTML = originalButtonText;
            addToCartButton.disabled = false;

            // Remove event listener
            document.removeEventListener('liquid-ajax-cart:request-end', handleRequestEnd);
          };

          // Add event listener for request completion
          document.addEventListener('liquid-ajax-cart:request-end', handleRequestEnd);

        } catch (error) {
          console.error('Error invoking Liquid Ajax Cart add method:', error);

          // Reset button state
          addToCartButton.innerHTML = originalButtonText;
          addToCartButton.disabled = false;

          alert('Could not add the item to your cart. Please try again.');
        }
      } else {
        console.error('Liquid Ajax Cart is not available');

        // Reset button state
        addToCartButton.innerHTML = originalButtonText;
        addToCartButton.disabled = false;

        alert('Could not add the item to your cart. Please refresh the page and try again.');
      }
    }

    // Add this new method to reset the form
    resetForm() {
      // Reset form values to defaults
      this.selectedStyle = 'AB';
      this.selectedColor = 'white';
      this.monogramText = 'A';
      this.acknowledgeNoReturn = false;
      this.maxCharacters = this.styleCharacterLimits[this.selectedStyle] || 2;

      // Reset text input
      const textInput = this.querySelector('.product-monogram__text-input');
      if (textInput) {
        textInput.value = '';
        textInput.maxLength = this.maxCharacters;
      }

      // Reset character counter
      const counter = this.querySelector('.product-monogram__character-count');
      if (counter) {
        counter.textContent = `${this.maxCharacters} characters left`;
      }

      // Reset style selection
      this.querySelectorAll('.product-monogram__style-option').forEach(option => {
        option.classList.remove('product-monogram__selected');
        if (option.dataset.style === 'AB') {
          option.classList.add('product-monogram__selected');
        }
      });

      // Reset color selection
      this.querySelectorAll('.product-monogram__color-option').forEach(option => {
        option.classList.remove('product-monogram__selected');
        if (option.dataset.color === 'white') {
          option.classList.add('product-monogram__selected');
        }
      });

      // Reset acknowledgement checkbox
      const checkbox = this.querySelector('#monogram-acknowledge');
      if (checkbox) {
        checkbox.checked = false;
      }

      // Reset the preview
      this.updatePreview();

      // Disable the add to cart button
      const addToCartButton = this.querySelector('.product-monogram__add-to-cart');
      if (addToCartButton) {
        addToCartButton.setAttribute('disabled', '');
      }

      console.log('Monogram form has been reset to default values');
    }
  }

  customElements.define('product-monogram-popup', ProductMonogramPopup);
}