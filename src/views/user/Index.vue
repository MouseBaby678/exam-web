<template>
  <div class="container">
    <a-row style="margin-bottom: 16px">
      <a-col :span="24">
        <UserPanel />
      </a-col>
    </a-row>
    <ADivider/>
    <a-row class="wrapper">
      <a-col :span="24">
        <a-tabs :active-key="activeTab" type="rounded" @tab-click="handleTabChange">
          <a-tab-pane key="1" title="基础信息">
            <UserInfo />
          </a-tab-pane>
          <a-tab-pane key="2" title="安全设置">
            <SecuritySettings />
          </a-tab-pane>
          <a-tab-pane key="3" title="学校认证">
            <SchoolAuth />
          </a-tab-pane>
        </a-tabs>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import UserPanel from './UserPanel.vue';
  import UserInfo from "./UserInfo.vue";
  import SecuritySettings from './SecuritySetting.vue';
  import SchoolAuth from './SchoolAuth.vue';
  
  const route = useRoute();
  const router = useRouter();
  const activeTab = ref('1');
  
  // 组件名称定义
  defineOptions({
    name: 'Setting',
  });

  // 处理URL参数中的tab
  const handleRouteChange = () => {
    const tab = route.query.tab;
    if (tab && ['1', '2', '3'].includes(tab)) {
      activeTab.value = tab;
    }
  };

  // 监听路由变化
  watch(() => route.query, handleRouteChange);

  // 切换标签时更新URL
  const handleTabChange = (key) => {
    activeTab.value = key;
    router.push({ query: { ...route.query, tab: key } });
  };

  onMounted(() => {
    handleRouteChange();
  });
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
  }

  .wrapper {
    padding: 20px 0 0 20px;
    min-height: 580px;
    background-color: var(--color-bg-2);
    border-radius: 4px;
  }

  :deep(.section-title) {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 14px;
  }
</style>
