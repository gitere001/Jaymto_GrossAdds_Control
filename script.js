class GrossAddsTracker {
  constructor() {
    this.dsrs = {};
    this.currentDsr = null;
    this.grossAdds = [];
    this.reportDate = new Date().toISOString().split('T')[0];

    // Existing elements
    this.numberInput = document.getElementById('numberInput');
    this.addsInput = document.getElementById('addsInput');
    this.addButton = document.getElementById('addButton');
    this.entriesList = document.getElementById('entries-list');
    this.registeredTotal = document.getElementById('registeredTotal');
    this.unregisteredTotal = document.getElementById('unregisteredTotal');
    this.reportDateElement = document.getElementById('reportDate');

    // New DSR elements
    this.dsrSelect = document.getElementById('dsrSelect');
    this.newDsrInput = document.getElementById('newDsrInput');
    this.addDsrButton = document.getElementById('addDsrButton');

    // Existing modal elements
    this.modal = document.getElementById('updateModal');
    this.updateAddsInput = document.getElementById('updateAddsInput');
    this.confirmUpdate = document.getElementById('confirmUpdate');
    this.cancelUpdate = document.getElementById('cancelUpdate');

    this.dateModal = document.getElementById('dateModal');
    this.dateInput = document.getElementById('dateInput');
    this.confirmDate = document.getElementById('confirmDate');
    this.cancelDate = document.getElementById('cancelDate');

    this.currentUpdateIndex = null;

    this.loadFromLocalStorage();
    this.setupEventListeners();
    this.render();
  }

  loadFromLocalStorage() {
    const savedDsrs = localStorage.getItem('dsrs');
    const savedCurrentDsr = localStorage.getItem('currentDsr');
    const savedDate = localStorage.getItem('reportDate');

    if (savedDsrs) {
      this.dsrs = JSON.parse(savedDsrs);
    }

    this.currentDsr = savedCurrentDsr || null;
    this.grossAdds = this.currentDsr ? (this.dsrs[this.currentDsr] || []) : [];

    if (savedDate) {
      this.reportDate = savedDate;
    }

    this.updateDsrSelect();
  }

  saveToLocalStorage() {
    if (this.currentDsr) {
      this.dsrs[this.currentDsr] = this.grossAdds;
    }
    localStorage.setItem('dsrs', JSON.stringify(this.dsrs));
    localStorage.setItem('currentDsr', this.currentDsr);
    localStorage.setItem('reportDate', this.reportDate);
  }

  updateDsrSelect() {
    this.dsrSelect.innerHTML = '<option value="">Select DSR</option>';
    Object.keys(this.dsrs).forEach(dsr => {
      const option = document.createElement('option');
      option.value = dsr;
      option.textContent = dsr;
      option.selected = dsr === this.currentDsr;
      this.dsrSelect.appendChild(option);
    });
  }

  setupEventListeners() {
    // Existing event listeners
    this.addButton.addEventListener('click', () => this.handleAddNumber());
    this.reportDateElement.addEventListener('click', () => this.showDateModal());

    this.addsInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleAddNumber();
      }
    });

    // New DSR event listeners
    this.dsrSelect.addEventListener('change', (e) => {
      this.currentDsr = e.target.value;
      this.grossAdds = this.currentDsr ? (this.dsrs[this.currentDsr] || []) : [];
      this.render();
    });

    this.addDsrButton.addEventListener('click', () => {
      const newDsrName = this.newDsrInput.value.trim();
      if (newDsrName && !this.dsrs[newDsrName]) {
        this.dsrs[newDsrName] = [];
        this.currentDsr = newDsrName;
        this.grossAdds = this.dsrs[newDsrName];
        this.updateDsrSelect();
        this.newDsrInput.value = '';
        this.saveToLocalStorage();
        this.render();
      }
    });

    // Existing modal events
    this.confirmUpdate.addEventListener('click', () => this.handleUpdateConfirm());
    this.cancelUpdate.addEventListener('click', () => this.hideModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hideModal();
    });

    this.confirmDate.addEventListener('click', () => this.handleDateConfirm());
    this.cancelDate.addEventListener('click', () => this.hideDateModal());
    this.dateModal.addEventListener('click', (e) => {
      if (e.target === this.dateModal) this.hideDateModal();
    });
  }

  handleAddNumber() {
    if (!this.currentDsr) return;

    const number = this.numberInput.value.trim();
    const adds = parseInt(this.addsInput.value);

    if (!number || isNaN(adds)) return;

    const existingIndex = this.grossAdds.findIndex(item => item.number === number);

    if (existingIndex >= 0) {
      this.grossAdds[existingIndex].adds += adds;
    } else {
      const blanksIndex = this.grossAdds.findIndex(item => item.number === '(Blanks)');
      if (blanksIndex >= 0) {
        this.grossAdds.splice(blanksIndex, 0, { number, adds });
      } else {
        this.grossAdds.push({ number, adds });
      }
    }

    this.saveToLocalStorage();
    this.render();
    this.clearInputs();
  }

  showUpdateModal(index) {
    this.currentUpdateIndex = index;
    this.updateAddsInput.value = this.grossAdds[index].adds;
    this.modal.classList.add('show');
    this.updateAddsInput.focus();
    this.updateAddsInput.select();
  }

  hideModal() {
    this.modal.classList.remove('show');
    this.currentUpdateIndex = null;
  }

  showDateModal() {
    this.dateInput.value = this.reportDate;
    this.dateModal.classList.add('show');
    this.dateInput.focus();
  }

  hideDateModal() {
    this.dateModal.classList.remove('show');
  }

  handleUpdateConfirm() {
    const newAdds = parseInt(this.updateAddsInput.value);
    if (!isNaN(newAdds) && this.currentUpdateIndex !== null) {
      this.grossAdds[this.currentUpdateIndex].adds = newAdds;
      this.saveToLocalStorage();
      this.render();
      this.hideModal();
    }
  }

  handleDateConfirm() {
    const newDate = this.dateInput.value;
    if (newDate) {
      this.reportDate = newDate;
      this.saveToLocalStorage();
      this.render();
      this.hideDateModal();
    }
  }

  clearInputs() {
    this.numberInput.value = '';
    this.addsInput.value = '';
    this.numberInput.focus();
  }

  calculateTotals() {
    let registered = 0;
    let unregistered = 0;

    this.grossAdds.forEach(item => {
      if (item.number === '(Blanks)') {
        unregistered += item.adds;
      } else {
        registered += item.adds;
      }
    });

    return { registered, unregistered };
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  render() {
    // Update date display
    this.reportDateElement.textContent = this.formatDate(this.reportDate);

    // Update totals
    const totals = this.calculateTotals();
    this.registeredTotal.textContent = totals.registered;
    this.unregisteredTotal.textContent = totals.unregistered;

    // Clear and render entries
    this.entriesList.innerHTML = '';
    this.grossAdds.forEach((item, index) => {
      const entryElement = document.createElement('div');
      const isBlank = item.number === '(Blanks)';
      entryElement.className = `entry ${isBlank ? 'entry-blanks' : ''}`;
      entryElement.innerHTML = `
        <div class="entry-circle"></div>
        <div class="entry-text">
          <span class="entry-number">${item.number}</span>
          <span class="entry-adds" data-index="${index}">(${item.adds})</span>
        </div>
      `;

      const addsElement = entryElement.querySelector('.entry-adds');
      addsElement.addEventListener('click', () => this.showUpdateModal(index));

      this.entriesList.appendChild(entryElement);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GrossAddsTracker();
});