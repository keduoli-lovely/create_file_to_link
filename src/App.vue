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

    <el-dialog class="global_style" v-model="centerDialogVisible" title="提示" width="400" align-center>
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
  </div>

</template>

<script setup>
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
import { ref, onMounted, watch, computed } from 'vue';
import { get_config_default } from './assets/default';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { dirname } from "@tauri-apps/api/path";
import { exists } from '@tauri-apps/plugin-fs';
import { load } from '@tauri-apps/plugin-store';
import { openPath, revealItemInDir, openUrl } from '@tauri-apps/plugin-opener';
import { getCurrentWindow } from '@tauri-apps/api/window';
import History_card from './views/History_card.vue';
import CurrentProgress from './views/CurrentProgress.vue';
import 'element-plus/dist/index.css';
import Title_bar from './views/title_bar.vue';


// 默认配置
let {
  appWindow,
  config_store,
  terminal_icon,
  github_icon,
  github_link,
  SpaceSniffer_link,
  copy_move_tiem,
  lastUpdate,
  update_time,
  options,
  default_config,
  clear_history_btn_disabled,
  lastOpenedDir,
  buildLinkName
} = get_config_default()

// 加载的配置文件
const config_res = ref(null)
// 临时的迁移文件记录
const Temporary_history_list = ref([])
const Temporary_history_list_sta = ref(false)
// 文件名冲突解决方法
const nameRe = ref('Option1')
// 是否创建链接
const is_link = ref(true)
// 复制文件是否创建链接
const copy_and_create_link = ref(false)
// 复制文件创建链接后缀
const copy_link_name = ref("_link")
// 完成后打开文件夹
const over_open_folder = ref(false)
// 主题
const dark_sta = ref(false)
// 是否展开设置页面
const setting_page_isShow = ref(false)
// 选择的类型 文件 / 文件夹
const select_file_type = ref("文件")
// 选择 复制 / 剪切 弹窗
const centerDialogVisible = ref(false)
// 选择的文件 / 文件夹 列表
const file_obj = ref({})
// 默认显示选择文件 / 文件夹的数量 index - 1
const show_file_index = ref(5)
// 加载动画页面状态
const mask_sta = ref(false)
// 进度页面
const Progress_page = ref(100)
// 定义进度条状态  '' 状态 '' 成功， exception 错误
const progress = ref(0)
// 进度页面 复制 / 剪切 文件名
const currentFile = ref("等待处理中....")
// 进度条状态
const format = ref("")
// 文件/文件夹
const file_type = ref([
  "文件",
  "文件夹"
])
const open_devtools_fn = async () => {
  // 打开 DevTools
  invoke("open_devtools")
}

// select file fn
const select_file_fn = async (sta, key, multiple = true) => {
  const file = await open({ multiple, directory: sta })
  file_obj.value[key] = file
  console.log(file_obj.value.goList)
  if (key === "goList") {
    file_obj.value.isFile = !sta
  }
}

// over data
const move_file_config = async (isCopy) => {
  mask_sta.value = true
  if ("isFile" in file_obj.value && file_obj.value.goList?.length > 0 && file_obj.value.toPath) {
    let res = await checkConflict(file_obj.value.toPath, file_obj.value.goList)
    if (!res.sta) {
      mask_sta.value = false
      return ElNotification({ title: '发生错误', message: res.mse, type: 'error', duration: 5000, })
    }
    file_obj.value.isCopy = isCopy

    // 进入进度条页面 
    Progress_page.value = 0
    show_file_index.value = 5
    Temporary_history_list_sta.value = true
    runMoveOrCopy(file_obj.value)
  } else {
    ElNotification({ title: '参数不全', message: file_obj.value, type: 'error', duration: 5000, })

  }

  centerDialogVisible.value = false
  mask_sta.value = false
  reset_config()
}

// create link
const createLink = async (item, file_isCopy, file_isFile) => {
  console.log(!config_res.value.is_link, file_isCopy && !config_res.value.copy_and_create_link, 'link', item, file_isCopy)
  if (!config_res.value.is_link) return;
  if (file_isCopy && !config_res.value.copy_and_create_link) return;
  // let file_name_Suffix = file_isCopy ? item.old + config_res.value.copy_link_name : item.old
  // 处理复制文件冲突添加_link覆盖后缀的问题
  let dst = file_isCopy ? buildLinkName(item.old, config_res.value.copy_link_name, file_isFile) : item.old

  try {
    let l_res = await invoke("create_link_auto", {
      src: item.new,
      dst
    })

    if (over_open_folder.value) {
      await new Promise(r => setTimeout(r, 100))
      // 根据文件/文件夹打开 
      console.log(file_isFile, 12, dst)
      await open_symlink_or_forder(file_isFile, dst)
    }
    console.log(l_res, 'create link')
  } catch (error) {
    console.log(error, 'create link')
    ElNotification({ title: '发生错误', message: error, type: 'error', duration: 3000, })
  }

}



// 清空 Temporary_history_list / config_res.value.history_list
const clear_history_list = () => {
  console.log('-----------清空记录------------')
  try {
    Temporary_history_list.value.length = 0
    config_res.value.history_list.length = 0
    console.log('info: clear over', Temporary_history_list.value, config_res.value.history_list)
  } catch (error) {
    Temporary_history_list.value = []
    config_res.value.history_list = []
    console.log("info: ", error)
  }

  set_progress_data()
  Temporary_history_list_sta.value = false
}

// copy / move
const runMoveOrCopy = async (file_obj) => {
  try {
    await invoke("move_or_copy_files", file_obj)
  } catch (error) {
    let currentFile_tmp = error?.toString?.() ?? "未知错误"
    set_progress_data(0, currentFile_tmp, "exception")

    Temporary_history_list.value.unshift({
      list: [],
      sta: false,
      progress: 0,
      currentFile: currentFile_tmp,
      time: Date.now()
    })
  }
}

// 打开 symlink 所在目录
const open_symlink_or_forder = async (file_isFile, dst) => {
  const isLink = await invoke("is_symlink", { path: dst });

  if (isLink) {
    // 打开 symlink 所在目录，而不是跳到真实文件
    const dir = await dirname(dst);
    // 如果目录与上一次相同 → 不重复打开 
    if (lastOpenedDir === dir) {
      console.log("目录相同，不重复打开", dir);
      return;
    }
    lastOpenedDir = dir;
    await openPath(dir);

    return;
  } else {
    // 普通文件 → 正常打开
    if (file_isFile) {
      await revealItemInDir(dst) // 打开所在目录并选中文件 
    } else {
      await openPath(dst) // 打开文件夹 
    }
  }
}

// 排除文件名 / 冲突文件
async function checkConflict(toPath, src_list) {
  // 排除列表检查
  for (let src of src_list) {
    if (config_res.value.filter_path.some(ex =>
      src.toLowerCase().startsWith(ex.toLowerCase())
    )) {
      return { sta: false, mse: `不允许复制/剪切的文件/目录: ${src}` }
    }
  }

  // 映射目标路径
  const mappedFiles = src_list.map(path => {
    const parts = path.split(/[/\\]/)
    const fileName = parts[parts.length - 1]
    return `${toPath}\\${fileName}`
  })

  // Option1：严格模式 → 检查目标是否存在
  if (nameRe.value === "Option1") {
    for (let item of mappedFiles) {
      let res = await exists(item)
      if (res) {
        return { sta: false, mse: `目标文件已存在：${item}` }
      }
    }
  }

  // Option2：覆盖模式 → 检查 symlink
  else {
    for (let dst of mappedFiles) {
      const isLink = await invoke("is_symlink", { path: dst })
      if (isLink) {
        return { sta: false, mse: `目标路径是符号链接，无法覆盖：${dst}` }
      }
    }
  }

  return { sta: true }
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

  nameRe.value = config_res.value?.nameRe || "Option1"
  is_link.value = config_res.value?.is_link || true
  copy_and_create_link.value = config_res.value?.copy_and_create_link || false
  copy_link_name.value = config_res.value?.copy_link_name || "_link"
  over_open_folder.value = config_res.value?.over_open_folder || false
  dark_sta.value = config_res.value?.dark_sta || false

  // 切换暗色主题
  if (dark_sta.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  // 主题准备好后再显示窗口 
  await appWindow.show();
  // 清空历史记录是否可用
  clear_history_btn_disabled = computed(() => {
    return Temporary_history_list.value.length === 0 &&
      config_res.value.history_list.length === 0 &&
      Temporary_history_list_sta.value === false
  })
  console.log(config_res.value)
}

// listen / watch
async function listen_message() {
  listen("file-progress", (event) => {
    const now = Date.now()

    if (now - lastUpdate > update_time) {
      progress.value = event.payload.percent
      currentFile.value = event.payload.src
      lastUpdate = now
      console.log(`文件 ${event.payload.src} 进度: ${event.payload.percent}%`)
    }
  })

  // 完成事件
  listen("file-complete", (event) => {
    const result = event.payload

    progress.value = 100
    Temporary_history_list_sta.value = false

    if (result.length > 0) {
      currentFile.value = result[0].new
    }

    setTimeout(() => {
      for (const item of result) {
        createLink(item, file_obj.value.isCopy, file_obj.value.isFile)
      }

      // 重置数据
      set_progress_data()
      lastOpenedDir = null
      reset_config()
    }, copy_move_tiem)

    Temporary_history_list.value.unshift({
      list: result,
      sta: true,
      progress: 100,
      currentFile: currentFile.value,
      time: Date.now()
    })
  })

  // 错误事件
  listen("file-error", (event) => {
    let currentFile_tmp = error?.toString?.() ?? "未知错误"
    set_progress_data(0, currentFile_tmp, "exception")
    Temporary_history_list_sta.value = false

    Temporary_history_list.value.unshift({
      list: [],
      sta: false,
      progress: 0,
      currentFile: currentFile_tmp,
      time: Date.now()
    })
  })

  //  文件锁定错误事件
  listen("lock_error", (event) => {
    set_progress_data(0, "文件锁定失败, 取消操作", "exception")
    setTimeout(() => {
      Temporary_history_list_sta.value = false
    }, 5000);
    ElNotification({ title: '文件锁定失败', message: event.payload, type: 'error', duration: 5000, })
    console.log('文件锁定失败:', event.payload)
  })

  await appWindow.listen("tauri://close-requested", async () => {
    try {
      // 合并历史记录
      config_res.value.history_list = Temporary_history_list.value.concat(
        config_res.value.history_list
      )

      // 保存配置
      await config_store.set("config", config_res.value)
      await config_store.save()
    } catch (error) {
      // 写入日志
    } finally {
      // 无论是否出错，最后都执行 destroy
      await appWindow.destroy()
    }
  })

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

      // 切换暗色主题
      if (newDarkSta) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      console.log(newValue, newIsLink, newCopyAndCreateLink, newCopyLinkName, newOverOpenFolder, newDarkSta, nameRe.value)
    }
  )
}

// 重置数据
const reset_config = () => {
  file_obj.value.goList = []
  file_obj.value.toPath = ""
  file_obj.value.isFile = null
  file_obj.value.isCopy = null
}
// 进度条数据
const set_progress_data = (_progress = 0, _currentFile = "等待处理中....", _format = "") => {
  progress.value = _progress
  currentFile.value = _currentFile
  format.value = _format
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