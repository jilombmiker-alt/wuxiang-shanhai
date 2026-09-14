import { native, sys } from "cc";
import { NativeBackupTransfer } from "./NativeBackupTransfer";

const android = () => sys.isNative && sys.os === sys.OS.ANDROID;
let transfer: NativeBackupTransfer;
let cancelWebSelection: (() => void) | null = null;
function androidTransfer() {
  if (!transfer) {
    const call = (method: string, signature: string, data: string) =>
      native.reflection.callStaticMethod("com/cocos/game/BackupDocuments", method, signature, data);
    transfer = new NativeBackupTransfer({
      request: data => call("request", "(Ljava/lang/String;)V", data),
      poll: id => call("poll", "(Ljava/lang/String;)Ljava/lang/String;", id),
      cancel: id => call("cancel", "(Ljava/lang/String;)V", id),
    });
  }
  return transfer;
}
export function cancelBackupTransfer() {
  transfer?.cancel();
  cancelWebSelection?.();
}

/** File transport only. Import validation and commit stay in BackupVault/Panel. */
export async function downloadBackup(text: string): Promise<"saved" | "download" | null> {
  if (android()) return (await androidTransfer().run("export", 2 * 1024 * 1024, text)) === null ? null : "saved";
  const env: any = globalThis;
  if (!env.document || !env.Blob || !env.URL?.createObjectURL)
    throw Error("当前平台尚未接入备份文件导出，请使用 Web 构建。");
  const url = env.URL.createObjectURL(
      new env.Blob([text], { type: "application/json" }),
    ),
    a = env.document.createElement("a");
  a.href = url;
  a.download =
    "无相山海-Cocos备份-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  setTimeout(() => env.URL.revokeObjectURL(url), 1000);
  return "download";
}
export function chooseBackupFile(limit: number): Promise<string | null> {
  if (android()) return androidTransfer().run("import", limit);
  cancelWebSelection?.();
  const env: any = globalThis;
  return new Promise((resolve, reject) => {
    if (!env.document) {
      reject(Error("当前平台尚未接入文件选择，请使用 Web 构建。"));
      return;
    }
    const input = env.document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";
    env.document.body.appendChild(input);
    let done = false;
    const finish = (text: string | null, error?: Error) => {
      if (done) return;
      done = true;
      input.remove();
      cancelWebSelection = null;
      error ? reject(error) : resolve(text);
    };
    cancelWebSelection = () => finish(null);
    input.addEventListener("cancel", () => finish(null), { once: true });
    input.addEventListener(
      "change",
      async () => {
        const file = input.files?.[0];
        if (!file) {
          finish(null);
          return;
        }
        if (file.size > limit) {
          finish(null, Error("文件超过 2 MiB 限额，未读取。"));
          return;
        }
        try {
          finish(await file.text());
        } catch {
          finish(null, Error("文件读取失败，原资料未改变。"));
        }
      },
      { once: true },
    );
    input.click();
  });
}
