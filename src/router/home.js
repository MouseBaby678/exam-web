const Home=()=>import("../views/home/Index.vue")
const MyCourse=()=>import("../views/home/MyCourse.vue")
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
]
export default homes;