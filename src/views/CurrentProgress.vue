<template>
    <el-card :body-style="{ padding: '8px' }" shadow="hover">
        <div style="font-size: 18px;">
            <el-text :type="format === 'exception' ? 'danger' : 'primary'">
                <span :style="{ userSelect: 'none', color: 'var(--targe-path-color)' }">目标路径：&nbsp;</span>
                {{ shortenByWidth(currentFile ?? "等待处理中....", 150) }}</el-text>
            <div style="height: 2px;"></div>
            <el-progress :style="{ userSelect: 'none' }" :percentage="progress" :status="format" />
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { shortenByWidth } from '@/utils/filenameUtils'

defineProps<{
    currentFile?: string
    progress?: number
    format?: string
}>()
</script>
