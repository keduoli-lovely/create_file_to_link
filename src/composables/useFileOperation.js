import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener";
import { exists } from "@tauri-apps/plugin-fs";
import { dirname } from "@tauri-apps/api/path";
import { storeToRefs } from "pinia";
import { ElNotification } from "element-plus";
import { useFileStore } from "@/stores/useFileStore";
import { useConfigStore } from "@/stores/useConfigStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { check_isSymLink_fn } from "@/utils/fileUtils";
import { buildLinkName } from "@/utils/filenameUtils";

export function useFileOperation() {
  const HistoryStore = useHistoryStore();
  const { file_obj, select_file_type } = storeToRefs(useFileStore());
  const {
    config_res,
    nameRe,
    over_open_folder,
    mask_sta,
    Progress_page,
    show_file_index,
    centerDialogVisible,
  } = storeToRefs(useConfigStore());
  const { addHistory } = HistoryStore;
  const { lastOpenedDir, Temporary_history_list_sta } =
    storeToRefs(HistoryStore);
  const { set_progress_data } = useProgressStore();

  // 选择文件 / 文件夹
  const select_file_fn = async (sta, key, multiple = true) => {
    const file = await open({ multiple, directory: sta });
    file_obj.value[key] = file;
    console.log(file_obj.value.goList);
    if (key === "goList") {
      file_obj.value.isFile = !sta;
    }
  };

  // 打开 symlink 所在目录
  const open_symlink_or_forder = async (file_isFile, dst) => {
    const isLink = await invoke("is_symlink", { path: dst });

    if (isLink) {
      // 打开 symlink 所在目录，而不是跳到真实文件
      const dir = await dirname(dst);
      // 如果目录与上一次相同 → 不重复打开
      if (lastOpenedDir.value === dir) {
        console.log("目录相同，不重复打开", dir);
        return;
      }
      lastOpenedDir.value = dir;
      await openPath(dir);

      return;
    } else {
      // 普通文件 → 正常打开
      if (file_isFile) {
        await revealItemInDir(dst); // 打开所在目录并选中文件
      } else {
        await openPath(dst); // 打开文件夹
      }
    }
  };

  // 排除文件名 / 冲突文件
  async function checkConflict(toPath, src_list) {
    // 排除列表检查
    for (let src of src_list) {
      if (
        config_res.value.filter_path.some((ex) =>
          src.toLowerCase().startsWith(ex.toLowerCase()),
        )
      ) {
        return { sta: false, mse: `不允许复制/剪切的文件/目录: ${src}` };
      }
    }

    // 映射目标路径
    const mappedFiles = src_list.map((path) => {
      const parts = path.split(/[/\\]/);
      const fileName = parts[parts.length - 1];
      return `${toPath}\\${fileName}`;
    });

    // Option1：严格模式 → 检查目标是否存在
    if (nameRe.value === "Option1") {
      for (let item of mappedFiles) {
        let res = await exists(item);
        if (res) {
          return { sta: false, mse: `目标文件已存在：${item}` };
        }
      }
    }

    // Option2：覆盖模式 → 检查 symlink
    else {
      let res = await check_isSymLink_fn(mappedFiles);
      if (!res.sta) {
        return {
          sta: res.sta,
          mse: `目标路径存在同名的符号链接文件，覆盖会出现错误：${res.path}`,
        };
      }
    }

    return { sta: true };
  }

  // 创建软连接
  const createLink = async (item, file_isCopy, file_isFile) => {
    console.log(
      !config_res.value.is_link,
      file_isCopy && !config_res.value.copy_and_create_link,
      "link",
      item,
      file_isCopy,
    );
    if (!config_res.value.is_link) return;
    if (file_isCopy && !config_res.value.copy_and_create_link) return;
    // let file_name_Suffix = file_isCopy ? item.old + config_res.value.copy_link_name : item.old
    // 处理复制文件冲突添加_link覆盖后缀的问题
    let dst = file_isCopy
      ? buildLinkName(item.old, config_res.value.copy_link_name, file_isFile)
      : item.old;

    try {
      let l_res = await invoke("create_link_auto", {
        src: item.new,
        dst,
      });

      if (over_open_folder.value) {
        await new Promise((r) => setTimeout(r, 100));
        // 根据文件/文件夹打开
        console.log(file_isFile, 12, dst);
        if (file_isFile === null) {
          select_file_type.value === "文件"
            ? (file_isFile = true)
            : (file_isFile = false);
        }
        await open_symlink_or_forder(file_isFile, dst);
      }
      console.log(l_res, "create link");
    } catch (error) {
      console.log(error, "create link");
      ElNotification({
        title: "发生错误",
        message: error,
        type: "error",
        duration: 3000,
      });
    }
  };

  // 检查并开始迁移文件
  const move_file_config = async (isCopy) => {
    mask_sta.value = true;
    if (
      "isFile" in file_obj.value &&
      file_obj.value.goList?.length > 0 &&
      file_obj.value.toPath
    ) {
      let res = await checkConflict(
        file_obj.value.toPath,
        file_obj.value.goList,
      );
      if (!res.sta) {
        mask_sta.value = false;
        return ElNotification({
          title: "发生错误",
          message: res.mse,
          type: "error",
          duration: 5000,
        });
      }
      file_obj.value.isCopy = isCopy;

      // 进入进度条页面
      Progress_page.value = 0;
      show_file_index.value = 5;
      Temporary_history_list_sta.value = true;
      if (file_obj.value.isFile === null) {
        select_file_type.value === "文件"
          ? (file_obj.value.isFile = true)
          : (file_obj.value.isFile = false);
      }

      runMoveOrCopy(file_obj.value);
    } else {
      ElNotification({
        title: "参数不全",
        message: file_obj.value,
        type: "error",
        duration: 5000,
      });
    }

    centerDialogVisible.value = false;
    mask_sta.value = false;
  };

  // 剪切 / 拷贝
  const runMoveOrCopy = async (file_obj) => {
    try {
      await invoke("run_check_copy_move_files", file_obj);
    } catch (error) {
      let currentFile_tmp = error?.toString?.() ?? "未知错误";
      set_progress_data(0, currentFile_tmp, "exception");

      addHistory({ currentFile: currentFile_tmp });
    }
  };

  return {
    select_file_fn,
    open_symlink_or_forder,
    checkConflict,
    createLink,
    move_file_config,
  };
}
