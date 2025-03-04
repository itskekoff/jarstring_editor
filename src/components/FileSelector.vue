<template>
  <div class="file-upload" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop" @click="triggerFileInput">
    <input type="file" accept=".jar" @change="onFileChange" ref="fileInput" style="display: none;" />
    <p>Drop .jar file or click to select</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const emit = defineEmits(['selected']);
const fileInput = ref(null);

const onDragOver = (e) => e.currentTarget.classList.add('dragging');
const onDragLeave = (e) => e.currentTarget.classList.remove('dragging');
const onDrop = (event) => {
  event.currentTarget.classList.remove('dragging');
  const file = event.dataTransfer.files[0];
  if (file && file.name.endsWith('.jar')) emit('selected', file);
  else alert('Скажи мне, ты долбаеб?');
};

const onFileChange = (event) => {
  const file = event.target.files[0];
  if (file) emit('selected', file);
};
const triggerFileInput = () => fileInput.value.click();
</script>

<style scoped>
.file-upload {
  border: 2px dashed #444;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.file-upload:hover, .file-upload.dragging {
  border-color: #4CAF50;
}
</style>