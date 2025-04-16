import axios from 'axios'
import useUserStore from "../sotre/user-store";
import { Message } from '@arco-design/web-vue';

var instance = axios.create({
    // baseURL: process.env.VUE_APP_API_URL,
    timeout: 10000,
});
// 添加请求拦截器
instance.interceptors.request.use(function(config) {
    const userStore=useUserStore();
    // 在发送请求之前做些什么
    if(userStore.token!=""){
        config.headers['Authorization'] = userStore.token
    }
    // config.headers['X-Requested-With'] = 'XMLHttpRequest'
    return config;
}, function(error) {
    // 对请求错误做些什么
    return Promise.reject(error);
});

// 添加响应拦截器
instance.interceptors.response.use(function(response) {
        
        // 对响应数据做点什么
        // Message('操作成功')
        const authorization=response.headers.authorization
        if (authorization) {
            const userStore=useUserStore();
            userStore.token=authorization
            console.log(authorization)
        }
        //获取自定义状态码
        const code=response.data.code
        console.log(code)
        //如果自定义状态码存在
        if(code&&code!="00000"){
            const msg=response.data.msg
            if(code.startsWith("0")){
                Message.success(msg)
                return response
            }
            // 特殊处理 A0000 用户未认证的情况，这是正常业务流程不应当视为错误
            if(code === "A0000" && msg === "用户未完成认证"){
                console.log('用户未认证状态（A0000），作为正常响应处理');
                return response
            }
            if(code.startsWith("A")){
                Message.info(msg)
            }else if(code.startsWith("B")){
                Message.warning(msg)
            }else{
                Message.error(msg)
            }
           return Promise.reject(response)
        }
        return response
    },
    function(error) {
        if(error.response){
            if(error.response.status==500){
                Message.error("服务器连接失败~");
            } else if(error.response.status==401){
                Message.error("认证失败，请重新登录");
            } else if(error.response.status==400){
                // 根据响应内容提供更具体的信息
                if(error.response.data && error.response.data.error_description){
                    Message.error(error.response.data.error_description);
                } else {
                    Message.error("请求参数错误");
                }
            } else {
                Message.error("请求失败，请稍后再试");
            }
            return Promise.reject(error.response);
        } else {
            Message.error("网络连接异常");
            return Promise.reject(error);
        }
    });
export default instance;