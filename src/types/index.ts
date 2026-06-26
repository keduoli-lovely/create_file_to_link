// === Tauri Rust command argument/return types ===

export interface CreateLinkAutoArgs {
  src: string;
  dst: string;
}

export interface RunCheckCopyMoveFilesArgs {
  goList: string[];
  toPath: string;
  isFile: boolean | null;
  isCopy: boolean | null;
}

/** Returned from Rust `file_or_dir` command: [ok: boolean, kind: "file" | "dir" | "null"] */
export type FileOrDirResult = [boolean, string];

// === Tauri event payload types ===

export interface FileProgressPayload {
  percent: number;
  src: string;
}

export interface FileResult {
  old: string;
  new: string;
  success?: boolean;
  linkPath?: string;
}

export type FileCompletePayload = FileResult[];

// === Config types ===

export type NameConflictMode = "Option1" | "Option2";

export interface NameConflictOption {
  value: NameConflictMode;
  label: string;
}

export interface Config {
  filter_path: string[];
  nameRe: NameConflictMode;
  is_link: boolean;
  copy_and_create_link: boolean;
  copy_link_name: string;
  over_open_folder: boolean;
  dark_sta: boolean;
  history_list: HistoryEntry[];
}

export interface ConfigDefaults {
  appWindow: unknown;
  config_store: unknown;
  terminal_icon: string;
  github_icon: string;
  github_link: string;
  SpaceSniffer_link: string;
  copy_move_tiem: number;
  lastUpdate: number;
  update_time: number;
  options: NameConflictOption[];
  default_config: Config;
}

// === Store types ===

export interface FileObject {
  goList?: string[];
  toPath?: string | null;
  isFile?: boolean | null;
  isCopy?: boolean | null;
}

export interface HistoryEntry {
  list: FileResult[];
  sta: boolean;
  progress: number;
  currentFile: string;
  time: number;
  isCopy?: boolean;
  isFile?: boolean;
}

export interface AddHistoryParams {
  list?: FileResult[];
  sta?: boolean;
  progress?: number;
  currentFile?: string;
  time?: number;
  isCopy?: boolean;
  isFile?: boolean;
}

// === Utility return types ===

export interface FilterResult {
  sta: boolean;
  type?: "file" | "dir" | "mixed";
  list: string[];
  list_v1: string[];
  most_file?: boolean;
}

export interface SymLinkCheckResult {
  sta: boolean;
  path?: string;
}

export interface ConflictCheckResult {
  sta: boolean;
  mse?: string;
}

// === Misc ===

/** The unlisten function returned by Tauri's `listen()` */
export type UnlistenFn = () => void;
