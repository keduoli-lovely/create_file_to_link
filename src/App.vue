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
              <el-text class="mx-1" style="user-select: none;" size="large">自定义复制文件链接后缀:</el-text>
              <br>
              <div style="height: 2px;"></div>
              <el-input v-model="copy_link_name" style="width: 240px" maxlength="20" placeholder="名称后缀" show-word-limit
                type="text" />
            </div>
            <span>
              <el-checkbox v-model="over_open_folder" label="完成后打开链接文件夹" />
            </span>
            <span>
              <el-checkbox v-model="dark_sta" label="使用暗色" />
            </span>
            <div style="height: 12px;"></div>
          </div>
        </div>
      </el-card>
    </div>
    <div style="height: 12px;"></div>
    <div class="select_title">
      <el-segmented v-model="select_file_type" :options="file_type" @change="file_obj = {}, show_file_index = 5" />
      <div style="display: flex;">
        <el-text class="mx-1" size="large">名称冲突方案:&nbsp;&nbsp;</el-text>
        <el-select v-model="nameRe" placeholder="Select" style="width: 150px;">
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </div>

    <div class="select_body">
      <el-card class="card1" v-for="i in file_type" :key="i" :class="{ 'file': select_file_type === i }"
        style="width: 100%;" shadow="hover">
        <el-text class="mx-1" style="user-select: none;">选择需要移动的{{ i }}: </el-text>
        <div style="height: 4px;"></div>
        <div class="start_s">
          <el-button v-if="!file_obj.goList?.[0]" type="primary" text bg @click="select_file_fn(i === '文件夹', 'goList')">
            选择{{ i }} &nbsp;<el-icon v-if="!(i === '文件夹')">
              <DocumentCopy />
            </el-icon><el-icon v-else>
              <FolderOpened />
            </el-icon>
          </el-button>

          <el-card style="max-height: 350px; overflow-y: auto;" :body-style="{ padding: '5px', }" shadow="never" v-else>
            <div v-for="(item, i) in file_obj.goList.slice(0, show_file_index)" :key="item"
              style="white-space: nowrap;">
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
        <el-text class="mx-1" style="user-select: none;">选择需要移动到的{{ i }}:</el-text>
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

    <el-dialog v-model="centerDialogVisible" title="提示" width="400" align-center>
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

    <el-card
      style="position: fixed;z-index: 99;width: 100vw;height: 100vh;left: 0;transition: .2s all ease-in;overflow-y: hidden;"
      :style="{ top: `${Progress_page}%` }">
      <div>
        <el-page-header @back="Progress_page = 100" :style="{ userSelect: 'none' }" title="返回">
          <template #content>
            <el-text class="mx-1">迁移记录</el-text>&nbsp;
            <el-text class="mx-1"><el-icon>
                <List />
              </el-icon></el-text>

          </template>
        </el-page-header>
        <div style="height: 20px;position: relative;">
          <div class="clear_history_btn" style="position: absolute;top: -25px;right: 2px;user-select: none;">

            <el-popconfirm class="box-item" title="确认要清楚迁移记录吗?" placement="left" confirm-button-text="确认"
              cancel-button-text="取消" @confirm="clear_history_list">
              <template #reference>
                <el-button class="mt-3 mb-3"> <el-text class="mx-1">清空</el-text>&nbsp;
                  <el-text class="mx-1"><el-icon>
                      <DeleteFilled />
                    </el-icon></el-text>&nbsp;</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>

      <div style="overflow-y: auto;height: 92%;padding-right: 10px;">
        <CurrentProgress v-if="Temporary_history_list_sta" :currentFile="currentFile" :progress="progress"
          :format="format" />
        <div style="height: 16px;"></div>
        <History_card v-if="Temporary_history_list?.length" :history_list=Temporary_history_list :format="format" />
        <History_card v-if="config_res?.history_list?.length" :history_list=config_res?.history_list :format="format" />
      </div>
    </el-card>
    <div class="mask" style="position: fixed;z-index: 999;width: 100vw;height: 100vh; inset: 0;" v-loading="true"
      v-if="mask_sta"></div>
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
import { ref, onMounted, watch } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { dirname } from "@tauri-apps/api/path";
import { exists } from '@tauri-apps/plugin-fs';
import { load } from '@tauri-apps/plugin-store';
import { openPath, revealItemInDir } from '@tauri-apps/plugin-opener';
import { getCurrentWindow } from '@tauri-apps/api/window';
import History_card from './views/History_card.vue';
import CurrentProgress from './views/CurrentProgress.vue';
import 'element-plus/dist/index.css';
import Title_bar from './views/title_bar.vue';

// 窗口
let appWindow = null

// 配置文件
let config_store = null
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
// 复制 / 剪切完等待时间
const copy_move_tiem = 500
let lastUpdate = 0
const update_time = 200
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
const currentFile = ref("珂朵莉世界第一可爱!!!!")
// 进度条状态
const format = ref("")
// 文件/文件夹
const file_type = ref([
  "文件",
  "文件夹"
])
// 文件名冲突方案列表
const options = [
  {
    value: 'Option1',
    label: '提示冲突',
  },
  {
    value: 'Option2',
    label: '强制覆盖',
  },
]
// 默认配置参数
const default_config = {
  filter_path: [
    "C:\\Windows",
    "C:\\$Recycle.Bin",
    "C:\\System Volume Information",
    "C:\\Boot",
    "C:\\EFI",
  ],
  nameRe: "Option1",
  is_link: true,
  copy_and_create_link: false,
  copy_link_name: "_link",
  over_open_folder: false,
  dark_sta: false,
  history_list: [
    // progress: 0  进度
    // currentFile: 提示/文件名
    // format: '' 状态 '' 成功， exception 错误
  ]
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
  if ("isFile" in file_obj.value && file_obj.value.goList.length > 0 && file_obj.value.toPath) {
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

// 处理复制文件冲突添加_link覆盖后缀的问题
const buildLinkName = (oldPath, suffix, isFile) => {
  if (!isFile) {
    // 文件夹：直接拼接后缀
    return oldPath + suffix
  }

  // 文件：插入后缀到扩展名前
  const lastDot = oldPath.lastIndexOf(".")
  if (lastDot === -1) {
    // 没有扩展名
    return oldPath + suffix
  }

  const name = oldPath.slice(0, lastDot)
  const ext = oldPath.slice(lastDot)
  return name + suffix + ext
}

// 清空 Temporary_history_list / config_res.value.history_list
const clear_history_list = () => {
  console.log('-----------清空记录------------')
  try {
    Temporary_history_list.value.length = 0
    config_res.value.history_list.length = 0

    console.log('info: clear over', Temporary_history_list.value, config_res.value.history_list)
    return;
  } catch (error) {
    Temporary_history_list.value = []
    config_res.value.history_list = []
    console.log("info: ", error)
  }
}

// copy / move
const runMoveOrCopy = async (file_obj) => {
  try {
    await invoke("move_or_copy_files", file_obj)
  } catch (error) {
    format.value = "exception"
    currentFile.value = error?.toString?.() ?? "未知错误"
    progress.value = 0

    Temporary_history_list.value.unshift({
      list: [],
      sta: false,
      progress: 0,
      currentFile: currentFile.value,
      time: Date.now()
    })
  }
}

// 打开 symlink 所在目录
let lastOpenedDir = null; // 记录上一次打开的目录
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
      currentFile.value = "等待处理中...."
      progress.value = 0
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
    format.value = "exception"
    currentFile.value = event.payload?.toString?.() ?? "未知错误"
    progress.value = 0
    Temporary_history_list_sta.value = false

    Temporary_history_list.value.unshift({
      list: [],
      sta: false,
      progress: 0,
      currentFile: currentFile.value,
      time: Date.now()
    })
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
            color: skyblue;
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
      }
    }
  }

  .select_title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    user-select: none;
  }

  .select_body {
    position: relative;

    .card1,
    .card2 {
      position: absolute;
      filter: blur(5px);
    }

    .file {
      z-index: 99 !important;
      animation: file .4s ease-in;
      filter: none;
    }
  }
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