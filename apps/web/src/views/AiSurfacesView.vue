<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h3>{{ $t('aiSurfaces.title') }}</h3>
      <button class="btn btn-primary" @click="showForm = true">{{ $t('aiSurfaces.register') }}</button>
    </div>

    <div v-if="showForm" class="card" style="margin-bottom: 1.5rem;">
      <h4 style="margin-bottom: 1rem;">{{ $t('aiSurfaces.registerTitle') }}</h4>
      <div class="form-group">
        <label>{{ $t('projects.name') }}</label>
        <input class="form-input" v-model="form.name" :placeholder="$t('aiSurfaces.namePlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ $t('devApps.platform') }}</label>
        <input class="form-input" v-model="form.platform" :placeholder="$t('aiSurfaces.platformPlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ $t('aiSurfaces.adapter') }}</label>
        <input class="form-input" v-model="form.adapterKey" :placeholder="$t('aiSurfaces.adapterPlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ $t('devApps.scope') }}</label>
        <input class="form-input" v-model="form.scope" placeholder="global" />
      </div>
      <div class="form-group">
        <label>{{ $t('projects.path') }}</label>
        <input class="form-input" v-model="form.rootPath" placeholder="Ruta opcional" />
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-primary" @click="register">{{ $t('projects.save') }}</button>
        <button class="btn btn-outline" @click="showForm = false">{{ $t('projects.cancel') }}</button>
      </div>
    </div>

    <div v-if="loading" class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('common.loading') }}</div>

    <div v-else class="card">
      <table v-if="surfaces.length">
        <thead>
          <tr>
            <th>{{ $t('projects.name') }}</th>
            <th>{{ $t('devApps.platform') }}</th>
            <th>{{ $t('aiSurfaces.adapter') }}</th>
            <th>{{ $t('devApps.scope') }}</th>
            <th>{{ $t('projects.status') }}</th>
            <th>{{ $t('projects.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in surfaces" :key="s.id">
            <td>{{ s.name }}</td>
            <td class="mono">{{ s.platform }}</td>
            <td class="mono">{{ s.adapter_key }}</td>
            <td>{{ s.scope }}</td>
            <td><span class="badge" :class="statusBadge(s.status)">{{ s.status }}</span></td>
            <td><button class="btn btn-outline btn-sm" @click="remove(s.id)">{{ $t('projects.delete') }}</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('dashboard.noAiSurfaces') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { apiGet, apiPost, apiDelete } from "../api/client.js";

const surfaces = ref<any[]>([]);
const loading = ref(false);
const showForm = ref(false);
const form = ref({ name: "", platform: "", adapterKey: "", scope: "global", rootPath: "" });

async function load() {
  loading.value = true;
  try {
    const res = await apiGet("/ai-surfaces");
    surfaces.value = res.surfaces || [];
  } finally { loading.value = false; }
}

async function register() {
  if (!form.value.name || !form.value.platform || !form.value.adapterKey) return;
  await apiPost("/ai-surfaces", form.value);
  form.value = { name: "", platform: "", adapterKey: "", scope: "global", rootPath: "" };
  showForm.value = false;
  await load();
}

async function remove(id: number) {
  await apiDelete(`/ai-surfaces/${id}`);
  await load();
}

function statusBadge(s: string): string {
  const m: Record<string, string> = { active: "badge-success", error: "badge-danger" };
  return m[s] || "badge-info";
}

onMounted(load);
</script>
