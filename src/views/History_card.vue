<template>
    <div>
        <!-- 渲染可见的部分 -->
        <el-card v-for="(item, index) in visibleList" :key="index" :body-style="{ padding: '8px' }" shadow="hover"
            style="margin-bottom: 16px;">
            <div style="display: flex;align-items: center;font-size: 18px;">
                <div style="flex: 9;">
                    <el-text class="mx-1" style="white-space: nowrap;" :type="item?.sta ? 'primary' : 'danger'">
                        <span :style="{ userSelect: 'none', color: 'var(--targe-path-color)' }">目标路径：&nbsp;</span>
                        {{ shortenByWidth(safeText(item.currentFile), 220) }}
                    </el-text>

                    <div style="height: 2px;"></div>

                    <el-progress :style="{ userSelect: 'none' }" :percentage="item.progress"
                        :status="checkSta(item?.sta)" />
                </div>

                <div class="history_icon"
                    style="flex: 1;font-size: 24px;width: 40px;height: 40px;text-align: center;padding-top: 8px;cursor: pointer;">
                    <el-tooltip placement="bottom-start">
                        <template #content>
                            <div class="tooltip-text">
                                {{ formatHistoryList(item?.list, item?.time) }}
                            </div>
                        </template>

                        <el-icon>
                            <InfoFilled />
                        </el-icon>
                    </el-tooltip>

                </div>
            </div>
        </el-card>

        <!-- 触底触发器自动加载下一批 -->
        <div ref="loadTrigger" style="height: 1px;"></div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue"
import { InfoFilled } from "@element-plus/icons-vue"
import { get_config_default } from '../assets/default';

const { shortenByWidth } = get_config_default();

const props = defineProps({
    history_list: Array,
    format: String
})

// 分批加载 + IntersectionObserver
const visibleList = ref([])
const batchSize = 5
let currentIndex = 0

const loadTrigger = ref(null)
let observer = null

const loadMore = () => {
    const next = props.history_list.slice(currentIndex, currentIndex + batchSize)
    if (next.length > 0) {
        visibleList.value.push(...next)
        currentIndex += batchSize
    }
}

watch(
    () => props.history_list,
    () => {
        visibleList.value = []
        currentIndex = 0
        loadMore()
    },
    { immediate: true, deep: true }
)

// 工具函数 复制 / 剪切 状态
const checkSta = (sta) => {
    if (sta === false) return "exception"
    if (sta === true) return ""
    return props.format
}

// 设置默认文件名
const safeText = (val) => {
    if (typeof val === "string" && val.trim().length > 0) return val
    if (val instanceof Error) return val.message || "发生错误"
    return "文件名丢失"
}

// 处理 文件复制完成时间
const formatTime = (time) => {
    if (!time) return "无时间记录"

    const d = new Date(time)
    if (isNaN(d.getTime())) return "无时间记录"

    return d.toLocaleString()
}

// 格式化 info 数据
const formatHistoryList = (list, time) => {
    if (!Array.isArray(list) || list.length === 0) {
        return `时间：${timeStr}\n\n没有迁移记录`
    }

    const timeStr = formatTime(time)

    const lines = list.map((item, idx) => {
        return [
            `记录 ${idx + 1}`,
            `从：${item.old}`,
            `到：${item.new}`,
            `------------------------------`
        ].join("\n")
    })

    return `时间：${timeStr}\n\n` + lines.join("\n")
}

onMounted(() => {
    observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMore()
        }
    })

    if (loadTrigger.value) {
        observer.observe(loadTrigger.value)
    }
})

onBeforeUnmount(() => {
    if (observer && loadTrigger.value) {
        observer.unobserve(loadTrigger.value)
    }
})
</script>

<style scoped>
.history_icon {
    color: var(--info-icon-color);
}

.history_icon:hover {
    color: skyblue;
}

.tooltip-text {
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-line;
}

:deep(.el-progress__text) {
    color: var(--progress-text);
}
</style>
