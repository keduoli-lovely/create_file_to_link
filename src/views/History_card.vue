<template>
    <div>
        <transition-group name="slide-out">
            <el-card
                v-for="(entryWrap, vi) in visibleList"
                :key="entryWrap.originalIndex"
                :body-style="{ padding: '8px' }"
                shadow="hover"
                style="margin-bottom: 16px;"
                :class="{ 'undoing-card': entryWrap.undoing }"
            >
                <div style="display: flex;align-items: center;font-size: 18px;">
                    <div style="flex: 9;">
                        <el-text class="mx-1" style="white-space: nowrap;" :type="entryWrap.entry?.sta ? 'primary' : 'danger'">
                            <span :style="{ userSelect: 'none', color: 'var(--targe-path-color)' }">目标路径：&nbsp;</span>
                            {{ shortenByWidth(safeText(entryWrap.entry.currentFile), 260) }}
                        </el-text>

                        <div style="height: 2px;"></div>

                        <el-progress
                            :style="{ userSelect: 'none' }"
                            :percentage="entryWrap.displayProgress"
                            :status="entryWrap.undoing ? undefined : checkSta(entryWrap.entry?.sta)"
                            :color="entryWrap.undoing ? 'var(--el-color-warning)' : undefined"
                        />
                    </div>

                    <div style="display: flex; gap: 0; align-items: center;">
                        <!-- 详情图标 -->
                        <el-tooltip placement="bottom-start">
                            <template #content>
                                <div class="tooltip-text">
                                    <div v-if="entryWrap.entry?.list?.length" style="margin-bottom: 6px; font-weight: bold;">
                                        {{ entryWrap.entry.list.length }}个{{ entryWrap.entry.isFile ? '文件' : '文件夹' }} · {{ entryWrap.sizeText }}
                                    </div>
                                    {{ formatHistoryList(entryWrap.entry?.list, entryWrap.entry?.time) }}
                                </div>
                            </template>
                            <div class="history_icon">
                                <el-icon :size="22">
                                    <InfoFilled />
                                </el-icon>
                            </div>
                        </el-tooltip>

                        <!-- 撤销按钮 — 与详情图标一致样式 -->
                        <el-tooltip
                            v-if="entryWrap.entry?.sta === true && entryWrap.entry?.list?.length && !entryWrap.undoing"
                            content="撤销此操作"
                            placement="bottom"
                        >
                            <el-popconfirm
                                title="确认撤销此操作？"
                                confirm-button-text="撤销"
                                cancel-button-text="取消"
                                @confirm="handleUndo(entryWrap, vi)"
                            >
                                <template #reference>
                                    <div class="history_icon">
                                        <el-icon :size="22">
                                            <RefreshLeft />
                                        </el-icon>
                                    </div>
                                </template>
                            </el-popconfirm>
                        </el-tooltip>

                        <!-- 撤销中加载 -->
                        <div v-if="entryWrap.undoing" class="history_icon" style="cursor: default;">
                            <el-icon :size="22" class="is-loading">
                                <Loading />
                            </el-icon>
                        </div>
                    </div>
                </div>
            </el-card>
        </transition-group>

        <!-- 触底触发器自动加载下一批 -->
        <div ref="loadTrigger" style="height: 1px;"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue"
import { invoke } from "@tauri-apps/api/core"
import { InfoFilled, RefreshLeft, Loading } from "@element-plus/icons-vue"
import { shortenByWidth, formatFileSize } from '@/utils/filenameUtils'
import type { HistoryEntry, FileResult } from '@/types'

interface EntryWrap {
    entry: HistoryEntry
    originalIndex: number
    undoing: boolean
    displayProgress: number
    slideOut: boolean
    sizeText: string
}

const props = defineProps<{
    history_list: HistoryEntry[]
    format: string
    onUndo: (entry: HistoryEntry, index: number) => Promise<boolean>
}>()

// 分批加载 + IntersectionObserver
const visibleList = ref<EntryWrap[]>([])
const batchSize = 5
let currentIndex = 0

const loadTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// 获取文件总大小
const fetchEntrySize = async (entry: HistoryEntry): Promise<string> => {
    if (!entry.list?.length) return "0 B"
    try {
        const paths = entry.list
            .filter(item => item.success !== false)
            .map(item => item.new)
        if (paths.length === 0) return "0 B"
        const [size] = await invoke("get_total_size", { paths }) as [number, number]
        return formatFileSize(size)
    } catch {
        return "计算中..."
    }
}

const loadMore = (): void => {
    const remaining = props.history_list.slice(currentIndex)
    const next = remaining.slice(0, batchSize)
    if (next.length > 0) {
        next.forEach((entry, i) => {
            const wrap: EntryWrap = {
                entry: { ...entry },
                originalIndex: currentIndex + i,
                undoing: false,
                displayProgress: entry.progress,
                slideOut: false,
                sizeText: "...",
            }
            visibleList.value.push(wrap)
            // 异步取大小
            fetchEntrySize(entry).then(size => { wrap.sizeText = size })
        })
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

// 撤销处理 — 带动画
const handleUndo = async (entryWrap: EntryWrap, visibleIndex: number): Promise<void> => {
    entryWrap.undoing = true

    // 进度条从 100 动画降到 0
    const duration = 1200
    const startProgress = entryWrap.displayProgress
    const startTime = Date.now()

    const animStep = (): Promise<void> => {
        return new Promise((resolve) => {
            const tick = () => {
                const elapsed = Date.now() - startTime
                const ratio = Math.min(elapsed / duration, 1)
                entryWrap.displayProgress = Math.round(startProgress * (1 - ratio))
                if (ratio < 1) {
                    requestAnimationFrame(tick)
                } else {
                    entryWrap.displayProgress = 0
                    resolve()
                }
            }
            requestAnimationFrame(tick)
        })
    }

    // 启动进度动画
    const animPromise = animStep()

    // 同时执行撤销
    const result = await props.onUndo(entryWrap.entry, entryWrap.originalIndex)

    // 等待动画完成
    await animPromise

    if (result) {
        // 成功 → 滑出动画后移除
        entryWrap.slideOut = true
        setTimeout(() => {
            const idx = visibleList.value.findIndex(e => e.originalIndex === entryWrap.originalIndex)
            if (idx >= 0) visibleList.value.splice(idx, 1)
        }, 400)
    } else {
        // 失败 → 恢复状态
        entryWrap.undoing = false
        entryWrap.displayProgress = startProgress
        entryWrap.slideOut = false
    }
}

// 工具函数 复制 / 剪切 状态
const checkSta = (sta: boolean): string => {
    if (sta === false) return "exception"
    if (sta === true) return ""
    return props.format
}

// 设置默认文件名
const safeText = (val: unknown): string => {
    if (typeof val === "string" && val.trim().length > 0) return val
    if (val instanceof Error) return val.message || "发生错误"
    return "文件名丢失"
}

// 处理 文件复制完成时间
const formatTime = (time: number): string => {
    if (!time) return "无时间记录"

    const d = new Date(time)
    if (isNaN(d.getTime())) return "无时间记录"

    return d.toLocaleString()
}

// 格式化 info 数据
const formatHistoryList = (list: FileResult[], time: number): string => {
    const timeStr = formatTime(time)

    if (!Array.isArray(list) || list.length === 0) {
        return `时间：${timeStr}\n\n没有迁移记录`
    }

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
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
    transition: color .2s, background-color .2s;
}

.history_icon:hover {
    color: skyblue;
}

.tooltip-text {
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-line;
}

.undoing-card {
    opacity: 0.7;
}

/* 撤销中加载旋转 */
.is-loading {
    animation: rotating 1s linear infinite;
}

@keyframes rotating {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* 滑出动画 */
.slide-out-enter-active,
.slide-out-leave-active {
    transition: all 0.4s ease;
}
.slide-out-leave-to {
    transform: translateX(120%);
    opacity: 0;
}

:deep(.el-progress__text) {
    color: var(--progress-text);
}
</style>
