// composables/useProgress.js
import { listen } from "@tauri-apps/api/event";
import { storeToRefs } from "pinia";
import { useProgressStore } from "@/stores/useProgressStore";
import { get_config_default } from "@/config";

export function useProgress() {
  let { lastUpdate, update_time } = get_config_default();
  const { progress, currentFile, format } = storeToRefs(useProgressStore());

  const set_progress_data = (
    _progress = 0,
    _currentFile = "等待处理中....",
    _format = "",
  ) => {
    progress.value = _progress;
    currentFile.value = _currentFile;
    format.value = _format;
  };

  async function listen_Progress() {
    // 迁移文件进度
    listen("file-progress", (event) => {
      const now = Date.now();
      if (now - lastUpdate.value > update_time) {
        progress.value = event.payload.percent;
        currentFile.value = event.payload.src;
        lastUpdate.value = now;
        console.log(
          `文件 ${event.payload.src} 进度: ${event.payload.percent}%`,
        );
      }
    });
  }

  return {
    set_progress_data,
    listen_Progress,
  };
}
