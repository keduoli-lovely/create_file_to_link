// composables/useProgress.js
import { listen } from "@tauri-apps/api/event";
import { storeToRefs } from "pinia";
import { useProgressStore } from "@/stores/useProgressStore";
import { get_config_default } from "@/config";

export function useProgress() {
  let { lastUpdate, update_time } = get_config_default();
  const ProgressStore = useProgressStore();
  const { progress, currentFile } = storeToRefs(ProgressStore);

  async function listen_Progress() {
    // 迁移文件进度
    listen("file-progress", (event) => {
      const now = Date.now();
      if (now - lastUpdate > update_time) {
        progress.value = event.payload.percent;
        currentFile.value = event.payload.src;
        lastUpdate = now;
        console.log(
          `文件 ${event.payload.src} 进度: ${event.payload.percent}%`,
        );
      }
    });
  }

  return {
    listen_Progress,
  };
}
