import { createApp } from "vue";
import App from "./App.vue";
import "./assets/styles/reset.css";
// import ArcoVueIcon from "@arco-design/web-vue/es/icon";
// 路由
import router from "./router/index";
//路由守卫
import {courseGuard} from './router/guards'
//指令
import {imageDirective} from './utils/directive'
//pinia
import { createPinia } from "pinia";
//持久化保存
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import useUserStore from "./sotre/user-store";
import { Message } from '@arco-design/web-vue';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// 添加认证守卫
router.beforeEach((to, from) => {
  const userStore = useUserStore();
  
  // 不需要登录的页面
  const publicPages = ['/login', '/register'];
  const authRequired = !publicPages.includes(to.path);
  
  // 需要登录但未登录，重定向到登录页
  if (authRequired && !userStore.isLogin) {
    Message.warning('请先登录');
    return '/login';
  }
});

// 课程守卫
router.beforeEach(courseGuard);

const app = createApp(App);
// 仅在浏览器内编译时才会工作
// 如果使用了构建工具，请看下面的配置示例

// app.use(ArcoVueIcon);
app.use(router);
app.use(pinia);
app.directive("loadImg", imageDirective);

// 尝试加载用户信息
const userStore = useUserStore();
if (userStore.token) {
  // 如果有token但没有用户信息，尝试获取
  if (!userStore.userInfo) {
    userStore.getUserInfo().catch(error => {
      console.warn('初始化时获取用户信息失败，将尝试获取基本信息', error);
      // 如果获取用户完整信息失败，尝试获取基本信息
      userStore.getBaseUserInfo().catch(error => {
        console.error('初始化时获取用户基本信息也失败', error);
      });
    });
  }
}

app.mount("#app");

