<template>
    <div class="home-wrap">
        <!-- 介绍区 -->
        <!-- <div class="home-introduce">
            <img src="@/assets/img/home-introduce-bg.png"/>
        </div> -->
        <div class="home-function">
            <!-- 课程菜单侧边栏 -->
            <div class="home-menu home-common" v-if="showSidebar">
                <div class="menu-header">
                    <div class="logo-icon">
                        <img src="../../assets/svg/logo.svg" alt="课程" />
                    </div>
                    <h2 class="course-title">{{ courseStore.courseInfo.name }}</h2>
                </div>
                <a-menu
                    :default-selected-keys="[menuActiveKey]"
                    :style="{ width: '100%' }"
                    @menu-item-click="onMenuItemClick"
                >
                    <a-menu-item v-for="item in menuList" :key="item.key" v-show="item.visble">
                        <template #icon>
                            <component :is="item.icon" />
                        </template>
                        {{ item.name }}
                    </a-menu-item>
                </a-menu>
            </div>
            
            <!-- 课程内容区域 -->
            <div class="home-content home-common" :class="{ 'full-width': !showSidebar }">
                <router-view></router-view>
                <div class="footer">
                    <p>
                        <a href="https://gitee.com/baymaxsjj">&copy; 2022 Baymax 版权所有<br /></a>
                    </p>
                    <p style="font-size:12px;margin:5px 0;">
                        <a href="https://gitee.com/baymaxsjj/sqlmock">数据填充由 SqlMock 提供</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, shallowRef, watchEffect, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useCourseStore from '../../sotre/course-store';
import useUserStore from '../../sotre/user-store';

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 检查用户登录状态
if (!userStore.token) {
    router.push({
        name: "Login"
    })
}

const courseStore = useCourseStore()

// 获取课程ID并加载课程信息
const courseId = computed(() => route.params.courseId)
watchEffect(() => {
    if (courseId.value) {
        courseStore.getCourseInfo(courseId.value)
    }
})

// 侧边栏菜单数据
const menuList = computed(() => courseStore.menu)

// 仅在课程页面显示侧边栏
const showSidebar = computed(() => {
    return route.path.startsWith('/course/') && courseId.value
})

// 根据当前路由设置活动菜单项
const menuActiveKey = computed(() => {
    return route.name || ''
})

// 菜单项点击事件
const onMenuItemClick = (key) => {
    // 查找对应的菜单项
    const menuItem = menuList.value.find(item => item.key === key)
    if (menuItem) {
        router.push({
            name: menuItem.key,
            params: menuItem.params
        })
    }
}
</script>
<style lang="less" scoped>
.home-wrap {
    padding-top: 72px;
    box-sizing: border-box;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-border-1);
    overflow-y: hidden;

    .home-common {
        margin: 0 10px;
        background-color: var(--color-menu-light-bg);
        border-radius: 10px;
        padding: 20px;
    }

    .home-introduce {
        height: 150px;

        img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: inherit;
        }
    }

    .home-function {
        flex-grow: 1;
        display: flex;
        padding: 10px 0;
        overflow: hidden;
    }

    .home-menu {
        width: 220px;
        flex-shrink: 0;
        overflow-y: auto;
        padding: 0; /* 移除内边距，由菜单组件控制 */
        
        .menu-header {
            padding: 20px 15px;
            border-bottom: 1px solid var(--color-border-2);
            margin-bottom: 15px;
            text-align: center; /* 居中标题 */
            display: flex;
            flex-direction: column;
            align-items: center;
            
            .logo-icon {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: var(--color-primary-light-1);
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12px;
                box-shadow: 0 4px 8px rgba(var(--primary-6), 0.15);
                
                img {
                    width: 30px;
                    height: 30px;
                }
            }
            
            .course-title {
                font-size: 18px;
                font-weight: bold;
                color: var(--color-text-1);
                margin: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 100%;
                padding: 0 5px;
                line-height: 1.5;
            }
        }
    }

    .home-content {
        overflow-y: auto;
        width: calc(100% - 240px);
        margin-left: 10px; /* 添加左边距，增加间隔 */
        
        &.full-width {
            width: 100%;
            margin: 0 auto;
            max-width: 1200px;
        }
    }
    
    .footer {
        text-align: center;
        color: var(--color-text-3);
        font-size: 16px;
        padding: 10px;
    }
}

:deep(.arco-page-header) {
    position: sticky;
    top: -20px;
    background-color: var(--color-menu-light-bg);
    z-index: 1;
}

:deep(.arco-menu) {
    background-color: var(--color-menu-light-bg);
    border-radius: 10px;
    padding: 10px;
    
    .arco-menu-item {
        font-size: 16px;
        font-weight: 500;
        height: 50px;
        line-height: 50px;
        margin: 4px 0;
        border-radius: 6px; /* 圆角菜单项 */
        transition: all 0.3s;
        
        .arco-icon {
            font-size: 18px;
            margin-right: 12px;
        }
        
        &:hover {
            background-color: var(--color-fill-2);
        }
    }
    
    .arco-menu-selected {
        font-weight: 600;
        background-color: var(--color-primary-light-1) !important;
        color: var(--color-primary-6) !important;
    }
}

:deep(.arco-menu-collapsed) {
    padding: 0;
    
    .collapsed-hidden {
        display: none;
    }
    
    .arco-menu-item {
        padding: 0 24px;
    }
}
</style>