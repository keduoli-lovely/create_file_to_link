import { ref } from "vue";
import { defineStore } from "pinia";

export const useProgressStore = defineStore("Progress", () => {
  const progress = ref(0); // 进度
  const currentFile = ref("等待处理中...."); // 提示文字 / 迁移文件名
  const format = ref(""); // 状态 成功 / 失败

  // 初始化进度
  const set_progress_data = (
    _progress = 0,
    _currentFile = "等待处理中....",
    _format = "",
  ) => {
    progress.value = _progress;
    currentFile.value = _currentFile;
    format.value = _format;
  };

  return {
    progress,
    currentFile,
    format,
    set_progress_data
  };
});
