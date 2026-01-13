<template>
    <el-card :body-style="{ padding: '8px' }" shadow="hover">
        <div style="font-size: 18px;">
            <el-text :type="format === 'exception' ? 'danger' : 'primary'">
                <span :style="{ userSelect: 'none', color: 'var(--targe-path-color)' }">目标路径：&nbsp;</span>
                {{ shortenByWidth(currentFile, 150) }}</el-text>
            <div style="height: 2px;"></div>
            <el-progress :style="{ userSelect: 'none' }" :percentage="progress" :status="format" />
        </div>
    </el-card>
</template>

<script setup>
import { get_config_default } from '../assets/default';

const { shortenByWidth } = get_config_default();
defineProps({
    currentFile: String,
    progress: Number,
    format: String
})
</script>
