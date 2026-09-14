import { Node, Label, UITransform, BlockInputEvents, Color, UIOpacity } from "cc";
import { CombatCore as C } from "./CombatSession";
import { BACKUP_LIMIT, encodeBackup, decodeBackup } from "./BackupVault";
import { downloadBackup, chooseBackupFile, cancelBackupTransfer } from "./BackupFiles";

/** Menu-only administration; current game must be saved and closed first. */
export class BackupPanel {
  node: Node;
  pending: any = null;
  message = "";
  private rows: Label[] = [];
  private body: Label;
  private notice: Label;
  private confirmLabel: Label;
  private undoLabel: Label;
  private selection = 1;
  private fileToken = 0;
  private busy = false;
  constructor(private host: any) {
    const h = host;
    this.node = h.child("命契管理");
    this.node.addComponent(UITransform).setContentSize(960, 640);
    this.node.addComponent(BlockInputEvents);
    h.panel(this.node, 960, 640);
    h.label("命契管理 · 本地备份", 0, 250, 28, this.node);
    h.label(
      "单档删除不影响共享成长；完整导入会替换三档、命府与设置。",
      0,
      205,
      16,
      this.node,
    );
    for (let i = 0; i < 3; i++) {
      const b = h.button(
          "",
          (i - 1) * 275,
          133,
          () => {
            if (this.busy) return;
            this.selection = i + 1;
            this.pending = null;
            this.message = "";
            this.render();
          },
          this.node,
          250,
          92,
        ),
        l = b.getChildByName("Label").getComponent(Label);
      l.node.getComponent(UITransform).setContentSize(230, 80);
      l.overflow = Label.Overflow.SHRINK;
      this.rows.push(l);
    }
    this.body = h.label("", 0, 0, 18, this.node);
    this.body.node.getComponent(UITransform).setContentSize(780, 148);
    this.body.overflow = Label.Overflow.SHRINK;
    this.notice = h.label("", 0, -107, 15, this.node);
    this.notice.node.getComponent(UITransform).setContentSize(810, 64);
    this.notice.overflow = Label.Overflow.SHRINK;
    h.button(
      "导出完整备份",
      -285,
      -174,
      () => this.exportFile(),
      this.node,
      230,
      44,
    );
    h.button(
      "选择备份文件",
      0,
      -174,
      () => this.importFile(),
      this.node,
      230,
      44,
    );
    h.button(
      "删除所选命契",
      285,
      -174,
      () => {
        if (this.busy) return;
        h.store.slots();
        if (!this.readable()) {
          this.message = "本地资料不可读，未执行删除。请先恢复有效备份。";
          this.pending = null;
          this.render();
          return;
        }
        const s = h.store.slots()[this.selection - 1];
        if (!s) {
          this.message = "所选命契为空，无需删除。";
          this.pending = null;
        } else {
          this.pending = {
            kind: "delete",
            slot: this.selection,
            fingerprint: JSON.stringify(s),
          };
          this.message = `仅删除命契${this.selection}的局内进度，命府/设置和其余两档保留；确认后执行。`;
        }
        this.render();
      },
      this.node,
      230,
      44,
    );
    const undo = h.button(
      "回退导入前",
      -275,
      -230,
      () => {
        if (this.busy) return;
        if (!h.vault.canUndo()) {
          this.message = "没有可用的导入前副本。";
          this.pending = null;
        } else {
          this.pending = { kind: "undo" };
          this.message =
            "将整套回到最近一次导入前的状态，导入后的游玩与成长会回退。确认后执行。";
        }
        this.render();
      },
      this.node,
      250,
      42,
    );
    this.undoLabel = undo.getChildByName("Label").getComponent(Label);
    const confirm = h.button(
      "",
      135,
      -230,
      () => this.confirm(),
      this.node,
      470,
      42,
    );
    this.confirmLabel = confirm.getChildByName("Label").getComponent(Label);
    h.button(
      "取消 / 返回菜单 · Esc",
      0,
      -276,
      () => this.close(),
      this.node,
      360,
      40,
    );
    this.node.active = false;
  }
  open() {
    const h = this.host;
    if (
      !h.menu.active ||
      h.session ||
      h.settingsPanel.active ||
      h.profilePanel.active
    )
      return;
    this.selection = h.slot;
    this.message = "";
    this.pending = null;
    h.clearInput();
    this.node.active = true;
    this.render();
  }
  close() {
    this.node.active = false;
    this.pending = null;
    this.fileToken++;
    cancelBackupTransfer();
    this.busy = false;
    this.host.clearInput();
    this.host.describe();
  }
  render() {
    const h = this.host,
      slots = h.store.slots(),
      readable = this.readable();
    for (const child of this.node.children) {
      if (!child.getChildByName("ControllerFocus") || child.name.startsWith("取消")) continue;
      const opacity = child.getComponent(UIOpacity) || child.addComponent(UIOpacity);
      opacity.opacity = this.busy ? 125 : 255;
    }
    for (let i = 0; i < 3; i++) {
      const s = C.covenantSummary(slots[i]);
      this.rows[i].string =
        `${this.selection === i + 1 ? "● " : ""}命契${i + 1}\n${readable ? s.title + "\n" + s.detail : "资料不可读\n不是空白新档"}`;
      this.rows[i].color = new Color(
        this.selection === i + 1 ? "#eed493" : "#c9d4c2",
      );
    }
    const preview = this.pending?.kind === "import" ? this.pending.file : null,
      p = preview?.payload;
    this.body.string = p
      ? `待导入 · ${new Date(preview.createdAt).toLocaleString("zh-CN")}\n共享 Lv.${p.profile.meta.level} · ${p.profile.meta.currency} 命砂\n${p.slots.map((s, i) => `命契${i + 1}：${C.covenantSummary(s).title}`).join("\n")}`
      : !readable
        ? "本地资料读取异常，未将其当作新进度。\n暂不允许导出或删除；请选择有效的外部备份恢复。\n若没有备份，请保留此浏览器资料以便排查，勿清空存储。"
        : `当前共享 Lv.${h.profile.data.meta.level} · ${h.profile.data.meta.currency} 命砂\n完整备份包括三份命契、共享等级/图鉴/天赋及设置。\n游戏不上传文件；系统文件服务可能由你选择的云盘提供。\n仅支持 Cocos 备份格式；导入前保留本地回退副本。`;
    this.notice.string =
      this.message || "先导出一份备份再操作更稳妥；恢复旧备份会回退后续进度。";
    this.notice.color = new Color(this.pending ? "#eed493" : "#c9d4c2");
    this.confirmLabel.node.parent.active = !!this.pending;
    this.confirmLabel.string =
      this.pending?.kind === "delete"
        ? `确认删除命契${this.pending.slot}`
        : this.pending?.kind === "undo"
          ? "确认整套回退"
          : "确认导入并替换全部资料";
    this.undoLabel.string = h.vault.canUndo() ? "回退导入前" : "暂无导入前副本";
  }
  private readable() {
    const h = this.host;
    return [h.store.health().code, h.profile.code, h.settings.code].every((c) =>
      ["ok", "recovered"].includes(c),
    );
  }
  private currentBackup() {
    const h = this.host,
      slots = h.store.slots();
    if (
      ![h.store.health().code, h.profile.code, h.settings.code].every((c) =>
        ["ok", "recovered"].includes(c),
      )
    )
      throw Error("资料尚有读取/保存错误，请先恢复或重试，未导出。");
    return { slots, profile: h.profile.data, settings: h.settings.data };
  }
  private async exportFile() {
    if (this.busy) return;
    const token = ++this.fileToken;
    this.busy = true;
    this.pending = null;
    this.message = "正在导出，请在系统窗口选择保存位置；取消不会改变游戏进度。";
    this.render();
    try {
      const result = await downloadBackup(encodeBackup(this.currentBackup()));
      if (token !== this.fileToken || !this.node.active) return;
      this.message = result === "saved" ? "备份已写入所选文件，请妥善保留。"
        : result === null ? "已取消导出，游戏进度未改变。"
        : "备份下载已发起，请在浏览器下载位置保留 JSON 文件。";
    } catch (e) {
      if (token !== this.fileToken) return;
      this.message = e.message;
    } finally {
      if (token === this.fileToken) this.busy = false;
    }
    this.render();
  }
  private async importFile() {
    if (this.busy) return;
    this.busy = true;
    const token = ++this.fileToken;
    this.pending = null;
    this.message = "请选择本机 JSON 备份；校验不会改动现有资料。";
    this.render();
    try {
      const text = await chooseBackupFile(BACKUP_LIMIT);
      if (token !== this.fileToken || !this.node.active) return;
      if (text === null) this.message = "已取消文件选择，原进度未改变。";
      else {
        const file = decodeBackup(text);
        this.pending = { kind: "import", file };
        this.message =
          "校验通过。确认将替换全部三档、共享成长/图鉴与设置，不能合并；请核对上方摘要。";
      }
    } catch (e) {
      if (token !== this.fileToken) return;
      this.message = e.message;
    } finally {
      if (token === this.fileToken) this.busy = false;
    }
    this.render();
  }
  private confirm() {
    const p = this.pending,
      h = this.host;
    if (!p || h.session || this.busy) return;
    let ok = false;
    try {
      if (p.kind === "delete") {
        if (JSON.stringify(h.store.slots()[p.slot - 1]) !== p.fingerprint) {
          this.pending = null;
          this.message = "所选命契已变化，请重新核对后删除。";
          this.render();
          return;
        }
        ok = h.store.write(p.slot, null);
      } else if (p.kind === "import") ok = h.vault.replace(p.file.payload);
      else ok = h.vault.undo();
      h.reloadDataStores();
      this.message = ok
        ? p.kind === "delete"
          ? `命契${p.slot}已删除，共享成长与其余命契保留。可从事先导出的完整备份恢复。`
          : p.kind === "import"
            ? h.vault.canUndo()
              ? "完整备份已导入，可返回菜单继续；导入前副本已保留。"
              : "完整备份已导入；损坏原文已保留，但没有可用的导入前回退副本。"
            : "已回到导入前的完整资料。"
        : "写入失败，旧资料保留；请检查存储空间后重新操作。";
    } catch (e) {
      this.message = "操作未完成：" + e.message;
    }
    this.pending = null;
    this.render();
  }
}
