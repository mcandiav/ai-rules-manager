import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppStore = defineStore("app", () => {
  const locale = ref(localStorage.getItem("locale") || "es");
  const appVersion = ref("0.1.0");
  const sidebarOpen = ref(true);

  function setLocale(lang: string) {
    locale.value = lang;
    localStorage.setItem("locale", lang);
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value;
  }

  return { locale, appVersion, sidebarOpen, setLocale, toggleSidebar };
});
