<template>
  <div class="app-container">
    <div class="header">
      <h2 class="brand" @click="clearContext">Jar String Editor</h2>
    </div>

    <div v-if="!loadedJar">
      <FileSelector @selected="onFileSelected" />
      <Footer />
    </div>
    <div v-else-if="loadInfo" class="load-info-box">
      <div class="spinner"></div>
      <p>{{ loadInfo }}</p>
    </div>
    <div v-else>
      <div class="search-wrapper">
        <input @input="onSearchChange" placeholder="Search strings..." aria-label="String search" />
      </div>
      <br>
      <div class="info">
        <span>{{ stringsInfo }}</span>
        <div class="save">
          <button @click="onSaveFile" class="save-btn" :disabled="isSaving">
            <span v-if="isSaving">🌀 Saving...</span>
            <span v-else>💾 Save</span>
          </button>
        </div>
      </div>
      <transition name="fade">
        <StringList v-if="strings.length" :strings="filteredStrings" @string-changed="onStringChanged" @view-class="handleViewClass" />
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { debounce } from 'lodash';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { StringSearcher } from './util/stringSearcher.js';
import { StringWriter } from './util/stringWriter.js';
import { settings } from './util/settings';
import { extractClassName, extractMethodInfoConstants, getInstructionLineNumber, getStringContext } from './util/util';
import FileSelector from './components/FileSelector.vue';
import StringList from './components/StringList.vue';
import Footer from './components/Footer.vue';

const loadedJar = ref(null);
const selectedFileName = ref(null);
const strings = ref([]);
const filter = ref('');
const loadInfo = ref(null);
const isSaving = ref(false);

const debouncedOnSearchChange = debounce((value) => filter.value = value, 300);
const onSearchChange = (event) => debouncedOnSearchChange(event.target.value);

let selectedJar = undefined;
let jdecWindow = undefined;

const filteredStrings = computed(() => {
  const includeChanged = true;

  return strings.value.filter(s => {
    if (includeChanged && s.changed) return true;

    const passesEmptyCheck = !settings.hideEmptyStrings || s.value.trim().length > 0;

    if (!filter.value) {
      return passesEmptyCheck;
    }

    const words = filter.value.split(' ').map(w => w.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`^(?=.*${words.join(')(?=.*')}).*$`, 'i');
    return passesEmptyCheck && regex.test(s.value);
  }).map(s => {
    if (!filter.value) return s;
    const words = filter.value.split(' ');
    return { ...s, highlightWords: words };
  });
});

const stringsInfo = computed(() => `Found ${strings.value.length} strings, showed ${filteredStrings.value.length}`);

const onFileSelected = async (file) => {
  selectedFileName.value = file.name;
  selectedJar = file;
  loadInfo.value = 'Loading .jar file...';
  try {
    const jar = await JSZip.loadAsync(file);
    loadedJar.value = jar;
    const stringSearcher = new StringSearcher();
    stringSearcher.on('read_count', (numDone) => loadInfo.value = `Collecting strings... Processed ${numDone} classes`);
    const result = await stringSearcher.searchInJar(jar);
    strings.value = processResult(result);
    loadInfo.value = null;
  } catch (error) {
    console.error(error);
    clearContext();
  }
};

const processResult = (result) => {
  const stringsFound = [];
  let stringId = 0;
  for (const { classFile, fileName, methods } of result) {
    const className = extractClassName(classFile.this_class, classFile.constant_pool);
    for (const { method, strings: methodStrings, instructions } of methods) {
      const methodLocation = extractMethodInfoConstants(method, classFile.constant_pool);
      for (const string of methodStrings) {
        try {
          const location = {
            className,
            method: methodLocation,
            lineNumber: getInstructionLineNumber(classFile, method, string.instruction)
          };
          stringsFound.push({
            ...string,
            fileName,
            location,
            id: stringId++,
            context: settings.sortByContext ? getStringContext(classFile.constant_pool, instructions, string.instructionIndex) : undefined,
          });
        } catch (e) {
          console.log("Error in class " + className)
          console.log(e);
        }
      }
    }
  }
  if (settings.sortByContext) stringsFound.sort((a, b) => { const priority = { SendMessage: 2, ItemDisplayName: 1, undefined: 0 }; return priority[b.context] - priority[a.context]; });
  return stringsFound;
};

const onStringChanged = (newValue, stringId) => {
  const string = strings.value.find(s => s.id === stringId);
  if (string && newValue !== string.value) {
    string.value = newValue;
    string.changed = true;
  }
};

const onSaveFile = async () => {
  isSaving.value = true;
  try {
    const blob = await StringWriter.write(loadedJar.value, strings.value);
    saveAs(blob, selectedFileName.value || 'translated.jar');
  } catch (error) {
    console.error(error);
    alert('Error in saving .jar: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

const handleViewClass = (string) => {
  const JDEC_URL = 'https://jdec.app';
  const payload = {
    action: 'open',
    jarFile: selectedJar,
    path: string.fileName,
    highlight: string.value
  };

  if (jdecWindow === undefined || jdecWindow.closed) {
    const handleAppReady = e => {
      const originHost = new URL(e.origin).host;
      const jdecHost = new URL(JDEC_URL).host;
      if (originHost !== jdecHost || e.data !== "app-ready") return;
      window.removeEventListener("message", handleAppReady);
      jdecWindow.postMessage(payload, JDEC_URL);
    };
    window.addEventListener("message", handleAppReady);
    jdecWindow = window.open(`${JDEC_URL}?jse`, "jdec");
  } else {
    jdecWindow.focus();
    jdecWindow.postMessage(payload, JDEC_URL);
  }
};

const clearContext = () => { loadedJar.value = null; selectedFileName.value = null; strings.value = []; filter.value = ''; loadInfo.value = null; };
</script>

<style scoped>
.app-container {
  max-width: 900px;
  margin: 30px auto;
  display: grid;
  grid-gap: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand { margin: 0; cursor: pointer; font-weight: 500; }

.search-wrapper input { padding-left: 5px; }
.search-wrapper::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 200px;
  height: 8px;
  background-size: contain;
}

.info { display: flex; align-items: center; gap: 10px; }
.save {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  width: fit-content;
}

.save-btn {
  padding: 0 1px;
  height: 25px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
  line-height: 5px;
  display: flex;
  align-items: center;
}

.save-btn:hover { background-color: #6a6a6a; }
.save-btn:active { transform: scale(0.98); }

.load-info-box { text-align: center; }
.spinner {
  width: 30px;
  height: 30px;
  border: 4px solid rgba(255, 255, 255, 0.25);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>