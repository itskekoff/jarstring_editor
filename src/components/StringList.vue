<template>
  <div class="string-list-container">
    <div class="string-list">
      <div v-for="string in paginatedStrings" :key="string.id" class="string-item">
        <input :value="string.value" @input="e => emit('string-changed', e.target.value, string.id)"/>
        <div class="info-container">
          <div class="tooltip-wrapper">
            <button @mouseenter="setHovered(string.id)" @mouseleave="clearHovered(string.id)" :disabled="true" >Class info</button>
            <div v-if="hoveredButtons[string.id]" class="class-tooltip">
              Class: {{ string.location.className}}
              <br>
              Method: {{ string.location.method['name'] + string.location.method['descriptor']}}
              <br>
              Line: {{ string.location.lineNumber }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="props.strings.length > itemsPerPage" class="pagination-controls">
      <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">Previous</button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-btn">Next</button>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, reactive} from 'vue';

const props = defineProps({
  strings: Array
});

const emit = defineEmits(['string-changed', 'view-class']);

const itemsPerPage = 250;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(props.strings.length / itemsPerPage));
const paginatedStrings = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return props.strings.slice(start, end);
});

const hoveredButtons = reactive({});

const setHovered = (id) => {
  hoveredButtons[id] = true;
};

const clearHovered = (id) => {
  hoveredButtons[id] = false;
};
</script>

<style scoped>
.string-list-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 250px;
}

.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  align-items: center;
  padding: 10px;
  border: solid 1px rgba(255, 255, 255, 0.25);
  border-radius: 6px;
}

.string-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.string-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: solid 1px rgba(255, 255, 255, 0.25);
  border-radius: 6px;
}

.string-item > *:first-child {
  flex: 1;
  min-width: 0;
}

button {
  background: none;
  border: solid 1px rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  padding: 5px 10px;
  color: white;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 165px;
}

.pagination-controls {
  display: grid;
  grid-template-columns: auto 1fr auto;
  place-self: center;
  grid-gap: 10px;
  align-items: center;
  padding: 10px;
  border: solid 1px rgba(255, 255, 255, 0.25);
  border-radius: 6px;
}

.page-btn {
  background: #3d4348;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.page-btn:disabled {
  background: #2a2f33;
  cursor: not-allowed;
  opacity: 0.7;
}

.page-btn:not(:disabled):hover {
  background: #4a90e2;
}

.page-info {
  color: #8a9095;
  font-size: 0.9em;
}

.class-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 70%;
  background: #2a2f33;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
}

.tooltip-wrapper:hover .class-tooltip {
  opacity: 1;
  transform:
      translateX(-50%)
      translateY(0);
}

.class-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color:
      #2a2f33
      transparent
      transparent
      transparent;
}

.class-tooltip::after {
  border-color: transparent;
}


</style>