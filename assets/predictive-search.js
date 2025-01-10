class PredictiveSearch extends HTMLElement {
    constructor() {
      super();
  
      this.input = this.querySelector('input[type="search"]');
      this.predictiveSearchResults = this.querySelector('#predictive-search');
      this.searchTerm = this.input.value.trim();
  
      if (this.searchTerm.length) {
        this.getSearchResults(this.searchTerm);
      }
  
      this.input.addEventListener('input', this.debounce(event => this.onChange(event), 300));
    }
  
    onChange() {
      const newSearchTerm = this.input.value.trim();
      if (!this.searchTerm || !newSearchTerm.startsWith(this.searchTerm)) {
        const resultsElement = this.querySelector('#predictive-search-results');
        if (resultsElement) resultsElement.remove();
      }
  
      this.searchTerm = newSearchTerm;
  
      if (!this.searchTerm.length) {
        this.close();
        return;
      }
  
      this.getSearchResults(this.searchTerm);
    }
  
    getSearchResults(searchTerm) {
      fetch(`/search/suggest?q=${encodeURIComponent(searchTerm)}&section_id=predictive-search`)
        .then(response => {
          if (!response.ok) {
            this.close();
            return Promise.reject(new Error(`Failed to fetch: ${response.status}`));
          }
          return response.text();
        })
        .then(text => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          const resultsMarkup = doc.querySelector('#shopify-section-predictive-search').innerHTML;
          this.updateResults(resultsMarkup);
        })
        .catch(error => {
          console.error('Error fetching search results:', error);
          this.close();
        });
    }
  
    updateResults(resultsMarkup) {
      this.predictiveSearchResults.innerHTML = resultsMarkup;
      this.open();
    }
  
    open() {
      this.predictiveSearchResults.style.display = 'block';
    }
  
    close() {
      this.predictiveSearchResults.style.display = 'none';
    }
  
    debounce(fn, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
      };
    }
  }
  
  customElements.define('predictive-search', PredictiveSearch);  