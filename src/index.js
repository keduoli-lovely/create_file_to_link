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
import { get_config_default } from './config';
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
import drag_file_page from './views/drag_file_page.vue';


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
  buildLinkName,
  filter_fileList,
  check_isSymLink_fn,
} = get_config_default()

// 拖拽文件动画
const drag_file_show = ref(false)
const drag_loding_show = ref(true)
// 拖拽冲突提示
const drag_error = ref(false)
const drag_fileList_data = ref(null)
const drag_fileMerge = ref(false)
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
    if (file_obj.value.isFile === null) {
      select_file_type.value === "文件" ? file_obj.value.isFile = true : file_obj.value.isFile = false
    }

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
      if (file_isFile === null) {
        select_file_type.value === "文件" ? file_isFile = true : file_isFile = false
      }
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
    let res = await check_isSymLink_fn(mappedFiles)
    if (!res.sta) {
      return { sta: res.sta, mse: `目标路径是符号链接，覆盖会出现错误：${res.path}` }
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

    setTimeout(async () => {
      for (const item of result) {
        await createLink(item, file_obj.value.isCopy, file_obj.value.isFile)
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

    set_progress_data()
    reset_config()
  })

  //  文件锁定错误事件
  listen("lock_error", (event) => {
    set_progress_data(0, "文件锁定失败, 取消操作", "exception")
    setTimeout(() => {
      Temporary_history_list_sta.value = false
      set_progress_data()
      reset_config()
    }, 5000);
    ElNotification({ title: '文件锁定失败', message: event.payload, type: 'error', duration: 5000, })
    console.log('文件锁定失败:', event.payload)
  })

  listen_file()

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

// 文件移动事件 / 添加文件
const listen_file = async () => {
  // 进入
  await listen('tauri://drag-enter', event => {
    if (drag_file_show.value) return;
    drag_file_show.value = true
    setTimeout(() => {
      drag_loding_show.value = false

    }, 100);
    console.log('拖入文件列表:', event.payload);
  });

  // 移出
  await listen("tauri://drag-leave", e => {
    out_loding_fn()
    console.log("拖拽离开:", e.payload);
  });

  // 放下
  await listen("tauri://drag-drop", async event => {
    setTimeout(() => out_loding_fn(), 500);
    console.log(select_file_type.value)
    let res_symlink = await check_isSymLink_fn(event.payload.paths)
    if (!res_symlink.sta) {
      ElNotification({ title: '提示', message: `发现链接文件, 移动可能会出现错误: ${res_symlink.path}`, type: 'warning', duration: 5000, })
    };
    let res = await filter_fileList(event.payload.paths)
    console.log(res)
    if (res.most_file) {
      if (res.type === "mixed") {
        // 提示用户二选一
        drag_fileList_data.value = res;
        drag_fileMerge.value = true
        drag_error.value = true;
        return
      }

      res.list = [...res.list, ...res.list_v1]
    }

    handleFileOrDir(res)

  })
}

// 统一类型
const handleFileOrDir = (res) => {
  if (!file_obj.value.goList || !file_obj.value.goList?.length) {
    select_file_type.value = res.type === "file" ? "文件" : "文件夹";
    file_obj.value.goList = Array.isArray(res.list) ? res.list : [res.list];
    return;
  }

  if (res.type === "file") {
    if (select_file_type.value === "文件") {
      file_obj.value.goList = [...new Set([...file_obj.value.goList, ...res.list])];
    } else {
      drag_fileList_data.value = res;
      drag_error.value = true;
    }
  } else if (res.type === "dir") {
    if (select_file_type.value === "文件") {
      drag_fileList_data.value = res;
      drag_error.value = true;
    } else {
      file_obj.value.goList = [...new Set([...file_obj.value.goList, ...res.list])];
    }
  }
};

// 保留指定类型
const save_fileOrDir = (type) => {
  if (drag_fileMerge.value) {
    if (type === "dir") {
      drag_fileList_data.value.list = drag_fileList_data.value.list_v1
    }
    handleFileOrDir(drag_fileList_data.value)
    drag_fileMerge.value = false
  }
  select_file_type.value = type === "file" ? "文件" : "文件夹"
  file_obj.value.goList = drag_fileList_data.value.list
  drag_error.value = false
}

// out_loding
const out_loding_fn = () => {
  if (drag_loding_show.value) return;
  drag_loding_show.value = true
  setTimeout(() => {
    drag_file_show.value = false
  }, 100);
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