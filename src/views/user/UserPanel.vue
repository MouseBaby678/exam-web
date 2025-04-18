<template>
  <a-card :bordered="false">
    <a-space :size="54">
      <a-upload
        :custom-request="customRequest"
        list-type="picture-card"
        :file-list="fileList"
        :show-upload-button="true"
        :show-file-list="false"
      >
        <template #upload-button>
          <a-avatar :size="100" class="info-avatar">
            <template #trigger-icon>
              <icon-camera />
            </template>
            <img v-if="fileList.length" :src="getImageUrl(fileList[0].url)" />
          </a-avatar>
        </template>
      </a-upload>
      <a-descriptions
        :data="renderData"
        :column="2"
        align="right"
        layout="inline-horizontal"
        :label-style="{
          width: '140px',
          fontWeight: 'normal',
          color: 'rgb(var(--gray-8))',
        }"
        :value-style="{
          width: '200px',
          paddingLeft: '8px',
          textAlign: 'left',
        }"
      >
        <template #label="{ label }">{{ label }}:</template>
        <template #value="{ value, data }">
          <a-tag
            v-if="data.label === '学校认证'"
            :color="userStore.isAuthenticated ? 'green' : 'orange'"
            size="small"
          >
            {{ userStore.isAuthenticated ? "已认证" : "未认证" }}
          </a-tag>
          <span v-else>{{ value }}</span>
        </template>
      </a-descriptions>
    </a-space>
  </a-card>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue';
  import useUserStore from '../../sotre/user-store';
  import {uploadAvatar} from '../../apis/file-api'
  import {imageUploadHandle,getImageUrl} from '../../utils/image'
  const userStore = useUserStore();
  const file = {
    uid: '-2',
    name: 'avatar.png',
    url: userStore.userInfo.picture,
  };
  const renderData = ref([
    {
      label: '昵称',
      value: userStore.baseUserInfo.nickname,
    },
    {
      label: '学校认证',
      value: userStore.isAuthenticated ? "已认证" : "未认证",
    },
    {
      label: '用户名',
      value: userStore.baseUserInfo.username,
    },
    {
      label: '手机号',
      value: userStore.baseUserInfo.phone,
    },
    {
      label: '注册时间',
      value: userStore.baseUserInfo.createdAt,
    },
  ]);
  const fileList = ref([file]);
  const customRequest = (options) => {
    return imageUploadHandle(options,uploadAvatar,(res)=>{
      const path=res.data.data;
      fileList.value[0].url=path
      userStore.userInfo.picture=path
      userStore.baseUserInfo.picture=path
    })
  };

  onMounted(async () => {
    // 确保用户信息已加载
    if (!userStore.userInfo && !userStore.baseUserInfo) {
      try {
        // 先尝试获取用户完整信息
        await userStore.getUserInfo();
        
        // 如果完整信息获取失败，尝试获取基本信息
        if (!userStore.userInfo) {
          await userStore.getBaseUserInfo();
        }
      } catch (error) {
        console.error('加载用户信息失败', error);
      }
    }
    
    // 获取认证状态
    userStore.getAuthStatus();
  });

  // 添加watcher监听认证状态变化
  watch(() => userStore.isAuthenticated, (newVal) => {
    console.log('认证状态变化，更新显示', newVal);
    renderData.value[1].value = newVal ? "已认证" : "未认证";
  });
</script>

<style scoped lang="less">
  .arco-card {
    padding: 14px 0 4px 4px;
    border-radius: 4px;
  }
  :deep(.arco-avatar-trigger-icon-button) {
    width: 32px;
    height: 32px;
    line-height: 32px;
    background-color: #e8f3ff;
    .arco-icon-camera {
      margin-top: 8px;
      color: rgb(var(--arcoblue-6));
      font-size: 14px;
    }
  }
</style>
