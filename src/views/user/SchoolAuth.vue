<template>
    <div class="school-auth-container">
        <a-card class="auth-card">
            <div v-if="authLoading" class="loading-container">
                <a-spin />
                <p>加载中...</p>
            </div>
            <div v-else>
                <!-- 已认证状态 -->
                <div v-if="isAuthenticated" class="auth-success">
                    <AuthCard :userAuthInfo="userAuthInfo" />
                    <div class="auth-actions">
                        <a-popconfirm content="确定要解除认证吗？解除后将无法参与考试" @ok="handleCancelAuth">
                            <a-button status="danger">解除认证</a-button>
                        </a-popconfirm>
                    </div>
                </div>
                
                <!-- 未认证状态 -->
                <div v-else class="auth-form">
                    <div v-if="authStep === 1">
                        <a-form :model="verifyForm" @submit="handleVerifyStudent">
                            <a-form-item field="jobNo" label="学号" validate-trigger="blur" :rules="[{ required: true, message: '请输入学号' }]">
                                <a-input v-model="verifyForm.jobNo" placeholder="请输入学号" />
                            </a-form-item>
                            <a-form-item field="realName" label="姓名" validate-trigger="blur" :rules="[{ required: true, message: '请输入姓名' }]">
                                <a-input v-model="verifyForm.realName" placeholder="请输入姓名" />
                            </a-form-item>
                            <a-form-item>
                                <a-button type="primary" html-type="submit" long :loading="verifyLoading">
                                    验证学生信息
                                </a-button>
                            </a-form-item>
                        </a-form>
                    </div>
                    
                    <div v-if="authStep === 2" class="verify-result">
                        <a-result status="success" title="学生信息验证成功">
                            <template #subtitle>
                                <div class="student-info">
                                    <p><span>学号：</span>{{ studentInfo.jobNo }}</p>
                                    <p><span>姓名：</span>{{ studentInfo.realName }}</p>
                                    <p v-if="studentInfo.departmentName"><span>院系：</span>{{ studentInfo.departmentName }}</p>
                                </div>
                            </template>
                            <template #extra>
                                <div class="action-buttons">
                                    <a-button type="primary" @click="handleConfirmAuth" :loading="bindLoading">
                                        确认绑定
                                    </a-button>
                                    <a-button @click="authStep = 1">
                                        返回修改
                                    </a-button>
                                </div>
                            </template>
                        </a-result>
                    </div>
                </div>
            </div>
        </a-card>
        
        <a-card class="auth-tips">
            <template #title>认证须知</template>
            <ol>
                <li>请确保输入的学号和姓名与学校登记的信息一致</li>
                <li>每个学生信息只能被一个账号认证</li>
                <li>认证成功后，可以参与学校的考试和查看成绩</li>
                <li>如认证信息有误，请联系管理员处理</li>
            </ol>
        </a-card>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import useUserStore from '@/sotre/user-store';
import AuthCard from '@/components/auth/AuthCard.vue';
import { 
    verifyStudentRequest, 
    bindStudentAuthRequest, 
    getUserAuthInfoRequest, 
    cancelAuthRequest,
    clearUserAuthIdRequest,
    fullCancelAuthRequest
} from '@/apis/auth-api';

const userStore = useUserStore();
const userId = computed(() => userStore.userInfo?.id);

// 认证信息
const userAuthInfo = ref({});
const isAuthenticated = ref(false);
const authLoading = ref(true);
const checkingAuthStatus = ref(false);

// 表单状态
const authStep = ref(1); // 1: 验证表单, 2: 确认认证
const verifyForm = ref({
    jobNo: '',
    realName: ''
});
const studentInfo = ref({});
const verifyLoading = ref(false);
const bindLoading = ref(false);

// 监听用户ID变化，重新获取认证信息
watch(() => userStore.userInfo?.id, (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
        console.log('用户ID已更新，重新获取认证信息');
        fetchUserAuthInfo();
    }
});

// 添加重新检查认证状态的方法
const refreshAuthStatus = async () => {
    if (checkingAuthStatus.value) return;
    
    checkingAuthStatus.value = true;
    try {
        // 直接从后端获取最新的认证状态
        // 使用userStore中的用户ID
        const currentUserId = userStore.userInfo?.id || userStore.baseUserInfo?.id;
        if (!currentUserId) {
            console.error('无法获取有效的用户ID，无法刷新认证状态');
            return;
        }
        
        // 同时发起两个请求，获取最新认证状态
        const [authInfoResponse, userInfoResponse] = await Promise.all([
            getUserAuthInfoRequest(currentUserId).catch(() => null),
            userStore.getUserInfo().catch(() => null)
        ]);
        
        // 处理认证信息响应
        if (authInfoResponse && authInfoResponse.data.code === '00000') {
            userAuthInfo.value = authInfoResponse.data.data;
            isAuthenticated.value = true;
            userStore.updateAuthStatus(1);
        } else if (userInfoResponse && userInfoResponse.authId) {
            // 如果用户信息中有authId，也认为已认证
            isAuthenticated.value = true;
            userStore.updateAuthStatus(1);
            // 再次尝试获取详细认证信息
            fetchUserAuthInfo();
        } else {
            isAuthenticated.value = false;
            userStore.updateAuthStatus(0);
        }
    } catch (error) {
        console.error('刷新认证状态失败', error);
    } finally {
        checkingAuthStatus.value = false;
    }
};

// 获取用户认证信息
const fetchUserAuthInfo = async () => {
    authLoading.value = true;
    try {
        // 检查用户ID是否存在
        if (!userId.value) {
            console.error('获取用户ID失败');
            // 先获取userStore中的token是否存在
            if (!userStore.token) {
                console.error('用户未登录，请先登录');
                isAuthenticated.value = false;
                authLoading.value = false;
                return;
            }
            
            // 尝试重新获取用户信息
            try {
                const userData = await userStore.getUserInfo();
                if (!userData || !userData.id) {
                    console.error('重新获取用户信息后，用户ID仍不存在');
                    // 尝试获取基本信息
                    const baseData = await userStore.getBaseUserInfo();
                    if (!baseData || !baseData.id) {
                        isAuthenticated.value = false;
                        authLoading.value = false;
                        return;
                    }
                    
                    // 使用基本信息中的ID
                    console.log('使用基本信息中的用户ID:', baseData.id);
                    
                    try {
                        const res = await getUserAuthInfoRequest(baseData.id);
                        processAuthInfoResponse(res);
                    } catch (error) {
                        console.error('使用基本ID获取认证信息请求异常', error);
                        // 检查是否是正常的业务响应（A0000，用户未认证）
                        if (error.data && error.data.code === 'A0000' && error.data.msg === '用户未完成认证') {
                            console.log('用户未完成认证（正常业务响应，从异常中获取）');
                            isAuthenticated.value = false;
                            userStore.updateAuthStatus(0);
                            
                            // 再次检查用户信息中的authId
                            if (userStore.userInfo && userStore.userInfo.authId) {
                                console.log('但用户信息中有authId，可能存在数据不一致');
                                isAuthenticated.value = true;
                                userStore.updateAuthStatus(1);
                            }
                        } else {
                            // 真正的异常情况
                            console.error('获取认证信息失败', error);
                            // 降级方案：从用户信息判断
                            if (userStore.userInfo && userStore.userInfo.authId) {
                                isAuthenticated.value = true;
                                userStore.updateAuthStatus(1);
                            } else {
                                isAuthenticated.value = false;
                                userStore.updateAuthStatus(0);
                            }
                        }
                    }
                    return;
                }
            } catch (error) {
                console.error('重新获取用户信息失败', error);
                isAuthenticated.value = false;
                authLoading.value = false;
                return;
            }
        }
        
        // 使用最新的用户ID
        const currentUserId = userStore.userInfo?.id || userStore.baseUserInfo?.id;
        if (!currentUserId) {
            console.error('无法获取有效的用户ID');
            isAuthenticated.value = false;
            authLoading.value = false;
            return;
        }
        
        try {
            const res = await getUserAuthInfoRequest(currentUserId);
            processAuthInfoResponse(res);
        } catch (error) {
            // 检查是否是正常的业务响应（A0000，用户未认证）
            if (error.data && error.data.code === 'A0000' && error.data.msg === '用户未完成认证') {
                console.log('用户未完成认证（正常业务响应，从异常中获取）');
                isAuthenticated.value = false;
                userStore.updateAuthStatus(0);
                
                // 再次检查用户信息中的authId
                if (userStore.userInfo && userStore.userInfo.authId) {
                    console.log('但用户信息中有authId，可能存在数据不一致');
                    isAuthenticated.value = true;
                    userStore.updateAuthStatus(1);
                }
            } else {
                // 真正的异常情况
                console.error('获取认证信息失败', error);
                // 降级方案：从用户信息判断
                if (userStore.userInfo && userStore.userInfo.authId) {
                    console.log('用户信息中存在authId，认为已认证');
                    isAuthenticated.value = true;
                    userStore.updateAuthStatus(1);
                } else {
                    isAuthenticated.value = false;
                    userStore.updateAuthStatus(0);
                }
            }
        }
    } finally {
        authLoading.value = false;
    }
};

// 处理认证信息响应
const processAuthInfoResponse = (res) => {
    try {
        // 添加完整的响应验证逻辑
        if (!res) {
            console.error('认证响应为空');
            return;
        }
        
        if (!res.data) {
            console.error('认证响应数据为空', res);
            return;
        }
        
        // A0000是正常的业务响应，表示用户未认证
        if (res.data.code === 'A0000' && res.data.msg === '用户未完成认证') {
            console.log('用户未完成认证（正常业务响应）');
            isAuthenticated.value = false;
            userStore.updateAuthStatus(0);
            
            // 再次检查用户信息中的authId，防止数据不一致
            if (userStore.userInfo && userStore.userInfo.authId) {
                console.log('但用户信息中有authId，可能存在数据不一致');
                // 在这种情况下，我们信任用户表中的authId
                isAuthenticated.value = true;
                userStore.updateAuthStatus(1);
                // 不需要显示任何警告
            }
            return;
        }
        
        // 检查数据格式是否符合预期
        if (res.data.code === '00000' && res.data.data) {
            userAuthInfo.value = res.data.data;
            isAuthenticated.value = true;
            // 更新全局认证状态
            userStore.updateAuthStatus(1);
        } else {
            console.log('认证接口返回非成功状态或数据格式异常:', res.data);
            
            // 如果API返回未认证，再次检查用户信息中的authId
            if (userStore.userInfo && userStore.userInfo.authId) {
                console.log('认证接口返回未认证，但用户信息中有authId，认为已认证');
                isAuthenticated.value = true;
                userStore.updateAuthStatus(1);
                // 可能是数据不一致，尝试重新获取一次
                setTimeout(refreshAuthStatus, 1000);
            } else {
                isAuthenticated.value = false;
                userStore.updateAuthStatus(0);
            }
        }
    } catch (error) {
        // 捕获处理响应过程中可能出现的错误
        console.error('处理认证信息响应时出错:', error);
        
        // 降级方案：尝试从用户信息中判断认证状态
        if (userStore.userInfo && userStore.userInfo.authId) {
            console.log('处理认证响应出错，从用户信息判断为已认证');
            isAuthenticated.value = true;
            userStore.updateAuthStatus(1);
        } else {
            isAuthenticated.value = false;
            userStore.updateAuthStatus(0);
        }
    }
};

// 验证学生信息
const handleVerifyStudent = async (data) => {
    if (!data.errors) {
        verifyLoading.value = true;
        try {
            const res = await verifyStudentRequest(verifyForm.value.jobNo, verifyForm.value.realName);
            if (res.data.code === '00000') {
                studentInfo.value = res.data.data;
                authStep.value = 2;
                Message.success('学生信息验证成功');
            }
        } catch (error) {
            console.error('验证失败', error);
            // 检查是否已经在http拦截器中显示了消息
            // 如果是服务器返回的业务错误（带有自定义状态码），拦截器已经显示过消息，这里不再显示
            if (!error.data || !error.data.code) {
                // 只有在网络错误或其他非业务错误时才显示这个通用消息
                Message.error('学生信息验证失败，请检查网络连接或稍后重试');
            }
        } finally {
            verifyLoading.value = false;
        }
    }
};

// 确认认证
const handleConfirmAuth = async () => {
    // 检查用户ID是否存在
    if (!userId.value) {
        // 先获取userStore中的token是否存在
        if (!userStore.token) {
            // 移除不必要的提示
            console.error('用户未登录，请先登录系统');
            return;
        }
        
        // 尝试重新获取用户信息
        try {
            const userData = await userStore.getUserInfo();
            if (!userData || !userData.id) {
                // 尝试获取基本信息
                const baseData = await userStore.getBaseUserInfo();
                if (!baseData || !baseData.id) {
                    // 移除不必要的提示
                    console.error('用户信息获取失败');
                    return;
                }
                // 可以使用基本信息中的ID
                console.log('使用基本信息中的用户ID:', baseData.id);
            }
        } catch (error) {
            console.error('获取用户信息失败', error);
            // 移除不必要的提示
            return;
        }
    }
    
    bindLoading.value = true;
    try {
        // 使用最新的用户ID，优先使用userInfo中的ID，其次使用baseUserInfo中的ID
        const currentUserId = userStore.userInfo?.id || userStore.baseUserInfo?.id;
        if (!currentUserId) {
            // 移除不必要的提示
            console.error('无法获取有效的用户ID');
            bindLoading.value = false;
            return;
        }
        
        const res = await bindStudentAuthRequest(currentUserId, studentInfo.value.studentId);
        if (res.data.code === '00000') {
            Message.success('认证成功');
            fetchUserAuthInfo();
            authStep.value = 1;
        } else {
            // 保留这个错误提示，因为是API返回的具体错误
            Message.error(res.data.msg || '认证失败，请稍后重试');
        }
    } catch (error) {
        console.error('认证失败', error);
        // 检查是否已经在http拦截器中显示了消息
        // 如果是服务器返回的业务错误（带有自定义状态码），拦截器已经显示过消息，这里不再显示
        if (!error.data || !error.data.code) {
            // 只有在网络错误或其他非业务错误时才显示这个通用消息
            Message.error('认证请求失败，请检查网络连接或稍后重试');
        }
    } finally {
        bindLoading.value = false;
    }
};

// 解除认证
const handleCancelAuth = async () => {
    // 检查用户ID是否存在
    if (!userId.value) {
        // 先获取userStore中的token是否存在
        if (!userStore.token) {
            // 移除不必要的提示
            console.error('用户未登录，请先登录系统');
            return;
        }
        
        // 尝试重新获取用户信息
        try {
            const userData = await userStore.getUserInfo();
            if (!userData || !userData.id) {
                // 尝试获取基本信息
                const baseData = await userStore.getBaseUserInfo();
                if (!baseData || !baseData.id) {
                    // 移除不必要的提示
                    console.error('用户信息获取失败');
                    return;
                }
                // 可以使用基本信息中的ID
                console.log('使用基本信息中的用户ID:', baseData.id);
            }
        } catch (error) {
            console.error('获取用户信息失败', error);
            // 移除不必要的提示
            return;
        }
    }
    
    try {
        // 使用最新的用户ID，优先使用userInfo中的ID，其次使用baseUserInfo中的ID
        const currentUserId = userStore.userInfo?.id || userStore.baseUserInfo?.id;
        if (!currentUserId) {
            // 移除不必要的提示
            console.error('无法获取有效的用户ID');
            return;
        }
        
        // 使用新的完整解除认证接口
        const res = await fullCancelAuthRequest(currentUserId);
        if (res.data.code === '00000') {
            Message.success('解除认证成功');
            isAuthenticated.value = false;
            userAuthInfo.value = {};
            userStore.updateAuthStatus(0);
        } else {
            Message.error(res.data.msg || '解除认证失败，请稍后重试');
        }
    } catch (error) {
        console.error('解除认证失败', error);
        // 检查是否已经在http拦截器中显示了消息
        // 如果是服务器返回的业务错误（带有自定义状态码），拦截器已经显示过消息，这里不再显示
        if (!error.data || !error.data.code) {
            // 只有在网络错误或其他非业务错误时才显示这个通用消息
            Message.error('解除认证请求失败，请检查网络连接或稍后重试');
        }
    }
};

onMounted(async () => {
    // 确保用户信息已加载
    authLoading.value = true;
    
    // 检查token是否存在
    if (!userStore.token) {
        console.warn('用户未登录，无法获取认证信息');
        authLoading.value = false;
        isAuthenticated.value = false;
        // 这里不再显示警告，因为是在用户设置页面中
        return;
    }
    
    try {
        // 尝试获取用户完整信息
        let userData = userStore.userInfo;
        if (!userData || !userData.id) {
            console.log('正在获取用户完整信息...');
            userData = await userStore.getUserInfo();
        }
        
        // 先从用户信息判断认证状态
        if (userData && userData.authId) {
            console.log('用户信息中有authId，预先设置为已认证状态');
            isAuthenticated.value = true;
            userStore.updateAuthStatus(1);
        }
        
        // 如果仍然获取不到完整用户信息，尝试获取基本信息
        if (!userData || !userData.id) {
            console.log('用户完整信息获取失败，尝试获取基本信息...');
            const baseData = await userStore.getBaseUserInfo();
            
            if (baseData && baseData.id) {
                console.log('使用基本信息中的用户ID:', baseData.id);
                // 使用基本信息中的ID获取认证信息
                try {
                    const res = await getUserAuthInfoRequest(baseData.id);
                    processAuthInfoResponse(res);
                } catch (error) {
                    console.error('使用基本信息ID获取认证信息失败', error);
                    // 检查是否是正常的业务响应（A0000，用户未认证）
                    if (error.data && error.data.code === 'A0000' && error.data.msg === '用户未完成认证') {
                        console.log('用户未完成认证（正常业务响应，从异常中获取）');
                        isAuthenticated.value = false;
                        userStore.updateAuthStatus(0);
                        
                        // 再次检查用户信息中的authId
                        if (userStore.userInfo && userStore.userInfo.authId) {
                            console.log('但用户信息中有authId，可能存在数据不一致');
                            isAuthenticated.value = true;
                            userStore.updateAuthStatus(1);
                        }
                    } else {
                        // 真正的异常情况
                        isAuthenticated.value = false;
                        userStore.updateAuthStatus(0);
                    }
                }
            } else {
                console.error('无法获取有效的用户ID');
                isAuthenticated.value = false;
                userStore.updateAuthStatus(0);
                // 移除此警告提示
            }
        } else {
            // 使用完整用户信息获取认证信息
            fetchUserAuthInfo();
        }
        
        // 组件挂载后，延迟再次检查认证状态
        setTimeout(refreshAuthStatus, 1000);
    } catch (error) {
        console.error('初始化用户信息失败', error);
        isAuthenticated.value = false;
        userStore.updateAuthStatus(0);
        // 移除此警告提示
    } finally {
        authLoading.value = false;
    }
});
</script>

<style lang="less" scoped>
.school-auth-container {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    
    .auth-card {
        margin-bottom: 30px;
        min-height: 300px;
        box-shadow: none;
        border: none;
        background-color: var(--color-bg-2);
        border-radius: 8px;
        
        :deep(.arco-card-header) {
            border-bottom: none;
        }
        
        :deep(.arco-card-body) {
            padding: 24px;
        }
        
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 200px;
            
            p {
                margin-top: 10px;
                color: var(--color-text-3);
            }
        }
        
        .auth-success {
            display: flex;
            flex-direction: column;
            align-items: center;
            
            .auth-actions {
                margin-top: 24px;
            }
        }
        
        .auth-form {
            max-width: 400px;
            margin: 0 auto;
            padding: 16px;
            
            :deep(.arco-form-item-label) {
                font-weight: 500;
            }
            
            :deep(.arco-input) {
                border-radius: 6px;
            }
            
            :deep(.arco-btn) {
                border-radius: 6px;
                height: 40px;
                margin-top: 8px;
            }
        }
        
        .verify-result {
            .student-info {
                text-align: left;
                margin: 16px 0;
                padding: 16px;
                background-color: var(--color-fill-2);
                border-radius: 8px;
                
                p {
                    margin: 12px 0;
                    
                    span {
                        font-weight: 500;
                        margin-right: 12px;
                        color: var(--color-text-2);
                    }
                }
            }
            
            .action-buttons {
                display: flex;
                justify-content: center;
                gap: 16px;
                margin-top: 8px;
                
                :deep(.arco-btn) {
                    border-radius: 6px;
                    height: 40px;
                    min-width: 120px;
                }
            }
        }
    }
    
    .auth-tips {
        box-shadow: none;
        border: none;
        background-color: var(--color-bg-2);
        border-radius: 8px;
        
        :deep(.arco-card-header) {
            border-bottom: none;
            padding-bottom: 0;
            
            .arco-card-header-title {
                font-weight: 600;
                font-size: 18px;
                color: var(--color-text-1);
            }
        }
        
        ol {
            padding-left: 20px;
            
            li {
                margin-bottom: 12px;
                color: var(--color-text-2);
                line-height: 1.6;
            }
        }
    }
}
</style>