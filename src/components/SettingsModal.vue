<template>
  <div class="modal" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Settings</h3>
        <button class="close-btn" @click="closeModal">✖</button>
      </div>
      <div class="modal-body">
        <div class="setting-item">
          <label for="sortByContext">Sort by context</label>
          <input type="checkbox" id="sortByContext" v-model="localSettings.sortByContext" />
        </div>
        <div class="setting-item">
          <label for="hideEmptyStrings">Hide empty strings</label>
          <input type="checkbox" id="hideEmptyStrings" v-model="localSettings.hideEmptyStrings" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="save-btn" @click="saveSettings">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { settings } from '../util/settings';

const props = defineProps({
  modelValue: Boolean,
});
const emit = defineEmits(['update:modelValue']);

const localSettings = ref({ ...settings });

const closeModal = () => {
  emit('update:modelValue', false);
};

const saveSettings = () => {
  Object.assign(settings, localSettings.value);
  closeModal();
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #2c2c2c;
  color: #ffffff;
  border-radius: 8px;
  width: 400px;
  padding: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
}

.close-btn {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
}

.close-btn:hover {
  color: #fff;
}

.modal-body {
  padding: 20px 0;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  background-color: #4a4a4a;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn:hover {
  background-color: #5a5a5a;
}
</style>