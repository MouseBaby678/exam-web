<template>
    <a-page-header title="导入题库" @back="$router.back">
        <template #extra>
            <a-button-group style="margin-right:10px;">
                <!-- 移除题目配置按钮
                <a-button @click="configModal = true">
                    <template #icon>
                        <icon-sort />
                    </template>
                    题目配置
                </a-button>
                -->
            </a-button-group>
            <a-button-group>
                <a-button status="success" @click="analyzeText">
                    <template #icon>
                        <icon-search />
                    </template>
                    预览
                </a-button>
                <a-button type="primary" @click="startImport"><template #icon>
                        <icon-share-external />
                    </template>导入</a-button>
            </a-button-group>
        </template>
    </a-page-header>
    <a-spin dot :loading="loading" style="display:block">
        <div class="batch-import">
        <BaseTextEditor :config="editorConfig" v-model:model-value="text" :edit-hight="300" class="editor"></BaseTextEditor>
        <AList :max-height="400" class="preview">
            <template #header>
                <h1>预览区</h1>
            </template>
            <AListItem v-for="(item, index) in list" :key="index">
                <div v-if="isPreviewReady">
                    <BaseQuestionPreview 
                        :number="index + 1" 
                        :topic-type="item.type" 
                        :question="item"
                        :options="item.options || []"
                        :showArea="{difficulty: true, analysis: !!item.analysis}"
                    ></BaseQuestionPreview>
                </div>
                <a-skeleton v-else :animation="true" :loading="true">
                    <a-skeleton-line :rows="3" />
                    <a-skeleton-shape shape="circle" />
                </a-skeleton>
            </AListItem>
        </AList>
    </div>
    </a-spin>
   
    <a-modal simple v-model:visible="tagModal" title="选择导入分组">
        <QuestionTagTree @select="selectTag" />
        <template #footer>
            <a-space>
                <a-button @click="tagModal = false">取消</a-button>
                <a-button type="primary" :disabled="tagId === undefined || tagId === null" @click="confirmImport">确定导入</a-button>
            </a-space>
        </template>
    </a-modal>
    <a-modal simple v-model:visible="resultMode" title="导入结果">
        <div class="batchResult">
            <a-statistic class="success" title="成功个数" :value="batchSuccesCount" :value-from="0" animation>
                <template #prefix>
                    <icon-arrow-rise />
                </template>
                <template #suffix>题</template>
            </a-statistic>

            <a-statistic class="failed" title="失败个数" :value="batchResult.length - batchSuccesCount" :value-from="0"
                animation>
                <template #prefix>
                    <icon-arrow-rise />
                </template>
                <template #suffix>题</template>
            </a-statistic>
        </div>
        <a-list :max-height="300">
            <a-list-item v-for="(item, index) of list">
                <a-tag :color="getBatchResult(index) ? 'green' : 'red'">
                    {{ getBatchResult(index) ? "成功" : `失败：${batchResult[index]}` }}</a-tag>
                {{ item.content }}
            </a-list-item>
        </a-list>
        <template #footer>
            <a-space>
                <a-button type="primary" @click="confirmAndRedirect">确定</a-button>
            </a-space>
        </template>
    </a-modal>
</template>
<script setup>
import BaseTextEditor from '../../components/BaseTextEditor.vue';
import BaseQuestionPreview from '../../components/BaseQuestionPreview.vue';
import { parseQuestionTextRequest, batchQuestionRequest, questionRulesRequest } from '../../apis/question-api';
import { computed, ref, reactive, onMounted } from 'vue';
import QuestionTagTree from '../../components/QuestionTagTree.vue';
import { questionType } from '../../utils/question-config';
import { useRoute, useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
const route = useRoute()
const router = useRouter()
const tagId = ref(route.query["tagId"])
const courseId = route.params['courseId']
const loading = ref(false)
const list = ref([])
const text = ref("")
const isPreviewReady = ref(false)
// 对话框显示
// const configModal = ref(false)
const tagModal = ref(false)
const resultMode = ref(false)
// 匹配结果
const batchResult = ref([])
// 移除不再需要的config变量
// 题目配置
// const config = ref([])
//编辑器配置
const editorConfig = ref({
    plugins: "autoresize"
})

// 添加标记，指示是否处于导入流程中
const isImportProcess = ref(false);

// 初始化每种题型的配置
onMounted(() => {
    // 移除题型配置初始化
    /*
    questionType.forEach(type => {
        questionConfigs[type.enumName] = {
            difficulty: 3,
            score: 5,
            isPublic: 'self',
            type: type.enumName
        }
    })
    */
})

// 显示标签选择模态框
const showTagModal = () => {
    tagModal.value = true;
};

// 选择标签
const selectTag = (nodeData, parentTree) => {
    console.log('选择节点:', nodeData, '父路径:', parentTree);
    
    // 处理未定义的情况
    if (!nodeData) {
        // 根目录特殊处理 - 设置根目录ID并显示提示
        tagId.value = "";
        Message.success(`已选择分组: 根目录`);
        return;
    }
    
    // 对于有效节点，使用其ID
    tagId.value = nodeData.id || "";
    
    // 如果是根节点（空ID），使用根目录名称
    if (tagId.value === "") {
        Message.success(`已选择分组: 根目录`);
        return;
    }
    
    // 从节点中获取名称
    let tagName = nodeData.tag;
    
    // 从QuestionTagTree组件看，可能需要从data.node中获取数据
    if (!tagName && nodeData._rawNode) {
        tagName = nodeData._rawNode.tag;
    }
    
    // 最后尝试其他可能的属性
    if (!tagName) {
        tagName = nodeData.label || nodeData.title || '未命名分组';
    }
    
    // 显示成功提示
    Message.success(`已选择分组: ${tagName}`);
};

const analyzeText = () => {
    // 重置预览状态
    isPreviewReady.value = false;
    loading.value = true
    
    // 使用简化的API，已固定使用CHAOXING规则
    parseQuestionTextRequest(text.value).then(res => {
        if(res.data.code !== "00000" && res.data.code !== 200) {
            Message.error("解析失败: " + (res.data.msg || "未知错误"));
            loading.value = false;
            return;
        }
        
        console.log("解析结果:", res.data.data);
        
        if(!res.data.data || !Array.isArray(res.data.data)) {
            Message.error("解析结果格式错误");
            loading.value = false;
            return;
        }
        
        list.value = res.data.data;
        
        // 为预览的题目应用配置
        applyConfigToQuestions();
        
        // 设置预览准备好了
        setTimeout(() => {
            isPreviewReady.value = true;
            loading.value = false;
        }, 500); // 短暂延迟以确保DOM更新
    }).catch((error) => {
        console.error("解析出错:", error);
        Message.error("解析异常: " + (error.message || "未知错误"));
        loading.value = false;
    });
}

// 将配置应用到预览的题目上
const applyConfigToQuestions = () => {
    if (list.value && list.value.length > 0) {
        console.log("应用配置到题目，题目数量:", list.value.length);
        
        // 处理每个题目
        list.value.forEach((question, index) => {
            try {
                if (question.content) {
                    // 使用正则表达式匹配开头的数字+点+空格模式并去除
                    question.content = question.content.replace(/^\d+\.\s*/, '');
                }
                console.log(`处理题目 ${index+1}:`, question);
                
                // 0. 检查是否是主观题特征，若是则强制设为主观题
                if (question.content && question.options) {
                    // 特征1：题目内容包含关键词
                    const subjectiveKeywords = ["简述", "论述", "分析", "比较", "描述", "解释"];
                    const hasSubjectiveKeyword = subjectiveKeywords.some(keyword => 
                        question.content.includes(keyword)
                    );
                    
                    // 特征2：答案较长（合并所有答案判断）
                    let combinedAnswerLength = 0;
                    if (question.options && question.options.length > 0) {
                        const combinedAnswer = question.options
                            .map(opt => opt.answer || "")
                            .join("");
                        combinedAnswerLength = combinedAnswer.length;
                    }
                    
                    // 如果符合主观题特征但被错误识别为填空题，则更正为主观题
                    if ((hasSubjectiveKeyword || combinedAnswerLength > 50) && 
                        question.type === "COMPLETION" && 
                        !question.content.match(/_{1,}/)) {
                        console.log(`将题目 ${index+1} 从填空题更正为主观题，原因:`, 
                            hasSubjectiveKeyword ? "包含主观题关键词" : "答案较长");
                        question.type = "SUBJECTIVE";
                    }
                }
                
                // 1. 确保options不为null
                if (question.options === null) {
                    question.options = [];
                    
                    // 对于判断题，添加默认选项
                    if (question.type === "JUDGMENTAL") {
                        question.options = [
                            {
                                content: "正确",
                                answer: "1", // 默认选中第一项
                                questionId: null
                            },
                            {
                                content: "错误",
                                answer: null,
                                questionId: null
                            }
                        ];
                    }
                }
                
                // 2. 确保难度、分值和可见性有值（使用默认值）
                question.difficulty = question.difficulty || 3;
                question.score = question.score || 5.0;
                question.isPublic = question.isPublic || "self";
                
                // 3. 检查填空题答案数量和下划线数量是否匹配
                if (question.type === "COMPLETION" && question.content) {
                    // 计算题目中下划线占位符的数量
                    const underscoreMatches = question.content.match(/_{1,}/g) || [];
                    const underscoreCount = underscoreMatches.length;
                    console.log(`题目 ${index+1} 包含 ${underscoreCount} 个下划线占位符`);
                    
                    // 确保选项数量与下划线数量匹配
                    if (question.options && underscoreCount > 0) {
                        // 如果选项比下划线少，添加空选项
                        while (question.options.length < underscoreCount) {
                            question.options.push({
                                content: "",
                                answer: "",
                                questionId: null
                            });
                        }
                        // 如果选项比下划线多，裁剪多余选项
                        if (question.options.length > underscoreCount) {
                            question.options = question.options.slice(0, underscoreCount);
                        }
                        console.log(`调整后填空题选项数量: ${question.options.length}`);
                    }
                }
                
                // 4. 处理主观题答案被拆分的问题
                // 检查是否为主观题但有多个选项
                if (question.type === "SUBJECTIVE" && question.options && question.options.length > 1) {
                    console.log(`修正主观题答案被拆分的问题，题目索引: ${index}`);
                    // 将所有答案合并为一个，使用分号连接
                    const fullAnswer = question.options.map(opt => opt.answer || "").join("；");
                    question.options = [{
                        content: "",
                        answer: fullAnswer,
                        questionId: null
                    }];
                    console.log(`合并后的答案: ${fullAnswer}`);
                } 
                // 5. 处理特殊题型的特殊需求
                else if (question.type === "SUBJECTIVE" && (!question.options || question.options.length === 0)) {
                    question.options = [{
                        content: "",
                        answer: "",
                        questionId: null
                    }];
                }
                
                // 6. 确保每个选项都有必要的字段
                if (Array.isArray(question.options)) {
                    question.options.forEach(option => {
                        option.content = option.content || "";
                        option.questionId = option.questionId || null;
                    });
                }
                
                console.log(`题目 ${index+1} 处理完成`);
            } catch (e) {
                console.error(`处理题目 ${index+1} 时出错:`, e);
            }
        });
    }
}

const batchSuccesCount = computed(() => {
    return batchResult.value.filter(value => value == "").length;
})
const getBatchResult = (index) => {
    const result = batchResult.value[index];
    if (result == "") {
        return true;
    }
    return false;
}

// 开始导入流程
const startImport = () => {
    if (list.value.length == 0) {
        Message.info("请先预览后导入");
        return;
    }
    
    // 如果预览还未准备好，等待它准备好
    if (!isPreviewReady.value) {
        Message.warning("预览正在准备中，请稍候再试");
        return;
    }
    
    // 设置导入流程标记
    isImportProcess.value = true;
    
    // 显示标签选择窗口
    tagModal.value = true;
};

// 确认导入，在用户选择标签并点击确定后调用
const confirmImport = () => {
    // 关闭标签选择窗口
    tagModal.value = false;
    
    
    // 检查是否选择了标签
    if (tagId.value === undefined || tagId.value === null) {
        Message.warning("请先选择导入分组");
        return;
    }
    
    // 导入前应用配置到题目
    applyConfigToQuestions();
    
    console.log("准备导入题目，数量:", list.value.length, "标签ID:", tagId.value);
    
    // 最后检查每个题目，确保它们都有可导入的格式
    let canProceed = true;
    list.value.forEach((question, index) => {
        if (question.type === "JUDGMENTAL" && (!question.options || question.options.length < 2)) {
            Message.error(`题目 ${index+1} (判断题) 选项数量不足，请检查`);
            canProceed = false;
        }
    });
    
    if (!canProceed) {
        return;
    }
    
    // 执行导入操作
    executeImport();
};

// 执行实际的导入操作
const executeImport = () => {
    // 显示明确的加载提示
    loading.value = true;
    Message.loading({
        content: '正在导入题目，请稍候...',
        duration: 0 // 不自动关闭
    });
    
    // 添加请求超时处理
    const requestTimeout = setTimeout(() => {
        loading.value = false;
        Message.clear(); // 清除之前的loading消息
        Message.error('请求超时，请检查网络后重试');
    }, 30000); // 30秒超时
    
    // 传入null作为配置，使用每个题目自己的配置
    batchQuestionRequest(courseId, tagId.value, list.value, null).then(res => {
        clearTimeout(requestTimeout); // 清除超时计时器
        Message.clear(); // 清除loading消息
        
        if(res.data.code !== "00000" && res.data.code !== 200) {
            console.error("导入失败，响应码:", res.data.code, "错误信息:", res.data.msg);
            Message.error("导入失败: " + (res.data.msg || "未知错误"));
            loading.value = false;
            return;
        }
        
        console.log("导入结果:", res.data.data);
        
        if (!res.data.data) {
            Message.error("导入结果格式错误");
            loading.value = false;
            return;
        }
        
        batchResult.value = res.data.data;
        resultMode.value = true;
        loading.value = false;
        
        const successCount = batchSuccesCount.value;
        if (successCount === list.value.length) {
            Message.success(`导入成功，共导入 ${successCount} 个题目`);
        } else {
            Message.warning(`部分导入成功，成功 ${successCount} 个，失败 ${list.value.length - successCount} 个`);
        }
    }).catch(err => {
        clearTimeout(requestTimeout); // 清除超时计时器
        Message.clear(); // 清除loading消息
        
        console.error("导入出错:", err);
        loading.value = false;
        
        // 提供更详细的错误信息
        let errorMessage = "导入异常: ";
        if (err.response) {
            // 服务器返回了错误响应
            errorMessage += `服务器错误 (${err.response.status}): ${err.response.data?.msg || err.message || "未知错误"}`;
        } else if (err.request) {
            // 请求发出但没有收到响应
            errorMessage += "服务器无响应，请检查网络连接";
        } else {
            // 请求设置出错
            errorMessage += err.message || "未知错误";
        }
        
        Message.error(errorMessage);
    }).finally(() => {
        // 确保在任何情况下都会重置加载状态
        loading.value = false;
        // 重置导入流程标记
        isImportProcess.value = false;
    });
}

// 确认结果并跳转到题库页面
const confirmAndRedirect = () => {
    // 关闭结果对话框
    resultMode.value = false;
    // 跳转到题库页面
    router.push(`/course/${courseId}/question`);
}
</script>
<style lang="less" scoped>
.batch-import {
    display: flex;
    border: 2px solid var(--color-fill-3);
    border-radius: 10px;

    .editor,
    .empty,
    .preview {
        flex-grow:1;
        width: 100%;
    }
}

.batchResult {
    display: flex;
    justify-content: center;

    .success,
    .failed {
        margin: 10px;
        padding: 10px 30px;
        flex: 1;
        border: 1px solid var(--color-fill-1);
        border-radius: 5px;
    }

    .success {
        background-color: rgb(var(--green-1));

        :deep(.arco-statistic-title) {
            color: rgb(var(--green-6));
        }
    }

    .failed {
        background-color: rgb(var(--red-1));

        :deep(.arco-statistic-title) {
            color: rgb(var(--red-6));
        }
    }
}
</style>