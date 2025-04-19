import { createRouter, createWebHistory } from "vue-router";
import courses from "./course";
import exams from './exam'
import users from './users'
import useUserStore from '../sotre/user-store'
import { Message } from '@arco-design/web-vue'

const base = import.meta.env.VITE_BASE;
const Empty = () => import("../components/Empty.vue");
const Login = () => import("../views/login/Index.vue");
const MyCourse = () => import("../views/home/MyCourse.vue");
const Home = () => import("../views/home/Index.vue");

const routes = [
  {
    //404页面
    path: "/:pathMatch(.*)*",
    component: Empty,
  },
  {
    path: "/login",
    component: Login,
    name: "Login",
    meta: {
      title: "登录",
      header: false,
    },
  },
  // 直接访问课程中心路径
  {
    path: '/course/:role',
    component: Home,
    name: 'CourseCenter',
    children: [
      {
        path: "",
        component: MyCourse,
        name: 'CourseCenterRole',
        meta: {
          title: '我的课程'
        }
      }
    ]
  },
  // 根路径
  {
    path: '/',
    name: 'Root',
    component: Home,
    children: [
      {
        path: "",
        component: MyCourse,
        name: 'RootPage',
        meta: {
          title: '我的课程'
        }
      }
    ]
  },
  ...courses,
  ...exams,
  ...users
];

const router = createRouter({
  // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
  history: createWebHistory(base),
  routes, // `routes: routes` 的缩写
});

// 需要教师权限的路由路径
const teacherAuthPaths = [
  '/course/*/exam/paper',       // 试卷创建
  '/course/*/exam/paper/manage', // 试卷管理
  '/course/*/exam/paper/automatic', // 自动组卷
  '/course/*/question/batch-import', // 批量导入题目
  '/exam/*/console'             // 考试控制台
]

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 根路径重定向逻辑
  if (to.name === 'Root' || to.name === 'RootPage') {
    if (!userStore.isLogin) {
      next({ name: 'Login' });
      return;
    } else {
      const role = userStore.isTeacher ? 'teacher' : 'student';
      next({ name: 'CourseCenterRole', params: { role } });
      return;
    }
  }
  
  // 检查是否需要教师权限
  const needsTeacherAuth = teacherAuthPaths.some(path => {
    // 将路径转换为正则表达式
    const regex = new RegExp(`^${path.replace(/\*/g, '[^/]+')}`)
    return regex.test(to.path)
  })
  
  // 如果需要教师权限但用户不是教师
  if (needsTeacherAuth && !userStore.isTeacher) {
    Message.error('您没有权限访问此页面，需要教师权限')
    next(from.path || '/') // 返回来源页面或首页
    return
  }
  
  next()
})

export default router;
