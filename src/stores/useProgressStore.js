import { ref } from "vue";
import { defineStore } from "pinia";

export const useProgressStore = defineStore("Progress", () => {
  const progress = ref(0); // 进度
  const currentFile = ref("等待处理中...."); // 提示文字 / 迁移文件名
  const format = ref(""); // 状态 成功 / 失败



  return {
    progress,
    currentFile,
    format,
  }
});
