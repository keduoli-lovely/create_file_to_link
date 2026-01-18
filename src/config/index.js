export const get_config_default = () => {
  // 窗口
  let appWindow = null;
  // 配置文件
  let config_store = null;
  // terminal_icon
  const terminal_icon =
    "M4 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4zm0 2h16v14H4V5zm4.5 3.5a1 1 0 0 0-.7.3a1 1 0 0 0 0 1.4L9.59 12L7.8 13.8a1 1 0 1 0 1.4 1.4l2.5-2.5a1 1 0 0 0 0-1.4l-2.5-2.5a1 1 0 0 0-.7-.3zm4.5 6.5a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4z";

  // github icon
  const github_icon =
    "M12.001 2c-5.525 0-10 4.475-10 10a9.99 9.99 0 0 0 6.837 9.488c.5.087.688-.213.688-.476c0-.237-.013-1.024-.013-1.862c-2.512.463-3.162-.612-3.362-1.175c-.113-.288-.6-1.175-1.025-1.413c-.35-.187-.85-.65-.013-.662c.788-.013 1.35.725 1.538 1.025c.9 1.512 2.337 1.087 2.912.825c.088-.65.35-1.087.638-1.337c-2.225-.25-4.55-1.113-4.55-4.938c0-1.088.387-1.987 1.025-2.687c-.1-.25-.45-1.275.1-2.65c0 0 .837-.263 2.75 1.024a9.3 9.3 0 0 1 2.5-.337c.85 0 1.7.112 2.5.337c1.913-1.3 2.75-1.024 2.75-1.024c.55 1.375.2 2.4.1 2.65c.637.7 1.025 1.587 1.025 2.687c0 3.838-2.337 4.688-4.562 4.938c.362.312.675.912.675 1.85c0 1.337-.013 2.412-.013 2.75c0 .262.188.574.688.474A10.02 10.02 0 0 0 22 12c0-5.525-4.475-10-10-10";

  // github link
  const github_link = "https://github.com/keduoli-lovely/create_file_to_link";

  //   SpaceSniffer link
  const SpaceSniffer_link =
    "https://www.uderzo.it/main_products/space_sniffer/download.html";

  // 复制 / 剪切完等待时间
  const copy_move_tiem = 500;
  let lastUpdate = 0;
  const update_time = 200;

  // 文件名冲突方案列表
  const options = [
    {
      value: "Option1",
      label: "提示冲突",
    },
    {
      value: "Option2",
      label: "强制覆盖",
    },
  ];
  // 默认配置参数
  const default_config = {
    filter_path: [
      "C:\\Windows",
      "C:\\$Recycle.Bin",
      "C:\\System Volume Information",
      "C:\\Boot",
      "C:\\EFI",
    ],
    nameRe: "Option1",
    is_link: true,
    copy_and_create_link: false,
    copy_link_name: "_link",
    over_open_folder: false,
    dark_sta: false,
    history_list: [
      // progress: 0  进度
      // currentFile: 提示/文件名
      // format: '' 状态 '' 成功， exception 错误
    ],
  };



  return {
    appWindow,
    config_store,
    terminal_icon,
    github_icon,
    github_link,
    SpaceSniffer_link,
    copy_move_tiem,
    lastUpdate,
    update_time,
    options,
    default_config,
  };
};
