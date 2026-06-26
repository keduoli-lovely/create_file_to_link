import { storeToRefs } from "pinia";
import { invoke } from "@tauri-apps/api/core";
import { ElNotification } from "element-plus";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useConfigStore } from "@/stores/useConfigStore";
import { useProgressStore } from "@/stores/useProgressStore";
import type { HistoryEntry, FileResult } from "@/types";

export function useHistory() {
  const { Temporary_history_list, Temporary_history_list_sta } =
    storeToRefs(useHistoryStore());
  const { config_res } = storeToRefs(useConfigStore());
  const { set_progress_data } = useProgressStore();

  // 清空 Temporary_history_list / config_res.value.history_list
  const clear_history_list = (): void => {
    console.log("-----------清空记录------------");
    try {
      Temporary_history_list.value.length = 0;
      config_res.value!.history_list.length = 0;
      console.log(
        "info: clear over",
        Temporary_history_list.value,
        config_res.value!.history_list,
      );
    } catch (error) {
      Temporary_history_list.value = [];
      config_res.value!.history_list = [];
      console.log("info: ", error);
    }

    set_progress_data();
    Temporary_history_list_sta.value = false;
  };

  // 撤销单条历史记录
  const undoEntry = async (entry: HistoryEntry, listKey: "Temporary" | "persisted", index: number): Promise<boolean> => {
    const items = entry.list
      .filter((item: FileResult) => item.success !== false)
      .map((item: FileResult) => ({
        old: item.old,
        new: item.new,
        linkPath: item.linkPath ?? item.old,
        isCopy: entry.isCopy ?? false,
        isFile: entry.isFile ?? true,
      }));

    if (items.length === 0) {
      ElNotification({
        title: "无需撤销",
        message: "没有可撤销的操作",
        type: "warning",
        duration: 3000,
      });
      return false;
    }

    try {
      const results = await invoke("undo_operation", { items }) as Array<{
        old: string;
        new: string;
        success: boolean;
        error: string | null;
      }>;

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        ElNotification({
          title: "部分撤销失败",
          message: failed.map((r) => r.error).join("\n"),
          type: "warning",
          duration: 5000,
        });
        return false;
      }

      // 撤销成功 → 从历史列表中移除
      if (listKey === "Temporary") {
        Temporary_history_list.value.splice(index, 1);
      } else {
        config_res.value!.history_list.splice(index, 1);
      }

      ElNotification({
        title: "撤销成功",
        message: `已撤销 ${results.length} 个文件操作`,
        type: "success",
        duration: 3000,
      });
      return true;
    } catch (error) {
      ElNotification({
        title: "撤销失败",
        message: String(error),
        type: "error",
        duration: 5000,
      });
      return false;
    }
  };

  // 从持久化历史记录中撤销
  const undoPersistedEntry = async (entry: HistoryEntry, index: number): Promise<boolean> => {
    return undoEntry(entry, "persisted", index);
  };

  // 从临时历史记录中撤销
  const undoTempEntry = async (entry: HistoryEntry, index: number): Promise<boolean> => {
    return undoEntry(entry, "Temporary", index);
  };

  return {
    clear_history_list,
    undoPersistedEntry,
    undoTempEntry,
  };
}
