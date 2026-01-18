import { ref } from "vue";
import { defineStore } from "pinia";

export const useConfigStore = defineStore("Config", () => {
  // 加载的配置文件
  const config_res = ref(null);
  const nameRe = ref("Option1");
  // 是否创建链接
  const is_link = ref(true);
  // 复制文件是否创建链接
  const copy_and_create_link = ref(false);
  // 复制文件创建链接后缀
  const copy_link_name = ref("_link");
  // 完成后打开文件夹
  const over_open_folder = ref(false);
  // 主题
  const dark_sta = ref(false);
  // 是否展开设置页面
  const setting_page_isShow = ref(false);
  // 默认显示选择文件 / 文件夹的数量 index - 1
  const show_file_index = ref(5);
  // 加载动画页面状态
  const mask_sta = ref(false);
  // 进度页面
  const Progress_page = ref(100);
  // 选择 复制 / 剪切 弹窗
  const centerDialogVisible = ref(false);

  // 初始化
  const init_setting_data = (config) => {
    nameRe.value = config.value?.nameRe || "Option1";
    is_link.value = config.value?.is_link || true;
    copy_and_create_link.value = config.value?.copy_and_create_link || false;
    copy_link_name.value = config.value?.copy_link_name || "_link";
    over_open_folder.value = config.value?.over_open_folder || false;
    dark_sta.value = config.value?.dark_sta || false;
  };

  return {
    config_res,
    nameRe,
    is_link,
    copy_and_create_link,
    copy_link_name,
    over_open_folder,
    dark_sta,
    setting_page_isShow,
    show_file_index,
    mask_sta,
    Progress_page,
    centerDialogVisible,
    init_setting_data
  };
});
