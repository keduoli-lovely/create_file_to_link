<template>
    <div class="titlebar" data-tauri-drag-region>
        <div class="title-left">
            <img src="../assets/link_32x32.png" class="title-icon" />
            <span class="title-text">create_file_to_link</span>
        </div>
        <div class="title-right">
            <el-icon class="title-icon-btn" @click="minimize">
                <SemiSelect />
            </el-icon>
            <el-icon class="title-icon-btn" @click="close">
                <CloseBold />
            </el-icon>
        </div>
    </div>
</template>

<script setup>
import { getCurrentWindow } from '@tauri-apps/api/window'
import { CloseBold, SemiSelect } from '@element-plus/icons-vue'

const minimize = async () => await getCurrentWindow().minimize()
const close = async () => await getCurrentWindow().close()
</script>

<style scoped>
.titlebar {
    height: 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 12px;
    background-color: var(--titlebar-bg);
    color: var(--titlebar-text);
    -webkit-app-region: drag;
}

.title-right>* {
    color: var(--titlebar-icon-color);
    margin-left: 8px;
    cursor: pointer;
    -webkit-app-region: no-drag;
}

.title-icon-btn:hover {
    color: var(--titlebar-icon-hover);
}

.title-icon {
    width: 20px;
    height: 20px;
}

.title-text {
    font-size: 13px;
    user-select: none;
}

.title-left {
    display: flex;
    align-items: center;
}
</style>
