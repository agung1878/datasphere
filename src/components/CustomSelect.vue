<template>
  <div class="custom-select" ref="selectWrapper">
    <!-- Selected Display -->
    <div 
      class="select-display"
      :class="{ 'active': isOpen, 'disabled': disabled }"
      @click="toggleDropdown"
    >
      <div class="selected-item" v-if="selectedOption">
        <span class="icon">{{ selectedOption.icon }}</span>
        <span class="label">{{ selectedOption.label }}</span>
      </div>
      <div class="placeholder" v-else>
        {{ placeholder }}
      </div>
      <svg class="chevron" :class="{ 'rotate': isOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>

    <!-- Dropdown -->
    <transition name="dropdown">
      <div class="dropdown" v-if="isOpen">
        <!-- Search Box -->
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            ref="searchInput"
            v-model="searchQuery" 
            type="text" 
            placeholder="Search..." 
            @click.stop
          />
        </div>

        <!-- Options List -->
        <div class="options-list">
          <div 
            v-for="option in filteredOptions" 
            :key="option.value"
            class="option"
            :class="{ 
              'selected': option.value === modelValue,
              'disabled': option.disabled 
            }"
            @click="selectOption(option)"
          >
            <span class="icon">{{ option.icon }}</span>
            <div class="option-content">
              <span class="label">{{ option.label }}</span>
              <span class="meta" v-if="option.meta">{{ option.meta }}</span>
            </div>
            <svg v-if="option.value === modelValue" class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div v-if="filteredOptions.length === 0" class="no-results">
            No devices found
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'CustomSelect',
  
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    options: {
      type: Array,
      required: true,
      // Expected format: [{ value: '', label: '', icon: '', meta: '', disabled: false }, ...]
    },
    placeholder: {
      type: String,
      default: 'Select an option...'
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },

  emits: ['update:modelValue'],

  data() {
    return {
      isOpen: false,
      searchQuery: ''
    }
  },

  computed: {
    selectedOption() {
      return this.options.find(opt => opt.value === this.modelValue);
    },

    filteredOptions() {
      if (!this.searchQuery) {
        return this.options;
      }

      const query = this.searchQuery.toLowerCase();
      return this.options.filter(opt => 
        opt.label.toLowerCase().includes(query) ||
        (opt.meta && opt.meta.toLowerCase().includes(query))
      );
    }
  },

  methods: {
    toggleDropdown() {
      if (this.disabled) return;
      
      this.isOpen = !this.isOpen;
      
      if (this.isOpen) {
        this.$nextTick(() => {
          this.$refs.searchInput?.focus();
        });
      } else {
        this.searchQuery = '';
      }
    },

    selectOption(option) {
      if (option.disabled) return;
      
      this.$emit('update:modelValue', option.value);
      this.isOpen = false;
      this.searchQuery = '';
    },

    handleClickOutside(event) {
      if (!this.$refs.selectWrapper?.contains(event.target)) {
        this.isOpen = false;
        this.searchQuery = '';
      }
    }
  },

  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }
}
</script>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
}

/* Selected Display */
.select-display {
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #2244bf;
  /* border-radius: 1rem; */
  padding: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-display:hover:not(.disabled) {
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(0, 0, 0, 0.6);
}

.select-display.active {
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.select-display.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.selected-item .icon {
  font-size: 1.25rem;
}

.selected-item .label {
  color: white;
  font-size: 0.875rem;
}

.placeholder {
  color: rgba(156, 163, 175, 0.6);
  font-size: 0.875rem;
}

.chevron {
  color: rgba(156, 163, 175, 0.6);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.chevron.rotate {
  transform: rotate(180deg);
}

/* Dropdown */
.dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: rgba(15, 15, 25, 0.98);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

/* Search Box */
.search-box {
  padding: 1rem;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-box svg {
  color: rgba(156, 163, 175, 0.6);
  flex-shrink: 0;
}

.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-size: 0.875rem;
}

.search-box input::placeholder {
  color: rgba(156, 163, 175, 0.4);
}

/* Options List */
.options-list {
  max-height: 150px;
  overflow-y: auto;
  padding: 0.5rem;
}

.options-list::-webkit-scrollbar {
  width: 6px;
}

.options-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.options-list::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.3);
  border-radius: 3px;
}

.options-list::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.5);
}

/* Option Item */
.option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option:hover:not(.disabled) {
  background: rgba(59, 130, 246, 0.1);
}

.option.selected {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.option.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.option .icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option-content .label {
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
}

.option-content .meta {
  color: rgba(156, 163, 175, 0.7);
  font-size: 0.75rem;
}

.check-icon {
  color: rgb(34, 197, 94);
  flex-shrink: 0;
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: rgba(156, 163, 175, 0.5);
  font-size: 0.875rem;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
