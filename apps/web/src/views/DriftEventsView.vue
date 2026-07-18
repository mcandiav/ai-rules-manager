<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h3>{{ $t('drift.title') }}</h3>
      <button class="btn btn-primary btn-sm" :disabled="verifying" @click="verifyAll">
        {{ verifying ? $t('drift.verifying') : $t('drift.verifyAll') }}
      </button>
    </div>

    <div v-if="verifyResult" class="card" style="margin-bottom: 1rem;">
      <div style="display: flex; gap: 1rem;">
        <span class="badge badge-danger">Drifted: {{ verifyResult.drifted }}</span>
        <span class="badge badge-success">OK: {{ verifyResult.ok }}</span>
        <span v-if="verifyResult.errors" class="badge badge-warning">Errors: {{ verifyResult.errors }}</span>
      </div>
    </div>

    <div v-if="loading" class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('common.loading') }}</div>

    <div v-else class="card">
      <table v-if="events.length">
        <thead>
          <tr>
            <th>{{ $t('drift.platform') }}</th>
            <th>{{ $t('drift.target') }}</th>
            <th>{{ $t('drift.expected') }}</th>
            <th>{{ $t('drift.observed') }}</th>
            <th>{{ $t('drift.status') }}</th>
            <th>{{ $t('drift.date') }}</th>
            <th>{{ $t('projects.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in events" :key="e.id">
            <td class="mono">{{ e.platform || '--' }}</td>
            <td class="mono" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">{{ e.target_path || '--' }}</td>
            <td class="mono" style="max-width: 80px; overflow: hidden; text-overflow: ellipsis;">{{ e.expected_hash }}</td>
            <td class="mono" style="max-width: 80px; overflow: hidden; text-overflow: ellipsis;">{{ e.observed_hash }}</td>
            <td><span class="badge" :class="driftBadge(e.status)">{{ e.status }}</span></td>
            <td class="mono">{{ formatDate(e.detected_at) }}</td>
            <td>
              <div style="display: flex; gap: 0.25rem;">
                <button v-if="e.status === 'open'" class="btn btn-outline btn-sm" @click="acknowledge(e.id)">{{ $t('drift.acknowledge') }}</button>
                <button v-if="e.status === 'acknowledged'" class="btn btn-outline btn-sm" @click="resolve(e.id)">{{ $t('drift.resolve') }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('drift.noDrift') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { apiGet, apiPost } from "../api/client.js";

const events = ref<any[]>([]);
const loading = ref(false);
const verifying = ref(false);
const verifyResult = ref<any>(null);

async function load() {
  loading.value = true;
  try {
    const res = await apiGet("/drift/events");
    events.value = res.events || [];
  } finally { loading.value = false; }
}

async function verifyAll() {
  verifying.value = true;
  try {
    verifyResult.value = await apiPost("/drift/verify", {});
    await load();
  } finally { verifying.value = false; }
}

async function acknowledge(id: number) {
  await apiPost(`/drift/acknowledge/${id}`, {});
  await load();
}

async function resolve(id: number) {
  await apiPost(`/drift/resolve/${id}`, {});
  await load();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function driftBadge(status: string): string {
  const m: Record<string, string> = { open: "badge-danger", acknowledged: "badge-warning", resolved: "badge-success" };
  return m[status] || "badge-info";
}

onMounted(load);
</script>
