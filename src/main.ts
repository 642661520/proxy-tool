import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';

import App from './App.vue';
import router from './router';
const i18n = createI18n({
  locale: 'zh',
  messages: {
    zh: {
      message: {
        hello: '你好，世界',
        "port-proxy": "端口代理",
      },
    },
    en: {
      message: {
        hello: 'hello world',
        "port-proxy": "port proxy",
      },
    },
  },
})
createApp(App).use(i18n).use(router).mount('#app');
