import { createApp } from "vue";

import App from "./App.vue";
import "./styles.scss";
import { createPinia } from "pinia";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);

createApp(App).mount("#app");
