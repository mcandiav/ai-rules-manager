<template>
  <div v-if="loading" class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('common.loading') }}</div>

  <div v-else-if="error" class="card">
    <span style="color: var(--atonce-color-danger-text);">{{ error }}</span>
  </div>

  <div v-else>
    <div class="card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3>{{ surface?.name || '--' }}</h3>
          <table>
            <tbody>
              <tr><td style="width: 160px; color: var(--atonce-color-text-muted);">{{ $t('projects.path') }}</td><td class="mono">{{ surface?.root_path || '--' }}</td></tr>
              <tr><td style="color: var(--atonce-color-text-muted);">{{ $t('projects.status') }}</td><td><span class="badge" :class="statusBadge(surface?.governance_status || surface?.status)">{{ surface?.governance_status || surface?.status }}</span></td></tr>
            </tbody>
          </table>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-direction: column; align-items: flex-end;">
          <button class="btn btn-primary" @click="showPlan" :disabled="publishing">
            {{ $t('detail.publishPlan') }}
          </button>
          <span v-if="publishResult" class="mono" :style="{ color: publishAllOk ? 'var(--atonce-color-success)' : 'var(--atonce-color-warning)' }">
            {{ publishAllOk ? $t('detail.publishSuccess') : $t('detail.publishPartial') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Publish Plan -->
    <div v-if="plan.length" class="card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <h4>{{ $t('detail.planTitle') }} ({{ plan.length }} {{ $t('detail.planItems') }})</h4>
        <button class="btn btn-primary btn-sm" :disabled="publishing" @click="execute">
          {{ publishing ? $t('detail.publishing') : $t('detail.planConfirm') }}
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>{{ $t('artifacts.platform') }}</th>
            <th>{{ $t('detail.publishTarget') }}</th>
            <th>{{ $t('artifacts.type') }}</th>
            <th>Hash</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in plan" :key="i">
            <td class="mono">{{ item.platform }}</td>
            <td class="mono" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">{{ item.targetPath }}</td>
            <td>{{ item.artifactType }}</td>
            <td class="mono" style="max-width: 80px; overflow: hidden; text-overflow: ellipsis;">{{ item.estimatedHash }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Publish Result -->
    <div v-if="publishResult && publishResult.items" class="card" style="margin-bottom: 1.5rem;">
      <h4 style="margin-bottom: 0.75rem;">{{ $t('detail.publishResult') }}</h4>
      <table>
        <thead>
          <tr>
            <th>{{ $t('artifacts.platform') }}</th>
            <th>{{ $t('detail.publishTarget') }}</th>
            <th>{{ $t('detail.publishWritten') }}</th>
            <th>{{ $t('detail.publishVerified') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in publishResult.items" :key="i">
            <td class="mono">{{ item.platform }}</td>
            <td class="mono" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">{{ item.targetPath }}</td>
            <td>
              <span class="badge" :class="item.written ? 'badge-success' : 'badge-danger'">{{ item.written ? 'Yes' : 'No' }}</span>
            </td>
            <td>
              <span class="badge" :class="item.verified ? 'badge-success' : 'badge-danger'">{{ item.verified ? 'Yes' : 'No' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Artifacts -->
    <div class="card" style="margin-bottom: 1.5rem;">
      <h4 style="margin-bottom: 0.75rem;">{{ $t('detail.artifacts') }}</h4>
      <table v-if="artifacts.length">
        <thead>
          <tr>
            <th>{{ $t('artifacts.platform') }}</th>
            <th>{{ $t('artifacts.type') }}</th>
            <th>{{ $t('artifacts.path') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in artifacts" :key="a.id">
            <td class="mono">{{ a.platform }}</td>
            <td>{{ a.artifact_type }}</td>
            <td class="mono">{{ a.configured_path || a.target_path || '--' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('detail.noArtifacts') }}</div>
    </div>

    <!-- Rules -->
    <div class="card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <h4>{{ $t('detail.rules') }}</h4>
        <button class="btn btn-outline btn-sm" @click="showRuleForm = true">{{ $t('detail.addRule') }}</button>
      </div>

      <div v-if="showRuleForm" class="card" style="margin-bottom: 1rem; background: var(--atonce-color-bg);">
        <div class="form-group">
          <label>{{ $t('detail.ruleKey') }}</label>
          <input class="form-input" v-model="ruleForm.ruleKey" placeholder="my-custom-rule" />
        </div>
        <div class="form-group">
          <label>{{ $t('detail.ruleTitle') }}</label>
          <input class="form-input" v-model="ruleForm.title" :placeholder="$t('detail.ruleTitle')" />
        </div>
        <div class="form-group">
          <label>{{ $t('detail.precedence') }}</label>
          <select class="form-input" v-model="ruleForm.precedenceMode">
            <option value="extend">extend</option>
            <option value="replace">replace</option>
            <option value="disable">disable</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ $t('detail.ruleContent') }}</label>
          <textarea class="form-input" v-model="ruleForm.content" rows="4" style="resize: vertical; font-family: var(--atonce-font-family-mono); font-size: var(--atonce-font-size-xs);"></textarea>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary btn-sm" @click="addRule">{{ $t('common.save') }}</button>
          <button class="btn btn-outline btn-sm" @click="showRuleForm = false">{{ $t('common.cancel') }}</button>
        </div>
      </div>

      <table v-if="rules.length">
        <thead>
          <tr>
            <th>{{ $t('detail.ruleKey') }}</th>
            <th>{{ $t('detail.ruleTitle') }}</th>
            <th>{{ $t('detail.precedence') }}</th>
            <th>{{ $t('projects.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rules" :key="r.id">
            <td class="mono">{{ r.rule_key }}</td>
            <td>{{ r.title }}</td>
            <td><span class="badge badge-info">{{ r.precedence_mode }}</span></td>
            <td><button class="btn btn-outline btn-sm" @click="deleteRule(r.id)">{{ $t('projects.delete') }}</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="mono" style="color: var(--atonce-color-text-muted);">{{ $t('detail.noRules') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { apiGet, apiPost, apiDelete } from "../api/client.js";

const props = defineProps<{ ownerType: string; ownerId: number }>();
const route = useRoute();

const surface = ref<any>(null);
const artifacts = ref<any[]>([]);
const rules = ref<any[]>([]);
const loading = ref(true);
const error = ref("");
const showRuleForm = ref(false);
const ruleForm = ref({ ruleKey: "", title: "", content: "", precedenceMode: "extend" });
const plan = ref<any[]>([]);
const publishing = ref(false);
const publishResult = ref<any>(null);

const publishAllOk = computed(() => {
  if (!publishResult.value?.items) return false;
  return publishResult.value.items.every((i: any) => i.written && i.verified);
});

function getEndpoint(): string {
  const map: Record<string, string> = {
    project: "projects",
    dev_application: "dev-applications",
    ai_surface: "ai-surfaces",
  };
  return map[props.ownerType] || "projects";
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [surfRes, artRes, rulesRes] = await Promise.all([
      apiGet(`/${getEndpoint()}/${props.ownerId}`),
      apiGet(`/artifacts/by-owner?ownerType=${props.ownerType}&ownerId=${props.ownerId}`),
      apiGet(`/rules?ownerType=${props.ownerType}&ownerId=${props.ownerId}`),
    ]);

    const surfKey = getEndpoint() === "projects" ? "project" :
      getEndpoint() === "dev-applications" ? "application" : "surface";
    surface.value = surfRes[surfKey] || surfRes.surface;
    artifacts.value = artRes.artifacts || [];
    rules.value = rulesRes.rules || [];
  } catch (e: any) {
    error.value = e.message || "Error loading detail";
  } finally {
    loading.value = false;
  }
}

async function showPlan() {
  plan.value = [];
  try {
    const res = await apiPost("/publish/plan", {
      ownerType: props.ownerType,
      ownerId: props.ownerId,
    });
    plan.value = res.plan || [];
  } catch (e: any) {
    error.value = e.message || "Error building plan";
  }
}

async function execute() {
  publishing.value = true;
  try {
    publishResult.value = await apiPost("/publish/execute", {
      ownerType: props.ownerType,
      ownerId: props.ownerId,
      triggeredBy: "manual",
    });
    plan.value = [];
  } catch (e: any) {
    error.value = e.message || "Error publishing";
  } finally {
    publishing.value = false;
  }
}

async function addRule() {
  if (!ruleForm.value.ruleKey || !ruleForm.value.title) return;
  await apiPost("/rules", {
    ownerType: props.ownerType,
    ownerId: props.ownerId,
    ...ruleForm.value,
  });
  ruleForm.value = { ruleKey: "", title: "", content: "", precedenceMode: "extend" };
  showRuleForm.value = false;
  await load();
}

async function deleteRule(id: number) {
  await apiDelete(`/rules/${id}`);
  await load();
}

function statusBadge(s: string): string {
  const m: Record<string, string> = { active: "badge-success", adopting: "badge-info", paused: "badge-warning", error: "badge-danger" };
  return m[s] || "badge-info";
}

onMounted(load);
</script>
