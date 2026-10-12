# V14 清晰度与统一视觉版

基于 https://github.com/xiaowen-prog/deepseek-stars 的 main 公开源码修改。

在解压后的目录运行 `python3 -m http.server 4185`，打开 http://127.0.0.1:4185/?replay 。直接看1986用 ?skip#y1986。

最新设计规范见 docs/VISUAL-SYSTEM.md，四个文件的差异见 docs/V14.patch。

本包可直接作为 GitHub Pages 的静态内容。index.html 位于根目录，不需构建。若仓库已有后续改动，请应用补丁或按修改文件合并，不要覆盖更新。

已检查桌面网络与聊天场景、手机网络与完整终章，控制台无error/warn；JS语法检查通过。暂未进行低端真机性能测试。

这是本地修订版，GitHub Pages线上尚未更新。
