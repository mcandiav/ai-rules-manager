<template>
  <div>
    <div class="card-grid">
      <div
        v-for="card in statCards"
        :key="card.to + card.label"
        class="card stat-card stat-card--link"
        role="link"
        tabindex="0"
        @click="$router.push(card.to)"
        @keydown.enter="$router.push(card.to)"
      >
        <div class="stat-value">{{ card.value }}</div>
        <div class="stat-label">{{ card.label }}</div>
      </div>
    </div>

    <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1rem;">
      <span class="mono" style="font-size: var(--atonce-font-size-sm); color: var(--atonce-color-text-muted);">{{ $t('dashboard.filter') }}:</span>
      <button v-for="f in filters" :key="f.key" class="btn btn-outline btn-sm" :style="filterStyle(f.key)" @click="activeFilter = f.key">{{ f.label }}</button>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 class="section-link" style="font-size: var(--atonce-font-size-base);" @click="$router.push('/projects')">{{ $t('nav.projects') }}</h3>
        <button class="btn btn-outline btn-sm" @click="store.refresh()">{{ $t('dashboard.refresh') }}</button>
      </div>
      <div v-if="store.loading" class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('common.loading') }}</div>
      <table v-else-if="filteredProjects.length">
        <thead>
          <tr><th>{{ $t('projects.name') }}</th><th>{{ $t('projects.path') }}</th><th>{{ $t('projects.status') }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredProjects" :key="p.id" @click="$router.push(`/projects/${p.id}`)" style="cursor: pointer;">
            <td>{{ p.name }}</td>
            <td class="mono">{{ p.root_path }}</td>
            <td><span class="badge" :class="statusBadge(p.governance_status)">{{ p.governance_status }}</span></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('dashboard.noProjects') }}</div>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <h3 class="section-link" style="font-size: var(--atonce-font-size-base); margin-bottom: 1rem;" @click="$router.push('/dev-applications')">{{ $t('dashboard.devApplications') }}</h3>
      <table v-if="filteredDevApps.length">
        <thead>
          <tr><th>{{ $t('projects.name') }}</th><th>{{ $t('devApps.platform') }}</th><th>{{ $t('devApps.scope') }}</th><th>{{ $t('projects.status') }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="a in filteredDevApps" :key="a.id" @click="$router.push(`/dev-applications/${a.id}`)" style="cursor: pointer;">
            <td>{{ a.name }}</td>
            <td class="mono">{{ a.platform }}</td>
            <td>{{ a.scope }}</td>
            <td><span class="badge" :class="statusBadge(a.status)">{{ a.status }}</span></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('dashboard.noDevApps') }}</div>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <h3 class="section-link" style="font-size: var(--atonce-font-size-base); margin-bottom: 1rem;" @click="$router.push('/ai-surfaces')">{{ $t('dashboard.aiSurfaces') }}</h3>
      <table v-if="filteredAiSurfaces.length">
        <thead>
          <tr><th>{{ $t('projects.name') }}</th><th>{{ $t('devApps.platform') }}</th><th>{{ $t('aiSurfaces.adapter') }}</th><th>{{ $t('projects.status') }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in filteredAiSurfaces" :key="s.id" @click="$router.push('/ai-surfaces')" style="cursor: pointer;">
            <td>{{ s.name }}</td>
            <td class="mono">{{ s.platform }}</td>
            <td class="mono">{{ s.adapter_key }}</td>
            <td><span class="badge" :class="statusBadge(s.status)">{{ s.status }}</span></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('dashboard.noAiSurfaces') }}</div>
    </div>

    <div v-if="store.summary.lastSync" class="mono" style="color: var(--atonce-color-text-muted);">
      {{ $t('dashboard.lastSync') }}: {{ formatDate(store.summary.lastSync) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useDashboardStore } from "../stores/dashboard.js";

const store = useDashboardStore();
const $router = useRouter();
const { t } = useI18n();

const activeFilter = ref("all");
const filters = computed(() => [
  { key: "all", label: t("dashboard.filterAll") },
  { key: "active", label: t("dashboard.filterActive") },
  { key: "error", label: t("dashboard.filterError") },
  { key: "adopting", label: t("dashboard.filterPending") },
]);

const statCards = computed(() => [
  {
    label: t("dashboard.canonicalVersion"),
    value: store.summary.canonicalVersion?.version_number ?? "--",
    to: "/versions",
  },
  {
    label: t("dashboard.projects"),
    value: store.summary.counts.projects,
    to: "/projects",
  },
  {
    label: t("dashboard.devApplications"),
    value: store.summary.counts.devApplications,
    to: "/dev-applications",
  },
  {
    label: t("dashboard.aiSurfaces"),
    value: store.summary.counts.aiSurfaces,
    to: "/ai-surfaces",
  },
  {
    label: t("dashboard.artifacts"),
    value: store.summary.counts.artifacts,
    to: "/artifacts",
  },
  {
    label: t("dashboard.pending"),
    value: store.summary.pending,
    to: "/publish-history",
  },
  {
    label: t("dashboard.drift"),
    value: store.summary.drift,
    to: "/drift",
  },
  {
    label: t("dashboard.conflicts"),
    value: store.summary.conflicts.total,
    to: "/projects",
  },
]);

function filterStyle(key: string) {
  return key === activeFilter.value
    ? { background: "var(--atonce-gradient-primary)", color: "#fff", borderColor: "transparent" }
    : {};
}

const filteredProjects = computed(() => {
  if (activeFilter.value === "all") return store.summary.projects;
  return store.summary.projects.filter((p: any) => p.governance_status === activeFilter.value);
});

const filteredDevApps = computed(() => {
  if (activeFilter.value === "all") return store.summary.devApplications;
  return store.summary.devApplications.filter((a: any) => a.status === activeFilter.value);
});

const filteredAiSurfaces = computed(() => {
  if (activeFilter.value === "all") return store.summary.aiSurfaces;
  return store.summary.aiSurfaces.filter((s: any) => s.status === activeFilter.value);
});

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    active: "badge-success", adopting: "badge-info", paused: "badge-warning", error: "badge-danger",
  };
  return map[status] || "badge-info";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

onMounted(() => store.refresh());
</script>
