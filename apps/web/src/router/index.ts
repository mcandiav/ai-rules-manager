import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "dashboard",
    component: () => import("../views/DashboardView.vue"),
  },
  {
    path: "/projects",
    name: "projects",
    component: () => import("../views/ProjectsView.vue"),
  },
  {
    path: "/projects/:id",
    name: "project-detail",
    component: () => import("../views/SurfaceDetailView.vue"),
    props: (route: any) => ({ ownerType: "project", ownerId: Number(route.params.id) }),
  },
  {
    path: "/dev-applications",
    name: "dev-applications",
    component: () => import("../views/DevApplicationsView.vue"),
  },
  {
    path: "/ai-surfaces",
    name: "ai-surfaces",
    component: () => import("../views/AiSurfacesView.vue"),
  },
  {
    path: "/versions",
    name: "versions",
    component: () => import("../views/VersionsView.vue"),
  },
  {
    path: "/artifacts",
    name: "artifact-settings",
    component: () => import("../views/ArtifactSettingsView.vue"),
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("../views/SettingsView.vue"),
  },
  {
    path: "/publish-history",
    name: "publish-history",
    component: () => import("../views/PublishHistoryView.vue"),
  },
  {
    path: "/drift",
    name: "drift",
    component: () => import("../views/DriftEventsView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
