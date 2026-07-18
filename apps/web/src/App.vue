<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>{{ $t('app.title') }}</h1>
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
      <div class="sidebar-footer">
        <span>v{{ appStore.appVersion }}</span>
      </div>
    </aside>
    <main class="main-content">
      <header class="topbar">
        <h2 class="topbar-title">{{ routeName }}</h2>
        <LangSelector />
      </header>
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppStore } from "./stores/app.js";
import LangSelector from "./components/lang/LangSelector.vue";

const route = useRoute();
const { t } = useI18n();
const appStore = useAppStore();

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
