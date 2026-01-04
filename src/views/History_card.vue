<template>
    <div>
        <el-card :body-style="{ padding: '8px', }" shadow="hover" style="margin-bottom: 16px;"
            v-for="(item, index) in history_list" :key="index">
            <div style="display: flex;align-items: center;font-size: 18px;">
                <div style="flex: 9;">
                    <el-text class="mx-1" style="white-space: nowrap;" :type="item?.sta ? 'primary' : 'danger'">
                        <span :style="{ userSelect: 'none' }">目标路径：&nbsp;</span>
                        {{ safeText(item.currentFile) }}</el-text>
                    <div style="height: 2px;"></div>
                    <el-progress :style="{userSelect: 'none'}" :percentage="item.progress" :status="checkSta(item?.sta)" />
                </div>
                <div class="history_icon"
                    style="flex: 1;font-size: 24px;width: 40px;height: 40px;text-align: center;padding-top: 8px;cursor: pointer;">
                    <el-tooltip class="box-item" effect="light" :content="JSON.stringify(item?.list) || '还没有数据'"
                        placement="bottom-start">
                        <el-icon>
                            <InfoFilled />
                        </el-icon>
                    </el-tooltip>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { InfoFilled } from '@element-plus/icons-vue';
const props = defineProps({ history_list: Array, format: String })

const checkSta = (sta) => {
    if (sta === false) return "exception"
    if (sta === true) return ""
    return props.format
}

const safeText = (val) => {
    if (typeof val === "string" && val.trim().length > 0) {
        return val
    }
    if (val instanceof Error) {
        return val.message || "发生错误"
    }
    return "文件名丢失"
}
</script>

<style lang="scss" scoped>
.history_icon {
    color: rgba(0, 0, 0, .3);

    &:hover {
        color: skyblue;
    }
}
</style>