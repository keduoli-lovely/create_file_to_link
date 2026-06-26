export function useChangeTheme(theme: boolean): void {
  // 切换主题
  if (theme) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
