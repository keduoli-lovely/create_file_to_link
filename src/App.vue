<template>
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
              <el-text class="mx-1" size="large">自定义复制文件链接后缀:</el-text>
              <br>
              <div style="height: 2px;"></div>
              <el-input v-model="copy_link_name" style="width: 240px" maxlength="20" placeholder="名称后缀" show-word-limit
                type="text" />
            </div>
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
        <el-text class="mx-1">选择需要移动的{{ i }}:

        </el-text>
        <div style="height: 4px;"></div>
        <div class="start_s">
          <el-button v-if="!file_obj.goList?.[0]" type="primary" text bg @click="select_file_fn(i === '文件夹', 'goList')">
            选择{{ i }} &nbsp;<el-icon v-if="!(i === '文件夹')">
              <DocumentCopy />
            </el-icon><el-icon v-else>
              <FolderOpened />
            </el-icon>
          </el-button>

          <el-card style="max-height: 400px; overflow-y: auto;" :body-style="{ padding: '5px', }" shadow="never" v-else>
            <div v-for="(item, i) in file_obj.goList.slice(0, show_file_index)" :key="item"
              style="white-space: nowrap;">
              <el-tag type="primary" closable @close="file_obj.goList.splice(i, 1)">
                {{ item }}
              </el-tag>

              <span style="width: 20px;">&nbsp;&nbsp;&nbsp;&nbsp;</span>
            </div>

            <el-tag type="primary" @click="show_file_index += 2"
              v-show="show_file_index < file_obj.goList.length">........</el-tag>
          </el-card>
        </div>
        <div style="height: 14px;"></div>
        <el-text class="mx-1">选择需要移动到的{{ i }}:</el-text>
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

    <el-card style="position: fixed;z-index: 99;width: 100vw;height: 100vh;left: 0;transition: .3s all ease; "
      :style="{ top: `${Progress_page}%` }">
      <el-page-header @back="Progress_page = 100" :style="{userSelect: 'none'}">
        <template #content>
          <el-text class="mx-1">迁移记录</el-text>&nbsp;
          <el-text class="mx-1"><el-icon>
              <List />
            </el-icon></el-text>

        </template>
      </el-page-header>
      <div style="height: 20px;"></div>

      <CurrentProgress v-if="Temporary_history_list_sta" :currentFile="currentFile" :progress="progress"
        :format="format" />
      <div style="height: 16px;"></div>
      <History_card v-if="!Temporary_history_list?.[0]" :history_list=Temporary_history_list :format="format" />
      <History_card :history_list=config_res?.history_list :format="format" />
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
  List
} from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { ref, onMounted, watch } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { exists } from '@tauri-apps/plugin-fs';
import { load } from '@tauri-apps/plugin-store';
import { getCurrentWindow } from '@tauri-apps/api/window';
import History_card from './views/History_card.vue';
import CurrentProgress from './views/CurrentProgress.vue';
import 'element-plus/dist/index.css';

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
    "C:\\Windows\\System32",
    "C:\\ProgramData",
    "C:\\Users",
    "C:\\$Recycle.Bin",
    "C:\\System Volume Information",
    "C:\\Boot",
    "C:\\EFI",
  ],
  nameRe: "Option1",
  is_link: true,
  copy_and_create_link: false,
  copy_link_name: "_link",
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
    if (nameRe.value === "Option1") {
      let res = await checkConflict(file_obj.value.toPath, file_obj.value.goList)
      if (!res.sta) {
        mask_sta.value = false
        return ElNotification({ title: '发生错误', message: res.mse, type: 'error', duration: 5000, })
      }
    }
    file_obj.value.isCopy = isCopy

    // 进入进度条页面 
    Progress_page.value = 0
    show_file_index.value = 5
    Temporary_history_list_sta.value = true
    runMoveOrCopy(file_obj.value)

    file_obj.value.goList = []
    file_obj.value.toPath = ""
    file_obj.value.isFile = null
    file_obj.value.isCopy = null
  } else {
    ElNotification({ title: '参数不全', message: file_obj.value, type: 'error', duration: 5000, })

  }

  centerDialogVisible.value = false
  mask_sta.value = false
}

// create link
const createLink = async (item, file_isCopy) => {
  console.log(!config_res.value.is_link, file_isCopy && !config_res.value.copy_and_create_link, 'link', item, file_isCopy)
  if (!config_res.value.is_link) return;
  if (file_isCopy && !config_res.value.copy_and_create_link) return;
  let file_name_Suffix = file_isCopy ? item.old + config_res.value.copy_link_name : item.old

  try {
    let l_res = await invoke("create_link_auto", {
      src: item.new,
      dst: file_name_Suffix
    })

    console.log(l_res, 'create link')
  } catch (error) {
    console.log(error, 'create link')
    ElNotification({ title: '发生错误', message: error, type: 'error', duration: 3000, })
  }

}

// copy / move
const runMoveOrCopy = async (file_obj) => {
  try {
    await invoke("move_or_copy_files", file_obj)   // ⭐ 不再等待 result
  } catch (error) {
    format.value = "exception"
    currentFile.value = error?.toString?.() ?? "未知错误"
    progress.value = 0

    Temporary_history_list.value.unshift({
      list: [],
      sta: false,
      progress: 0,
      currentFile: currentFile.value
    })
  }
}

// 排除文件名 / 冲突文件
async function checkConflict(toPath, src_list) {
  // 先检查是否命中排除列表
  for (let src of src_list) {
    // 判断是否在排除列表里（可以用 startsWith 来匹配子目录）
    if (config_res.value.filter_path.some(ex => src.toLowerCase().startsWith(ex.toLowerCase()))) {
      return { sta: false, mse: "不允许复制/剪切的文件/目录" }
    }
  }

  // 映射目标路径
  const mappedFiles = src_list.map(path => {
    const parts = path.split(/[/\\]/)
    const fileName = parts[parts.length - 1]
    return `${toPath}\\${fileName}`
  })

  // 判断目标是否已存在
  for (let item of mappedFiles) {
    let res = await exists(item)
    if (res) {
      return { sta: false, mse: "目标文件已存在" }
    }
  }

  // 如果都没问题
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

  nameRe.value = config_res.value.nameRe
  is_link.value = config_res.value.is_link
  copy_and_create_link.value = config_res.value.copy_and_create_link
  copy_link_name.value = config_res.value.copy_link_name
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
        createLink(item, file_obj.value.isCopy)
      }
    }, copy_move_tiem)

    Temporary_history_list.value.unshift({
      list: result,
      sta: true,
      progress: 100,
      currentFile: currentFile.value
    })
  })

  // 错误事件
  listen("file-error", (event) => {
    format.value = "exception"
    currentFile.value = event.payload?.toString?.() ?? "未知错误"
    progress.value = 0

    Temporary_history_list.value.unshift({
      list: [],
      sta: false,
      progress: 0,
      currentFile: currentFile.value
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
  watch([nameRe, is_link, copy_and_create_link, copy_link_name],
    ([newValue, newIsLink, newCopyAndCreateLink, newCopyLinkName]) => {
      // 关闭链接 / 关闭复制创建链接
      if (!newIsLink) {
        copy_and_create_link.value = false;
        newCopyAndCreateLink = false;
      }
      config_res.value.nameRe = newValue
      config_res.value.is_link = newIsLink
      config_res.value.copy_and_create_link = newCopyAndCreateLink
      config_res.value.copy_link_name = newCopyLinkName

      console.log(newValue, newIsLink, newCopyAndCreateLink, newCopyLinkName, nameRe.value)
    }
  )
}

// 初始化
onMounted(async () => {
  await init_config()
  listen_message()
})


// #############################################################
// const runMoveOrCopy = async (file_obj) => {
//   let history_list_v2 = {
//     list: [],
//     sta: true,
//   }

//   try {
//     const result = await invoke("move_or_copy_files", file_obj)
//     // 添加转移记录
//     history_list_v2.list = result
//     progress.value = 100
//     if (currentFile.value === "珂朵莉世界第一可爱!!!!") {
//       result.length > 0 ? currentFile.value = result[0]?.new : ''
//     }

//     Temporary_history_list_sta.value = false
//     // 创建链接 /等待500ms
//     setTimeout(() => {
//       for (const item of result) {
//         createLink(item, file_obj.isCopy)
//       }
//     }, copy_move_tiem);
//     console.log(result)
//   } catch (error) {
//     format.value = "exception"
//     currentFile.value = error?.toString?.() ?? "未知错误"
//     progress.value = 0
//     history_list_v2.sta = false
//     console.log(error, 1111111111111)
//   }

//   // 保存转移记录
//   setTimeout(() => {
//     Temporary_history_list.value.unshift({
//       ...history_list_v2,
//       progress: progress.value,
//       currentFile: currentFile.value
//     })
//   }, 0)

// }
</script>

<style lang="scss" scoped>
.box {
  padding: 20px 14px;

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
      filter: blur(2px);
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