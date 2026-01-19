// composables/useDragFile.js
import { listen } from "@tauri-apps/api/event";
import { ElNotification } from "element-plus";
import { filter_fileList, check_isSymLink_fn } from "@/utils/fileUtils";
import { storeToRefs } from "pinia";
import { useFileStore } from "@/stores/useFileStore";
import { useDragStore } from "@/stores/useDragStore";

export function useDragFile() {
  const { file_obj, select_file_type } = storeToRefs(useFileStore());
  const {
    drag_file_show,
    drag_loding_show,
    drag_error,
    drag_fileList_data,
    drag_fileMerge,
  } = storeToRefs(useDragStore());

  // 移除/释放后的延迟动画
  const out_loding_fn = () => {
    if (drag_loding_show.value) return;
    drag_loding_show.value = true;
    setTimeout(() => {
      drag_file_show.value = false;
    }, 100);
  };

  // 根据选择文件/文件夹 切换标签和设置数据
  const handleFileOrDir = (res) => {
    if (!file_obj.value.goList || !file_obj.value.goList?.length) {
      select_file_type.value = res.type === "file" ? "文件" : "文件夹";
      file_obj.value.isFile = res.type === "file" ? true : false;
      file_obj.value.goList = res.list;
      console.log("drag add", file_obj.value);
      return;
    }

    if (res.type === "file") {
      if (select_file_type.value === "文件") {
        file_obj.value.goList = [
          ...new Set([...file_obj.value.goList, ...res.list]),
        ];
        file_obj.value.isFile = true;
      } else {
        drag_fileList_data.value = res;
        drag_error.value = true;
        file_obj.value.isFile = false;
      }
    } else if (res.type === "dir") {
      if (select_file_type.value === "文件") {
        drag_fileList_data.value = res;
        drag_error.value = true;
        file_obj.value.isFile = true;
      } else {
        file_obj.value.goList = [
          ...new Set([...file_obj.value.goList, ...res.list]),
        ];
        file_obj.value.isFile = false;
      }
    }
  };

  // 根据用户选择保留 文件 / 文件夹
  const save_fileOrDir = (type) => {
    select_file_type.value = type === "file" ? "文件" : "文件夹";
    file_obj.value.isFile = type === "file" ? true : false;
    if (drag_fileMerge.value) {
      if (type === "dir") {
        drag_fileList_data.value.list = drag_fileList_data.value.list_v1;
      }
      handleFileOrDir(drag_fileList_data.value);
      drag_fileMerge.value = false;
    }
    file_obj.value.goList = drag_fileList_data.value.list;
    drag_error.value = false;
    console.log(file_obj.value);
  };

  // 拖入文件
  const listen_file = async () => {
    await listen("tauri://drag-enter", (event) => {
      if (drag_file_show.value) return;
      drag_file_show.value = true;
      setTimeout(() => {
        drag_loding_show.value = false;
      }, 100);
    });

    // 拖拽离开
    await listen("tauri://drag-leave", (e) => {
      out_loding_fn();
    });

    // 拖拽在应用中释放
    await listen("tauri://drag-drop", async (event) => {
      setTimeout(() => out_loding_fn(), 400);
      let res_symlink = await check_isSymLink_fn(event.payload.paths);
      if (!res_symlink.sta) {
        ElNotification({
          title: "提示",
          message: `发现链接文件: ${res_symlink.path}`,
          type: "warning",
          duration: 5000,
        });
      }
      let res = await filter_fileList(event.payload.paths);
      if (res.most_file) {
        if (res.type === "mixed") {
          drag_fileList_data.value = res;
          drag_fileMerge.value = true;
          drag_error.value = true;
          return;
        }
        res.list = [...res.list, ...res.list_v1];
      }
      handleFileOrDir(res);
    });
  };

  return {
    listen_file,
    save_fileOrDir,
  };
}
