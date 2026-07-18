<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h3>{{ $t('projects.title') }}</h3>
      <button class="btn btn-primary" @click="showForm = true">{{ $t('projects.register') }}</button>
    </div>

    <div v-if="showForm" class="card" style="margin-bottom: 1.5rem;">
      <h4 style="margin-bottom: 1rem;">{{ $t('projects.registerTitle') }}</h4>
      <div class="form-group">
        <label>{{ $t('projects.name') }}</label>
        <input class="form-input" v-model="form.name" :placeholder="$t('projects.namePlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ $t('projects.path') }}</label>
        <input class="form-input" v-model="form.rootPath" :placeholder="$t('projects.pathPlaceholder')" />
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-primary" @click="registerProject">{{ $t('projects.save') }}</button>
        <button class="btn btn-outline" @click="showForm = false">{{ $t('projects.cancel') }}</button>
      </div>
    </div>

    <div v-if="loading" class="mono" style="color: var(--atonce-color-text-muted);">
      {{ $t('common.loading') }}
    </div>

    <div v-else class="card">
      <table v-if="projects.length">
        <thead>
          <tr>
            <th>{{ $t('projects.name') }}</th>
            <th>{{ $t('projects.path') }}</th>
            <th>{{ $t('projects.status') }}</th>
            <th>{{ $t('projects.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in projects" :key="p.id">
            <td>{{ p.name }}</td>
            <td class="mono">{{ p.root_path }}</td>
            <td><span class="badge" :class="statusBadge(p.governance_status)">{{ p.governance_status }}</span></td>
            <td>
              <button class="btn btn-outline btn-sm" @click="deleteProject(p.id)">{{ $t('projects.delete') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="mono" style="color: var(--atonce-color-text-muted);">
        {{ $t('dashboard.noProjects') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { apiGet, apiPost, apiDelete } from "../api/client.js";

const projects = ref<any[]>([]);
const loading = ref(false);
const showForm = ref(false);
const form = ref({ name: "", rootPath: "" });

async function loadProjects() {
  loading.value = true;
  try {
    const res = await apiGet("/projects");
    projects.value = res.projects || [];
  } finally {
    loading.value = false;
  }
}

async function registerProject() {
  if (!form.value.name || !form.value.rootPath) return;
  await apiPost("/projects", form.value);
  form.value = { name: "", rootPath: "" };
  showForm.value = false;
  await loadProjects();
}

async function deleteProject(id: number) {
  await apiDelete(`/projects/${id}`);
  await loadProjects();
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    active: "badge-success",
    adopting: "badge-info",
    paused: "badge-warning",
    error: "badge-danger",
  };
  return map[status] || "badge-info";
}

onMounted(loadProjects);
</script>
