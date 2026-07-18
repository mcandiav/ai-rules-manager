<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h3>{{ $t('devApps.title') }}</h3>
      <button class="btn btn-outline" @click="showManual = !showManual">{{ $t('devApps.register') }}</button>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <h4 style="margin-bottom: 0.75rem;">{{ $t('devApps.governTitle') }}</h4>
      <p class="mono" style="margin-bottom: 1rem; color: var(--atonce-color-text-muted);">
        {{ $t('devApps.governHint') }}
      </p>
      <div class="form-group">
        <label>{{ $t('devApps.selectGlobal') }}</label>
        <select class="form-input" v-model="selectedKey">
          <option value="">{{ $t('devApps.selectPlaceholder') }}</option>
          <option
            v-for="item in availableCatalog"
            :key="item.key"
            :value="item.key"
            :disabled="!item.governable || item.alreadyGoverned"
          >
            {{ item.name }}{{ item.alreadyGoverned ? ' ✓' : '' }}{{ !item.governable ? ` (${$t('devApps.unavailable')})` : '' }}
          </option>
        </select>
      </div>
      <div v-if="selectedItem" class="form-group">
        <label>{{ $t('projects.path') }}</label>
        <input class="form-input" v-model="selectedRootPath" />
        <div v-if="selectedItem.notes" class="mono" style="margin-top: 0.35rem; color: var(--atonce-color-text-muted);">
          {{ selectedItem.notes }}
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <button class="btn btn-primary" :disabled="!canGovern || governing" @click="governSelected">
          {{ governing ? $t('devApps.governing') : $t('devApps.governAction') }}
        </button>
        <span v-if="governMsg" class="mono" style="color: var(--atonce-color-accent);">{{ governMsg }}</span>
      </div>
    </div>

    <div v-if="showManual" class="card" style="margin-bottom: 1.5rem;">
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
        <button class="btn btn-outline" @click="showManual = false">{{ $t('projects.cancel') }}</button>
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
            <td>
              <router-link
                :to="`/dev-applications/${a.id}`"
                style="color: var(--atonce-color-accent); text-decoration: none;"
              >{{ a.name }}</router-link>
            </td>
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
import { computed, ref, watch, onMounted } from "vue";
import { apiGet, apiPost, apiDelete } from "../api/client.js";

const apps = ref<any[]>([]);
const catalog = ref<any[]>([]);
const loading = ref(false);
const governing = ref(false);
const governMsg = ref("");
const showManual = ref(false);
const selectedKey = ref("");
const selectedRootPath = ref("");
const form = ref({ name: "", platform: "", scope: "global_user", rootPath: "" });

const selectedItem = computed(() => catalog.value.find((c) => c.key === selectedKey.value) || null);
const availableCatalog = computed(() => catalog.value);
const canGovern = computed(() => {
  const item = selectedItem.value;
  return Boolean(item && item.governable && !item.alreadyGoverned && selectedRootPath.value.trim());
});

watch(selectedItem, (item) => {
  selectedRootPath.value = item?.rootPath || "";
  governMsg.value = "";
});

async function load() {
  loading.value = true;
  try {
    const [appsRes, catalogRes] = await Promise.all([
      apiGet("/dev-applications"),
      apiGet("/dev-applications/catalog"),
    ]);
    apps.value = appsRes.applications || [];
    catalog.value = catalogRes.catalog || [];
  } finally {
    loading.value = false;
  }
}

async function governSelected() {
  if (!canGovern.value || !selectedKey.value) return;
  governing.value = true;
  governMsg.value = "";
  try {
    await apiPost("/dev-applications/govern-global", {
      key: selectedKey.value,
      rootPath: selectedRootPath.value.trim(),
    });
    governMsg.value = "ok";
    selectedKey.value = "";
    selectedRootPath.value = "";
    await load();
  } catch (e: any) {
    governMsg.value = e.message || "error";
  } finally {
    governing.value = false;
  }
}

async function register() {
  if (!form.value.name || !form.value.platform) return;
  await apiPost("/dev-applications", form.value);
  form.value = { name: "", platform: "", scope: "global_user", rootPath: "" };
  showManual.value = false;
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
