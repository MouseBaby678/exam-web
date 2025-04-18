const MyCourse=()=>import("../views/home/MyCourse.vue")
const Home=()=>import("../views/home/Index.vue")
import useUserStore from "../sotre/user-store";

const homes = [
    {
        path: '/home',
        component: Home,
        name:'Home',
        children: [
            {
                path:"",
                component:MyCourse,
                name:'MyCourse',
                meta:{
                    title:'我的课程'
                }
            },
            {
                path:"course/:role",
                component:MyCourse,
                name:'MyCourseWithRole',
                meta:{
                    title:'我的课程'
                }
            }
        ]
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
    // 添加根路径重定向到课程中心
    {
        path: '/',
        redirect: to => {
            const userStore = useUserStore();
            const role = userStore.isTeacher ? 'teacher' : 'student';
            return { name: 'CourseCenterRole', params: { role } };
        }
    }
]
export default homes;