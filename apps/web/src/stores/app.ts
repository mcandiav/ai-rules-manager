import { defineStore } from "pinia";
import { computed, ref } from "vue";

function readRelease(): string {
  return (import.meta.env.VITE_APP_RELEASE as string | undefined)?.trim() || "0.0.0";
}

function readUiVersion(): string {
  return (import.meta.env.VITE_UI_VERSION as string | undefined)?.trim() || "dev";
}

export const useAppStore = defineStore("app", () => {
  const locale = ref(localStorage.getItem("locale") || "es");
  const appRelease = ref(readRelease());
  const uiVersion = ref(readUiVersion());
  const appVersion = computed(() => `${appRelease.value}@${uiVersion.value}`);
  const sidebarOpen = ref(true);

  function setLocale(lang: string) {
    locale.value = lang;
    localStorage.setItem("locale", lang);
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value;
  }

  return {
    locale,
    appRelease,
    uiVersion,
    appVersion,
    sidebarOpen,
    setLocale,
    toggleSidebar,
  };
});
