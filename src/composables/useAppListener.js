import { listen } from "@tauri-apps/api/event";
import { storeToRefs } from "pinia";
import { ElNotification } from "element-plus";
import { useFileStore } from "@/stores/useFileStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { get_config_default } from "@/config";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useConfigStore } from "@/stores/useConfigStore";
import { useFileOperation } from "@/composables/useFileOperation";

export async function useAppListener(appWindow, config_store) {
  const fileStore = useFileStore();
  const ProgressStore = useProgressStore();
  const HistoryStore = useHistoryStore();
  let { copy_move_tiem } = get_config_default();
  const { file_obj } = storeToRefs(fileStore);
  const { progress, currentFile } = storeToRefs(ProgressStore);
  const { config_res } = storeToRefs(useConfigStore());
  const { addHistory } = HistoryStore;
  const { createLink } = useFileOperation();
  const { set_progress_data } = ProgressStore;
  const { reset_config } = fileStore;
  const { Temporary_history_list_sta, lastOpenedDir, Temporary_history_list } =
    storeToRefs(HistoryStore);

  // 文件迁移完成
  listen("file-complete", (event) => {
    const result = event.payload;
    progress.value = 100;
    Temporary_history_list_sta.value = false;

    if (result.length > 0) {
      currentFile.value = result[0].new;
    }

    setTimeout(async () => {
      for (const item of result) {
        await createLink(item, file_obj.value.isCopy, file_obj.value.isFile);
      }
      set_progress_data();
      lastOpenedDir.value = null;
      reset_config();
    }, copy_move_tiem);

    addHistory({
      list: result,
      sta: true,
      progress: 100,
      currentFile: currentFile.value,
    });
  });

  listen("file-move-err", (event) => {
    ElNotification({
      title: event.payload[0] || "迁移该文件出错",
      message: (event.payload[1] || "获取失败") + (event.payload[2] || "error"),
      type: "error",
      duration: 6000,
    });
  });

  // 文件迁移错误
  listen("file-error", (event) => {
    let currentFile_tmp = event?.payload?.toString?.() ?? "未知错误";
    set_progress_data(0, currentFile_tmp, "exception");
    Temporary_history_list_sta.value = false;

    addHistory({
      currentFile: currentFile_tmp,
    });

    set_progress_data();
    reset_config();
  });

  //  检测移动文件出错
  listen("check_move_file_error", (event) => {
    set_progress_data(0, "文件锁定失败, 取消操作", "exception");
    setTimeout(() => {
      Temporary_history_list_sta.value = false;
      set_progress_data();
      reset_config();
    }, 5000);
    ElNotification({
      title: "发生错误",
      message: event.payload,
      type: "error",
      duration: 5000,
    });
    console.log("发生错误:", event.payload);
  });

  // 关闭窗口并写入文件
  await appWindow.listen("tauri://close-requested", async () => {
    try {
      // 合并历史记录
      config_res.value.history_list = Temporary_history_list.value.concat(
        config_res.value.history_list,
      );

      // 保存配置
      await config_store.set("config", config_res.value);
      await config_store.save();
    } catch (error) {
      // 写入日志
    } finally {
      // 无论是否出错，最后都执行 destroy
      await appWindow.destroy();
    }
  });
}
