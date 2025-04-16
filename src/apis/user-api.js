import axios from '../utils/http'
///登录
export const userInfoRequest=()=>{
    return axios.get(`/uapi/user/info`)
}
export const baseUserInfoRequest=()=>{
    return axios.get(`/uapi/user/base/info`)
}
export const userAuthInfoRequest=()=>{
    return axios.get(`/uapi/user-auth/info`)
}

// 更新用户基本信息
export const updateUserInfoRequest=(userInfo)=>{
    return axios.post(`/uapi/user/update/info`, userInfo)
}

// 更新用户密码
export const updatePasswordRequest=(oldPassword, newPassword)=>{
    return axios.post(`/uapi/user/update/password`, {
        oldPassword,
        newPassword
    })
}

// 获取用户学校认证状态
export const getAuthStatusRequest=()=>{
    return axios.get(`/uapi/school-auth/status`)
}
