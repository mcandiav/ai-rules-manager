<template>
  <div>
    <h3 style="margin-bottom: 1.5rem;">{{ $t('history.title') }}</h3>

    <div v-if="loading" class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('common.loading') }}</div>

    <div v-else class="card">
      <table v-if="operations.length">
        <thead>
          <tr>
            <th>{{ $t('history.date') }}</th>
            <th>{{ $t('history.result') }}</th>
            <th>{{ $t('history.trigger') }}</th>
            <th>{{ $t('history.items') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="op in operations" :key="op.id" style="cursor: pointer;" @click="toggleDetail(op.id)">
            <td class="mono">{{ formatDate(op.started_at) }}</td>
            <td>
              <span class="badge" :class="resultBadge(op.result)">{{ op.result }}</span>
            </td>
            <td>{{ op.triggered_by }}</td>
            <td class="mono">{{ op.scope_id?.length || 0 }}</td>
          </tr>
          <tr v-if="selectedOp">
            <td colspan="4" style="background: var(--atonce-color-bg);">
              <pre class="mono" style="font-size: var(--atonce-font-size-xs); color: var(--atonce-color-text-soft);">{{ JSON.stringify(selectedOp, null, 2) }}</pre>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('history.noHistory') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { apiGet } from "../api/client.js";

const operations = ref<any[]>([]);
const loading = ref(false);
const selectedOp = ref<any>(null);

async function load() {
  loading.value = true;
  try {
    const res = await apiGet("/publish/history");
    operations.value = res.operations || [];
  } finally { loading.value = false; }
}

function toggleDetail(op: any) {
  selectedOp.value = selectedOp.value?.id === op.id ? null : op;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function resultBadge(result: string): string {
  const m: Record<string, string> = { success: "badge-success", running: "badge-info", partial: "badge-warning", error: "badge-danger" };
  return m[result] || "badge-info";
}

onMounted(load);
</script>
