<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h3>{{ $t('devApps.title') }}</h3>
      <button class="btn btn-outline" @click="showManual = !showManual">{{ $t('devApps.register') }}</button>
    </div>

    <div v-if="loading" class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('common.loading') }}</div>

    <div v-else class="card" style="margin-bottom: 1.5rem;">
      <h4 style="margin-bottom: 0.75rem;">{{ $t('devApps.governedList') }}</h4>
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
            <td><button class="btn btn-outline btn-sm" @click="remove(a.id)">{{ $t('devApps.ungovern') }}</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('dashboard.noDevApps') }}</div>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <h4 style="margin-bottom: 0.75rem;">{{ $t('devApps.availableGlobals') }}</h4>
      <p class="mono" style="margin-bottom: 1rem; color: var(--atonce-color-text-muted);">
        {{ $t('devApps.governHint') }}
      </p>
      <table v-if="catalog.length">
        <thead>
          <tr>
            <th>{{ $t('projects.name') }}</th>
            <th>{{ $t('devApps.platform') }}</th>
            <th>{{ $t('projects.path') }}</th>
            <th>{{ $t('projects.status') }}</th>
            <th>{{ $t('projects.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in catalog" :key="item.key">
            <td>
              {{ item.name }}
              <div v-if="item.notes" class="mono" style="font-size: var(--atonce-font-size-xs); color: var(--atonce-color-text-muted);">
                {{ item.notes }}
              </div>
            </td>
            <td class="mono">{{ item.platform }}</td>
            <td>
              <input
                v-if="item.governable && !item.alreadyGoverned"
                class="form-input"
                v-model="draftPaths[item.key]"
              />
              <span v-else class="mono">{{ item.rootPath }}</span>
            </td>
            <td>
              <span v-if="item.alreadyGoverned" class="badge badge-success">{{ $t('devApps.statusGoverned') }}</span>
              <span v-else-if="!item.governable" class="badge badge-warning">{{ $t('devApps.unavailable') }}</span>
              <span v-else class="badge badge-info">{{ $t('devApps.statusAvailable') }}</span>
            </td>
            <td>
              <button
                v-if="item.governable && !item.alreadyGoverned"
                class="btn btn-primary btn-sm"
                :disabled="governingKey === item.key || !(draftPaths[item.key] || '').trim()"
                @click="governItem(item)"
              >
                {{ governingKey === item.key ? $t('devApps.governing') : $t('devApps.governAction') }}
              </button>
              <button
                v-else-if="item.alreadyGoverned && governedIdByPlatform(item.platform)"
                class="btn btn-outline btn-sm"
                :disabled="ungoverningId === governedIdByPlatform(item.platform)"
                @click="ungovernByPlatform(item.platform)"
              >
                {{ ungoverningId === governedIdByPlatform(item.platform) ? $t('devApps.ungoverning') : $t('devApps.ungovern') }}
              </button>
              <span v-else class="mono" style="color: var(--atonce-color-text-muted);">—</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="governMsg" class="mono" style="margin-top: 0.75rem; color: var(--atonce-color-accent);">{{ governMsg }}</div>
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
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { apiGet, apiPost, apiDelete } from "../api/client.js";

const apps = ref<any[]>([]);
const catalog = ref<any[]>([]);
const draftPaths = reactive<Record<string, string>>({});
const loading = ref(false);
const governingKey = ref("");
const ungoverningId = ref<number | null>(null);
const governMsg = ref("");
const showManual = ref(false);
const form = ref({ name: "", platform: "", scope: "global_user", rootPath: "" });

function governedIdByPlatform(platform: string): number | null {
  const row = apps.value.find((a) => a.platform === platform && a.scope === "global_user");
  return row?.id ?? null;
}

async function load() {
  loading.value = true;
  try {
    const [appsRes, catalogRes] = await Promise.all([
      apiGet("/dev-applications"),
      apiGet("/dev-applications/catalog"),
    ]);
    apps.value = appsRes.applications || [];
    catalog.value = catalogRes.catalog || [];
    for (const item of catalog.value) {
      if (!(item.key in draftPaths)) {
        draftPaths[item.key] = item.rootPath || "";
      }
    }
  } finally {
    loading.value = false;
  }
}

async function governItem(item: any) {
  const rootPath = (draftPaths[item.key] || "").trim();
  if (!item.governable || item.alreadyGoverned || !rootPath) return;
  governingKey.value = item.key;
  governMsg.value = "";
  try {
    await apiPost("/dev-applications/govern-global", {
      key: item.key,
      rootPath,
    });
    governMsg.value = "ok";
    await load();
  } catch (e: any) {
    governMsg.value = e.message || "error";
  } finally {
    governingKey.value = "";
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
  ungoverningId.value = id;
  governMsg.value = "";
  try {
    await apiDelete(`/dev-applications/${id}`);
    await load();
  } catch (e: any) {
    governMsg.value = e.message || "error";
  } finally {
    ungoverningId.value = null;
  }
}

async function ungovernByPlatform(platform: string) {
  const id = governedIdByPlatform(platform);
  if (!id) return;
  await remove(id);
}

function statusBadge(s: string): string {
  const m: Record<string, string> = { active: "badge-success", error: "badge-danger" };
  return m[s] || "badge-info";
}

onMounted(load);
</script>
