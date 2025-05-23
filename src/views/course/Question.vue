<template>

    <a-page-header v-if="!props.selectMode" title="题库中心" @back="$router.back">
        <template #breadcrumb>
            <a-breadcrumb>
                <a-breadcrumb-item>
                    <img src="../../assets/svg/logo.svg" style="margin-right: 8px;height: 10px;vertical-align: middle;" />{{ courseStore.courseInfo.name }}
                </a-breadcrumb-item>
                <template v-for="item of navList">
                    <a-breadcrumb-item v-if="item.id != ''">{{ item.name }}</a-breadcrumb-item>
                </template>
            </a-breadcrumb>
        </template>
        <template #extra>
            <RoleAccess required-role="teacher" :require-course-manager="true">
                <div class="opearte_area" v-if="!props.selectMode">
                    <a-button-group>
                    <a-dropdown :popup-max-height="false" trigger="hover">
                        <a-button status="info">
                            <template #icon>
                                <icon-edit />
                            </template>
                            批量操作
                        </a-button>
                        <template #content>
                            <a-doption @click="batchDelete"><span style="padding: 0 15px;">批量删除</span></a-doption>
                            <a-doption @click="batchUpdateVisibility('overt')"><span style="padding: 0 15px;">设为公开</span></a-doption>
                            <a-doption @click="batchUpdateVisibility('course')"><span style="padding: 0 15px;">课程可见</span></a-doption>
                            <a-doption @click="batchUpdateVisibility('self')"><span style="padding: 0 15px;">仅自己可见</span></a-doption>
                        </template>
                    </a-dropdown>

                    <a-dropdown :popup-max-height="false" trigger="hover">
                        <a-button type="primary">
                            <template #icon>
                                <icon-plus />
                            </template>
                            创建题目
                        </a-button>
                        <template #content>
                            <a-doption v-for="item of questionType" @click="createQuestion(item.enumName)"><span
                                    style="padding: 0 15px;">{{ item.simpleName }}</span></a-doption>

                        </template>
                    </a-dropdown>
                    <a-button status="success" @click="toBatchImport">
                        <template #icon>
                            <icon-upload />
                        </template>
                        导入题库
                    </a-button>
                </a-button-group>
                </div>
            </RoleAccess>
        </template>
    </a-page-header>
    <div class="question-wrap">
        <QuestionTagTree @select="select" class="tag-tree"></QuestionTagTree>
        <div class="question-detail">
            <!-- 创建/更新区 -->
            <div v-if="visible">
                <a-page-header title="返回列表" @back="back">
                </a-page-header>
                <BaseQuestionPreview v-if="editMode=='display'" :showArea="true" :question="questionInfo"
                    :topic-type="questionInfo['type']" :options="questionInfo['options']"></BaseQuestionPreview>
                <QuestionEditView v-else :question="questionInfo"
                    :topic-type="questionInfo['type']" :options="questionInfo['options']"/>

            </div>
            <!-- 题目列表 -->
            <div v-show="!visible">
                <a-table :columns="columns" @selection-change="selectRow" :data="questionList" row-key="id"
                    :row-selection="rowSelection" v-model:selectedKeys="selectedKeys" :loading="loading"
                    column-resizable :pagination="{ total: total, current: page }" @page-change="pageChange">
                    <template #content="{ record, rowIndex }">
                        <TextEditor mode="preview" :model-value="record.content.substring(0,250)"></TextEditor>
                    </template>
                    <template #type="{ record, rowIndex }">
                        <a-tag>{{ getQuestionType(record.type).simpleName }}</a-tag>
                    </template>
                    <template #difficulty="{ record, rowIndex }">
                        <a-rate :default-value="record.difficulty" readonly allow-half />
                    </template>
                    <template #isPublic="{ record, rowIndex }">
                        <a-tag>{{ getQuestionVisble(record.isPublic).name }}</a-tag>
                    </template>
                    <template #edit="{ record, rowIndex }">
                        <a-button status="danger" v-if="isTeacher" @click="delQuestion(record.id)"
                            style="margin-right: 10px;">
                            <template #icon>
                                <icon-delete />
                            </template>
                        </a-button>
                        <a-button style="margin-right: 10px;" @click="seeQuestion(record.id, true)">
                            <template #icon>
                                <icon-search />
                            </template>
                        </a-button>
                        <a-button type="primary" v-if="isTeacher" @click="seeQuestion(record.id, false)">
                            <template #icon>
                                <icon-edit />
                            </template>
                        </a-button>
                    </template>
                </a-table>
            </div>
        </div>
    </div>
</template>
<script setup>
import { useRoute, useRouter } from 'vue-router';
import { reactive, ref, watch } from 'vue';
import useCourseStore from '../../sotre/course-store';
import QuestionTagTree from '../../components/QuestionTagTree.vue';
import { questionType, getQuestionType, getQuestionVisble } from '../../utils/question-config.js'
import { 
    questionListRequest, 
    delQuestionRequest, 
    questionDetailRequest, 
    batchDeleteQuestionRequest,
    batchUpdateVisibilityRequest
} from '../../apis/question-api';
import QuestionEditView from '../../components/QuestionEditView.vue';
import BaseQuestionPreview from '../../components/BaseQuestionPreview.vue';
import TextEditor from '../../components/TextEditor.vue';
import RoleAccess from '../../components/RoleAccess.vue';
import { Message, Modal } from '@arco-design/web-vue';

const props = defineProps({
    selectMode: {
        type: Boolean,
        defalut: false
    },
    selectKes: {
        type: Array,
        default: () => []
    }
})
const emit = defineEmits([
    'update:selectKes',
    'select',
]);
const selectedKeys = ref(props.selectKes);
const rowSelection = reactive({
    type: 'checkbox',
    showCheckedAll: true,
    onlyCurrent: false,
});
const courseStore = useCourseStore()
const route = useRoute();
const router=useRouter()

const isTeacher = courseStore.isTeacher
const navList = ref([])
const courseId = route.params['courseId']
const currTagId = ref('');
const page = ref(1);
const total = ref(1);

const loading = ref(false)
const visible = ref(false)

const questionList = ref([])
const editMode = ref('editor')
const questionInfo = ref({

})
watch(() => props.selectKes, (keys) => {
    selectedKeys.value = keys;
})
const selectRow = (data) => {
    console.log(data)
    emit('update:selectKes', data)
}

//选择目录
const select = (nodeData, tree) => {
    navList.value = tree;
    currTagId.value = nodeData?.id
    page.value = 1
    getQuestList()
    console.log("获取标签树", nodeData)
}
// 删除问题
const delQuestion = (id) => {
    delQuestionRequest(id).then(res => {
        getQuestList()
    })
}
const back = () => {
    visible.value = false
    getQuestList()
}
const toBatchImport=()=>{
    router.push({
        name:"BatchImportQuestion",
        query:{
            tagId:currTagId.value
        }
    })
}
const getQuestList = () => {
    loading.value = true
    questionListRequest(courseId, page.value, currTagId.value).then(res => {
        const data = res.data.data
        console.log(data)
        questionList.value = data.list;
        total.value = data.total;
        page.value = data.current
        loading.value = false
    })
}
const createQuestion = (type) => {
    console.log(type)
    editMode.value = 'editor'
    questionInfo.value = {}
    questionInfo.value['type'] = type
    questionInfo.value['courseId'] = courseId
    questionInfo.value['tagId'] = currTagId.value
    questionInfo.value['options']=[{content:''}]
    visible.value = true;
}
//查看题目
const seeQuestion = (questionId, isPreview = false) => {
    questionDetailRequest(questionId).then(res => {
        questionInfo.value = res.data.data
        if (isPreview) {
            editMode.value = 'display'
        } else {
            editMode.value = 'editor'
        }
        visible.value = true;
    })

}
const pageChange = (num) => {
    page.value = num
    getQuestList()
}
getQuestList()
const columns = [
    {
        title: '题目',
        dataIndex: 'content',
        ellipsis: true,
        slotName: 'content',
        // tooltip: true,
    },

    {
        title: '难度',
        dataIndex: 'difficulty',
        slotName: 'difficulty',
        width: 160,


    },
    {
        title: '类别',
        dataIndex: 'type',
        slotName: 'type',
        width: 80,

    },

];
if (!props.selectMode) {
    columns.push({
        title: '可见度',
        dataIndex: 'isPublic',
        slotName: 'isPublic',
        width: 80,

    }, {
        title: '编辑',
        dataIndex: 'edit',
        width: 170,
        slotName: 'edit'
    },)
}

// 批量删除题目
const batchDelete = () => {
    if (selectedKeys.value.length === 0) {
        Message.warning('请先选择要操作的题目');
        return;
    }

    Modal.confirm({
        title: '批量删除题目',
        content: `确定要删除选中的 ${selectedKeys.value.length} 个题目吗？此操作不可恢复！`,
        okText: '确认删除',
        cancelText: '取消',
        onOk: () => {
            loading.value = true;
            batchDeleteQuestionRequest(selectedKeys.value).then(res => {
                console.log(res)
                if (res.data.code === '00001') {
                    selectedKeys.value = [];
                    getQuestList();
                } else {
                    Message.error(`删除失败: ${res.data.msg || '未知错误'}`);
                }
            }).catch(err => {
                console.error('批量删除出错:', err);
                Message.error(`操作异常: ${err.message || '未知错误'}`);
            }).finally(() => {
                loading.value = false;
            });
        }
    });
};

// 批量更新题目可见性
const batchUpdateVisibility = (visibility) => {
    if (selectedKeys.value.length === 0) {
        Message.warning('请先选择要操作的题目');
        return;
    }

    const visibilityName = {
        'overt': '公开',
        'course': '课程可见',
        'self': '仅自己可见'
    }[visibility];

    Modal.confirm({
        title: '批量修改可见性',
        content: `确定将选中的 ${selectedKeys.value.length} 个题目设置为"${visibilityName}"吗？`,
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
            loading.value = true;
            batchUpdateVisibilityRequest(selectedKeys.value, visibility).then(res => {
                if (res.data.code === '00001') {
                    selectedKeys.value = [];
                    getQuestList();
                } else {
                    Message.error(`操作失败: ${res.data.msg || '未知错误'}`);
                }
            }).catch(err => {
                console.error('批量更新可见性出错:', err);
                Message.error(`操作异常: ${err.message || '未知错误'}`);
            }).finally(() => {
                loading.value = false;
            });
        }
    });
};
</script>
<style lang="less" scoped>
:deep(.arco-rate-character) {
    margin: 0;
    // font-size: 20px;
    // line-height: 20px;
}

.question-wrap {
    display: flex;

    .tag-tree {
        position: sticky;
        top: 60px;
        width: 240px;
        padding-right: 10px;
        margin-right: 10px;
        border-right: 2px solid var(--color-fill-2);
    }

    .question-detail {
        flex: 1;

        .opearte_area {
            padding: 10px 0;
        }
    }
}
</style>