<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; gap: 0.5rem; flex-wrap: wrap;">
      <h3>{{ $t('versions.title') }}</h3>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-outline btn-sm" :disabled="openingSource" @click="goEditStandardRules">
          {{ openingSource ? $t('versions.openingSource') : $t('versions.editStandardRules') }}
        </button>
        <button class="btn btn-primary btn-sm" :disabled="scanning" @click="scan">
          {{ scanning ? $t('versions.scanning') : $t('versions.scan') }}
        </button>
      </div>
    </div>

    <div v-if="sourceMsg" class="card" style="margin-bottom: 1rem;">
      <div style="margin-bottom: 0.35rem;">{{ sourceMsg }}</div>
      <div v-if="sourcePath" class="mono" style="color: var(--atonce-color-accent); word-break: break-all;">{{ sourcePath }}</div>
    </div>

    <div v-if="scanResult" class="card" style="margin-bottom: 1rem;">
      <span class="mono" style="color: var(--atonce-color-accent);">
        {{ scanResult.changed ? 'Changes detected' : 'No changes' }}
      </span>
    </div>

    <div v-if="loading" class="mono" style="color: var(--atonce-color-text-muted);">
      {{ $t('common.loading') }}
    </div>

    <div v-else class="card">
      <table v-if="versions.length">
        <thead>
          <tr>
            <th>{{ $t('versions.number') }}</th>
            <th>{{ $t('versions.hash') }}</th>
            <th>{{ $t('versions.status') }}</th>
            <th>{{ $t('versions.date') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in versions" :key="v.id">
            <td class="mono">v{{ v.version_number }}</td>
            <td class="mono" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">{{ v.global_hash }}</td>
            <td><span class="badge" :class="statusBadge(v.status)">{{ v.status }}</span></td>
            <td class="mono">{{ formatDate(v.created_at) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="mono" style="color: var(--atonce-color-text-muted);">
        {{ $t('versions.noVersions') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { apiGet, apiPost } from "../api/client.js";

const { t } = useI18n();
const versions = ref<any[]>([]);
const loading = ref(false);
const scanning = ref(false);
const openingSource = ref(false);
const scanResult = ref<any>(null);
const sourceMsg = ref("");
const sourcePath = ref("");

async function loadVersions() {
  loading.value = true;
  try {
    const res = await apiGet("/canonical/versions");
    versions.value = res.versions || [];
  } finally {
    loading.value = false;
  }
}

async function scan() {
  scanning.value = true;
  try {
    scanResult.value = await apiPost("/canonical/scan", {});
    await loadVersions();
  } finally {
    scanning.value = false;
  }
}

async function goEditStandardRules() {
  openingSource.value = true;
  sourceMsg.value = "";
  sourcePath.value = "";
  try {
    const source = await apiGet("/canonical/source");
    const path = (source.hostPath || source.openHint || source.containerPath || "").trim();
    sourcePath.value = path;
    if (!path) {
      sourceMsg.value = t("versions.sourceMissing");
      return;
    }

    try {
      await navigator.clipboard.writeText(path);
      sourceMsg.value = t("versions.sourceCopied");
    } catch {
      sourceMsg.value = t("versions.sourceReady");
    }

    // Best-effort open in Cursor/VS Code if the browser allows the custom protocol.
    const normalized = path.replace(/\\/g, "/");
    const cursorUri = `cursor://file/${normalized}`;
    window.open(cursorUri, "_blank", "noopener,noreferrer");
  } catch (e: any) {
    sourceMsg.value = e.message || t("versions.sourceMissing");
  } finally {
    openingSource.value = false;
  }
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    detected: "badge-info",
    ready: "badge-success",
    published_partial: "badge-warning",
    published_complete: "badge-success",
  };
  return map[status] || "badge-info";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

onMounted(loadVersions);
</script>
