import axios from '../utils/http'
export const uploadAvatar=(image,config)=>{
    return axios.post(`/uapi/user/upload-avatar`,image,config)
}
export const uploadCourseCover=(image,config)=>{
    return axios.post(`/uapi/courses/upload-cover`,image,config)
}

// 生成课程封面API
export const generateCourseCover=(courseName)=>{
    return axios.post(`/uapi/courses/generate-cover`, { courseName })
}