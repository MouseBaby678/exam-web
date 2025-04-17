<template>
  <div v-if="hasAccess">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import useUserStore from '../sotre/user-store';
import useCourseStore from '../sotre/course-store';

const props = defineProps({
  // 需要的角色: 'teacher', 'student', 'any'
  requiredRole: {
    type: String,
    default: 'any'
  },
  // 是否需要是课程创建者
  requireCourseCreator: {
    type: Boolean,
    default: false
  },
  // 是否需要是课程管理员
  requireCourseManager: {
    type: Boolean,
    default: false
  }
});

const userStore = useUserStore();
const courseStore = useCourseStore();

const hasAccess = computed(() => {
  // 角色检查
  if (props.requiredRole !== 'any') {
    if (props.requiredRole === 'teacher' && !userStore.isTeacher) {
      return false;
    }
    if (props.requiredRole === 'student' && !userStore.isStudent) {
      return false;
    }
  }

  // 课程创建者检查
  if (props.requireCourseCreator && !courseStore.isTeacher) {
    return false;
  }

  // 课程管理员检查
  if (props.requireCourseManager && !courseStore.isCourseManager) {
    return false;
  }

  return true;
});
</script> 