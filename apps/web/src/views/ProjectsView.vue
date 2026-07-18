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
      <div v-if="formError" class="mono" style="margin-top: 0.75rem; color: var(--atonce-color-danger-text);">
        {{ formError }}
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
            <td><router-link :to="`/projects/${p.id}`" style="color: var(--atonce-color-accent); text-decoration: none;">{{ p.name }}</router-link></td>
            <td class="mono">{{ p.root_path }}</td>
            <td><span class="badge" :class="statusBadge(p.governance_status)">{{ p.governance_status }}</span></td>
            <td>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm" :disabled="syncingProjectId === p.id" @click="syncProject(p.id)">
                  {{ syncingProjectId === p.id ? $t('projects.syncing') : $t('projects.sync') }}
                </button>
                <button class="btn btn-outline btn-sm" @click="deleteProject(p.id)">{{ $t('projects.delete') }}</button>
              </div>
              <div
                v-if="syncFeedback[p.id]"
                class="mono"
                :style="{ marginTop: '0.5rem', color: syncFeedback[p.id].ok ? 'var(--atonce-color-success)' : 'var(--atonce-color-warning)' }"
              >
                {{ syncFeedback[p.id].message.startsWith('projects.') ? $t(syncFeedback[p.id].message) : syncFeedback[p.id].message }}
              </div>
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
const formError = ref("");
const syncingProjectId = ref<number | null>(null);
const syncFeedback = ref<Record<number, { ok: boolean; message: string }>>({});

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
  formError.value = "";
  try {
    await apiPost("/projects", form.value);
    form.value = { name: "", rootPath: "" };
    showForm.value = false;
    await loadProjects();
  } catch (e: any) {
    formError.value = e.message || "Error";
  }
}

async function deleteProject(id: number) {
  await apiDelete(`/projects/${id}`);
  await loadProjects();
}

async function syncProject(id: number) {
  syncingProjectId.value = id;
  try {
    const res = await apiPost("/publish/execute", {
      ownerType: "project",
      ownerId: id,
      triggeredBy: "manual",
    });

    if (res.error) {
      syncFeedback.value = {
        ...syncFeedback.value,
        [id]: { ok: false, message: res.error },
      };
      return;
    }

    const items = res.items || [];
    const allOk = items.length > 0 && items.every((item: any) => item.written && item.verified);
    syncFeedback.value = {
      ...syncFeedback.value,
      [id]: {
        ok: allOk,
        message: allOk ? "projects.syncSuccess" : "projects.syncPartial",
      },
    };
    await loadProjects();
  } catch (e: any) {
    syncFeedback.value = {
      ...syncFeedback.value,
      [id]: { ok: false, message: e.message || "projects.syncError" },
    };
  } finally {
    syncingProjectId.value = null;
  }
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
