import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import router from "./router/index.js";
import App from "./App.vue";
import es from "./i18n/locales/es.json";
import pt from "./i18n/locales/pt.json";
import en from "./i18n/locales/en.json";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components-lang.css";

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem("locale") || "es",
  fallbackLocale: "en",
  messages: { es, pt, en },
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
app.mount("#app");
