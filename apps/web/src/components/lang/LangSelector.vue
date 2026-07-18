<template>
  <div class="lang-picker" role="group" aria-label="Idioma">
    <button
      v-for="lang in languages"
      :key="lang.code"
      type="button"
      class="lang-flag"
      :class="{ active: currentLang === lang.code }"
      :data-lang="lang.code"
      :title="lang.label"
      :aria-label="lang.label"
      :aria-pressed="currentLang === lang.code"
      @click="switchLang(lang.code)"
    >
      <img class="lang-flag__img" :src="lang.flag" alt="" />
      <span class="lang-flag__code">{{ lang.code.toUpperCase() }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "../../stores/app.js";

const { locale } = useI18n();
const appStore = useAppStore();

const currentLang = computed(() => appStore.locale);

const languages = [
  { code: "es", label: "Español", flag: "/flags/es.svg" },
  { code: "pt", label: "Português", flag: "/flags/br.svg" },
  { code: "en", label: "English", flag: "/flags/us.svg" },
];

function switchLang(code: string) {
  locale.value = code;
  appStore.setLocale(code);
}
</script>
