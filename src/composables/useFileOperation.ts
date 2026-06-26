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
import type {
  FileResult,
  ConflictCheckResult,
  RunCheckCopyMoveFilesArgs,
  FileCompletePayload,
} from "@/types";

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
  const select_file_fn = async (
    sta: boolean,
    key: "goList" | "toPath",
    multiple = true,
  ): Promise<void> => {
    const file = await open({ multiple, directory: sta });
    (file_obj.value as any)[key] = file;
    console.log(file_obj.value.goList);
    if (key === "goList") {
      file_obj.value.isFile = !sta;
    }
  };

  // 打开 symlink 所在目录
  const open_symlink_or_forder = async (
    file_isFile: boolean,
    dst: string,
  ): Promise<void> => {
    const isLink = (await invoke("is_symlink", { path: dst })) as boolean;

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
  async function checkConflict(
    toPath: string,
    src_list: string[],
  ): Promise<ConflictCheckResult> {
    // 排除列表检查
    for (const src of src_list) {
      if (
        config_res.value!.filter_path.some((ex) =>
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
      for (const item of mappedFiles) {
        const res = await exists(item);
        if (res) {
          return { sta: false, mse: `目标文件已存在：${item}` };
        }
      }
    } else {
      // Option2：覆盖模式 → 检查 symlink
      const res = await check_isSymLink_fn(mappedFiles);
      if (!res.sta) {
        return {
          sta: res.sta,
          mse: `目标路径存在同名的符号链接文件，覆盖会出现错误：${res.path}`,
        };
      }
    }

    return { sta: true };
  }

  // 创建软连接 — 返回创建的软链接路径
  const createLink = async (
    item: FileResult,
    file_isCopy: boolean,
    file_isFile: boolean | null,
  ): Promise<string | null> => {
    console.log(
      !config_res.value!.is_link,
      file_isCopy && !config_res.value!.copy_and_create_link,
      "link",
      item,
      file_isCopy,
    );
    if (!config_res.value!.is_link) return null;
    if (file_isCopy && !config_res.value!.copy_and_create_link) return null;

    const dst = file_isCopy
      ? buildLinkName(item.old, config_res.value!.copy_link_name, file_isFile!)
      : item.old;

    try {
      const l_res = await invoke("create_link_auto", {
        src: item.new,
        dst,
      });

      if (over_open_folder.value) {
        await new Promise((r) => setTimeout(r, 100));
        console.log(file_isFile, 12, dst);
        let resolvedIsFile = file_isFile;
        if (resolvedIsFile === null) {
          resolvedIsFile = select_file_type.value === "文件";
        }
        await open_symlink_or_forder(resolvedIsFile, dst);
      }
      console.log(l_res, "create link");
      return dst;
    } catch (error) {
      console.log(error, "create link");
      ElNotification({
        title: "发生错误",
        message: String(error),
        type: "error",
        duration: 3000,
      });
      return null;
    }
  };

  // 检查并开始迁移文件
  const move_file_config = async (isCopy: boolean): Promise<void> => {
    mask_sta.value = true;
    if (
      "isFile" in file_obj.value &&
      file_obj.value.goList?.length &&
      file_obj.value.toPath
    ) {
      const res = await checkConflict(
        file_obj.value.toPath,
        file_obj.value.goList,
      );
      if (!res.sta) {
        mask_sta.value = false;
        ElNotification({
          title: "发生错误",
          message: res.mse,
          type: "error",
          duration: 5000,
        });
        return;
      }
      file_obj.value.isCopy = isCopy;

      // 进入进度条页面
      Progress_page.value = 0;
      show_file_index.value = 5;
      Temporary_history_list_sta.value = true;
      if (file_obj.value.isFile === null) {
        file_obj.value.isFile = select_file_type.value === "文件";
      }

      runMoveOrCopy(file_obj.value as RunCheckCopyMoveFilesArgs);
    } else {
      ElNotification({
        title: "参数不全",
        message: JSON.stringify(file_obj.value),
        type: "error",
        duration: 5000,
      });
    }

    centerDialogVisible.value = false;
    mask_sta.value = false;
  };

  // 剪切 / 拷贝
  const runMoveOrCopy = async (
    data: RunCheckCopyMoveFilesArgs,
  ): Promise<void> => {
    try {
      await invoke("run_check_copy_move_files", data as any);
    } catch (error) {
      const currentFile_tmp = String(error ?? "未知错误");
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
