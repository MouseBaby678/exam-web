import axios from '../utils/http'
///登录
export const loginRequest=(username,password)=>{
    return axios.post(`/aapi/oauth/token?client_secret=123456&grant_type=password&username=${username}&password=${password}&client_id=exam-app`)
}

///注册
export const registerRequest=(params,code)=>{
    return axios.post(`/uapi/public/user/register?code=${code}`,params)
}
// 找回密码
export const forgetPassRequest=(email,code,password)=>{
    return axios.post(`/uapi/public/user/forgetPass?email=${email}&code=${code}`, {password: password})
}
// 发送邮箱验证码
export const sendEmailCodeRequest=(type,email)=>{
    return axios.post(`/uapi/public/user/sendEmailCode?type=${type}&email=${email}`)
}

// 校验学生信息
export const verifyStudentRequest=(jobNo, realName)=>{
    return axios.post(`/uapi/school-auth/verify?jobNo=${jobNo}&realName=${realName}`)
}

// 绑定学生认证
export const bindStudentAuthRequest=(userId, studentId)=>{
    return axios.post(`/uapi/school-auth/bind?userId=${userId}&studentId=${studentId}`)
}

// 获取用户认证信息
export const getUserAuthInfoRequest=(userId)=>{
    return axios.get(`/uapi/school-auth/info/${userId}`)
}

// 解除用户认证
export const cancelAuthRequest=(userId)=>{
    return axios.delete(`/uapi/school-auth/${userId}`)
}

// 清空用户auth_id（用于解决解除认证时的外键约束问题）
export const clearUserAuthIdRequest=(userId)=>{
    return axios.post(`/uapi/user/clear-auth/${userId}`)
}

// 完整解除认证流程（替代原有的取消认证方法）
export const fullCancelAuthRequest=(userId)=>{
    return axios.post(`/uapi/school-auth/full-cancel/${userId}`)
}
