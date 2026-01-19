<template>
  <Title_bar />
  <div class="box">
    <div class="setting">
      <el-card :body-style="{ padding: '8px 8px 4px 0px', }" shadow="hover">
        <div class="setting_box">
          <div class="setting_title">
            <div class="setting_title_icon" @click="setting_page_isShow = !setting_page_isShow">
              <el-icon>
                <Setting />
              </el-icon>
              <div style="width: 4px;"></div>
              <transition name="fade" mode="out-in">
                <span class="setting_title_text" :key="setting_page_isShow">
                  {{ setting_page_isShow ? '收起' : '点击展开全部设置' }}
                </span>
              </transition>
            </div>

            <span :class="{ 'show_icon_atv': setting_page_isShow }" style="transition: all .4s ease-in;">
              <el-icon class="setting_title_show_icon" @click="setting_page_isShow = !setting_page_isShow">
                <ArrowDown />
              </el-icon>
            </span>
          </div>

          <div class="setting_conten"
            :style="{ maxHeight: setting_page_isShow ? '500px' : '0px', opacity: setting_page_isShow ? 1 : 0 }">
            <span>
              <el-checkbox v-model="is_link" label="是否创建链接" />
            </span>
            <span>
              <el-checkbox v-model="copy_and_create_link" v-if="is_link" label="复制文件/文件夹是否创建链接" />
            </span>
            <div v-if="copy_and_create_link && is_link">
              <el-text class="mx-1 global_style" size="large">自定义复制文件链接后缀:</el-text>
              <br>
              <div style="height: 2px;"></div>
              <el-input v-model="copy_link_name" style="width: 240px" maxlength="20" placeholder="名称后缀" show-word-limit
                type="text" />
            </div>
            <span v-if="is_link">
              <el-checkbox v-model="over_open_folder" label="完成后打开链接文件夹" />
            </span>
            <span>
              <el-checkbox v-model="dark_sta" label="使用暗色" />
            </span>
            <span class="open_tools_fn" @click="open_devtools_fn">
              <svg viewBox="0 0 24 24" width="1.4em" height="1.4em" data-v-1b2da696="">
                <path fill="currentColor" :d="terminal_icon">
                </path>
              </svg>
              <div style="width: 4px;"></div>
              <el-text class="mx-1 open_tools_icon" size="large" style="margin-bottom: 1px;">
                打开DevTools
              </el-text>
            </span>
            <span class="open_tools_fn" @click="openUrl(github_link)">
              <svg viewBox="0 0 24 24" width="1.4em" height="1.4em" data-v-1b2da696="">
                <path fill="currentColor" :d="github_icon">
                </path>
              </svg>
              <div style="width: 4px;"></div>
              <el-text class="mx-1 open_tools_icon" size="large" style="margin-bottom: 4px;">
                github:keduoli-lovely
              </el-text>
            </span>
            <div style="height: 12px;"></div>
          </div>
        </div>
      </el-card>
    </div>
    <div style="height: 12px;"></div>
    <div class="select_title">
      <el-segmented v-model="select_file_type" :options="file_type" @change="file_obj = {}, show_file_index = 5" />
      <div class="name_error_fn">
        <el-text class="mx-1" size="large">名称冲突方案:&nbsp;&nbsp;</el-text>
        <el-select class="name_error_tips" v-model="nameRe" placeholder="Select">
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </div>

    <div class="select_body">
      <el-card class="card1" v-for="i in file_type" :key="i" :class="{ 'file': select_file_type === i }" shadow="hover">
        <el-text class="mx-1 global_style">选择需要移动的{{ i }}: </el-text>
        <div style="height: 4px;"></div>
        <div class="start_s">
          <el-button v-if="!file_obj.goList?.[0]" type="primary" text bg @click="select_file_fn(i === '文件夹', 'goList')">
            选择{{ i }} &nbsp;<el-icon v-if="!(i === '文件夹')">
              <DocumentCopy />
            </el-icon><el-icon v-else>
              <FolderOpened />
            </el-icon>
          </el-button>

          <el-card class="select_file_list_box" :body-style="{ padding: '5px', }" shadow="never" v-else>
            <div class="select_file_row_name" v-for="(item, i) in file_obj.goList.slice(0, show_file_index)"
              :key="item">
              <el-tag type="primary" closable @close="file_obj.goList.splice(i, 1)">
                {{ item }}
              </el-tag>

              <span style="width: 20px;">&nbsp;&nbsp;&nbsp;&nbsp;</span>
            </div>

            <el-tag type="primary" @click="show_file_index += 2, setting_page_isShow = false"
              v-show="show_file_index < file_obj.goList.length">........</el-tag>
          </el-card>
        </div>
        <div style="height: 14px;"></div>
        <el-text class="mx-1 global_style">选择需要移动到的{{ i }}:</el-text>
        <div style="height: 4px;"></div>
        <div class="start_s">
          <el-button v-if="!file_obj.toPath?.[0]" type="primary" text bg
            @click="select_file_fn(true, 'toPath', multiple = false)">
            选择文件夹 &nbsp; <el-icon>
              <FolderOpened />
            </el-icon>
          </el-button>

          <el-tag type="primary" v-else closable @close="file_obj.toPath = null">{{ file_obj.toPath }}</el-tag>
        </div>

      </el-card>

    </div>

    <el-dialog class="global_style" style="user-select: none;" v-model="centerDialogVisible" title="提示" width="400"
      align-center>
      <span>请选择文件的迁移方式 <el-text class="mx-1" type="danger">剪切 </el-text> / <el-text class="mx-1"
          type="primary">拷贝</el-text></span>
      <template #footer>
        <div class="dialog-footer">
          <el-button text bg @click="move_file_config(false)">&nbsp;剪切 &nbsp; <el-icon>
              <Failed />
            </el-icon>&nbsp;</el-button>
          <el-button text bg type="primary" @click="move_file_config(true)">
            &nbsp;拷贝 &nbsp; <el-icon>
              <CopyDocument />
            </el-icon>&nbsp;
          </el-button>
        </div>
      </template>
    </el-dialog>
    <el-button text bg class="send_btn send_btn1" @click="Progress_page = 0">
      迁移记录 &nbsp; <el-icon>
        <List />
      </el-icon>
    </el-button>
    <el-button type="primary" text bg class="send_btn" @click="centerDialogVisible = true"
      :disabled="Temporary_history_list_sta">
      开始迁移 &nbsp; <el-icon>
        <CircleCheck />
      </el-icon>
    </el-button>

    <el-card class="history_move_btn" :style="{ top: `${Progress_page}%` }">
      <div>
        <el-page-header @back="Progress_page = 100" class="global_style" title="返回">
          <template #content>
            <el-text class="mx-1">迁移记录</el-text>&nbsp;
            <el-text class="mx-1"><el-icon>
                <List />
              </el-icon></el-text>

          </template>
        </el-page-header>
        <div class="clear_history_box">
          <div class="clear_history_btn global_style">
            <el-popconfirm class="box-item" title="确认要清楚迁移记录吗?" placement="left" confirm-button-text="确认"
              cancel-button-text="取消" @confirm="clear_history_list">
              <template #reference>
                <el-button class="mt-3 mb-3" :disabled="clear_history_btn_disabled"> <el-text
                    class="mx-1">清空</el-text>&nbsp;
                  <el-text class="mx-1"><el-icon>
                      <DeleteFilled />
                    </el-icon></el-text>&nbsp;</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>

      <div class="new_row_history_data">
        <CurrentProgress v-if="Temporary_history_list_sta" :currentFile="currentFile" :progress="progress"
          :format="format" />
        <div style="height: 16px;"></div>
        <History_card v-if="Temporary_history_list?.length" :history_list=Temporary_history_list :format="format" />
        <History_card v-if="config_res?.history_list?.length" :history_list=config_res?.history_list :format="format" />
      </div>
    </el-card>
    <div class="mask" v-loading="true" v-if="mask_sta"></div>


    <div class="tips_mes">
      <span class="global_style">
        磁盘文件大小分析软件推荐: &nbsp;
      </span>
      <el-link type="info" @click="openUrl(SpaceSniffer_link)">SpaceSniffer</el-link>
    </div>

    <el-dialog class="global_style" style="user-select: none;" v-model="drag_error" title="提示" width="400" align-center
      :close-on-click-modal="false" :show-close="false">
      <span>不能同时选择文件和文件夹, 请选择保留文件或文件夹 </span>
      <template #footer>
        <div class="dialog-footer">
          <el-button text bg type="primary" @click="save_fileOrDir('dir')">&nbsp;文件夹 &nbsp; <el-icon>
              <FolderOpened />
            </el-icon>&nbsp;</el-button>
          <el-button text bg type="primary" @click="save_fileOrDir('file')">
            &nbsp;文件 &nbsp; <el-icon>
              <DocumentCopy />
            </el-icon>&nbsp;
          </el-button>
        </div>
      </template>
    </el-dialog>

    <drag_file_page :is-show-add-file="drag_file_show" :loding_show="drag_loding_show" />
  </div>

</template>

<script setup>
// element
import {
  FolderOpened,
  DocumentCopy,
  CircleCheck,
  CopyDocument,
  Failed,
  Setting,
  ArrowDown,
  InfoFilled,
  List,
  DeleteFilled,
  Position
} from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import 'element-plus/dist/index.css';
// vue
import { onMounted, watch } from 'vue';
// tauri
import { invoke } from "@tauri-apps/api/core";
import { load } from '@tauri-apps/plugin-store';
import { openUrl } from '@tauri-apps/plugin-opener';
import { getCurrentWindow } from '@tauri-apps/api/window';
// Components
import History_card from './views/History_card.vue';
import CurrentProgress from './views/CurrentProgress.vue';
import Title_bar from './views/title_bar.vue';
import drag_file_page from './views/drag_file_page.vue';
// config
import { get_config_default } from './config';
// composables
import { useDragFile } from '@/composables/useDragFile'
import { useProgress } from '@/composables/useProgress';
import { useHistory } from '@/composables/useHistory';
import { useFileOperation } from '@/composables/useFileOperation';
import { useAppListener } from '@/composables/useAppListener';
import { useChangeTheme } from '@/composables/useChangeTheme';
// store
import { storeToRefs } from 'pinia';
import { useFileStore } from '@/stores/useFileStore';
import { useDragStore } from '@/stores/useDragStore';
import { useProgressStore } from '@/stores/useProgressStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useHistoryStore } from '@/stores/useHistoryStore';


// 默认配置
let {
  appWindow,
  config_store,
  terminal_icon,
  github_icon,
  github_link,
  SpaceSniffer_link,
  options,
  default_config,
} = get_config_default()
// 文件数据
const fileStore = useFileStore()
const { file_obj, select_file_type, file_type } = storeToRefs(fileStore)
const { drag_file_show, drag_loding_show, drag_error, } = storeToRefs(useDragStore())
const { progress,
  currentFile,
  format,
} = storeToRefs(useProgressStore())

const ConfigStore = useConfigStore()
const { init_setting_data } = ConfigStore
const {
  config_res,
  nameRe,
  is_link,
  copy_and_create_link,
  copy_link_name,
  over_open_folder,
  dark_sta,
  setting_page_isShow,
  show_file_index,
  mask_sta,
  Progress_page,
  centerDialogVisible,
} = storeToRefs(ConfigStore)

// 迁移记录
const {
  Temporary_history_list,
  Temporary_history_list_sta,
  clear_history_btn_disabled,
} = storeToRefs(useHistoryStore())
// 拖拽文件
const { listen_file, save_fileOrDir, } = useDragFile()
// 清空迁移记录
const { clear_history_list, } = useHistory()
// 文件操作
const { select_file_fn, move_file_config } = useFileOperation()
// 文件迁移进度
const { listen_Progress, } = useProgress()

const open_devtools_fn = async () => {
  // 打开 DevTools
  invoke("open_devtools")
}


// init config
const init_config = async () => {
  appWindow = getCurrentWindow();
  config_store = await load('.settings.json', { autoSave: true });
  config_res.value = await config_store.get('config')
  if (!config_res.value) {
    config_res.value = default_config
    await config_store.set('config', config_res.value)
  }

  // 初始化一些配置
  init_setting_data(config_res)
  // 切换主题
  useChangeTheme(dark_sta.value)
  // 主题准备好后再显示窗口 
  await appWindow.show();
  console.log(config_res.value)
}

// listen / watch
async function listen_message() {
  // 文件进度
  listen_Progress()
  // 拖拽文件
  listen_file()
  // 错误 / 成功 / 关闭
  await useAppListener(appWindow, config_store)

  // 监听多个 ref
  watch([nameRe, is_link, copy_and_create_link, copy_link_name, over_open_folder, dark_sta],
    ([newValue, newIsLink, newCopyAndCreateLink, newCopyLinkName, newOverOpenFolder, newDarkSta]) => {
      // 关闭链接 / 关闭复制创建链接
      if (!newIsLink) {
        copy_and_create_link.value = false;
        newCopyAndCreateLink = false;
        over_open_folder.value = false;
      }
      config_res.value.nameRe = newValue
      config_res.value.is_link = newIsLink
      config_res.value.copy_and_create_link = newCopyAndCreateLink
      config_res.value.copy_link_name = newCopyLinkName
      config_res.value.over_open_folder = newOverOpenFolder
      config_res.value.dark_sta = newDarkSta

      // 切换主题
      useChangeTheme(newDarkSta)
      console.log(newValue, newIsLink, newCopyAndCreateLink, newCopyLinkName, newOverOpenFolder, newDarkSta, nameRe.value)
    }
  )
}

// 初始化
onMounted(async () => {
  await init_config()
  listen_message()
})
</script>

<style lang="scss" scoped>
.box {
  padding: 20px 14px;
  border-top: 1px solid #f2f2f2;

  .setting {
    .setting_box {
      padding: 0 10px;

      .setting_title {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .setting_title_icon,
        .setting_title_show_icon {
          cursor: pointer;
          display: flex;
          align-items: center;

          .setting_title_text {
            user-select: none;
            font-size: 12px;
          }

          &:hover {
            color: var(--el-color-primary);
          }
        }
      }

      .setting_conten {
        margin-top: 6px;
        padding: 0 6px;
        display: flex;
        flex-direction: column;
        max-height: 500px;
        overflow: hidden;
        transition: opacity .4s ease, max-height .4s ease;

        .open_tools_fn {
          display: flex;
          align-items: center;
          left: -3px;
          position: relative;
          user-select: none;
          cursor: pointer;
          vertical-align: middle;

          &:hover {
            color: var(--el-color-primary) !important;
          }

          .open_tools_icon:hover {
            color: var(--el-color-primary) !important;
          }
        }
      }
    }
  }

  .select_title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    user-select: none;

    .name_error_fn {
      display: flex;

      .name_error_tips {
        width: 150px;
      }
    }
  }

  .select_body {
    position: relative;

    .card1,
    .card2 {
      position: absolute;
      filter: blur(5px);
    }

    .card1 {
      width: 100%;

      .start_s {
        .select_file_list_box {
          max-height: 350px;
          overflow-y: auto;

          .select_file_row_name {
            white-space: nowrap;
          }
        }
      }
    }

    .file {
      z-index: 99 !important;
      animation: file .4s ease-in;
      filter: none;
    }
  }

  .history_move_btn {
    position: fixed;
    z-index: 99;
    width: 100vw;
    height: 100vh;
    left: 0;
    transition: .2s all ease-in;
    overflow-y: hidden;

    .clear_history_box {
      height: 20px;
      position: relative;

      .clear_history_btn {
        position: absolute;
        top: -25px;
        right: 2px;
      }
    }

    .new_row_history_data {
      overflow-y: auto;
      height: 92%;
      padding-right: 10px;
    }
  }

  .mask {
    position: fixed;
    z-index: 999;
    width: 100vw;
    height: 100vh;
    inset: 0;
  }

  .tips_mes {
    display: flex;
    align-items: center;
    position: fixed;
    left: 4px;
    bottom: 2px;
    color: var(--info-icon-color);
    font-size: 14px;
  }
}

.global_style {
  user-select: none;
}

.send_btn {
  padding: 0 10px;
  position: absolute;
  bottom: 30px;
  right: 30px;
}

.send_btn1 {
  bottom: 74px;
}

.show_icon_atv {
  transform: rotate(180deg) !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

@keyframes file {
  0% {
    opacity: 0.4;
    bottom: -180px;
  }

  50% {
    opacity: .8;
    bottom: -155px;
  }

  100% {
    opacity: 1;
    bottom: -174px;
  }
}
</style>