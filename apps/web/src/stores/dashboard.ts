import { defineStore } from "pinia";
import { ref } from "vue";
import { apiGet } from "../api/client.js";

export interface DashboardSummary {
  canonicalVersion: { version_number: number; global_hash: string; status: string } | null;
  counts: { projects: number; devApplications: number; aiSurfaces: number; artifacts: number };
  pending: number;
  drift: number;
  conflicts: { total: number; projects: number; devApplications: number; aiSurfaces: number };
  projects: any[];
  devApplications: any[];
  aiSurfaces: any[];
  lastSync: string | null;
  lastPublishes: any[];
}

export const useDashboardStore = defineStore("dashboard", () => {
  const summary = ref<DashboardSummary>({
    canonicalVersion: null,
    counts: { projects: 0, devApplications: 0, aiSurfaces: 0, artifacts: 0 },
    pending: 0,
    drift: 0,
    conflicts: { total: 0, projects: 0, devApplications: 0, aiSurfaces: 0 },
    projects: [],
    devApplications: [],
    aiSurfaces: [],
    lastSync: null,
    lastPublishes: [],
  });
  const loading = ref(false);

  async function refresh() {
    loading.value = true;
    try {
      const data = await apiGet("/dashboard");
      summary.value = data;
    } finally {
      loading.value = false;
    }
  }

  return { summary, loading, refresh };
});
