<template>
    <router-link to="/" class="header-logo">
        <img class="logo" src="../../assets/svg/logo.svg" />
        <h1 class="name">为考</h1>
    </router-link>
    <div class="login">
        <div class="login-wrap">
            <div class="login-left">
                <div v-html="slogan"></div>
            </div>
            <div class="login-right">
                <div class="login-right-wrap">
                    <h3 class="title">{{ title }}</h3>
                    <!-- 标签选项 -->
                    <Tabs style="margin:20px 0" v-model:tag="loginType" :tagList="tagList" @tab-click="taggleTag" />
                    <!-- 操作表单 -->
                    <tags-form v-model:loginType="loginType" :tagList="tagList"></tags-form>
                    <div v-show="loginType == 0">
                        <div class="protocol">
                            点击「登录」表示已阅读并同意 <a style="color:rgb(var(--primary-6))">服务条款</a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useUserStore from '../../sotre/user-store';
import TagsForm from './TagsForm.vue';
import Tabs from '@/components/Tabs.vue'

const title = ref("")
const app_name = import.meta.env.VITE_APP_NAME
const slogan = import.meta.env.VITE_APP_LOGIN_SLOGAN
// 登录类型：0：登录，1：注册，2：找回密码
const loginType = ref(0)
const tagList = [
    {
        name: '登录',
        loginType: 0,
        title: `登录你的${app_name}账户`
    },
    {
        name: '注册',
        loginType: 1,
        title: `注册你的${app_name}账户`
    },
    {
        name: '找回密码',
        loginType: 2,
        title: `找回你的${app_name}账户`
    }
]
const route = useRoute()
const router = useRouter();
const userStore = useUserStore();

// 确认标签
const checkTag = (type) => {
    type = parseInt(type)
    switch (type) {
        case 0:
            loginType.value = 0
            break
        case 1:
            loginType.value = 1
            break
        case 2:
            loginType.value = 2
            break
        default: loginType.value = 0
    }
    title.value = tagList[loginType.value].title
}
checkTag(route.query.type)
watch(() => route.query.type, (type) => {
    checkTag(type)
})
// 选择标签
const taggleTag = (val) => {
    router.push({
        name: "Login",
        query: {
            type: val
        }
    })
}
console.log(app_name)

</script>
<style lang="less" scoped>
.header-logo {
    position: fixed;
    top: 40px;
    left: 40px;
    display: flex;
    align-items: center;
    margin-right: 20px;

    .logo {
        height: 30px;
        width: 30px;
        padding: 5px;
        background-color: var(--color-bg-1);
        border-radius: 5px;
    }

    .name {
        text-align: center;
        font-weight: bold;
        font-size: 24px;
        font-weight: bold;
        margin-left: 10px;
        color: #fff;
    }
}

.login {
    background-image: url('@/assets/img/login_bg.jpg');
    background-size: cover;
    background-attachment: fixed;

    .header-logo {
        position: fixed;
        top: 40px;
        left: 40px;
    }

    .login-wrap {
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;

        .login-left,
        .login-right {
            flex: 1;
        }

        .login-left {
            font-size: 2rem;
            font-weight: 500;
            margin-bottom: 24px;
            line-height: 1.4;
            color: var(--color-bg-1);
            display: flex;
            justify-content: center;
        }

        .login-right {
            display: flex;
            justify-content: center;
            box-sizing: border-box;
            width: 100%;

            .login-right-wrap {
                border-radius: 20px;
                padding: 60px;
                background: var(--color-bg-1);
                border-radius: 1px solid #000;
                box-shadow: var(--shadow-3);
                width: 350px;

                // min-width: 300px;
                .title {
                    font-size: 22px;
                    font-weight: 500;
                    line-height: 30px;
                    text-align: center;
                    color: var(--color-text-2);
                    margin-bottom: 28px;
                }

                .protocol {
                    text-align: center;
                    margin-top: 20px;
                    color: var(--color-text-3);
                    font-size: 14px;
                }
            }

        }
    }

}

@media screen and(max-width: 600) {
    .login {
        .login-wrap {
            .login-left {
                display: none;
            }

            .login-right {
                background: rgba()var(--color-bg-1);
            }
        }
    }
}</style>
