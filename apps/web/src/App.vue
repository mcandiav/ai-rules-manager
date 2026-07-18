<template>
  <div class="app-layout">
    <div class="app-backdrop app-backdrop-cyan"></div>
    <div class="app-backdrop app-backdrop-blue"></div>
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="brand-block">
          <img src="/img/logos/atonce-logo-faq-inn.png" alt="At-Once Logo" class="brand-logo" />
          <span class="brand-kicker">AT-ONCE RULE OPS</span>
          <h1>{{ $t('app.title') }}</h1>
          <p class="brand-summary">Gobierno local de reglas, versiones y sincronizacion visible.</p>
        </div>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" active-class="active" exact>
          {{ $t('nav.dashboard') }}
        </router-link>
        <router-link to="/projects" class="nav-item" active-class="active">
          {{ $t('nav.projects') }}
        </router-link>
        <router-link to="/dev-applications" class="nav-item" active-class="active">
          {{ $t('nav.devApplications') }}
        </router-link>
        <router-link to="/ai-surfaces" class="nav-item" active-class="active">
          {{ $t('nav.aiSurfaces') }}
        </router-link>
        <router-link to="/versions" class="nav-item" active-class="active">
          {{ $t('nav.versions') }}
        </router-link>
        <router-link to="/artifacts" class="nav-item" active-class="active">
          {{ $t('nav.artifacts') }}
        </router-link>
        <router-link to="/publish-history" class="nav-item" active-class="active">
          {{ $t('nav.publishHistory') }}
        </router-link>
        <router-link to="/drift" class="nav-item" active-class="active">
          {{ $t('nav.drift') }}
        </router-link>
        <router-link to="/settings" class="nav-item" active-class="active">
          {{ $t('nav.settings') }}
        </router-link>
      </nav>
      <div class="sidebar-footer" style="display: flex; justify-content: center;">
        <atonce-version-badge :version="appStore.appVersion"></atonce-version-badge>
      </div>
    </aside>
    <main class="main-content">
      <header class="topbar">
        <div class="topbar-copy">
          <span class="topbar-eyebrow">AT-ONCE INTERFACE</span>
          <h2 class="topbar-title">{{ routeName }}</h2>
          <p class="topbar-release mono">{{ appStore.appVersion }}</p>
        </div>
        <div class="topbar-actions">
          <atonce-version-badge :version="appStore.appVersion"></atonce-version-badge>
          <atonce-lang-picker assets-path="/"></atonce-lang-picker>
        </div>
      </header>
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppStore } from "./stores/app.js";

const route = useRoute();
const { t, locale } = useI18n();
const appStore = useAppStore();

const handleLangChanged = (event: Event) => {
  const customEvent = event as CustomEvent<{ lang: string }>;
  const newLang = customEvent.detail.lang;
  if (newLang && newLang !== locale.value) {
    locale.value = newLang;
    appStore.setLocale(newLang);
  }
};

onMounted(() => {
  void appStore.loadDeployedVersion();
  window.addEventListener("atonce-lang-changed", handleLangChanged);
  
  // Sincronizar idioma inicial
  const initialLang = localStorage.getItem("lang") || locale.value;
  if (initialLang !== locale.value) {
    locale.value = initialLang;
    appStore.setLocale(initialLang);
  }
});

onUnmounted(() => {
  window.removeEventListener("atonce-lang-changed", handleLangChanged);
});

const routeName = computed(() => {
  const map: Record<string, string> = {
    dashboard: t("nav.dashboard"),
    projects: t("nav.projects"),
    "dev-applications": t("nav.devApplications"),
    "ai-surfaces": t("nav.aiSurfaces"),
    versions: t("nav.versions"),
    settings: t("nav.settings"),
    "project-detail": t("nav.projects"),
    "artifact-settings": t("nav.artifacts"),
    "publish-history": t("nav.publishHistory"),
    drift: t("nav.drift"),
  };
  return map[route.name as string] || "";
});
</script>
