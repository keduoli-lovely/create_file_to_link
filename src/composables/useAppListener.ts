import { listen } from "@tauri-apps/api/event";
import type { Window } from "@tauri-apps/api/window";
import type { Store } from "@tauri-apps/plugin-store";
import { storeToRefs } from "pinia";
import { ElNotification } from "element-plus";
import { useFileStore } from "@/stores/useFileStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { get_config_default } from "@/config";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useConfigStore } from "@/stores/useConfigStore";
import { useFileOperation } from "@/composables/useFileOperation";
import type { FileCompletePayload, FileResult, UnlistenFn } from "@/types";

export async function useAppListener(
  appWindow: Window,
  config_store: Store,
): Promise<UnlistenFn[]> {
  const fileStore = useFileStore();
  const ProgressStore = useProgressStore();
  const HistoryStore = useHistoryStore();
  const { copy_move_tiem } = get_config_default();
  const { file_obj } = storeToRefs(fileStore);
  const { progress, currentFile } = storeToRefs(ProgressStore);
  const { config_res } = storeToRefs(useConfigStore());
  const { addHistory } = HistoryStore;
  const { createLink } = useFileOperation();
  const { set_progress_data } = ProgressStore;
  const { reset_config } = fileStore;
  const { Temporary_history_list_sta, lastOpenedDir, Temporary_history_list } =
    storeToRefs(HistoryStore);

  const unlisteners: UnlistenFn[] = [];

  // 文件迁移完成
  unlisteners.push(
    await listen<FileCompletePayload>("file-complete", (event) => {
      const result = event.payload;
      progress.value = 100;
      Temporary_history_list_sta.value = false;

      if (result.length > 0) {
        currentFile.value = result[0].new;
      }

      const capturedIsCopy = file_obj.value.isCopy!;
      const capturedIsFile = file_obj.value.isFile!;

      setTimeout(async () => {
        for (const item of result) {
          const linkPath = await createLink(item, capturedIsCopy, capturedIsFile);
          // 将软链接路径存入结果，用于撤销
          if (linkPath) {
            item.linkPath = linkPath;
          }
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
        isCopy: capturedIsCopy,
        isFile: capturedIsFile,
      });
    }),
  );

  // 单个文件移动错误
  unlisteners.push(
    await listen("file-move-err", (event) => {
      const payload = event.payload as [string, string, string];
      ElNotification({
        title: payload[0] || "迁移该文件出错",
        message: (payload[1] || "获取失败") + (payload[2] || "error"),
        type: "error",
        duration: 6000,
      });
    }),
  );

  // 文件迁移错误
  unlisteners.push(
    await listen("file-error", (event) => {
      const currentFile_tmp =
        event?.payload != null ? String(event.payload) : "未知错误";
      set_progress_data(0, currentFile_tmp, "exception");
      Temporary_history_list_sta.value = false;

      addHistory({
        currentFile: currentFile_tmp,
      });

      set_progress_data();
      reset_config();
    }),
  );

  //  检测移动文件出错
  unlisteners.push(
    await listen("check_move_file_error", (event) => {
      set_progress_data(0, "文件锁定失败, 取消操作", "exception");
      setTimeout(() => {
        Temporary_history_list_sta.value = false;
        set_progress_data();
        reset_config();
      }, 5000);
      ElNotification({
        title: "发生错误",
        message: String(event.payload),
        type: "error",
        duration: 5000,
      });
      console.log("发生错误:", event.payload);
    }),
  );

  // 关闭窗口并写入文件
  unlisteners.push(
    await appWindow.listen("tauri://close-requested", async () => {
      try {
        // 合并历史记录
        config_res.value!.history_list = Temporary_history_list.value.concat(
          config_res.value!.history_list,
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
    }),
  );

  return unlisteners;
}
