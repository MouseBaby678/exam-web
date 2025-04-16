<template>
    <div class="school-card" v-if="isAuth">
        <div class="card-top">
            <h2 class="school-auth">校园认证</h2>
            <h2 class="school-name">{{ userAuthInfo.schoolName }}</h2>
        </div>
        <div class="card-body">
            <div class="user-picture">
                <AAvatar :image-url="getImageUrl(userAuthInfo.picture)">
                </AAvatar>
            </div>
            <div>
                <p class="real-name">{{ userAuthInfo.realName }}</p>
                <p class="job-id">{{ userAuthInfo.jobNo }}</p>
                <p class="department-name">{{ userAuthInfo.departmentName }}</p>
            </div>
        </div>
    </div>
    <div v-else class="not-certified">
        <slot name="notCertified">
            <a-button type="primary" @click="$router.push('/user/setting?tab=3')">未认证，去认证</a-button>
        </slot>
    </div>
</template>
<script setup>
import { computed, onMounted, watch, ref } from 'vue';
import useUserStore from '../../sotre/user-store';
import {getImageUrl} from '../../utils/image.js'

const props = defineProps({
    userAuthInfo: Object
})

const userStore = useUserStore();
const userAuthInfo = computed(() => props.userAuthInfo || userStore.userInfo);
const isAuth = computed(() => {
    console.log('认证状态检查 - store状态:', userStore.authStatus, '用户信息:', userAuthInfo.value);
    
    // 首先检查store中的authStatus
    if (userStore.authStatus === 1) {
        return true;
    }
    
    // 其次检查userAuthInfo中的jobNo
    if (userAuthInfo.value && userAuthInfo.value.jobNo) {
        // 如果发现用户信息中有学号但store状态为未认证，自动同步状态
        if (userStore.authStatus !== 1) {
            console.log('发现状态不一致，自动同步为已认证');
            userStore.updateAuthStatus(1);
        }
        return true;
    }
    
    // 最后，检查store中用户信息的authId
    if (userStore.userInfo && userStore.userInfo.authId) {
        console.log('通过userInfo.authId判断为已认证');
        if (userStore.authStatus !== 1) {
            userStore.updateAuthStatus(1);
        }
        return true;
    }
    
    return false;
});

// 监听认证状态变化
watch(() => userStore.authStatus, (newVal) => {
    console.log('认证状态变化:', newVal);
    if (newVal === 1 && (!userAuthInfo.value || !userAuthInfo.value.jobNo)) {
        // 如果认证状态变为已认证，但没有详细认证信息，尝试更新
        console.log('认证状态已更新，但缺少详细信息，尝试刷新');
        userStore.getUserInfo();
    }
});

onMounted(() => {
    // 组件挂载时检查状态一致性
    if ((userAuthInfo.value && userAuthInfo.value.jobNo) || 
        (userStore.userInfo && userStore.userInfo.authId)) {
        if (userStore.authStatus !== 1) {
            console.log('挂载时发现状态不一致，修正为已认证');
            userStore.updateAuthStatus(1);
        }
    }
});
</script>
<style lang="less">
:deep(.arco-avatar){
    background-color: transparent;
}
.school-card{
    background: url("../../assets/svg/auth-card.svg") no-repeat;
    background-size: cover;
    color: var(--color-bg-1);
    min-width: 300px;
    padding:20px;
    border-radius: 8px;
    .card-top{
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
    }
    .card-body{
        display: flex;
        align-items: center;
        line-height: 20px;
        font-size: 14px;
        .user-picture{
            margin-right: 20px;
            
        }
    }
}
.not-certified{
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 300px;
    height: 150px;
    background-image: linear-gradient(to right,#8193D6,#B4E6E7);
    border-radius: 15px;
}
</style>