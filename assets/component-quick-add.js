class QuickAdd extends HTMLElement {
  constructor() {
    super();
    this.modal = null;
    this.modalContent = null;
    this.setupModal();
    this.bindEvents();
  }

  setupModal() {
    this.modal = this.querySelector('[role="dialog"]');
    this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');
    document.body.appendChild(this);
  }

  bindEvents() {
    this.querySelector('[id^="ModalClose-"]')?.addEventListener('click', () => this.hide());
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    this.addEventListener('click', (event) => {
      if (event.target === this) this.hide();
    });
    
  }

  show(opener) {
    this.openedBy = opener;
    opener.setAttribute('aria-disabled', true);
    opener.querySelector('.loading__spinner').classList.remove('hidden');

    fetch(opener.getAttribute('data-product-url'))
      .then(response => response.text())
      .then(responseText => {
        const productElement = new DOMParser()
          .parseFromString(responseText, 'text/html')
          .querySelector('product-info');

        productElement.setAttribute('data-update-url', 'false');

        this.preprocessContent(productElement);
        this.setContent(productElement.outerHTML);
        
        document.body.classList.add('overflow-hidden');
        this.setAttribute('open', '');
        
        if (window.Shopify?.PaymentButton) Shopify.PaymentButton.init();
        if (window.ProductModel) window.ProductModel.loadShopifyXR();
      })
      .finally(() => {
        opener.removeAttribute('aria-disabled');
        opener.querySelector('.loading__spinner').classList.add('hidden');
      });
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    this.removeAttribute('open');
    this.modalContent.innerHTML = '';
  }

  preprocessContent(element) {
    const newId = `${element.dataset.section}`;
    element.innerHTML = element.innerHTML.replaceAll(element.dataset.section, newId);
    element.setAttribute('data-update-url', 'false');
  }

  setContent(html) {
    this.modalContent.innerHTML = html;
    // Reinject scripts
    this.modalContent.querySelectorAll('script').forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }
  
}

customElements.define('quick-add-modal', QuickAdd);


class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);



document.addEventListener('liquid-ajax-cart:request-end', function(e) {
    const { requestState } = e.detail;
    // If the "add to cart" request is successful
    if (requestState.requestType === 'add' && requestState.responseData?.ok) {
      // Add the CSS class to the "body" tag
      document.body.classList.add('js-show-ajax-cart');
      // dispatch a custom event
      document.dispatchEvent(
        new CustomEvent('item-added-to-cart', {
          detail: requestState?.responseData?.body,
        })
      );
    }
});
