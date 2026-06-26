import type { FileOrDirResult, FilterResult, SymLinkCheckResult } from "@/types";
import { invoke } from "@tauri-apps/api/core";

// 区分用户拖拽文件 / 文件夹
export const filter_fileList = async (file_list: string[]): Promise<FilterResult> => {
  if (file_list?.length < 1) return { sta: false, list: [], list_v1: [] };
  if (file_list.length === 1) {
    const res = await invoke("file_or_dir", { path: file_list[0] }) as FileOrDirResult;
    try {
      if (res[0])
        return {
          sta: res[0],
          type: res[1] as "file" | "dir",
          list: [file_list[0]],
          list_v1: [],
          most_file: false,
        };
    } catch (error) {
      // skip on error
    }
  } else {
    const tmp_fileList: string[] = [];
    const tmp_dirList: string[] = [];
    for (const item of file_list) {
      const res = await invoke("file_or_dir", { path: item }) as FileOrDirResult;
      try {
        if (res[0]) {
          res[1] === "file"
            ? tmp_fileList.push(item)
            : tmp_dirList.push(item);
        }
      } catch (error) {
        continue;
      }
    }

    return {
      sta: true,
      type:
        tmp_fileList.length && tmp_dirList.length
          ? "mixed"
          : tmp_fileList.length
            ? "file"
            : "dir",
      list: tmp_fileList,
      list_v1: tmp_dirList,
      most_file: true,
    };
  }
  // Fallback for single-file case when try/catch swallowed the error
  return { sta: false, list: [], list_v1: [] };
};

// 判断拖拽/选择的文件是否为软连接
export const check_isSymLink_fn = async (fileList: string[]): Promise<SymLinkCheckResult> => {
  for (const dst of fileList) {
    const isLink = await invoke("is_symlink", { path: dst }) as boolean;
    if (isLink) {
      return { sta: false, path: dst };
    }
  }
  return { sta: true };
};
