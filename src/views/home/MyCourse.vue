<template>
    <div class="my-course">
        <!-- 移除标签选择器，只保留"我学的课" -->

        <!-- 操作区 -->
        <div class="course-operation">
            <!-- 学生显示添加课程按钮 -->
            <a-button v-if="userStore.isStudent" type="primary" @click="showAddModal(0)" shape="round">添加课程</a-button>
            
            <!-- 教师显示创建课程按钮 -->
            <a-button v-else type="primary" @click="showCreateCourseModal" shape="round">创建课程</a-button>
            
            <a-radio-group type="button" @change="statusChange" default-value="0">
                <a-radio value="0">{{ userStore.isTeacher ? '教授中' : '正在学' }}</a-radio>
                <a-radio value="1">已完结</a-radio>
            </a-radio-group>
        </div>
        <!-- 课程列表 -->
        <div class="course-list" v-if="loading">
            <a-row :gutter="[15, 15]" class="course-list">
                <a-col :xs="24" :sm="12" :xl="8" :xxl="6"  v-for="item of 3" :key="item">
                    <a-skeleton class="course-item">
                        <a-space direction="vertical" size="large" style="width:100%">
                            <a-skeleton-shape class="course-picture" style="width:100%"/>
                            <a-skeleton-line :rows="2" />
                        </a-space>
                    </a-skeleton>
                </a-col>
            </a-row>
            
        </div>
        <div v-else-if="courseList.length != 0">
            <a-row :gutter="[15, 15]" class="course-list" :class="{'course-end':isEnd=='1'}">
                <a-col :xs="24" :sm="12" :xl="8" :xxl="6" v-for="item of courseList" :key="item.id"  @click="toCourse(item)">
                    <!-- <router-link :to="'/course/'+item.id"> -->
                        <div  class="course-item">
                        <div class="course-picture">
                            <a-image width="100%" style="object-fit: cover;" height="100%" :src="getImageUrl(item.cover)"  show-loader/>
                            <div class="course-opera">
                                <span @click.stop="showAddModal(2,item)">退课</span>
                            </div>
                        </div>
                        <div class="course-info">
                            <h3 class="title">{{ item.name }}</h3>
                            <p class="author">{{ item.teacher.nickname }}</p>
                        </div>
                    </div>
                    <!-- </router-link> -->
                </a-col>
            </a-row>
            <a-pagination style="justify-content: center;margin:10px 0"  v-model:current="currPage"  @change="getCourseList"  :total="total" :current="currPage" :page-size="10" />
        </div>
        <a-empty v-else />
        <!-- 邀请码添加课程 -->
        <a-modal simple v-model:visible="addModalVisible" @ok="courseOk" :title="modalTitle">
            <a-form :model="stuAddInfo">
                <a-form-item field="name" label="邀请码">
                    <a-input v-model="stuAddInfo.code" placeholder="输入班级邀请码" />
                </a-form-item>
            </a-form>
        </a-modal>
        
        <!-- 创建课程模态框 -->
        <a-modal simple v-model:visible="createCourseModalVisible" @ok="createCourse" title="创建课程">
            <a-form :model="courseCreateInfo">
                <a-form-item field="name" label="课程名称" :rules="[{ required: true, message: '请输入课程名称' }]">
                    <a-input v-model="courseCreateInfo.name" placeholder="输入课程名称" />
                </a-form-item>
                <a-form-item field="introduce" label="课程介绍">
                    <a-textarea v-model="courseCreateInfo.introduce" placeholder="输入课程介绍" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>
<script setup>
import { reactive, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { courseListRequest, stuAddCourseRequest, teaCreateCourseRequest } from '@/apis/course-api.js'
import useCourseStore from '../../sotre/course-store';
import useUserStore from '../../sotre/user-store'; // 导入用户存储
import { getImageUrl } from '../../utils/image'
import { Message } from '@arco-design/web-vue'; // 导入消息组件

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const userStore = useUserStore() // 获取用户存储实例

const modalTitle = ref('添加课程');
//0 加入、2：修改
const modalType = ref(0);
const addModalVisible = ref(false)
const stuAddInfo = reactive({
    code: ""
})

// 创建课程相关
const createCourseModalVisible = ref(false);
const courseCreateInfo = reactive({
    name: "",
    introduce: ""
});

// 根据用户实际角色动态设置
const role = computed(() => {
    // 根据角色返回对应的字符串
    return userStore.isTeacher ? 'teacher' : 'student'
})
console.log('当前用户角色:', role.value)
// 是否结课
const isEnd = ref(0)
const currPage = ref(1)
const total = ref(0)
const loading = ref(false)
//课程列表
const courseList = ref([])

//筛选改变
const statusChange = (value) => {
    isEnd.value = value;
    getCourseList();
}

const showAddModal = (type, data) => {
    //重置状态
    if (type == 0) {
        modalTitle.value = "添加课程"
        modalType.value = 0
        stuAddInfo.code = ""
    } else if (type == 2) {
        modalTitle.value = "退出课程"
        modalType.value = 2
        // 可以添加退课逻辑
    }
    addModalVisible.value = !addModalVisible.value
}

const getCourseList = () => {
    loading.value = true
    courseListRequest(role.value, currPage.value, isEnd.value)
        .then(({ data }) => {
            console.log(data)
            const result = data.data;
            courseList.value = result.list
            currPage.value = result.current
            total.value = result.total
            loading.value = false
        }).catch(err => {
            loading.value = false
        })
}

const courseOk = () => {
    if (modalType.value == 0) {
        stuAddCourseRequest(stuAddInfo.code).then(() => {
            getCourseList()
        })
    } else if (modalType.value == 2) {
        // 这里可以添加退课逻辑
    }
}

const toCourse = (data) => {
    courseStore.courseInfo = data
    router.push({
        name: 'Classroom',
        params: {
            courseId: data.id
        }
    })
}

// 显示创建课程模态框
const showCreateCourseModal = () => {
    courseCreateInfo.name = "";
    courseCreateInfo.introduce = "";
    createCourseModalVisible.value = true;
}

// 创建课程处理
const createCourse = () => {
    if (!courseCreateInfo.name) {
        Message.error('课程名称不能为空');
        return;
    }
    
    teaCreateCourseRequest(courseCreateInfo).then(() => {
        Message.success('课程创建成功');
        createCourseModalVisible.value = false;
        getCourseList(); // 刷新课程列表
    }).catch(err => {
        Message.error('课程创建失败：' + (err.message || '未知错误'));
    });
}

// 页面加载时获取课程列表
getCourseList()
</script>
<style lang="less">
.my-course {

    .course-operation {
        display: flex;
        justify-content: space-between;
        padding-bottom: 20px;
    }

    .course-list {
        .course-item {
            border-radius: 6px;
            overflow: hidden;
            cursor: pointer;
            box-sizing: border-box;
            border: 1px solid var(--color-border-2);
            transition: all .3s;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
            .course-picture{
                img{
                    transition: all .3s;
                    width: 100%;
                    height: 100%;
                    aspect-ratio: 2 / 1; 
                }
            }
            &:hover {
                box-shadow:0 0 20px rgba(0, 0, 0, 0.1);
                .course-picture {
                    .course-opera {
                        height: 100%;
                    }
                    img{
                        transform: scale(1.05);
                        filter: blur(2px);
                    }
                }

            }

            .course-picture {
                height: 160px;
                position: relative;
                .course-opera {
                    position: absolute;
                    top: 0px;
                    right: 0px;
                    height: 0;
                    left: 0;
                    bottom: 0;
                    overflow: hidden;
                    transition: height .3s;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-sizing: border-box;
                    span{
                        font-size: 14px;
                        display: inline-block;
                        height: 50px;
                        width: 50px;
                        text-align: center;
                        line-height: 50px;
                        border-radius: 30px;
                        color: var(--color-text-1);
                        background-color: var(--color-bg-1);
                        font-weight: bold;
                        margin: 0 5px;
                        &:hover{
                            background-color: var(--color-fill-2);
                        }
                    }
                }
            }
            .course-info{
                padding: 10px;
                .title {
                    margin: 10px 0;
                    color: var(--color-text-1);
                }

                .author {
                    color: var(--color-text-2);
                }
            }

           
        }
    }
    .course-end{
        .course-item{
            filter: grayscale(1);
        }
    }
}
</style>