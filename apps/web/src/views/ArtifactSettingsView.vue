<template>
  <div>
    <h3 style="margin-bottom: 1.5rem;">{{ $t('artifacts.title') }}</h3>

    <div v-if="loading" class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('common.loading') }}</div>

    <div v-else>
      <div class="card" v-if="artifacts.length">
        <table>
          <thead>
            <tr>
              <th>{{ $t('artifacts.owner') }}</th>
              <th>{{ $t('artifacts.platform') }}</th>
              <th>{{ $t('artifacts.type') }}</th>
              <th>{{ $t('artifacts.path') }}</th>
              <th>{{ $t('artifacts.pathSource') }}</th>
              <th>{{ $t('projects.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in artifacts" :key="a.id">
              <td class="mono">{{ a.owner_type }}:{{ a.owner_id }}</td>
              <td class="mono">{{ a.platform }}</td>
              <td>{{ a.artifact_type }}</td>
              <td class="mono" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
                {{ a.configured_path || a.target_path || '--' }}
              </td>
              <td>
                <span class="badge" :class="a.path_source === 'manual' ? 'badge-warning' : 'badge-info'">
                  {{ a.path_source === 'manual' ? $t('artifacts.manual') : $t('artifacts.adapter') }}
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 0.25rem; align-items: center;">
                  <input class="form-input" v-model="editPaths[a.id]" :placeholder="$t('artifacts.editPath')" style="width: 180px; font-size: var(--atonce-font-size-xs);" />
                  <button class="btn btn-outline btn-sm" @click="updatePath(a.id)">{{ $t('artifacts.editPath') }}</button>
                  <button class="btn btn-outline btn-sm" @click="validate(a.id)">{{ $t('artifacts.validate') }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="card">
        <div class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('artifacts.noArtifacts') }}</div>
      </div>

      <div v-if="validationResult" class="card" style="margin-top: 1rem;">
        <pre class="mono" style="color: var(--atonce-color-accent);">{{ JSON.stringify(validationResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { apiGet, apiPost } from "../api/client.js";

const artifacts = ref<any[]>([]);
const loading = ref(false);
const editPaths = ref<Record<number, string>>({});
const validationResult = ref<any>(null);

async function load() {
  loading.value = true;
  try {
    const res = await apiGet("/artifacts");
    artifacts.value = res.artifacts || [];
    for (const a of artifacts.value) {
      editPaths.value[a.id] = a.configured_path || a.target_path || "";
    }
  } finally { loading.value = false; }
}

async function updatePath(id: number) {
  await apiPost(`/artifacts/${id}/path`, { configuredPath: editPaths.value[id] });
  await load();
}

async function validate(id: number) {
  validationResult.value = await apiPost(`/artifacts/${id}/validate`, {});
}

onMounted(load);
</script>
