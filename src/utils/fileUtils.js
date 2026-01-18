// src/utils/fileUtils.js
import { invoke } from "@tauri-apps/api/core"

// 区分用户拖拽文件 / 文件夹
export const filter_fileList = async (file_list) => {
  if (file_list?.length < 1) return { sta: false };
  if (file_list.length === 1) {
    let res = await invoke("file_or_dir", { path: file_list[0] });
    try {
      if (res[0])
        return {
          sta: res[0],
          type: res[1],
          list: [file_list[0]],
          most_file: false,
        };
    } catch (error) {}
  } else {
    let tmp_fileList = [];
    let tmp_dirList = [];
    for (let item of file_list) {
      let res = await invoke("file_or_dir", { path: item });
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
};

// 判断拖拽/选择的文件是否为软连接
export const check_isSymLink_fn = async (fileList) => {
  for (let dst of fileList) {
    const isLink = await invoke("is_symlink", { path: dst });
    if (isLink) {
      return { sta: false, path: dst };
    }
  }
  return { sta: true };
};
