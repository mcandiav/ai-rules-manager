<template>
  <div>
    <h3 style="margin-bottom: 1.5rem;">{{ $t('settings.title') }}</h3>

    <div class="card" style="margin-bottom: 1rem;">
      <div class="form-group">
        <label>{{ $t('settings.language') }}</label>
        <LangSelector />
      </div>
    </div>

    <div class="card" style="margin-bottom: 1rem;">
      <table>
        <tbody>
          <tr>
            <td style="color: var(--atonce-color-text-muted); width: 200px;">{{ $t('settings.version') }}</td>
            <td class="mono">{{ appStore.appVersion }}</td>
          </tr>
          <tr>
            <td style="color: var(--atonce-color-text-muted);">{{ $t('settings.environment') }}</td>
            <td class="mono">{{ environment }}</td>
          </tr>
          <tr>
            <td style="color: var(--atonce-color-text-muted);">{{ $t('settings.apiStatus') }}</td>
            <td>
              <span v-if="apiOk" class="badge badge-success">{{ $t('common.ok') }}</span>
              <span v-else class="badge badge-danger">{{ $t('common.error') }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAppStore } from "../stores/app.js";
import { apiGet } from "../api/client.js";
import LangSelector from "../components/lang/LangSelector.vue";

const appStore = useAppStore();
const apiOk = ref(false);
const environment = ref(import.meta.env.MODE);

onMounted(async () => {
  try {
    await apiGet("/health");
    apiOk.value = true;
  } catch {
    apiOk.value = false;
  }
});
</script>
