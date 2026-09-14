/** One in-flight native file operation. The platform adapter never changes saves. */
export interface BackupTransport {
  request(message: string): void;
  poll(id: string): string;
  cancel(id: string): void;
}
// Cocos 3.8.8's JS -> Java reflection uses JNI NewStringUTF (modified UTF-8).
// ASCII JSON avoids embedded NUL / supplementary-character conversion ambiguity.
export function nativeRequestJson(value: unknown) {
  return JSON.stringify(value).replace(/[\u007f-\uffff]/g,
    c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}
export class NativeBackupTransfer {
  private active: { id: string; finish: (value: any, error?: Error) => void } | null = null;
  constructor(private transport: BackupTransport) {}
  run(kind: "import" | "export", limit: number, text?: string): Promise<string | null> {
    if (this.active) return Promise.reject(Error("文件操作正在进行，请先完成或取消。"));
    const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setInterval>;
      const finish = (value: string | null, error?: Error) => {
        if (this.active?.id !== id) return;
        clearInterval(timer);
        this.active = null;
        error ? reject(error) : resolve(value);
      };
      this.active = { id, finish };
      const poll = () => {
        try {
          const raw = this.transport.poll(id);
          if (!raw) return;
          const result = JSON.parse(raw);
          if (result.id !== id) throw Error("文件操作响应不匹配，未导入任何资料。");
          if (result.status === "cancel") finish(null);
          else if (result.status === "error") finish(null, Error(result.message || "文件操作失败，原进度未改变。"));
          else if (result.status === "ok" && typeof result.text === "string") finish(result.text);
          else throw Error("文件操作响应无效，原进度未改变。");
        } catch (error) {
          try { this.transport.cancel(id); } catch { /* retain original error */ }
          finish(null, error);
        }
      };
      try {
        this.transport.request(nativeRequestJson({ id, kind, limit, text,
          name: "无相山海-Cocos备份-" + new Date().toISOString().slice(0, 10) + ".json" }));
        timer = setInterval(poll, 200);
        poll();
      } catch (error) {
        finish(null, error);
      }
    });
  }
  cancel() {
    const current = this.active;
    if (!current) return;
    try { this.transport.cancel(current.id); }
    catch { /* Closing the panel must remain possible even if JNI is unavailable. */ }
    finally { current.finish(null); }
  }
}
