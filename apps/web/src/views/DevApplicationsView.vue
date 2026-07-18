<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h3>{{ $t('devApps.title') }}</h3>
      <button class="btn btn-primary" @click="showForm = true">{{ $t('devApps.register') }}</button>
    </div>

    <div v-if="showForm" class="card" style="margin-bottom: 1.5rem;">
      <h4 style="margin-bottom: 1rem;">{{ $t('devApps.registerTitle') }}</h4>
      <div class="form-group">
        <label>{{ $t('projects.name') }}</label>
        <input class="form-input" v-model="form.name" :placeholder="$t('devApps.namePlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ $t('devApps.platform') }}</label>
        <input class="form-input" v-model="form.platform" :placeholder="$t('devApps.platformPlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ $t('devApps.scope') }}</label>
        <input class="form-input" v-model="form.scope" :placeholder="$t('devApps.scopePlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ $t('projects.path') }}</label>
        <input class="form-input" v-model="form.rootPath" :placeholder="$t('devApps.pathPlaceholder')" />
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-primary" @click="register">{{ $t('projects.save') }}</button>
        <button class="btn btn-outline" @click="showForm = false">{{ $t('projects.cancel') }}</button>
      </div>
    </div>

    <div v-if="loading" class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('common.loading') }}</div>

    <div v-else class="card">
      <table v-if="apps.length">
        <thead>
          <tr>
            <th>{{ $t('projects.name') }}</th>
            <th>{{ $t('devApps.platform') }}</th>
            <th>{{ $t('devApps.scope') }}</th>
            <th>{{ $t('projects.path') }}</th>
            <th>{{ $t('projects.status') }}</th>
            <th>{{ $t('projects.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in apps" :key="a.id">
            <td>{{ a.name }}</td>
            <td class="mono">{{ a.platform }}</td>
            <td>{{ a.scope }}</td>
            <td class="mono">{{ a.root_path }}</td>
            <td><span class="badge" :class="statusBadge(a.status)">{{ a.status }}</span></td>
            <td><button class="btn btn-outline btn-sm" @click="remove(a.id)">{{ $t('projects.delete') }}</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('dashboard.noDevApps') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { apiGet, apiPost, apiDelete } from "../api/client.js";

const apps = ref<any[]>([]);
const loading = ref(false);
const showForm = ref(false);
const form = ref({ name: "", platform: "", scope: "", rootPath: "" });

async function load() {
  loading.value = true;
  try {
    const res = await apiGet("/dev-applications");
    apps.value = res.applications || [];
  } finally { loading.value = false; }
}

async function register() {
  if (!form.value.name || !form.value.platform) return;
  await apiPost("/dev-applications", form.value);
  form.value = { name: "", platform: "", scope: "", rootPath: "" };
  showForm.value = false;
  await load();
}

async function remove(id: number) {
  await apiDelete(`/dev-applications/${id}`);
  await load();
}

function statusBadge(s: string): string {
  const m: Record<string, string> = { active: "badge-success", error: "badge-danger" };
  return m[s] || "badge-info";
}

onMounted(load);
</script>
