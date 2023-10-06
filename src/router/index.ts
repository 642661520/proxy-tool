import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import menu from './menu';
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/port-proxy',
    name: 'home',
  },
  ...menu,
];
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
export default router;
