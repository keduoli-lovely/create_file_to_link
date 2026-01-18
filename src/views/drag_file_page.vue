<template>
    <div class="drag_box" :class="[{ drag_box_atv: !isShowAddFile }, { drag_box_ready: !isShowAddFile }]">
        <div class="add_file_icon">
            <el-icon>
                <DocumentAdd />
            </el-icon>
            <el-text class="mx-1" size="large">
                松开添加文件
            </el-text>
        </div>

        <div class="line_box" :class="{ 'in_aimn_class': loding_show }">
            <div class="top_line"></div>
            <div class="right_line"></div>
            <div class="bottom_line"></div>
            <div class="left_line"></div>

            <div class="corner_left_top v1"></div>
            <div class="corner_left_top v2"></div>
            <div class="corner_left_top v3"></div>
            <div class="corner_left_top v4"></div>
        </div>
    </div>
</template>

<script setup>
import { DocumentAdd } from '@element-plus/icons-vue'

const props = defineProps({
    isShowAddFile: {
        type: Boolean,
        default: false
    },
    loding_show: {
        type: Boolean,
        default: true
    }
});
</script>

<style lang="scss" scoped>
.drag_box {
    transition: opacity .5s ease, top .1s ease;
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-color: var(--titlebar-bg);
    background-color: #ffffff1a;
    backdrop-filter: blur(4px);
    z-index: 999;
    display: flex;
    justify-content: center;
    align-items: center;

    .add_file_icon {
        display: flex;
        flex-direction: column;
        justify-content: center;
        font-size: 6em;
        color: var(--file_loding_text);
    }

    .line_box {
        position: absolute;
        width: 85%;
        height: 90%;

        .top_line,
        .right_line,
        .bottom_line,
        .left_line {
            width: calc(100% - 50px);
            height: 100px;
            position: absolute;
            height: 3px;
            background-image: linear-gradient(to right, var(--file_loding_text) 50%, transparent 50%);
            background-size: 20px 2px;
        }

        .left_line,
        .right_line {
            width: 3px;
            height: calc(100% - 50px);
            background-image: linear-gradient(to bottom, var(--file_loding_text) 50%, transparent 50%);
            background-size: 2px 20px;
        }

        .top_line {
            top: 0px;
        }

        .bottom_line {
            bottom: 0px;
        }

        .top_line,
        .bottom_line {
            left: 25px;
            transition: all .2s ease;
        }

        .left_line {
            left: 0px;
        }

        .right_line {
            right: 0px;
        }

        .left_line,
        .right_line {
            top: 25px;
            transition: all .3s ease;

        }

        .corner_left_top {
            position: absolute;
            width: 25px;
            height: 25px;
            z-index: 999;
        }

        .v1,
        .v2 {
            width: 15px;
            height: 15px;
            top: 0;
            border-top: 3px solid var(--el-color-primary);
        }

        .v3,
        .v4 {
            width: 15px;
            height: 15px;
            bottom: 0;
            border-bottom: 3px solid var(--el-color-primary);
        }

        .v1,
        .v3 {
            transition: all .3s ease;
            left: 0;
            border-left: 3px solid var(--el-color-primary);
        }

        .v2,
        .v4 {
            transition: all .4s ease;
            right: 0;
            border-right: 3px solid var(--el-color-primary);
        }

    }

    .in_aimn_class {
        .top_line {
            top: -80px;
        }

        .right_line {
            right: -80px;
        }

        .bottom_line {
            bottom: -80px;
        }

        .left_line {
            left: -80px;
        }

        .v1,
        .v2 {
            top: -80px;

        }

        .v3,
        .v4 {
            bottom: -80px;
        }

        .v1,
        .v3 {
            left: -80px;
        }

        .v2,
        .v4 {
            right: -80px;
        }
    }

}

.drag_box_ready {
    transition: opacity .3s ease, top 1s ease;
}

.drag_box_atv {
    top: 150%;
    opacity: 0;
}
</style>