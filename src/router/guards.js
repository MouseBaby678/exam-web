import useCourseStore from "../sotre/course-store"

export const courseGuard=async (to,from)=>{
    // 获取课程学习
  if (to.path.startsWith("/course/")) {
    // 检查是否为课程中心路径 - role 参数为 'student' 或 'teacher'
    if (to.name === 'CourseCenter' || to.name === 'CourseCenterRole') {
      // 课程中心路径，不需要加载特定课程信息
      return;
    }
    
    // 否则是具体课程路径，需要加载课程信息
    const courseStore=useCourseStore()
    const courseId = to.params["courseId"]
    // 确保 courseId 是数字
    if (courseId && !isNaN(courseId)) {
      const courseInfo = courseStore.courseInfo
      //获取课程和班级列表
      if (courseInfo.id != courseId) {
        await courseStore.getCourseInfo(courseId)
      //   await courseStore.getClassList(courseId)
      }
    }
  }
}
