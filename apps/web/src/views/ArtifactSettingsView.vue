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
                  <button class="btn btn-outline btn-sm" :disabled="validatingId === a.id" @click="validate(a.id)">
                    {{ validatingId === a.id ? $t('artifacts.validating') : $t('artifacts.validate') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="card">
        <div class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('artifacts.noArtifacts') }}</div>
      </div>

      <div v-if="validationMessage" class="card" style="margin-top: 1rem;">
        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
          <span class="badge" :class="validationBadgeClass">{{ validationStatusLabel }}</span>
          <span style="font-weight: var(--atonce-font-weight-semibold);">{{ validationMessage }}</span>
        </div>
        <div v-if="validationDetail" class="mono" style="color: var(--atonce-color-text-muted); font-size: var(--atonce-font-size-sm);">
          {{ validationDetail }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { apiGet, apiPost } from "../api/client.js";

const { t } = useI18n();
const artifacts = ref<any[]>([]);
const loading = ref(false);
const editPaths = ref<Record<number, string>>({});
const validatingId = ref<number | null>(null);
const validationResult = ref<any>(null);

const validationMessage = computed(() => {
  const r = validationResult.value;
  if (!r) return "";
  if (r.error) return t("artifacts.validateError");
  if (!r.exists) return t("artifacts.validateMissing");
  if (r.drifted) return t("artifacts.validateDrifted");
  return t("artifacts.validateOk");
});

const validationStatusLabel = computed(() => {
  const r = validationResult.value;
  if (!r) return "";
  if (r.error || !r.exists) return t("artifacts.statusError");
  if (r.drifted) return t("artifacts.statusDrift");
  return t("artifacts.statusOk");
});

const validationBadgeClass = computed(() => {
  const r = validationResult.value;
  if (!r) return "badge-info";
  if (r.error || !r.exists) return "badge-danger";
  if (r.drifted) return "badge-warning";
  return "badge-success";
});

const validationDetail = computed(() => {
  const r = validationResult.value;
  if (!r || r.error) return "";
  const path = r.effectivePath || "--";
  const hash = r.observedHash ? String(r.observedHash).slice(0, 12) : "--";
  return t("artifacts.validateDetail", { path, hash });
});

async function load() {
  loading.value = true;
  try {
    const res = await apiGet("/artifacts");
    artifacts.value = res.artifacts || [];
    for (const a of artifacts.value) {
      editPaths.value[a.id] = a.configured_path || a.target_path || "";
    }
  } finally {
    loading.value = false;
  }
}

async function updatePath(id: number) {
  await apiPost(`/artifacts/${id}/path`, { configuredPath: editPaths.value[id] });
  await load();
}

async function validate(id: number) {
  validatingId.value = id;
  validationResult.value = null;
  try {
    validationResult.value = await apiPost(`/artifacts/${id}/validate`, {});
  } catch (e: any) {
    validationResult.value = { error: e.message || "error", exists: false, drifted: false };
  } finally {
    validatingId.value = null;
  }
}

onMounted(load);
</script>
