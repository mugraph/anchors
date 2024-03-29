import Vue from 'vue';
import App from './App.vue';
import VueMeta from 'vue-meta';
import './registerServiceWorker';
import router from './router/router.js';
import store from './store/store.js';
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.min.css';
import 'leaflet/dist/leaflet.css';

import '@/scss/styles.scss';
import '@/scss/_overrides.scss';

Vue.config.productionTip = false;

export const eventBus = new Vue();

window.player = null;

Vue.use(VueMeta, {
  keyName: 'head',
});

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
