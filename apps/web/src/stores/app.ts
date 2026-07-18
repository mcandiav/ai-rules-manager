import { defineStore } from "pinia";
import { ref } from "vue";
import { apiGet } from "../api/client.js";

export const useAppStore = defineStore("app", () => {
  const locale = ref(localStorage.getItem("locale") || "es");
  /** Deployed release from API /health (VERSION@GIT_HASH). */
  const appVersion = ref("…");
  const sidebarOpen = ref(true);

  async function loadDeployedVersion() {
    try {
      const health = await apiGet("/health");
      if (typeof health?.version === "string" && health.version.trim()) {
        appVersion.value = health.version.trim();
      }
    } catch {
      // Keep placeholder until API is reachable.
    }
  }

  function setLocale(lang: string) {
    locale.value = lang;
    localStorage.setItem("locale", lang);
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value;
  }

  return {
    locale,
    appVersion,
    sidebarOpen,
    loadDeployedVersion,
    setLocale,
    toggleSidebar,
  };
});
