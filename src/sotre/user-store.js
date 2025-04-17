import { defineStore } from 'pinia' 
import { userAuthInfoRequest, baseUserInfoRequest, getAuthStatusRequest } from '../apis/user-api'
import SocketService from '../utils/web-stocket-service.js'
import {getImageUrl} from '../utils/image'
import {IconApps} from "@arco-design/web-vue/es/icon";

const useUserStore = defineStore({ 
    id: 'user', 
    state: () => ({ 
        token:null,
        userInfo:null,
        baseUserInfo:null,
        authStatus: null, // 认证状态：0-未认证，1-已认证
        theme:'light'
    }),
    getters:{
        isLogin: (state) => state.token!=null,
        isAuthenticated: (state) => state.authStatus === 1,
        // 判断是否为教师（role=1）
        isTeacher: (state) => state.baseUserInfo?.role === '1',
        // 判断是否为学生（role=0）
        isStudent: (state) => state.baseUserInfo?.role === '0',
        menu:()=>{
            return [
                {
                    name: "个人信息",
                    icon: IconApps,
                    key: "UserInfo",
                    params: {},
                    visble: true,
                },
                {
                    name: "学校认证",
                    icon: IconApps,
                    key: "SchoolAuth",
                    params: {},
                    visble: true,
                },
                {
                    name: "安全设置",
                    icon: IconApps,
                    key: "LoginManagement",
                    params: {},
                    visble: true,
                },
                {
                    name: "系统设置",
                    icon: IconApps,
                    key: "SystemSetting",
                    params: {},
                    visble: true,
                }
            ]
        }
    },
    actions:{
        async getUserInfo(){
            try {
                const resp = await userAuthInfoRequest()
                const data = resp.data.data;
                data.picture = getImageUrl(data.picture)
                this.userInfo = data
                
                // 获取认证状态
                if (data && data.id) {
                    await this.getAuthStatus()
                }
                
                return data
            } catch (error) {
                console.error('获取用户信息失败', error)
                return null
            }
        },
        async getBaseUserInfo(){
            try {
                const resp = await baseUserInfoRequest()
                const data = resp.data.data;
                data.picture = getImageUrl(data.picture)
                this.baseUserInfo = data

                // 在控制台打印用户类型
                const roleText = data.role === '1' ? '教师' : '学生';
                console.log(`当前用户角色: ${roleText}`, {
                    用户ID: data.username,
                    用户名: data.nickname,
                    角色值: data.role
                });

                return data
            } catch (error) {
                console.error('获取用户基本信息失败', error)
                return null
            }
        },
        async getAuthStatus(){
            // 尝试从userInfo或baseUserInfo中获取用户ID
            let userId = null;
            
            if (this.userInfo && this.userInfo.id) {
                userId = this.userInfo.id;
            } else if (this.baseUserInfo && this.baseUserInfo.id) {
                userId = this.baseUserInfo.id;
                console.log('使用baseUserInfo中的ID获取认证状态:', userId);
            } else {
                console.warn('获取认证状态：未找到有效的用户ID, 将默认设置为未认证状态');
                this.authStatus = 0;
                return;
            }
            
            try {
                const resp = await getAuthStatusRequest()
                if (resp.data.code === '00000') {
                    this.authStatus = resp.data.data.status
                } else {
                    this.authStatus = 0
                }
            } catch (error) {
                console.error('获取认证状态失败', error)
                this.authStatus = 0
            }
        },
        toggleTheme(dark){
            if (dark) {
                this.theme = 'dark';
                document.body.setAttribute('arco-theme', 'dark');
              } else {
                this.theme = 'light';
                document.body.removeAttribute('arco-theme');
              }
        },
        updateAuthStatus(status) {
            this.authStatus = status
        },
        logOut(){
            this.userInfo = null
            this.token = null
            this.baseUserInfo = null
            this.authStatus = null
            SocketService.instance?.close()
        }
    },
    persist: {
        enabled: true,
    }
}) 
export default useUserStore