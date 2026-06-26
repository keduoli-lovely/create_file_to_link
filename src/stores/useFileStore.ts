import { ref } from "vue";
import { defineStore } from "pinia";
import type { FileObject } from "@/types";

export const useFileStore = defineStore("FileStore", () => {
  // 选择的类型 文件 / 文件夹
  const select_file_type = ref<"文件" | "文件夹">("文件");
  // 选择的文件 / 文件夹 列表
  const file_obj = ref<FileObject>({});
  // 文件/文件夹
  const file_type = ref(["文件", "文件夹"] as const);

  // 重置数据
  const reset_config = (): void => {
    file_obj.value.goList = [];
    file_obj.value.toPath = "";
    file_obj.value.isFile = null;
    file_obj.value.isCopy = null;
  };

  return {
    select_file_type,
    file_obj,
    file_type,
    reset_config,
  };
});
