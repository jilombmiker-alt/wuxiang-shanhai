System.register("chunks:///_virtual/AudioMixer.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _extends, cclegacy;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('validAudio', validAudio);
      cclegacy._RF.push({}, "5053fzePyBJ5K3F5Ok6GFn4", "AudioMixer", undefined);
      var defaultAudio = exports('defaultAudio', function defaultAudio() {
        return {
          muted: false,
          master: 60,
          sfx: 80,
          music: 40
        };
      });
      function validAudio(v) {
        return v && typeof v.muted === "boolean" && ["master", "sfx", "music"].every(function (k) {
          return Number.isInteger(v[k]) && v[k] >= 0 && v[k] <= 100;
        });
      }
      var cooldowns = {
        hit: 0.1,
        shoot: 0.1,
        explosion: 0.15,
        pickup: 0.12,
        damage: 0.3,
        bossSpawn: 1,
        bossWarn: 0.4,
        levelUp: 0.3,
        death: 1,
        achievement: 0.4
      };
      var priority = function priority(id) {
        return ["death", "bossWarn", "bossSpawn", "damage", "levelUp"].includes(id) ? 2 : 1;
      };
      /** No platform APIs here: policy is tested against a recording playback port. */
      var AudioMixer = exports('AudioMixer', /*#__PURE__*/function () {
        function AudioMixer(port, durations) {
          this.config = defaultAudio();
          this.ready = false;
          this.active = false;
          this.unlocked = false;
          this.hidden = false;
          this.time = 0;
          this.musicPlaying = false;
          this.last = {};
          this.voices = Array.from({
            length: 6
          }, function () {
            return {
              until: 0,
              id: ""
            };
          });
          this.port = port;
          this.durations = durations;
        }
        var _proto = AudioMixer.prototype;
        _proto.configure = function configure(config) {
          this.config = validAudio(config) ? _extends({}, config) : defaultAudio();
          this.sync();
        };
        _proto.gesture = function gesture() {
          this.unlocked = true;
          this.hidden = false;
          this.sync();
        };
        _proto.mode = function mode(active) {
          if (this.active === active) return;
          this.active = active;
          if (!active) this.stopEffects();
          this.sync();
        };
        _proto.tick = function tick(dt) {
          if (Number.isFinite(dt) && dt > 0) this.time += Math.min(dt, 0.25);
        };
        _proto.hide = function hide() {
          this.hidden = true;
          this.active = false;
          this.stopEffects();
          this.sync();
        };
        _proto.gain = function gain(channel) {
          return this.config.muted ? 0 : this.config.master * this.config[channel] / 10000;
        };
        _proto.sync = function sync() {
          var play = this.ready && this.unlocked && !this.hidden && this.active && this.gain("music") > 0;
          this.port.musicVolume(this.gain("music"));
          if (play !== this.musicPlaying) {
            this.musicPlaying = play;
            play ? this.port.musicPlay() : this.port.musicPause();
          }
          for (var i = 0; i < 6; i++) this.port.volume(i, this.gain("sfx"));
          if (!this.gain("sfx")) this.stopEffects();
        };
        _proto.stopEffects = function stopEffects() {
          for (var i = 0; i < 6; i++) {
            this.port.stop(i);
            this.voices[i] = {
              until: 0,
              id: ""
            };
          }
        };
        _proto.play = function play(id, preview) {
          var _this$last$id,
            _cooldowns$id,
            _this = this;
          if (preview === void 0) {
            preview = false;
          }
          if (!this.ready || !this.unlocked || this.hidden || !this.active && !preview || !this.gain("sfx") || !this.durations[id]) return false;
          if (this.time - ((_this$last$id = this.last[id]) != null ? _this$last$id : -Infinity) < ((_cooldowns$id = cooldowns[id]) != null ? _cooldowns$id : 0.15)) return false;
          var slot = this.voices.findIndex(function (v) {
            return v.until <= _this.time;
          });
          if (slot < 0 && priority(id) > 1) slot = this.voices.findIndex(function (v) {
            return priority(v.id) < priority(id);
          });
          if (slot < 0) return false;
          this.port.stop(slot);
          this.port.play(slot, id, this.gain("sfx"));
          this.voices[slot] = {
            until: this.time + this.durations[id],
            id: id
          };
          this.last[id] = this.time;
          return true;
        };
        _proto.destroy = function destroy() {
          this.hide();
          this.port.musicStop();
        };
        return AudioMixer;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/BackupFiles.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './NativeBackupTransfer.ts'], function (exports) {
  var _asyncToGenerator, _regeneratorRuntime, cclegacy, sys, native, NativeBackupTransfer;
  return {
    setters: [function (module) {
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
      sys = module.sys;
      native = module.native;
    }, function (module) {
      NativeBackupTransfer = module.NativeBackupTransfer;
    }],
    execute: function () {
      exports({
        cancelBackupTransfer: cancelBackupTransfer,
        chooseBackupFile: chooseBackupFile,
        downloadBackup: downloadBackup
      });
      cclegacy._RF.push({}, "ef1d9moW9lA0aBj48+HEPf1", "BackupFiles", undefined);
      var android = function android() {
        return sys.isNative && sys.os === sys.OS.ANDROID;
      };
      var transfer;
      var cancelWebSelection = null;
      function androidTransfer() {
        if (!transfer) {
          var call = function call(method, signature, data) {
            return native.reflection.callStaticMethod("com/cocos/game/BackupDocuments", method, signature, data);
          };
          transfer = new NativeBackupTransfer({
            request: function request(data) {
              return call("request", "(Ljava/lang/String;)V", data);
            },
            poll: function poll(id) {
              return call("poll", "(Ljava/lang/String;)Ljava/lang/String;", id);
            },
            cancel: function cancel(id) {
              return call("cancel", "(Ljava/lang/String;)V", id);
            }
          });
        }
        return transfer;
      }
      function cancelBackupTransfer() {
        var _transfer;
        (_transfer = transfer) == null || _transfer.cancel();
        cancelWebSelection == null || cancelWebSelection();
      }

      /** File transport only. Import validation and commit stay in BackupVault/Panel. */
      function downloadBackup(_x) {
        return _downloadBackup.apply(this, arguments);
      }
      function _downloadBackup() {
        _downloadBackup = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(text) {
          var _env$URL;
          var env, url, a;
          return _regeneratorRuntime().wrap(function _callee2$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                if (!android()) {
                  _context2.next = 10;
                  break;
                }
                _context2.next = 3;
                return androidTransfer().run("export", 2 * 1024 * 1024, text);
              case 3:
                _context2.t0 = _context2.sent;
                if (!(_context2.t0 === null)) {
                  _context2.next = 8;
                  break;
                }
                _context2.t1 = null;
                _context2.next = 9;
                break;
              case 8:
                _context2.t1 = "saved";
              case 9:
                return _context2.abrupt("return", _context2.t1);
              case 10:
                env = globalThis;
                if (!(!env.document || !env.Blob || !((_env$URL = env.URL) != null && _env$URL.createObjectURL))) {
                  _context2.next = 13;
                  break;
                }
                throw Error("当前平台尚未接入备份文件导出，请使用 Web 构建。");
              case 13:
                url = env.URL.createObjectURL(new env.Blob([text], {
                  type: "application/json"
                })), a = env.document.createElement("a");
                a.href = url;
                a.download = "无相山海-Cocos备份-" + new Date().toISOString().slice(0, 10) + ".json";
                a.click();
                setTimeout(function () {
                  return env.URL.revokeObjectURL(url);
                }, 1000);
                return _context2.abrupt("return", "download");
              case 19:
              case "end":
                return _context2.stop();
            }
          }, _callee2);
        }));
        return _downloadBackup.apply(this, arguments);
      }
      function chooseBackupFile(limit) {
        if (android()) return androidTransfer().run("import", limit);
        cancelWebSelection == null || cancelWebSelection();
        var env = globalThis;
        return new Promise(function (resolve, reject) {
          if (!env.document) {
            reject(Error("当前平台尚未接入文件选择，请使用 Web 构建。"));
            return;
          }
          var input = env.document.createElement("input");
          input.type = "file";
          input.accept = ".json,application/json";
          input.style.display = "none";
          env.document.body.appendChild(input);
          var done = false;
          var finish = function finish(text, error) {
            if (done) return;
            done = true;
            input.remove();
            cancelWebSelection = null;
            error ? reject(error) : resolve(text);
          };
          cancelWebSelection = function cancelWebSelection() {
            return finish(null);
          };
          input.addEventListener("cancel", function () {
            return finish(null);
          }, {
            once: true
          });
          input.addEventListener("change", /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
            var _input$files;
            var file;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  file = (_input$files = input.files) == null ? void 0 : _input$files[0];
                  if (file) {
                    _context.next = 4;
                    break;
                  }
                  finish(null);
                  return _context.abrupt("return");
                case 4:
                  if (!(file.size > limit)) {
                    _context.next = 7;
                    break;
                  }
                  finish(null, Error("文件超过 2 MiB 限额，未读取。"));
                  return _context.abrupt("return");
                case 7:
                  _context.prev = 7;
                  _context.t0 = finish;
                  _context.next = 11;
                  return file.text();
                case 11:
                  _context.t1 = _context.sent;
                  (0, _context.t0)(_context.t1);
                  _context.next = 18;
                  break;
                case 15:
                  _context.prev = 15;
                  _context.t2 = _context["catch"](7);
                  finish(null, Error("文件读取失败，原资料未改变。"));
                case 18:
                case "end":
                  return _context.stop();
              }
            }, _callee, null, [[7, 15]]);
          })), {
            once: true
          });
          input.click();
        });
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/BackupPanel.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CombatSession.ts', './BackupVault.ts', './BackupFiles.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _asyncToGenerator, _regeneratorRuntime, cclegacy, UIOpacity, Color, UITransform, BlockInputEvents, Label, C, encodeBackup, decodeBackup, BACKUP_LIMIT, cancelBackupTransfer, downloadBackup, chooseBackupFile;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
      UIOpacity = module.UIOpacity;
      Color = module.Color;
      UITransform = module.UITransform;
      BlockInputEvents = module.BlockInputEvents;
      Label = module.Label;
    }, function (module) {
      C = module.CombatCore;
    }, function (module) {
      encodeBackup = module.encodeBackup;
      decodeBackup = module.decodeBackup;
      BACKUP_LIMIT = module.BACKUP_LIMIT;
    }, function (module) {
      cancelBackupTransfer = module.cancelBackupTransfer;
      downloadBackup = module.downloadBackup;
      chooseBackupFile = module.chooseBackupFile;
    }],
    execute: function () {
      cclegacy._RF.push({}, "eb513nFP0FHELnbjGmdlHxo", "BackupPanel", undefined);

      /** Menu-only administration; current game must be saved and closed first. */
      var BackupPanel = exports('BackupPanel', /*#__PURE__*/function () {
        function BackupPanel(host) {
          var _this = this;
          this.node = void 0;
          this.pending = null;
          this.message = "";
          this.rows = [];
          this.body = void 0;
          this.notice = void 0;
          this.confirmLabel = void 0;
          this.undoLabel = void 0;
          this.selection = 1;
          this.fileToken = 0;
          this.busy = false;
          this.host = host;
          var h = host;
          this.node = h.child("命契管理");
          this.node.addComponent(UITransform).setContentSize(960, 640);
          this.node.addComponent(BlockInputEvents);
          h.panel(this.node, 960, 640);
          h.label("命契管理 · 本地备份", 0, 250, 28, this.node);
          h.label("单档删除不影响共享成长；完整导入会替换三档、命府与设置。", 0, 205, 16, this.node);
          var _loop = function _loop(i) {
            var b = h.button("", (i - 1) * 275, 133, function () {
                if (_this.busy) return;
                _this.selection = i + 1;
                _this.pending = null;
                _this.message = "";
                _this.render();
              }, _this.node, 250, 92),
              l = b.getChildByName("Label").getComponent(Label);
            l.node.getComponent(UITransform).setContentSize(230, 80);
            l.overflow = Label.Overflow.SHRINK;
            _this.rows.push(l);
          };
          for (var i = 0; i < 3; i++) {
            _loop(i);
          }
          this.body = h.label("", 0, 0, 18, this.node);
          this.body.node.getComponent(UITransform).setContentSize(780, 148);
          this.body.overflow = Label.Overflow.SHRINK;
          this.notice = h.label("", 0, -107, 15, this.node);
          this.notice.node.getComponent(UITransform).setContentSize(810, 64);
          this.notice.overflow = Label.Overflow.SHRINK;
          h.button("导出完整备份", -285, -174, function () {
            return _this.exportFile();
          }, this.node, 230, 44);
          h.button("选择备份文件", 0, -174, function () {
            return _this.importFile();
          }, this.node, 230, 44);
          h.button("删除所选命契", 285, -174, function () {
            if (_this.busy) return;
            h.store.slots();
            if (!_this.readable()) {
              _this.message = "本地资料不可读，未执行删除。请先恢复有效备份。";
              _this.pending = null;
              _this.render();
              return;
            }
            var s = h.store.slots()[_this.selection - 1];
            if (!s) {
              _this.message = "所选命契为空，无需删除。";
              _this.pending = null;
            } else {
              _this.pending = {
                kind: "delete",
                slot: _this.selection,
                fingerprint: JSON.stringify(s)
              };
              _this.message = "\u4EC5\u5220\u9664\u547D\u5951" + _this.selection + "\u7684\u5C40\u5185\u8FDB\u5EA6\uFF0C\u547D\u5E9C/\u8BBE\u7F6E\u548C\u5176\u4F59\u4E24\u6863\u4FDD\u7559\uFF1B\u786E\u8BA4\u540E\u6267\u884C\u3002";
            }
            _this.render();
          }, this.node, 230, 44);
          var undo = h.button("回退导入前", -275, -230, function () {
            if (_this.busy) return;
            if (!h.vault.canUndo()) {
              _this.message = "没有可用的导入前副本。";
              _this.pending = null;
            } else {
              _this.pending = {
                kind: "undo"
              };
              _this.message = "将整套回到最近一次导入前的状态，导入后的游玩与成长会回退。确认后执行。";
            }
            _this.render();
          }, this.node, 250, 42);
          this.undoLabel = undo.getChildByName("Label").getComponent(Label);
          var confirm = h.button("", 135, -230, function () {
            return _this.confirm();
          }, this.node, 470, 42);
          this.confirmLabel = confirm.getChildByName("Label").getComponent(Label);
          h.button("取消 / 返回菜单 · Esc", 0, -276, function () {
            return _this.close();
          }, this.node, 360, 40);
          this.node.active = false;
        }
        var _proto = BackupPanel.prototype;
        _proto.open = function open() {
          var h = this.host;
          if (!h.menu.active || h.session || h.settingsPanel.active || h.profilePanel.active) return;
          this.selection = h.slot;
          this.message = "";
          this.pending = null;
          h.clearInput();
          this.node.active = true;
          this.render();
        };
        _proto.close = function close() {
          this.node.active = false;
          this.pending = null;
          this.fileToken++;
          cancelBackupTransfer();
          this.busy = false;
          this.host.clearInput();
          this.host.describe();
        };
        _proto.render = function render() {
          var _this$pending, _this$pending2, _this$pending3;
          var h = this.host,
            slots = h.store.slots(),
            readable = this.readable();
          for (var _iterator = _createForOfIteratorHelperLoose(this.node.children), _step; !(_step = _iterator()).done;) {
            var child = _step.value;
            if (!child.getChildByName("ControllerFocus") || child.name.startsWith("取消")) continue;
            var opacity = child.getComponent(UIOpacity) || child.addComponent(UIOpacity);
            opacity.opacity = this.busy ? 125 : 255;
          }
          for (var i = 0; i < 3; i++) {
            var s = C.covenantSummary(slots[i]);
            this.rows[i].string = (this.selection === i + 1 ? "● " : "") + "\u547D\u5951" + (i + 1) + "\n" + (readable ? s.title + "\n" + s.detail : "资料不可读\n不是空白新档");
            this.rows[i].color = new Color(this.selection === i + 1 ? "#eed493" : "#c9d4c2");
          }
          var preview = ((_this$pending = this.pending) == null ? void 0 : _this$pending.kind) === "import" ? this.pending.file : null,
            p = preview == null ? void 0 : preview.payload;
          this.body.string = p ? "\u5F85\u5BFC\u5165 \xB7 " + new Date(preview.createdAt).toLocaleString("zh-CN") + "\n\u5171\u4EAB Lv." + p.profile.meta.level + " \xB7 " + p.profile.meta.currency + " \u547D\u7802\n" + p.slots.map(function (s, i) {
            return "\u547D\u5951" + (i + 1) + "\uFF1A" + C.covenantSummary(s).title;
          }).join("\n") : !readable ? "本地资料读取异常，未将其当作新进度。\n暂不允许导出或删除；请选择有效的外部备份恢复。\n若没有备份，请保留此浏览器资料以便排查，勿清空存储。" : "\u5F53\u524D\u5171\u4EAB Lv." + h.profile.data.meta.level + " \xB7 " + h.profile.data.meta.currency + " \u547D\u7802\n\u5B8C\u6574\u5907\u4EFD\u5305\u62EC\u4E09\u4EFD\u547D\u5951\u3001\u5171\u4EAB\u7B49\u7EA7/\u56FE\u9274/\u5929\u8D4B\u53CA\u8BBE\u7F6E\u3002\n\u6E38\u620F\u4E0D\u4E0A\u4F20\u6587\u4EF6\uFF1B\u7CFB\u7EDF\u6587\u4EF6\u670D\u52A1\u53EF\u80FD\u7531\u4F60\u9009\u62E9\u7684\u4E91\u76D8\u63D0\u4F9B\u3002\n\u4EC5\u652F\u6301 Cocos \u5907\u4EFD\u683C\u5F0F\uFF1B\u5BFC\u5165\u524D\u4FDD\u7559\u672C\u5730\u56DE\u9000\u526F\u672C\u3002";
          this.notice.string = this.message || "先导出一份备份再操作更稳妥；恢复旧备份会回退后续进度。";
          this.notice.color = new Color(this.pending ? "#eed493" : "#c9d4c2");
          this.confirmLabel.node.parent.active = !!this.pending;
          this.confirmLabel.string = ((_this$pending2 = this.pending) == null ? void 0 : _this$pending2.kind) === "delete" ? "\u786E\u8BA4\u5220\u9664\u547D\u5951" + this.pending.slot : ((_this$pending3 = this.pending) == null ? void 0 : _this$pending3.kind) === "undo" ? "确认整套回退" : "确认导入并替换全部资料";
          this.undoLabel.string = h.vault.canUndo() ? "回退导入前" : "暂无导入前副本";
        };
        _proto.readable = function readable() {
          var h = this.host;
          return [h.store.health().code, h.profile.code, h.settings.code].every(function (c) {
            return ["ok", "recovered"].includes(c);
          });
        };
        _proto.currentBackup = function currentBackup() {
          var h = this.host,
            slots = h.store.slots();
          if (![h.store.health().code, h.profile.code, h.settings.code].every(function (c) {
            return ["ok", "recovered"].includes(c);
          })) throw Error("资料尚有读取/保存错误，请先恢复或重试，未导出。");
          return {
            slots: slots,
            profile: h.profile.data,
            settings: h.settings.data
          };
        };
        _proto.exportFile = /*#__PURE__*/function () {
          var _exportFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
            var token, result;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  if (!this.busy) {
                    _context.next = 2;
                    break;
                  }
                  return _context.abrupt("return");
                case 2:
                  token = ++this.fileToken;
                  this.busy = true;
                  this.pending = null;
                  this.message = "正在导出，请在系统窗口选择保存位置；取消不会改变游戏进度。";
                  this.render();
                  _context.prev = 7;
                  _context.next = 10;
                  return downloadBackup(encodeBackup(this.currentBackup()));
                case 10:
                  result = _context.sent;
                  if (!(token !== this.fileToken || !this.node.active)) {
                    _context.next = 13;
                    break;
                  }
                  return _context.abrupt("return");
                case 13:
                  this.message = result === "saved" ? "备份已写入所选文件，请妥善保留。" : result === null ? "已取消导出，游戏进度未改变。" : "备份下载已发起，请在浏览器下载位置保留 JSON 文件。";
                  _context.next = 21;
                  break;
                case 16:
                  _context.prev = 16;
                  _context.t0 = _context["catch"](7);
                  if (!(token !== this.fileToken)) {
                    _context.next = 20;
                    break;
                  }
                  return _context.abrupt("return");
                case 20:
                  this.message = _context.t0.message;
                case 21:
                  _context.prev = 21;
                  if (token === this.fileToken) this.busy = false;
                  return _context.finish(21);
                case 24:
                  this.render();
                case 25:
                case "end":
                  return _context.stop();
              }
            }, _callee, this, [[7, 16, 21, 24]]);
          }));
          function exportFile() {
            return _exportFile.apply(this, arguments);
          }
          return exportFile;
        }();
        _proto.importFile = /*#__PURE__*/function () {
          var _importFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
            var token, text, file;
            return _regeneratorRuntime().wrap(function _callee2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  if (!this.busy) {
                    _context2.next = 2;
                    break;
                  }
                  return _context2.abrupt("return");
                case 2:
                  this.busy = true;
                  token = ++this.fileToken;
                  this.pending = null;
                  this.message = "请选择本机 JSON 备份；校验不会改动现有资料。";
                  this.render();
                  _context2.prev = 7;
                  _context2.next = 10;
                  return chooseBackupFile(BACKUP_LIMIT);
                case 10:
                  text = _context2.sent;
                  if (!(token !== this.fileToken || !this.node.active)) {
                    _context2.next = 13;
                    break;
                  }
                  return _context2.abrupt("return");
                case 13:
                  if (text === null) this.message = "已取消文件选择，原进度未改变。";else {
                    file = decodeBackup(text);
                    this.pending = {
                      kind: "import",
                      file: file
                    };
                    this.message = "校验通过。确认将替换全部三档、共享成长/图鉴与设置，不能合并；请核对上方摘要。";
                  }
                  _context2.next = 21;
                  break;
                case 16:
                  _context2.prev = 16;
                  _context2.t0 = _context2["catch"](7);
                  if (!(token !== this.fileToken)) {
                    _context2.next = 20;
                    break;
                  }
                  return _context2.abrupt("return");
                case 20:
                  this.message = _context2.t0.message;
                case 21:
                  _context2.prev = 21;
                  if (token === this.fileToken) this.busy = false;
                  return _context2.finish(21);
                case 24:
                  this.render();
                case 25:
                case "end":
                  return _context2.stop();
              }
            }, _callee2, this, [[7, 16, 21, 24]]);
          }));
          function importFile() {
            return _importFile.apply(this, arguments);
          }
          return importFile;
        }();
        _proto.confirm = function confirm() {
          var p = this.pending,
            h = this.host;
          if (!p || h.session || this.busy) return;
          var ok = false;
          try {
            if (p.kind === "delete") {
              if (JSON.stringify(h.store.slots()[p.slot - 1]) !== p.fingerprint) {
                this.pending = null;
                this.message = "所选命契已变化，请重新核对后删除。";
                this.render();
                return;
              }
              ok = h.store.write(p.slot, null);
            } else if (p.kind === "import") ok = h.vault.replace(p.file.payload);else ok = h.vault.undo();
            h.reloadDataStores();
            this.message = ok ? p.kind === "delete" ? "\u547D\u5951" + p.slot + "\u5DF2\u5220\u9664\uFF0C\u5171\u4EAB\u6210\u957F\u4E0E\u5176\u4F59\u547D\u5951\u4FDD\u7559\u3002\u53EF\u4ECE\u4E8B\u5148\u5BFC\u51FA\u7684\u5B8C\u6574\u5907\u4EFD\u6062\u590D\u3002" : p.kind === "import" ? h.vault.canUndo() ? "完整备份已导入，可返回菜单继续；导入前副本已保留。" : "完整备份已导入；损坏原文已保留，但没有可用的导入前回退副本。" : "已回到导入前的完整资料。" : "写入失败，旧资料保留；请检查存储空间后重新操作。";
          } catch (e) {
            this.message = "操作未完成：" + e.message;
          }
          this.pending = null;
          this.render();
        };
        return BackupPanel;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/BackupVault.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CombatSession.ts', './ProfileStore.ts', './SettingsStore.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, cclegacy, C, CombatSession, KEY, valid, SETTINGS_KEY, validSettings;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      C = module.CombatCore;
      CombatSession = module.CombatSession;
    }, function (module) {
      KEY = module.PROFILE_KEY;
      valid = module.validProfile;
    }, function (module) {
      SETTINGS_KEY = module.SETTINGS_KEY;
      validSettings = module.validSettings;
    }],
    execute: function () {
      exports({
        checksum: checksum,
        decodeBackup: decodeBackup,
        encodeBackup: encodeBackup,
        validatePayload: validatePayload
      });
      cclegacy._RF.push({}, "43a97tG4zlM3b8fAn3xG+96", "BackupVault", undefined);
      var VAULT_KEY = exports('VAULT_KEY', "cocos:complete-vault-v1");
      var BACKUP_LIMIT = exports('BACKUP_LIMIT', 2 * 1024 * 1024);
      function byteLength(text) {
        var n = 0;
        for (var i = 0; i < text.length; i++) {
          var c = text.charCodeAt(i);
          if (c < 128) n++;else if (c < 2048) n += 2;else if (c >= 0xd800 && c <= 0xdbff && text.charCodeAt(i + 1) >= 0xdc00 && text.charCodeAt(i + 1) <= 0xdfff) {
            n += 4;
            i++;
          } else n += 3;
        }
        return n;
      }
      var logicalKeys = [C.COVENANT_STORAGE_KEY, KEY, SETTINGS_KEY];
      var allowedKeys = logicalKeys.flatMap(function (k) {
        return ["", ":backup", ":damaged"].map(function (s) {
          return "cocos:" + k + s;
        });
      });
      var clone = function clone(v) {
        return JSON.parse(JSON.stringify(v));
      };
      var validRecords = function validRecords(v) {
        return C.isRecord(v) && v.version === 1 && C.isRecord(v.records) && Object.entries(v.records).every(function (_ref) {
          var k = _ref[0],
            x = _ref[1];
          return allowedKeys.includes(k) && typeof x === "string";
        });
      };
      var validBank = function validBank(v) {
        return validRecords(v) && (v.beforeImport == null || validRecords(v.beforeImport));
      };
      function checksum(text) {
        var h = 2166136261;
        for (var i = 0; i < text.length; i++) {
          h ^= text.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return (h >>> 0).toString(16).padStart(8, "0");
      }
      function known(list, defs, max) {
        return Array.isArray(list) && list.length <= max && new Set(list).size === list.length && list.every(function (id) {
          return Object.values(defs).some(function (d) {
            return d.id === id;
          });
        });
      }
      function validatePayload(p) {
        if (!C.isRecord(p) || !C.validCovenants(p.slots) || p.slots.length !== 3 || !valid(p.profile) || !validSettings(p.settings)) return false;
        var meta = p.profile.meta;
        if (meta.level < 1 || meta.level > C.META_LEVEL_CAP || meta.equippedTalents.length > 3 || !known(meta.purchasedTalents, C.META_TALENTS, Object.keys(C.META_TALENTS).length) || !meta.equippedTalents.every(function (id) {
          return meta.purchasedTalents.includes(id);
        })) return false;
        var serials = new Set();
        try {
          var _loop = function _loop() {
              var s = _step.value;
              if (!s) return 0; // continue
              var hero = C.HEROES[s.selectedHeroId];
              if (!hero || !hero.talents.some(function (t) {
                return t.id === s.selectedHeroTalentId;
              }) || !["chapter", "endless"].includes(s.runMode) || !Object.values(C.STAGES).some(function (d) {
                return d.id === s.stageId;
              }) || !C.isRecord(s.player) || !C.isRecord(s.build)) return {
                v: false
              };
              if (s.cocosRunSerial != null) {
                if (s.cocosRunSerial >= p.profile.nextSerial || serials.has(s.cocosRunSerial)) return {
                  v: false
                };
                serials.add(s.cocosRunSerial);
              }
              if (!Array.isArray(s.player.weapons) || s.player.weapons.length > C.CONFIG.MAX_WEAPONS || new Set(s.player.weapons.map(function (w) {
                return w.id;
              })).size !== s.player.weapons.length || s.player.weapons.some(function (w) {
                return !Object.values(C.WEAPONS).some(function (d) {
                  return d.id === w.id;
                }) || !Number.isInteger(w.level) || w.level < 1 || w.level > C.CONFIG.WEAPON_MAX_LEVEL;
              })) return {
                v: false
              };
              if (!C.isRecord(s.player.passives) || Object.keys(s.player.passives).length > C.CONFIG.MAX_PASSIVES || Object.entries(s.player.passives).some(function (_ref2) {
                var id = _ref2[0],
                  n = _ref2[1];
                return !Object.values(C.PASSIVES).some(function (d) {
                  return d.id === id;
                }) || !Number.isInteger(n) || n < 1 || n > C.CONFIG.PASSIVE_MAX_STACK;
              })) return {
                v: false
              };
              if (!known(s.build.relics, C.RELICS, C.CONFIG.MAX_RELICS) || !known(s.build.curses, C.CURSES, 4) || !known(s.build.fusions, C.FUSION_RECIPES, C.FUSION_RECIPES.length)) return {
                v: false
              };
              if (s.cocosBuildChoice && !known(s.cocosBuildChoice.ids, s.cocosBuildChoice.kind === "curse" ? C.CURSES : C.RELICS, 3)) return {
                v: false
              };
              if (s.cocosMetaTalents && !known(s.cocosMetaTalents, C.META_TALENTS, 3)) return {
                v: false
              };
              var r = new CombatSession(s.selectedHeroId, s.selectedHeroTalentId, {
                snapshot: s,
                mode: s.runMode,
                stage: s.stageId
              });
              if (![r.player.x, r.player.y, r.player.hp, r.player.maxHp, r.player.getDamageMult(), r.player.getSpeedMult(), r.player.getCooldownMult()].every(Number.isFinite)) return {
                v: false
              };
            },
            _ret;
          for (var _iterator = _createForOfIteratorHelperLoose(p.slots), _step; !(_step = _iterator()).done;) {
            _ret = _loop();
            if (_ret === 0) continue;
            if (_ret) return _ret.v;
          }
        } catch (_unused) {
          return false;
        }
        return true;
      }
      function encodeBackup(payload) {
        if (!validatePayload(payload)) throw Error("当前资料未通过备份校验，请先处理存档错误。");
        var file = {
          format: "wuxiang-cocos-backup",
          version: 1,
          createdAt: new Date().toISOString(),
          payload: clone(payload),
          checksum: checksum(JSON.stringify(payload))
        };
        var text = JSON.stringify(file);
        if (byteLength(text) > BACKUP_LIMIT) throw Error("备份超过 2 MiB 限额，未导出。");
        return text;
      }
      function decodeBackup(text) {
        var _f;
        if (typeof text !== "string" || byteLength(text) > BACKUP_LIMIT) throw Error("文件超过 2 MiB 限额。");
        var f;
        try {
          f = JSON.parse(text, function (k, v) {
            if (["__proto__", "prototype", "constructor"].includes(k) || typeof v === "number" && !Number.isFinite(v)) throw Error("unsafe");
            return v;
          });
        } catch (_unused2) {
          throw Error("不是有效的备份 JSON，原进度未改变。");
        }
        if (((_f = f) == null ? void 0 : _f.format) !== "wuxiang-cocos-backup" || f.version !== 1 || typeof f.createdAt !== "string" || f.createdAt.length > 40 || !Number.isFinite(Date.parse(f.createdAt))) throw Error("不是受支持的 Cocos 备份版本；浏览器旧原型备份不能混用。");
        if (f.checksum !== checksum(JSON.stringify(f.payload)) || !validatePayload(f.payload)) throw Error("备份校验失败，可能损坏或含不支持的内容；未导入。");
        return f;
      }
      /** Import switches one complete bank atomically; legacy keys remain untouched. */
      var BackupVault = exports('BackupVault', /*#__PURE__*/function () {
        function BackupVault(raw) {
          this.bank = null;
          this.expectedRaw = null;
          this.code = "ok";
          this.raw = raw;
          this.reload();
        }
        var _proto = BackupVault.prototype;
        _proto.reload = function reload() {
          var r = C.readJournal(this.raw, VAULT_KEY, validBank);
          this.bank = r.value;
          this.code = r.code;
          try {
            this.expectedRaw = this.raw.getItem(VAULT_KEY);
            if (!r.value && this.raw.getItem(VAULT_KEY + ":backup")) this.code = "corrupt";
          } catch (_unused3) {
            this.code = "unavailable";
          }
          return ["ok", "recovered"].includes(this.code);
        };
        _proto.ensure = function ensure() {
          if (!["ok", "recovered", "write-failed"].includes(this.code)) throw Error("完整资料不可读，请恢复有效备份。");
          if (this.raw.getItem(VAULT_KEY) !== this.expectedRaw) throw Error("另一窗口修改了资料，已停止写入。请确认另一窗口保存后重新打开本页。");
        };
        _proto.getItem = function getItem(key) {
          var _this$bank$records$ke;
          this.ensure();
          return this.bank ? (_this$bank$records$ke = this.bank.records[key]) != null ? _this$bank$records$ke : null : this.raw.getItem(key);
        };
        _proto.setItem = function setItem(key, value) {
          this.ensure();
          if (!this.bank) {
            this.raw.setItem(key, value);
            return;
          }
          var b = clone(this.bank);
          b.records[key] = value;
          this.commit(b);
        };
        _proto.removeItem = function removeItem(key) {
          this.ensure();
          if (!this.bank) {
            this.raw.removeItem(key);
            return;
          }
          var b = clone(this.bank);
          delete b.records[key];
          this.commit(b);
        };
        _proto.commit = function commit(bank) {
          var r = C.writeJournal(this.raw, VAULT_KEY, bank, validBank);
          this.code = r.code;
          if (!r.ok) throw Error("整套资料写入失败，旧进度保留。");
          this.bank = bank;
          this.expectedRaw = r.raw;
        };
        _proto.currentBank = function currentBank() {
          // Keep one checkpoint, not an ever-growing recursive history.
          if (this.bank) return {
            version: 1,
            records: clone(this.bank.records)
          };
          var records = {};
          for (var _iterator2 = _createForOfIteratorHelperLoose(allowedKeys), _step2; !(_step2 = _iterator2()).done;) {
            var k = _step2.value;
            var v = this.raw.getItem(k);
            if (v !== null) records[k] = v;
          }
          return {
            version: 1,
            records: records
          };
        };
        _proto.replace = function replace(payload) {
          if (!validatePayload(payload)) return false;
          try {
            if (this.code === "corrupt") {
              if (this.raw.getItem(VAULT_KEY) !== this.expectedRaw) return false;
            } else this.ensure();
            var prior = this.code === "corrupt" ? null : this.currentBank();
            var records = {};
            for (var _iterator3 = _createForOfIteratorHelperLoose([payload.slots, payload.profile, payload.settings].entries()), _step3; !(_step3 = _iterator3()).done;) {
              var _step3$value = _step3.value,
                i = _step3$value[0],
                value = _step3$value[1];
              records["cocos:" + logicalKeys[i]] = JSON.stringify(value);
            }
            // Progress and its rollback point become visible in the same primary write.
            this.commit({
              version: 1,
              records: records,
              beforeImport: prior
            });
            return true;
          } catch (_unused4) {
            return false;
          }
        };
        _proto.canUndo = function canUndo() {
          var _this$bank;
          var prior = (_this$bank = this.bank) == null ? void 0 : _this$bank.beforeImport;
          if (!prior) return false;
          var storage = {
            getItem: function getItem(key) {
              var _prior$records$key;
              return (_prior$records$key = prior.records[key]) != null ? _prior$records$key : null;
            }
          };
          return [C.validCovenants, valid, validSettings].every(function (valid, i) {
            return ["ok", "recovered"].includes(C.readJournal(storage, "cocos:" + logicalKeys[i], valid).code);
          });
        };
        _proto.undo = function undo() {
          try {
            var _this$bank2;
            this.ensure();
            if (!this.canUndo()) return false;
            var old = (_this$bank2 = this.bank) == null ? void 0 : _this$bank2.beforeImport;
            if (!old) return false;
            this.commit(_extends({}, clone(old), {
              beforeImport: clone(old)
            }));
            return true;
          } catch (_unused5) {
            return false;
          }
        };
        return BackupVault;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CocosAudio.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './AudioMixer.ts'], function (exports) {
  var _asyncToGenerator, _regeneratorRuntime, _createForOfIteratorHelperLoose, cclegacy, resources, Node, AudioSource, AudioClip, JsonAsset, AudioMixer;
  return {
    setters: [function (module) {
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      resources = module.resources;
      Node = module.Node;
      AudioSource = module.AudioSource;
      AudioClip = module.AudioClip;
      JsonAsset = module.JsonAsset;
    }, function (module) {
      AudioMixer = module.AudioMixer;
    }],
    execute: function () {
      cclegacy._RF.push({}, "bc416gJ669P2r9JUsUAW0oQ", "CocosAudio", undefined);
      /** Owned sources, not playOneShot: pause/mute/hide must be able to stop every sound. */
      var CocosAudio = exports('CocosAudio', /*#__PURE__*/function () {
        function CocosAudio(parent) {
          var _this = this;
          this.mixer = void 0;
          this.music = void 0;
          this.voices = [];
          this.clips = {};
          this.status = "loading";
          this.root = void 0;
          this.disposed = false;
          this.root = new Node("Audio playback");
          parent.addChild(this.root);
          var source = function source(name) {
            var n = new Node(name);
            _this.root.addChild(n);
            var s = n.addComponent(AudioSource);
            s.playOnAwake = false;
            return s;
          };
          this.music = source("Music");
          this.music.loop = true;
          this.voices = Array.from({
            length: 6
          }, function (_, i) {
            return source("SFX " + i);
          });
          this.mixer = new AudioMixer({
            musicVolume: function musicVolume(v) {
              return _this.music.volume = v;
            },
            musicPlay: function musicPlay() {
              return _this.music.play();
            },
            musicPause: function musicPause() {
              return _this.music.pause();
            },
            musicStop: function musicStop() {
              return _this.music.stop();
            },
            volume: function volume(i, v) {
              return _this.voices[i].volume = v;
            },
            stop: function stop(i) {
              return _this.voices[i].stop();
            },
            play: function play(i, id, v) {
              var s = _this.voices[i];
              s.clip = _this.clips[id];
              s.volume = v;
              s.play();
            }
          }, {});
        }
        var _proto = CocosAudio.prototype;
        _proto.loadResource = function loadResource(path, type) {
          return new Promise(function (resolve, reject) {
            return resources.load(path, type, function (e, a) {
              return e ? reject(e) : resolve(a);
            });
          });
        };
        _proto.load = /*#__PURE__*/function () {
          var _load = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
            var _this2 = this;
            var manifest, loaded, _iterator, _step, _step$value, f, clip;
            return _regeneratorRuntime().wrap(function _callee2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.prev = 0;
                  _context2.next = 3;
                  return this.loadResource("audio/manifest", JsonAsset);
                case 3:
                  manifest = _context2.sent;
                  _context2.next = 6;
                  return Promise.all(manifest.json.files.map( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(f) {
                    return _regeneratorRuntime().wrap(function _callee$(_context) {
                      while (1) switch (_context.prev = _context.next) {
                        case 0:
                          _context.t0 = f;
                          _context.next = 3;
                          return _this2.loadResource("audio/" + f.id, AudioClip);
                        case 3:
                          _context.t1 = _context.sent;
                          return _context.abrupt("return", [_context.t0, _context.t1]);
                        case 5:
                        case "end":
                          return _context.stop();
                      }
                    }, _callee);
                  }))));
                case 6:
                  loaded = _context2.sent;
                  if (!this.disposed) {
                    _context2.next = 9;
                    break;
                  }
                  return _context2.abrupt("return");
                case 9:
                  for (_iterator = _createForOfIteratorHelperLoose(loaded); !(_step = _iterator()).done;) {
                    _step$value = _step.value, f = _step$value[0], clip = _step$value[1];
                    this.clips[f.id] = clip;
                    this.mixer.durations[f.id] = f.duration;
                  }
                  this.music.clip = this.clips.music;
                  this.mixer.ready = true;
                  this.status = "ready";
                  this.mixer.sync();
                  _context2.next = 21;
                  break;
                case 16:
                  _context2.prev = 16;
                  _context2.t0 = _context2["catch"](0);
                  this.status = "unavailable";
                  this.mixer.ready = false;
                  this.mixer.hide();
                case 21:
                case "end":
                  return _context2.stop();
              }
            }, _callee2, this, [[0, 16]]);
          }));
          function load() {
            return _load.apply(this, arguments);
          }
          return load;
        }();
        _proto.snapshot = function snapshot() {
          return {
            status: this.status,
            clips: Object.keys(this.clips).length,
            active: this.mixer.active,
            unlocked: this.mixer.unlocked,
            hidden: this.mixer.hidden,
            musicPlaying: this.music.playing,
            musicTime: this.music.currentTime,
            musicVolume: this.music.volume,
            sfxVolume: this.voices[0].volume,
            playing: this.voices.filter(function (s) {
              return s.playing;
            }).length
          };
        };
        _proto.destroy = function destroy() {
          this.disposed = true;
          this.mixer.destroy();
          this.root.destroy();
        };
        return CocosAudio;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CocosJoystick.ts", ['cc', './JoystickState.ts'], function (exports) {
  var cclegacy, Color, UITransform, Graphics, Node, Vec3, JoystickState;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      UITransform = module.UITransform;
      Graphics = module.Graphics;
      Node = module.Node;
      Vec3 = module.Vec3;
    }, function (module) {
      JoystickState = module.JoystickState;
    }],
    execute: function () {
      cclegacy._RF.push({}, "7e69aGvS1tPkrMntoRYcv3s", "CocosJoystick", undefined);

      /** Existing shared joystick math, native Cocos input and drawing. */
      var CocosJoystick = exports('CocosJoystick', /*#__PURE__*/function () {
        function CocosJoystick(host) {
          var _this = this;
          this.state = new JoystickState();
          this.node = void 0;
          this.knob = void 0;
          this.base = void 0;
          this.ink = void 0;
          this.ring = void 0;
          this.wasHeld = false;
          this.rebuildCount = 0;
          this.node = host.child("移动摇杆");
          this.node.addComponent(UITransform).setContentSize(156, 156);
          this.base = this.node.addComponent(Graphics);
          var held = host.child("Held", this.node);
          this.ring = held.addComponent(Graphics);
          held.active = false;
          this.knob = host.child("Knob", this.node);
          this.ink = this.knob.addComponent(Graphics);
          this.redrawVisuals();
          var local = function local(e) {
            var p = e.getUILocation();
            return _this.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 0));
          };
          this.node.on(Node.EventType.TOUCH_START, function (e) {
            var _host$session;
            if (!host.canTouch(_this.node) || ((_host$session = host.session) == null ? void 0 : _host$session.state) !== "playing") return;
            var p = local(e);
            if (Math.hypot(p.x, p.y) > 74) return;
            _this.state.begin(e.getID(), p.x, -p.y);
            host.padVisible = false;
          });
          this.node.on(Node.EventType.TOUCH_MOVE, function (e) {
            var p = local(e);
            _this.state.move(e.getID(), p.x, -p.y);
          });
          for (var _i = 0, _arr = [Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL]; _i < _arr.length; _i++) {
            var type = _arr[_i];
            this.node.on(type, function (e) {
              return _this.state.end(e.getID());
            });
          }
          this.node.active = false;
        }
        /** Rebuild after activation: native Graphics can discard inactive render data. */
        var _proto = CocosJoystick.prototype;
        _proto.setVisible = function setVisible(visible) {
          if (this.node.active === visible) return;
          this.node.active = visible;
          if (visible) this.redrawVisuals();
        };
        _proto.redrawVisuals = function redrawVisuals() {
          this.rebuildCount++;
          var base = this.base;
          base.clear();
          base.fillColor = new Color("#223a30");
          base.circle(0, 0, 74);
          base.fill();
          base.strokeColor = new Color("#a5b596");
          base.lineWidth = 2;
          base.circle(0, 0, 74);
          base.stroke();
          base.strokeColor = new Color("#708b78");
          base.circle(0, 0, 50);
          base.stroke();
          for (var _i2 = 0, _arr2 = [[0, 64], [0, -64], [64, 0], [-64, 0]]; _i2 < _arr2.length; _i2++) {
            var _arr2$_i = _arr2[_i2],
              x = _arr2$_i[0],
              y = _arr2$_i[1];
            base.moveTo(x * 0.88, y * 0.88);
            base.lineTo(x, y);
            base.stroke();
          }
          this.ink.clear();
          this.ink.fillColor = new Color("#9fb18e");
          this.ink.circle(0, 0, 21);
          this.ink.fill();
          this.ink.strokeColor = new Color("#e7e8cf");
          this.ink.lineWidth = 2;
          this.ink.circle(0, 0, 21);
          this.ink.stroke();
          this.redrawHeldRing();
        };
        _proto.redrawHeldRing = function redrawHeldRing() {
          this.ring.clear();
          this.ring.strokeColor = new Color("#eed493");
          this.ring.lineWidth = 3;
          this.ring.circle(0, 0, 74);
          this.ring.stroke();
        };
        _proto.clear = function clear() {
          this.state.clear();
          this.draw();
        };
        _proto.draw = function draw() {
          this.knob.setPosition(this.state.value.knobX, -this.state.value.knobY);
          var held = this.state.owner !== null;
          if (held !== this.wasHeld) {
            this.ring.node.active = held;
            if (held) this.redrawHeldRing();
            this.wasHeld = held;
          }
        };
        return CocosJoystick;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CocosTerrain.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './TerrainPlan.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _asyncToGenerator, _regeneratorRuntime, cclegacy, resources, Node, UITransform, Sprite, SpriteFrame, Rect, Size, Texture2D, JsonAsset, planTerrain;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
      resources = module.resources;
      Node = module.Node;
      UITransform = module.UITransform;
      Sprite = module.Sprite;
      SpriteFrame = module.SpriteFrame;
      Rect = module.Rect;
      Size = module.Size;
      Texture2D = module.Texture2D;
      JsonAsset = module.JsonAsset;
    }, function (module) {
      planTerrain = module.planTerrain;
    }],
    execute: function () {
      cclegacy._RF.push({}, "f7b09F0zddF+qXl3jBG174x", "CocosTerrain", undefined);
      /** Native sprite pool below combat. Canvas is used only by the offline asset exporter. */
      var CocosTerrain = exports('CocosTerrain', /*#__PURE__*/function () {
        function CocosTerrain(parent) {
          this.node = void 0;
          this.status = "loading";
          this.patches = [];
          this.textures = new Map();
          this.disposed = false;
          this.pool = [];
          this.node = new Node("Theme terrain");
          this.node.layer = parent.layer;
          parent.addChild(this.node);
        }
        var _proto = CocosTerrain.prototype;
        _proto.loadResource = function loadResource(path, type) {
          return new Promise(function (resolve, reject) {
            return resources.load(path, type, function (e, a) {
              return e ? reject(e) : resolve(a);
            });
          });
        };
        _proto.load = /*#__PURE__*/function () {
          var _load = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
            var _this = this;
            var _manifest$json$files, manifest, expected, loaded, _iterator, _step, _step$value, key, texture;
            return _regeneratorRuntime().wrap(function _callee2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.prev = 0;
                  _context2.next = 3;
                  return this.loadResource("terrain/manifest", JsonAsset);
                case 3:
                  manifest = _context2.sent;
                  expected = ["forest-0.png", "forest-1.png", "crypt-0.png", "crypt-1.png", "tundra-0.png", "tundra-1.png"];
                  if (!(manifest.json.width !== 512 || manifest.json.height !== 512 || ((_manifest$json$files = manifest.json.files) == null ? void 0 : _manifest$json$files.length) !== 6 || !expected.every(function (name) {
                    return manifest.json.files.some(function (f) {
                      return f.filename === name;
                    });
                  }))) {
                    _context2.next = 7;
                    break;
                  }
                  throw Error("Invalid terrain manifest");
                case 7:
                  _context2.next = 9;
                  return Promise.all(expected.map( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(filename) {
                    var key, texture;
                    return _regeneratorRuntime().wrap(function _callee$(_context) {
                      while (1) switch (_context.prev = _context.next) {
                        case 0:
                          key = filename.replace(/\.png$/, "");
                          _context.next = 3;
                          return _this.loadResource("terrain/" + key + "/texture", Texture2D);
                        case 3:
                          texture = _context.sent;
                          if (!(texture.width !== 512 || texture.height !== 512)) {
                            _context.next = 6;
                            break;
                          }
                          throw Error("Invalid terrain texture");
                        case 6:
                          texture.setFilters(Texture2D.Filter.NEAREST, Texture2D.Filter.NEAREST);
                          return _context.abrupt("return", {
                            key: key,
                            texture: texture
                          });
                        case 8:
                        case "end":
                          return _context.stop();
                      }
                    }, _callee);
                  }))));
                case 9:
                  loaded = _context2.sent;
                  if (!this.disposed) {
                    _context2.next = 12;
                    break;
                  }
                  return _context2.abrupt("return");
                case 12:
                  for (_iterator = _createForOfIteratorHelperLoose(loaded); !(_step = _iterator()).done;) {
                    _step$value = _step.value, key = _step$value.key, texture = _step$value.texture;
                    this.textures.set(key, texture);
                  }
                  this.status = "ready";
                  _context2.next = 22;
                  break;
                case 16:
                  _context2.prev = 16;
                  _context2.t0 = _context2["catch"](0);
                  if (!this.disposed) {
                    _context2.next = 20;
                    break;
                  }
                  return _context2.abrupt("return");
                case 20:
                  this.status = "unavailable";
                  this.node.active = false;
                case 22:
                case "end":
                  return _context2.stop();
              }
            }, _callee2, this, [[0, 16]]);
          }));
          function load() {
            return _load.apply(this, arguments);
          }
          return load;
        }();
        _proto.draw = function draw(session, scale, visualView) {
          if (scale === void 0) {
            scale = 0.525;
          }
          this.node.active = this.status === "ready";
          if (!this.node.active) return false;
          var source = visualView || {
              x: session.camera.worldX,
              y: session.camera.worldY,
              width: session.canvas.width,
              height: session.canvas.height,
              cx: session.camera.worldX + session.canvas.width / 2,
              cy: session.camera.worldY + session.canvas.height / 2
            },
            view = {
              x: source.x - 2,
              y: source.y - 2,
              width: source.width + 4,
              height: source.height + 4
            };
          var patches = planTerrain(view, session.runMode, [].concat(session.worldMap.visibleStructures, session.interactions.objects));
          // Bounded rendering only: never discard gameplay objects or change collision.
          if (!patches.length || patches.length > 512) {
            this.node.active = false;
            this.patches = [];
            return false;
          }
          this.patches = patches;
          var cx = source.cx,
            cy = source.cy;
          for (var i = 0; i < patches.length; i++) {
            var p = patches[i],
              key = session.stageId + "-" + (p.paved ? 1 : 0);
            var entry = this.pool[i];
            if (!entry) {
              var _node = new Node("Terrain patch");
              _node.layer = this.node.layer;
              this.node.addChild(_node);
              _node.addComponent(UITransform);
              var _sprite = _node.addComponent(Sprite);
              _sprite.sizeMode = Sprite.SizeMode.CUSTOM;
              var _frame = new SpriteFrame();
              _frame.packable = false;
              entry = {
                node: _node,
                sprite: _sprite,
                frame: _frame,
                key: ""
              };
              this.pool.push(entry);
            }
            var _entry = entry,
              node = _entry.node,
              frame = _entry.frame,
              sprite = _entry.sprite;
            node.active = true;
            var signature = key + ":" + p.u + ":" + p.v + ":" + p.width + ":" + p.height;
            if (entry.key !== signature) {
              // SIMPLE sprites do not subscribe to SpriteFrame UV_UPDATED. Rebind via public API.
              sprite.spriteFrame = null;
              frame.texture = this.textures.get(key);
              frame.rect = new Rect(p.u, p.v, p.width, p.height);
              frame.originalSize = new Size(p.width, p.height);
              sprite.spriteFrame = frame;
              entry.key = signature;
            }
            node.setPosition((p.x + p.width / 2 - cx) * scale, -(p.y + p.height / 2 - cy) * scale);
            node.getComponent(UITransform).setContentSize(p.width * scale, p.height * scale);
          }
          for (var _i = patches.length; _i < this.pool.length; _i++) this.pool[_i].node.active = false;
          return true;
        };
        _proto.snapshot = function snapshot() {
          return {
            status: this.status,
            textures: this.textures.size,
            patches: this.patches.length,
            allocated: this.pool.length
          };
        };
        _proto.destroy = function destroy() {
          this.disposed = true;
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.pool), _step2; !(_step2 = _iterator2()).done;) {
            var entry = _step2.value;
            entry.frame.destroy();
          }
          this.node.destroy();
        };
        return CocosTerrain;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CombatCoach.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('coachCopy', coachCopy);
      cclegacy._RF.push({}, "f4de5Z3RvRMeZ3Fpy35FgwX", "CombatCoach", undefined);
      var COACH_IDS = exports('COACH_IDS', ["move", "pickup", "skill", "interact", "route", "ultimate"]);
      function coachCopy(id, mode, keys) {
        var move = mode === "touch" ? "左侧摇杆" : mode === "pad" ? "左摇杆" : "" + keys.up + keys.left + keys.down + keys.right;
        var action = function action(id, name, pad) {
          return mode === "touch" ? "\u70B9" + name : mode === "pad" ? "\u6309" + pad : "\u6309 " + keys[id];
        };
        return {
          move: move + "\u79FB\u52A8\uFF1B\u6B66\u5668\u81EA\u52A8\u653B\u51FB",
          pickup: "靠近地上经验升级，选择构筑",
          skill: action("skill", "主动", "西键") + "\u65BD\u6CD5\uFF1B\u4F7F\u7528\u540E\u7B49\u5F85\u51B7\u5374",
          interact: action("interact", "附近交互", "南键") + "\u4EA4\u4E92\uFF1B\u9009\u7269\u54C1\u65F6\u6218\u6597\u6682\u505C",
          route: "\u6E05\u623F\u5DF2\u5F00\u51FA\u53E3\uFF1B" + action("map", "路线图", "View") + "\u627E\u8DEF",
          ultimate: "\u7EC8\u6781\u5DF2\u6EE1\uFF1B" + action("ultimate", "终极", "北键") + "\u91CA\u653E"
        }[id] || "";
      }

      /** Read-only coaching: never moves a player, grants rewards, or pauses combat. */
      var CombatCoach = exports('CombatCoach', /*#__PURE__*/function () {
        function CombatCoach(history) {
          if (history === void 0) {
            history = [];
          }
          this.seen = void 0;
          this.dirty = false;
          this.origin = null;
          this.current = null;
          this.nextAt = 0;
          this.seen = new Set(history.filter(function (id) {
            return COACH_IDS.includes(id);
          }));
        }
        var _proto = CombatCoach.prototype;
        _proto.learn = function learn(id) {
          if (!this.seen.has(id)) {
            this.seen.add(id);
            this.dirty = true;
          }
        };
        _proto.historyChange = function historyChange() {
          if (!this.dirty) return null;
          this.dirty = false;
          return Array.from(this.seen);
        };
        _proto.suspend = function suspend() {
          this.current = null;
        };
        _proto.step = function step(c) {
          var _this = this;
          this.origin || (this.origin = {
            x: c.x,
            y: c.y
          });
          var moved = Math.hypot(c.x - this.origin.x, c.y - this.origin.y) >= 32;
          if (moved) this.learn("move");
          if (c.collected > 0 || c.level > 1) this.learn("pickup");
          if (!c.skillReady) this.learn("skill");
          if (c.interacting) {
            var _this$current;
            this.learn("interact");
            if (((_this$current = this.current) == null ? void 0 : _this$current.id) === "interact") {
              this.current = null;
              this.nextAt = c.time + 3;
            }
          }
          if (!c.playing) return null;
          var eligible = [["interact", c.near], ["route", c.roomReady], ["ultimate", c.ultimateReady], ["move", c.time < 20 && !moved], ["pickup", c.orbs > 0 && c.collected === 0 && c.level === 1], ["skill", c.time >= 5 && c.enemies > 0 && c.skillReady]];
          if (this.current) {
            if (eligible.some(function (_ref) {
              var id = _ref[0],
                ok = _ref[1];
              return id === _this.current.id && ok;
            }) && c.time - this.current.since < 12) return this.current.id;
            this.current = null;
            this.nextAt = c.time + 3;
          }
          if (c.time < this.nextAt) return null;
          var next = eligible.find(function (_ref2) {
            var id = _ref2[0],
              ok = _ref2[1];
            return ok && !_this.seen.has(id);
          });
          if (!next) return null;
          this.current = {
            id: next[0],
            since: c.time
          };
          this.learn(next[0]);
          return next[0];
        };
        return CombatCoach;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CombatSession.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './shared-core.js'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, cclegacy, sharedCore;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      sharedCore = module;
    }],
    execute: function () {
      cclegacy._RF.push({}, "cc260am6a9Nq56c6fksXiAy", "CombatSession", undefined);
      var C = exports('CombatCore', sharedCore);

      /** Native-compatible host of the shared rules. No DOM; persistence supplied by native stores. */
      var CombatSession = exports('CombatSession', /*#__PURE__*/function () {
        function CombatSession(heroId, talentId, options) {
          var _this = this,
            _options$snapshot,
            _this$profile,
            _this$profile2,
            _options$snapshot3,
            _options$snapshot4,
            _options$snapshot5,
            _options$snapshot6;
          if (heroId === void 0) {
            heroId = "sword";
          }
          if (options === void 0) {
            options = {};
          }
          this.player = void 0;
          this.enemies = [];
          this.projectiles = [];
          this.enemyProjectiles = [];
          this.mines = [];
          this.expOrbs = [];
          this.texts = [];
          this.state = C.GameState.PLAYING;
          this.runMode = "endless";
          this.stageId = "forest";
          this.stageMods = {};
          this.gameTime = 0;
          this.damageHistory = C.restoreDamageHistory(null, 0);
          this.kills = 0;
          this.runCoins = 0;
          this.combatCoinsEarned = 0;
          this.enemyDmgMult = 1;
          this.run = {
            orbsCollected: 0
          };
          this.save = {
            settings: {
              difficulty: "normal",
              reducedMotion: false,
              criticalFlash: false,
              damageNumbers: true,
              highContrast: false
            }
          };
          this.spatial = new C.SpatialHash(C.CONFIG.SPATIAL_CELL_SIZE);
          this.combatVisuals = new C.CombatVisualLayer();
          this.reactions = void 0;
          this.buildSystem = void 0;
          this.heroSkills = void 0;
          this.hostileFields = void 0;
          this.ui = {
            showBossBanner: function showBossBanner() {},
            updateHud: function updateHud() {}
          };
          this.audio = {
            shoot: function shoot() {},
            explosion: function explosion() {},
            pickup: function pickup() {},
            hit: function hit() {},
            bossSpawn: function bossSpawn() {},
            bossWarn: function bossWarn() {}
          };
          this.effects = new C.EffectLayer();
          // Reuse simulation-time delayed attacks; burst visuals are not drawn.
          this._lastMoveVec = {
            x: 1,
            y: 0
          };
          this.direction = {
            x: 0,
            y: 0
          };
          this.input = {
            getMoveVector: function getMoveVector() {
              return _this.direction;
            }
          };
          this.choices = [];
          this.pendingLevelUps = 0;
          this.buildChoice = null;
          this._spawnAccumulator = 0;
          this.arenaWidth = C.CONFIG.ARENA_WIDTH;
          this.arenaHeight = C.CONFIG.ARENA_HEIGHT;
          this.canvas = {
            width: 1200,
            height: 800
          };
          // Logical viewport, not an HTML canvas.
          this.camera = {
            worldX: 0,
            worldY: 0
          };
          this.worldMap = void 0;
          this.interactions = void 0;
          this.chapterRoute = void 0;
          this.endlessRun = new C.EndlessRun();
          this.environment = new C.EnvironmentState();
          this.shopPurchases = 0;
          this.activeInteraction = null;
          this._interactionOptions = [];
          this.message = "";
          this.outcome = null;
          this.discoveries = {};
          var difficulty = options.snapshot ? options.snapshot.cocosDifficulty : options.difficulty;
          this.save.settings.difficulty = Object.values(C.Difficulty).some(function (d) {
            return d.id === difficulty;
          }) ? difficulty : "normal";
          this.runMode = options.mode === "chapter" ? "chapter" : "endless";
          this.stageId = Object.values(C.STAGES).some(function (stage) {
            return stage.id === options.stage;
          }) ? options.stage : "forest";
          this.stageMods = C.getStageModifiers(this.stageId);
          this.stageWaves = C.getWavesFor(this.stageId);
          this.stageBosses = C.getBossesFor(this.stageId);
          this.currentWave = this.stageWaves[0];
          for (var _i = 0, _arr = ["_selectWave", "_computeDifficultyMults", "_spawnLogic", "_spawnOne", "_spawnBoss", "_tickEndlessBoss", "onBossAbility", "spawnBossMinions", "fireBossFan", "_setupChapterRoom", "_handleChapterRoomClear", "_spawnChapterExits", "_applyColdTick", "_worldInteractionOptions", "_sceneItemOptions", "_supplyOption", "_itemOption", "_resolveWorldInteraction", "_grantWorldItem"]; _i < _arr.length; _i++) {
            var name = _arr[_i];
            this[name] = C[name].bind(this);
          }
          C.registerWeaponClass(C.Weapon);
          this.player = new C.Player(0, 0);
          this.buildSystem = new C.RunBuildSystem(this);
          this.buildSystem.reset(this.player);
          var hero = C.getHero(heroId);
          C.applyHeroTalent(this.player, hero, talentId);
          this.selectedHeroId = hero.id;
          this.selectedHero = hero;
          this.selectedHeroTalentId = this.player.heroTalentId;
          this.store = options.store;
          this.profile = options.profile;
          this.serial = options.serial || ((_options$snapshot = options.snapshot) == null ? void 0 : _options$snapshot.cocosRunSerial);
          this.runMetaTalents = options.snapshot ? options.snapshot.cocosMetaTalents || [] : Array.from(((_this$profile = this.profile) == null ? void 0 : _this$profile.data.meta.equippedTalents) || []);
          this.activeCovenantSlot = options.slot || 1;
          var bonuses = C.applyMetaTalents(this.player, options.snapshot ? null : (_this$profile2 = this.profile) == null ? void 0 : _this$profile2.data.meta);
          this.player.weapons.push(new C.Weapon(Object.values(C.WEAPONS).find(function (w) {
            return w.id === hero.startingWeapon;
          })));
          if (bonuses.extraStartingWeapon) {
            var extraId = {
              sword: "knife",
              paper: "lightning",
              devourer: "soul_drain",
              star: "boomerang"
            }[hero.id];
            var def = Object.values(C.WEAPONS).find(function (w) {
              return w.id === extraId;
            });
            if (def) this.player.weapons.push(new C.Weapon(def));
          }
          this.runCoins = bonuses.startCoins;
          this._recordDiscovery("heroes", hero.id);
          for (var _iterator = _createForOfIteratorHelperLoose(this.player.weapons), _step; !(_step = _iterator()).done;) {
            var w = _step.value;
            this._recordDiscovery("weapons", w.id);
          }
          for (var _i2 = 0, _Object$entries = Object.entries(((_options$snapshot2 = options.snapshot) == null ? void 0 : _options$snapshot2.cocosDiscoveries) || {}); _i2 < _Object$entries.length; _i2++) {
            var _options$snapshot2;
            var _Object$entries$_i = _Object$entries[_i2],
              kind = _Object$entries$_i[0],
              ids = _Object$entries$_i[1];
            for (var _i3 = 0, _arr2 = ids; _i3 < _arr2.length; _i3++) {
              var id = _arr2[_i3];
              this._recordDiscovery(kind, id);
            }
          }
          var gainExp = this.player.gainExp.bind(this.player);
          this.player.gainExp = function (amount) {
            var levels = gainExp(amount);
            _this.pendingLevelUps += levels.length;
            return levels;
          };
          this.reactions = new C.ReactionSystem(this);
          this.hostileFields = new C.HostileFieldSystem(this);
          this.heroSkills = new C.QingfengSkillController(this);
          this.heroSkills.setHero(hero.id);
          this.chapterRoute = new C.ChapterRouteSystem();
          this.chapterRoute.reset((_options$snapshot3 = options.snapshot) == null ? void 0 : _options$snapshot3.chapterRoute, this.stageId);
          this.endlessRun.restore((_options$snapshot4 = options.snapshot) == null ? void 0 : _options$snapshot4.endlessRun);
          this.worldMap = new C.WorldMapSystem(this);
          this.interactions = new C.InteractionSystem(this);
          this.worldMap.reset({
            mode: this.runMode,
            stageId: this.stageId,
            player: this.player
          });
          this.interactions.reset(this.player, {
            mode: this.runMode
          });
          if (this.runMode === "chapter") this._setupChapterRoom();
          if (options.snapshot) C.restoreCovenantState.call(this, options.snapshot);
          this.lastSavedTime = this.gameTime;
          if (this.endlessRun.pendingDecision) this.state = C.GameState.MILESTONE;
          if ((_options$snapshot5 = options.snapshot) != null && _options$snapshot5.cocosBuildChoice) {
            var saved = options.snapshot.cocosBuildChoice,
              defs = saved.kind === "relic" ? C.RELICS : C.CURSES;
            var owned = saved.kind === "relic" ? this.buildSystem.relics : this.buildSystem.curses;
            var choices = saved.ids.map(function (id) {
              return defs[id];
            }).filter(function (d) {
              return d && !owned.has(d.id);
            });
            if (choices.length) {
              this.buildChoice = {
                kind: saved.kind,
                choices: choices
              };
              this.state = C.GameState.BUILD_CHOICE;
            }
          }
          if ((_options$snapshot6 = options.snapshot) != null && _options$snapshot6.cocosCompletion) {
            this.completion = options.snapshot.cocosCompletion;
            this.outcome = this.completion.outcome;
            this.player.hp = options.snapshot.player.hp;
            this.state = C.GameState.GAMEOVER;
          }
          this._updateCamera();
        }
        var _proto = CombatSession.prototype;
        _proto._usesEndlessTimeline = function _usesEndlessTimeline() {
          return this.runMode === "endless";
        };
        _proto._announce = function _announce(text) {
          this.message = text;
        };
        _proto._recordDiscovery = function _recordDiscovery(kind, id) {
          var _this$discoveries;
          ((_this$discoveries = this.discoveries)[kind] || (_this$discoveries[kind] = new Set())).add(id);
        };
        _proto.covenantSnapshot = function covenantSnapshot() {
          return _extends({}, C.buildCovenantSnapshot(this), {
            cocosDifficulty: this.save.settings.difficulty,
            cocosRunSerial: this.serial,
            cocosDiscoveries: Object.fromEntries(Object.entries(this.discoveries).map(function (_ref) {
              var kind = _ref[0],
                ids = _ref[1];
              return [kind, Array.from(ids)];
            })),
            cocosCompletion: this.completion || null,
            cocosBuildChoice: this.buildChoice ? {
              kind: this.buildChoice.kind,
              ids: this.buildChoice.choices.map(function (d) {
                return d.id;
              })
            } : null,
            cocosMetaTalents: this.runMetaTalents
          });
        };
        _proto.saveCurrentCovenant = function saveCurrentCovenant() {
          if (!this.store || this.player.dead || this.state === C.GameState.GAMEOVER || this.pendingLevelUps) return false;
          var saved = this.store.write(this.activeCovenantSlot, this.covenantSnapshot());
          if (saved && this.profile) saved = this.profile.discover(this.discoveries);
          this.lastSavedTime = this.gameTime;
          this.saveMessage = saved ? "命契" + this.activeCovenantSlot + "已保存到本地" : "保存失败，进度仍在内存；请重试，暂勿刷新或关闭";
          this.saveFailed = !saved;
          return saved;
        };
        _proto.finishCovenant = function finishCovenant() {
          if (!this.store) return true;
          if (this.profile) {
            this.completion || (this.completion = {
              outcome: this.outcome,
              dateKey: C.localDateKey(),
              run: {
                kills: this.kills,
                gameTime: this.gameTime,
                bossKills: this.runMode === "endless" ? this.endlessRun.nextIndex : Object.keys(this.run.bossesDefeated || {}).length,
                stageId: this.stageId,
                runMode: this.runMode,
                victory: !!this.outcome
              }
            });
            if (!this.profile.isSettled(this.activeCovenantSlot, this.serial) && !this.store.write(this.activeCovenantSlot, this.covenantSnapshot())) {
              this.saveFailed = true;
              this.saveMessage = "结算待存档失败，请重试，暂勿关闭。";
              return false;
            }
            var result = this.profile.settle(this.activeCovenantSlot, this.serial, this.completion, this.discoveries);
            if (!result.ok) {
              this.saveFailed = true;
              this.saveMessage = "命府入账失败，已保留待结算命契。返回菜单可重试。";
              return false;
            }
            this.metaReward = result.reward;
          }
          var saved = this.store.write(this.activeCovenantSlot, null);
          this.saveFailed = !saved;
          this.saveMessage = saved ? "本局已结束；这份命契可重新开始。" : "结束记录保存失败，请点击返回菜单重试，暂勿刷新或关闭。";
          return saved;
        };
        _proto._updateCamera = function _updateCamera() {
          var x = this.player.x - this.canvas.width / 2,
            y = this.player.y - this.canvas.height / 2;
          this.camera.worldX = this.runMode === "endless" ? x : Math.max(0, Math.min(this.arenaWidth - this.canvas.width, x));
          this.camera.worldY = this.runMode === "endless" ? y : Math.max(0, Math.min(this.arenaHeight - this.canvas.height, y));
        };
        _proto.interact = function interact() {
          return this.openWorldInteraction(this.interactions.nearby);
        };
        _proto.openWorldInteraction = function openWorldInteraction(object) {
          if (this.state !== C.GameState.PLAYING || !object || object.used) return false;
          this.activeInteraction = object;
          this.state = C.GameState.INTERACTION;
          this.setMove(0, 0);
          this._renderWorldInteraction();
          return true;
        };
        _proto._renderWorldInteraction = function _renderWorldInteraction() {
          this._interactionOptions = this._worldInteractionOptions(this.activeInteraction);
        };
        _proto.closeWorldInteraction = function closeWorldInteraction() {
          this.activeInteraction = null;
          this._interactionOptions = [];
          this.state = C.GameState.PLAYING;
          this.interactions.update(this.player);
        };
        _proto.resolveInteraction = function resolveInteraction(index) {
          if (this.state !== C.GameState.INTERACTION || !Number.isInteger(index)) return false;
          var option = this._interactionOptions[index];
          if (!option || option.disabled) return false;
          this._resolveWorldInteraction(option.id);
          return true;
        };
        _proto.checkpoint = function checkpoint(action) {
          if (this.state !== C.GameState.MILESTONE) return false;
          if (action === "continue") {
            this.endlessRun.continueRun();
            this.player.invincible = true;
            this.player.invincibleTimer = Math.max(2, this.player.invincibleTimer || 0);
            this.state = C.GameState.PLAYING;
          } else if (action === "settle") {
            this.outcome = "endless-complete";
            this.state = C.GameState.GAMEOVER;
            this.finishCovenant();
          } else return false;
          return true;
        };
        _proto.setMove = function setMove(x, y, analog) {
          if (analog === void 0) {
            analog = false;
          }
          var length = Math.hypot(x, y);
          var divisor = analog ? Math.max(1, length) : length;
          this.direction = length && Number.isFinite(length) ? {
            x: x / divisor,
            y: y / divisor
          } : {
            x: 0,
            y: 0
          };
          if (length && Number.isFinite(length)) this._lastMoveVec = {
            x: x / length,
            y: y / length
          };
        };
        _proto.pause = function pause() {
          if (this.state === C.GameState.PLAYING) this.state = C.GameState.PAUSED;
          this.setMove(0, 0);
        };
        _proto.resume = function resume() {
          if (this.state === C.GameState.PAUSED) this.state = C.GameState.PLAYING;
        };
        _proto.cast = function cast(ultimate) {
          if (ultimate === void 0) {
            ultimate = false;
          }
          if (this.state !== C.GameState.PLAYING) return false;
          var used = ultimate ? this.heroSkills.useUltimate() : this.heroSkills.useSkill();
          if (used) ultimate ? this.audio.explosion() : this.audio.shoot();
          return used;
        };
        _proto.update = function update(dt) {
          if (this.state !== C.GameState.PLAYING || !Number.isFinite(dt) || dt <= 0) return;
          dt = Math.min(dt, C.CONFIG.DT_CLAMP);
          this.gameTime += dt;
          this.effects.update(dt);
          var _this$_computeDifficu = this._computeDifficultyMults(),
            hpMult = _this$_computeDifficu.hpMult,
            dmgMult = _this$_computeDifficu.dmgMult,
            diff = _this$_computeDifficu.diff;
          this.enemyDmgMult = dmgMult;
          this.currentWave = this._selectWave();
          this.player.update(dt, this);
          this.worldMap.update(this.player);
          this.interactions.update(this.player, this.gameTime);
          this.heroSkills.update(dt);
          C.updateHeroAnimation(this.player, dt, this.save.settings.reducedMotion || C.heroPrefersReducedMotion());
          this.spatial.insertAll(this.enemies);
          C.updateEnemies.call(this, dt, hpMult, dmgMult);
          if (this._pendingChapterVictory) {
            this.outcome = "chapter-complete";
            this.state = C.GameState.GAMEOVER;
            this.finishCovenant();
            return;
          }
          if (this.endlessRun.pendingDecision) {
            this.hostileFields.reset();
            this.state = C.GameState.MILESTONE;
            return;
          }
          C.updateProjectiles.call(this, dt);
          C.updateEnemyProjectiles.call(this, dt);
          C.updateMines.call(this, dt);
          C.updateExpOrbs.call(this, dt);
          this.hostileFields.update(dt, this);
          this.combatVisuals.update(dt);
          this._applyColdTick(dt);
          this._updateCamera();
          this._spawnLogic(dt, hpMult, dmgMult, diff.spawnMult);
          this.texts = this.texts.filter(function (t) {
            return (t.life -= dt) > 0;
          });
          if (this.player.dead) {
            this.state = C.GameState.GAMEOVER;
            this.setMove(0, 0);
            this.finishCovenant();
          } else if (this.pendingLevelUps) this.offerLevel();
          if (this.state === C.GameState.PLAYING) this.offerBuildChoice();
          if (this.store && this.state === C.GameState.PLAYING && this.gameTime - this.lastSavedTime >= 15) {
            if (!this.saveCurrentCovenant()) this.pause();
          }
        };
        _proto.offerLevel = function offerLevel() {
          this.choices = C.levelChoices(this.player);
          this.state = C.GameState.LEVEL_UP;
          this.setMove(0, 0);
        };
        _proto.offerBuildChoice = function offerBuildChoice() {
          if (this.state !== C.GameState.PLAYING || this.buildChoice) return false;
          var choices = this.buildSystem.update(this.gameTime);
          if (!(choices != null && choices.length)) return false;
          this.buildChoice = {
            kind: "curse",
            choices: choices
          };
          this.state = C.GameState.BUILD_CHOICE;
          this.setMove(0, 0);
          if (this.store) this.saveCurrentCovenant();
          return true;
        };
        _proto.chooseBuild = function chooseBuild(index) {
          var _this$buildChoice;
          if (this.state !== C.GameState.BUILD_CHOICE || !Number.isInteger(index)) return false;
          var selected = (_this$buildChoice = this.buildChoice) == null ? void 0 : _this$buildChoice.choices[index];
          if (!selected) return false;
          var granted = this.buildChoice.kind === "relic" ? this.buildSystem.grantRelic(selected.id) : this.buildSystem.grantCurse(selected.id);
          if (!granted) return false;
          this.buildChoice = null;
          this.buildSystem.checkFusions();
          this.state = C.GameState.PLAYING;
          if (this.store && !this.saveCurrentCovenant()) this.pause();
          return true;
        };
        _proto.choose = function choose(index) {
          if (this.state !== C.GameState.LEVEL_UP || !Number.isInteger(index) || !this.choices[index]) return false;
          var choice = this.choices[index];
          // Clear this offer before applying it so the same card cannot be claimed twice.
          this.choices = [];
          this.state = C.GameState.PLAYING;
          if (choice.type === "weapon") {
            var owned = this.player.weapons.find(function (w) {
              return w.id === choice.data.id;
            });
            if (owned) owned.levelUp();else this.player.weapons.push(new C.Weapon(choice.data));
            this._recordDiscovery("weapons", choice.data.id);
          } else if (choice.type === "passive") {
            this.player.addPassive(choice.data);
            this._recordDiscovery("passives", choice.data.id);
          } else C.applyLevelReward(this, choice.data.id);
          this.pendingLevelUps--;
          this.buildSystem.checkFusions();
          if (this.pendingLevelUps > 0) this.offerLevel();else this.offerBuildChoice();
          return true;
        };
        _proto._onEnemyKilled = function _onEnemyKilled(enemy, hpMult, dmgMult) {
          this.audio.hit();
          this.kills++;
          if (enemy.boss) {
            var _this$run;
            (_this$run = this.run).bossesDefeated || (_this$run.bossesDefeated = {});
            this.run.bossesDefeated[enemy.id] = true;
          }
          var coins = C.killCoinReward({
            boss: enemy.boss,
            kills: this.kills,
            gameTime: this.gameTime,
            earned: this.combatCoinsEarned,
            endless: this.runMode === "endless"
          });
          this.runCoins += coins;
          if (!enemy.boss) this.combatCoinsEarned += coins;
          this.heroSkills.gainEnergy(enemy.boss ? 25 : 2);
          this.expOrbs.push(new C.ExpOrb(enemy.x, enemy.y, enemy.expValue));
          if (this.runMode === "chapter") {
            if (this.chapterRoute.registerKill(enemy)) this._handleChapterRoomClear(enemy);
          } else if (enemy.boss) {
            this.endlessRun.defeat(enemy.type);
            this.interactions.spawnBossChest(enemy.x, enemy.y, enemy.type.name || enemy.id, this.gameTime);
          }
          if (enemy.splitter) {
            var type = Object.values(C.ENEMIES).find(function (e) {
              return e.id === enemy.type.splitInto;
            });
            if (type) for (var i = 0; i < (enemy.type.splitCount || 2); i++) {
              var angle = i * Math.PI * 2 / (enemy.type.splitCount || 2);
              this.enemies.push(new C.Enemy(enemy.x + Math.cos(angle) * 14, enemy.y + Math.sin(angle) * 14, type, hpMult, dmgMult));
            }
          }
        };
        _proto.createFloatingText = function createFloatingText(text, x, y, color) {
          if (this.texts.length < 24) this.texts.push({
            text: String(text),
            x: x,
            y: y,
            color: color,
            life: 0.7
          });
        };
        _proto.createParticles = function createParticles() {} // Particle bursts and screen flashes intentionally absent.
        ;

        _proto.shake = function shake() {};
        _proto.snapshot = function snapshot() {
          return {
            hero: this.player.heroId,
            mode: this.runMode,
            stage: this.stageId,
            outcome: this.outcome,
            room: this.runMode === "chapter" ? _extends({}, this.chapterRoute.current(), {
              kills: this.chapterRoute.roomKills,
              ready: this.chapterRoute.roomReady,
              exits: this.chapterRoute.choices().map(function (n) {
                return n.id;
              })
            }) : null,
            boss: C.bossCombatSnapshot(this.enemies.find(function (e) {
              return e.boss;
            })),
            nextBoss: this.runMode === "endless" ? this.endlessRun.nextDefinition(this.stageId).spawnAt : null,
            interaction: this.activeInteraction ? {
              id: this.activeInteraction.id,
              kind: this.activeInteraction.kind,
              options: this._interactionOptions.map(function (o) {
                return {
                  id: o.id,
                  name: o.name,
                  price: o.price,
                  disabled: o.disabled
                };
              })
            } : null,
            talent: this.player.heroTalentId,
            state: this.state,
            x: this.player.x,
            y: this.player.y,
            time: this.gameTime,
            hp: this.player.hp,
            maxHp: this.player.maxHp,
            kills: this.kills,
            coins: this.runCoins,
            exp: this.player.exp,
            level: this.player.level,
            weapons: this.player.weapons.map(function (w) {
              return {
                id: w.id,
                name: w.name,
                level: w.level
              };
            }),
            passives: Object.keys(this.player.passives),
            curses: Array.from(this.buildSystem.curses),
            buildChoice: this.buildChoice ? {
              kind: this.buildChoice.kind,
              ids: this.buildChoice.choices.map(function (d) {
                return d.id;
              })
            } : null,
            enemies: this.enemies.length,
            projectiles: this.projectiles.length,
            fields: this.combatVisuals.items.map(function (v) {
              return {
                type: v.type,
                key: v.key,
                radius: v.radius,
                stable: v.stable
              };
            }),
            choices: this.choices.map(function (c) {
              return {
                type: c.type,
                id: c.data.id,
                name: c.data.name
              };
            }),
            ability: this.heroSkills.getSnapshot()
          };
        };
        return CombatSession;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ControllerState.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './shared-core.js'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, cclegacy, applyGamepadDeadzone;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      applyGamepadDeadzone = module.applyGamepadDeadzone;
    }],
    execute: function () {
      exports('neighbour', neighbour);
      cclegacy._RF.push({}, "c8111YNr9lCkpHkNStYB5pJ", "ControllerState", undefined);
      /** Engine-independent safety policy. One device owns input until disconnected. */
      var ControllerState = exports('ControllerState', /*#__PURE__*/function () {
        function ControllerState() {
          this.id = null;
          this.blocked = true;
          this.previous = {};
          this.direction = "";
          this.repeat = 0;
        }
        var _proto = ControllerState.prototype;
        _proto.block = function block() {
          this.blocked = true;
          this.direction = "";
          this.repeat = 0;
        };
        _proto.step = function step(devices, dt) {
          var _this = this;
          var lost = this.id !== null && !devices.some(function (d) {
            return d.id === _this.id;
          });
          if (lost) {
            this.id = null;
            this.previous = {};
            this.block();
            return {
              lost: true,
              x: 0,
              y: 0,
              actions: []
            };
          }
          if (this.id === null && devices.length) {
            this.id = devices[0].id;
            this.block();
          }
          var pad = devices.find(function (d) {
            return d.id === _this.id;
          });
          if (!pad) return {
            lost: false,
            x: 0,
            y: 0,
            actions: []
          };
          var axis = function axis(v) {
            return applyGamepadDeadzone(Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0);
          };
          var x = axis(pad.x),
            y = axis(pad.y);
          var length = Math.hypot(x, y);
          if (length > 1) {
            x /= length;
            y /= length;
          }
          var actions = [];
          if (this.blocked) {
            // Release every control after connect, hide, or a modal transition.
            if (!x && !y && !Object.values(pad.buttons).some(Boolean)) this.blocked = false;
            this.previous = _extends({}, pad.buttons);
            return {
              lost: false,
              x: 0,
              y: 0,
              actions: actions
            };
          }
          for (var _i = 0, _Object$keys = Object.keys(pad.buttons); _i < _Object$keys.length; _i++) {
            var name = _Object$keys[_i];
            if (pad.buttons[name] && !this.previous[name]) actions.push(name);
          }
          this.previous = _extends({}, pad.buttons);
          var direction = Math.max(Math.abs(x), Math.abs(y)) < 0.45 ? "" : Math.abs(x) > Math.abs(y) ? x > 0 ? "right" : "left" : y > 0 ? "down" : "up";
          if (direction !== this.direction) {
            this.direction = direction;
            this.repeat = 0.4;
            if (direction) actions.push(direction);
          } else if (direction) {
            this.repeat -= Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0;
            if (this.repeat <= 0) {
              actions.push(direction);
              this.repeat = 0.18;
            }
          }
          return {
            lost: false,
            x: x,
            y: y,
            actions: actions
          };
        };
        return ControllerState;
      }());

      /** Choose a visible neighbour in UI coordinates; shoulders also traverse all. */
      function neighbour(list, current, direction) {
        var dx = direction === "left" ? -1 : direction === "right" ? 1 : 0;
        var dy = direction === "down" ? -1 : direction === "up" ? 1 : 0;
        var best = current,
          score = Infinity;
        for (var _iterator = _createForOfIteratorHelperLoose(list), _step; !(_step = _iterator()).done;) {
          var item = _step.value;
          var x = item.x - current.x,
            y = item.y - current.y;
          var forward = x * dx + y * dy,
            cross = Math.abs(x * dy - y * dx);
          if (forward <= 1) continue;
          var value = Math.hypot(x, y) + cross * 2;
          if (value < score) {
            score = value;
            best = item;
          }
        }
        return best;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CovenantStore.ts", ['cc', './CombatSession.ts'], function (exports) {
  var cclegacy, C;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      C = module.CombatCore;
    }],
    execute: function () {
      cclegacy._RF.push({}, "e9ae3VQYlZCMJURf+3rEELF", "CovenantStore", undefined);

      /** Same journal/schema, separate namespace: never imports or overwrites browser saves. */
      var CovenantStore = exports('CovenantStore', /*#__PURE__*/function () {
        function CovenantStore(storage) {
          this.storage = void 0;
          this.storage = {
            getItem: function getItem(key) {
              return storage.getItem("cocos:" + key);
            },
            setItem: function setItem(key, value) {
              return storage.setItem("cocos:" + key, value);
            },
            removeItem: function removeItem(key) {
              return storage.removeItem("cocos:" + key);
            }
          };
        }
        var _proto = CovenantStore.prototype;
        _proto.slots = function slots() {
          return C.loadCovenants(this.storage);
        };
        _proto.health = function health() {
          return C.getSaveHealth("covenants");
        };
        _proto.write = function write(slot, snapshot) {
          if (!Number.isInteger(slot) || slot < 1 || slot > 3) return false;
          C.saveCovenant(slot, snapshot, this.storage);
          return this.health().code === "ok";
        };
        return CovenantStore;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EnemyFeedback.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('renderEnemyHit', renderEnemyHit);
      cclegacy._RF.push({}, "5dcdfVd+exOdLW4EDIArQEQ", "EnemyFeedback", undefined);
      /** Presentation-only state. Never writes enemies or enters a covenant snapshot. */
      var ENEMY_FEEDBACK = exports('ENEMY_FEEDBACK', Object.freeze({
        hitHold: 0.6,
        deathDuration: 0.28,
        deathOpacity: 0.45,
        maxHits: 48,
        maxDeaths: 24
      }));
      var EnemyFeedback = exports('EnemyFeedback', /*#__PURE__*/function () {
        function EnemyFeedback() {
          this.session = void 0;
          this.room = "";
          this.time = 0;
          this.tracked = new Map();
          this.hits = new Map();
          this.deaths = [];
        }
        var _proto = EnemyFeedback.prototype;
        _proto.reset = function reset() {
          this.tracked.clear();
          this.hits.clear();
          this.deaths.length = 0;
          this.session = undefined;
          this.room = "";
          this.time = 0;
        };
        _proto.observe = function observe(session, room, enemies, time, reduced, pose) {
          if (!Number.isFinite(time)) return;
          if (session !== this.session || room !== this.room || time < this.time) {
            this.reset();
            this.session = session;
            this.room = room;
            this.time = time;
          }
          var elapsed = Math.max(0, time - this.time);
          this.time = time;
          for (var _iterator = _createForOfIteratorHelperLoose(this.hits), _step; !(_step = _iterator()).done;) {
            var _step$value = _step.value,
              e = _step$value[0],
              remaining = _step$value[1];
            if (remaining <= elapsed || e.hp <= 0) this.hits["delete"](e);else this.hits.set(e, remaining - elapsed);
          }
          for (var i = this.deaths.length - 1; i >= 0; i--) if ((this.deaths[i].remaining -= elapsed) <= 0) this.deaths.splice(i, 1);
          if (reduced) {
            this.hits.clear();
            this.deaths.length = 0;
          }
          var next = new Map();
          for (var _iterator2 = _createForOfIteratorHelperLoose(enemies), _step2; !(_step2 = _iterator2()).done;) {
            var _e = _step2.value;
            if (!(_e.hp > 0)) continue;
            var previous = this.tracked.get(_e),
              shield = Number(_e.shieldHp) || 0;
            if (!reduced && previous && (_e.hp < previous.hp || shield < previous.shield) && (this.hits.has(_e) || this.hits.size < ENEMY_FEEDBACK.maxHits)) this.hits.set(_e, ENEMY_FEEDBACK.hitHold);
            next.set(_e, {
              hp: _e.hp,
              shield: shield,
              pose: pose(_e)
            });
          }
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.tracked), _step3; !(_step3 = _iterator3()).done;) {
            var _step3$value = _step3.value,
              _e2 = _step3$value[0],
              _previous = _step3$value[1];
            if (!next.has(_e2)) {
              this.hits["delete"](_e2);
              // Despawn/room changes are not kills. A dead object's HP stays observable
              // even after the combat array removes it; use its last rendered pose.
              if (!reduced && _e2.hp <= 0 && this.deaths.length < ENEMY_FEEDBACK.maxDeaths) this.deaths.push(_extends({}, _previous.pose, {
                remaining: ENEMY_FEEDBACK.deathDuration
              }));
            }
          }
          this.tracked = next;
        };
        _proto.deathAlpha = function deathAlpha(remaining) {
          return ENEMY_FEEDBACK.deathOpacity * Math.max(0, Math.min(1, remaining / ENEMY_FEEDBACK.deathDuration));
        };
        return EnemyFeedback;
      }());

      /** Four restrained corner marks; never a flashing whole-body tint or area ring. */
      function renderEnemyHit(ctx, x, y, radius) {
        if (![x, y, radius].every(Number.isFinite) || radius <= 0) return;
        var r = radius + 3,
          length = Math.min(9, r * 0.35);
        ctx.save();
        ctx.beginPath();
        for (var _i = 0, _arr = [-1, 1]; _i < _arr.length; _i++) {
          var sx = _arr[_i];
          for (var _i2 = 0, _arr2 = [-1, 1]; _i2 < _arr2.length; _i2++) {
            var sy = _arr2[_i2];
            ctx.moveTo(x + sx * (r - length), y + sy * r);
            ctx.lineTo(x + sx * r, y + sy * r);
            ctx.lineTo(x + sx * r, y + sy * (r - length));
          }
        }
        ctx.strokeStyle = "#171719";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.strokeStyle = "#c9a476";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameBoot.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './TouchState.ts', './CocosJoystick.ts', './PanelInk.ts', './CocosTerrain.ts', './CombatCoach.ts', './MenuCopy.ts', './ControllerState.ts', './ResponsiveLayout.ts', './CombatSession.ts', './GraphicsPainter.ts', './HazardLabels.ts', './IncomingThreats.ts', './EnemyFeedback.ts', './CovenantStore.ts', './ProfileStore.ts', './BackupVault.ts', './BackupPanel.ts', './CocosAudio.ts', './SettingsStore.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, _asyncToGenerator, _regeneratorRuntime, cclegacy, _decorator, UITransform, Label, BlockInputEvents, Color, KeyCode, Node, Sprite, Graphics, resources, sys, game, EventKeyboard, Input, input, Game, Component, Texture2D, SpriteFrame, JsonAsset, view, ResolutionPolicy, profiler, Mask, TouchState, CocosJoystick, PanelInk, CocosTerrain, CombatCoach, coachCopy, guidePages, difficultyIds, difficultyLabel, heroKit, healthText, skillCooldownText, pauseLoadout, neighbour, ControllerState, contextInteractionVisible, visualBattleView, ResponsiveLayout, C, CombatSession, GraphicsPainter, hazardLabels, incomingThreats, renderEnemyHit, EnemyFeedback, CovenantStore, ProfileStore, BackupVault, BackupPanel, CocosAudio, SettingsStore, ACTIONS, SETTING_KEYS, ACTION_NAMES;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      UITransform = module.UITransform;
      Label = module.Label;
      BlockInputEvents = module.BlockInputEvents;
      Color = module.Color;
      KeyCode = module.KeyCode;
      Node = module.Node;
      Sprite = module.Sprite;
      Graphics = module.Graphics;
      resources = module.resources;
      sys = module.sys;
      game = module.game;
      EventKeyboard = module.EventKeyboard;
      Input = module.Input;
      input = module.input;
      Game = module.Game;
      Component = module.Component;
      Texture2D = module.Texture2D;
      SpriteFrame = module.SpriteFrame;
      JsonAsset = module.JsonAsset;
      view = module.view;
      ResolutionPolicy = module.ResolutionPolicy;
      profiler = module.profiler;
      Mask = module.Mask;
    }, function (module) {
      TouchState = module.TouchState;
    }, function (module) {
      CocosJoystick = module.CocosJoystick;
    }, function (module) {
      PanelInk = module.PanelInk;
    }, function (module) {
      CocosTerrain = module.CocosTerrain;
    }, function (module) {
      CombatCoach = module.CombatCoach;
      coachCopy = module.coachCopy;
    }, function (module) {
      guidePages = module.guidePages;
      difficultyIds = module.difficultyIds;
      difficultyLabel = module.difficultyLabel;
      heroKit = module.heroKit;
      healthText = module.healthText;
      skillCooldownText = module.skillCooldownText;
      pauseLoadout = module.pauseLoadout;
    }, function (module) {
      neighbour = module.neighbour;
      ControllerState = module.ControllerState;
    }, function (module) {
      contextInteractionVisible = module.contextInteractionVisible;
      visualBattleView = module.visualBattleView;
      ResponsiveLayout = module.ResponsiveLayout;
    }, function (module) {
      C = module.CombatCore;
      CombatSession = module.CombatSession;
    }, function (module) {
      GraphicsPainter = module.GraphicsPainter;
    }, function (module) {
      hazardLabels = module.hazardLabels;
    }, function (module) {
      incomingThreats = module.incomingThreats;
    }, function (module) {
      renderEnemyHit = module.renderEnemyHit;
      EnemyFeedback = module.EnemyFeedback;
    }, function (module) {
      CovenantStore = module.CovenantStore;
    }, function (module) {
      ProfileStore = module.ProfileStore;
    }, function (module) {
      BackupVault = module.BackupVault;
    }, function (module) {
      BackupPanel = module.BackupPanel;
    }, function (module) {
      CocosAudio = module.CocosAudio;
    }, function (module) {
      SettingsStore = module.SettingsStore;
      ACTIONS = module.ACTIONS;
      SETTING_KEYS = module.SETTING_KEYS;
      ACTION_NAMES = module.ACTION_NAMES;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "4a035z55h1Nla8GzG+3gc+t", "GameBoot", undefined);
      var ccclass = _decorator.ccclass;

      /** Cocos combat migration slice; complete browser product and saves remain separate. */
      var GameBoot = exports('GameBoot', (_dec = ccclass("GameBoot"), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(GameBoot, _Component);
        function GameBoot() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.enemyFeedback = new EnemyFeedback();
          _this.frames = new Map();
          _this.vault = void 0;
          _this.manager = void 0;
          _this.sound = void 0;
          _this.audioMinus = [];
          _this.settings = void 0;
          _this.settingsPanel = void 0;
          _this.settingsButton = void 0;
          _this.settingsTab = "display";
          _this.settingsPage = 0;
          _this.settingsRows = [];
          _this.settingsActions = [];
          _this.settingsTabs = [];
          _this.settingsNav = [];
          _this.lastSystemMotion = false;
          _this.settingsFooter = void 0;
          _this.settingsReset = void 0;
          _this.settingsMessage = "";
          _this.bindingAction = null;
          _this.resetSettingsConfirmed = false;
          _this.controlsHint = void 0;
          _this.coach = new CombatCoach();
          _this.coachText = "";
          _this.controlsText = "";
          _this.routeButtonLabel = void 0;
          _this.mapCloseLabel = void 0;
          _this.fpsLabel = void 0;
          _this.fpsTime = 0;
          _this.fpsFrames = 0;
          _this.keys = new Set();
          _this.controller = new ControllerState();
          _this.responsive = void 0;
          _this.padDevices = new Map();
          _this.padMove = {
            x: 0,
            y: 0
          };
          _this.padScope = null;
          _this.padFocus = null;
          _this.padVisible = false;
          _this.padNotice = "";
          _this.padHint = void 0;
          _this.padButtons = [];
          _this.selected = 0;
          _this.talent = 0;
          _this.ready = false;
          _this.heroes = Object.values(C.HEROES);
          _this.session = null;
          _this.menu = void 0;
          _this.editingNew = false;
          _this.menuChoices = [];
          _this.kitLabels = [];
          _this.kitIcons = [];
          _this.cancelNew = void 0;
          _this.guidePanel = void 0;
          _this.guideTitle = void 0;
          _this.guideBody = void 0;
          _this.guidePage = 0;
          _this.guideBack = void 0;
          _this.guidePause = void 0;
          _this.overlay = void 0;
          _this.battle = void 0;
          /** Visual-only zoom; gameplay canvas and all combat coordinates stay fixed. */
          _this.battleRenderScale = 0.525;
          _this.terrain = void 0;
          _this.actors = void 0;
          _this.ground = void 0;
          _this.front = void 0;
          _this.hazardInk = void 0;
          _this.hazardTexts = [];
          _this.dangerLayout = null;
          _this.title = void 0;
          _this.detail = void 0;
          _this.talentText = void 0;
          _this.hud = void 0;
          _this.build = void 0;
          _this.skillLabel = void 0;
          _this.ultimateLabel = void 0;
          _this.overlayTitle = void 0;
          _this.choiceButtons = [];
          _this.choiceLabels = [];
          _this.resumeButton = void 0;
          _this.portrait = void 0;
          _this.skillIcon = void 0;
          _this.ultimateIcon = void 0;
          _this.pauseDetail = void 0;
          _this.choiceIcons = [];
          _this.weaponIcons = [];
          _this.weaponLabels = [];
          _this.sprites = [];
          _this.lastState = "";
          _this.mode = "chapter";
          _this.stageIndex = 0;
          _this.difficulty = "normal";
          _this.difficultyLabel = void 0;
          _this.journeySummary = void 0;
          _this.modeLabel = void 0;
          _this.stageLabel = void 0;
          _this.interactLabel = void 0;
          _this.routeLabel = void 0;
          _this.mapPanel = void 0;
          _this.mapGraphics = void 0;
          _this.mapLabels = [];
          _this.mapOpen = false;
          _this.miniMap = void 0;
          _this.markers = void 0;
          _this.mapVisible = true;
          _this.worldTexts = [];
          _this.touch = new TouchState();
          _this.directionButtons = [];
          _this.joystick = void 0;
          _this.directionMode = false;
          _this.movementToggle = void 0;
          _this.store = void 0;
          _this.slot = 1;
          _this.slotLabels = [];
          _this.startLabel = void 0;
          _this.saveButton = void 0;
          _this.exitLabel = void 0;
          _this.notice = void 0;
          _this.saveNotice = void 0;
          _this.confirmNew = false;
          _this.newButton = void 0;
          _this.profile = void 0;
          _this.profilePanel = void 0;
          _this.profileTitle = void 0;
          _this.profileSummary = void 0;
          _this.profileNotice = void 0;
          _this.profileRows = [];
          _this.profileIcons = [];
          _this.profileActions = [];
          _this.profileGroupButton = void 0;
          _this.profilePageLabel = void 0;
          _this.profileTab = "talents";
          _this.profilePage = 0;
          _this.profileGroup = 0;
          _this.profileEntries = [];
          _this.profileMessage = "";
          _this.detailsPanel = void 0;
          _this.detailsTitle = void 0;
          _this.detailsBody = void 0;
          _this.detailsFooter = void 0;
          _this.detailsIcon = void 0;
          _this.detailsButton = void 0;
          _this.detailsToggle = void 0;
          _this.detailsClose = void 0;
          _this.detailsPage = 0;
          _this.detailsExit = void 0;
          _this.detailsItems = false;
          _this.detailsPinned = false;
          _this.detailsTabs = [];
          _this.detailsNav = [];
          return _this;
        }
        var _proto = GameBoot.prototype;
        _proto.enemyPose = function enemyPose(e) {
          var _e$walkFrame;
          var ritual = "ritual-" + e.id + "-" + C.ritualActionFrame(e, this.reducedMotion());
          return {
            key: this.frames.has(ritual) ? ritual : this.session.stageId + "-" + C.enemyArchetypeSlot(e.type) + "-" + (this.reducedMotion() ? 1 : (_e$walkFrame = e.walkFrame) != null ? _e$walkFrame : 1),
            x: e.x,
            y: e.y,
            size: e.visualDiameter,
            facing: e.walkFacing === 1 ? -1 : 1
          };
        };
        _proto.observeEnemyFeedback = function observeEnemyFeedback(s) {
          var _s$chapterRoute$curre,
            _this2 = this;
          this.enemyFeedback.observe(s, s.stageId + ":" + s.runMode + ":" + (((_s$chapterRoute$curre = s.chapterRoute.current()) == null ? void 0 : _s$chapterRoute$curre.id) || ""), s.enemies, s.gameTime, this.reducedMotion(), function (e) {
            return _this2.enemyPose(e);
          });
        };
        _proto.onLoad = /*#__PURE__*/function () {
          var _onLoad = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
            var _this3 = this;
            var routeButton, interact, skill, ult, _i, _arr, label, i, _loop, _i2, _arr2, actor, _loop2, _i4, modeButton, stageButton, difficultyButton, startButton, _i5, l, _loop3, _i6, exitButton, _i7, _l, mapClose, _loop4, _i8, _arr4;
            return _regeneratorRuntime().wrap(function _callee2$(_context6) {
              while (1) switch (_context6.prev = _context6.next) {
                case 0:
                  view.setDesignResolutionSize(960, 640, ResolutionPolicy.SHOW_ALL);
                  profiler.hideStats();
                  this.vault = new BackupVault(sys.localStorage);
                  this.store = new CovenantStore(this.vault);
                  this.profile = new ProfileStore(this.store.storage);
                  this.settings = new SettingsStore(this.store.storage);
                  this.battle = this.child("Battle");
                  this.battle.addComponent(UITransform).setContentSize(630, 420);
                  this.battle.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
                  this.terrain = new CocosTerrain(this.battle);
                  this.ground = this.child("Ground", this.battle).addComponent(Graphics);
                  this.actors = this.child("Actors", this.battle);
                  this.front = this.child("Skill effects", this.battle).addComponent(Graphics);
                  this.hazardInk = this.child("Danger annotations", this.battle).addComponent(Graphics);
                  this.miniMap = this.child("Local map").addComponent(Graphics);
                  this.miniMap.node.setPosition(-390, 110);
                  this.markers = this.label("", -390, -55, 13);
                  this.markers.node.getComponent(UITransform).setContentSize(140, 230);
                  this.markers.overflow = Label.Overflow.SHRINK;
                  this.routeLabel = this.label("", 391, 95, 14);
                  this.routeLabel.node.getComponent(UITransform).setContentSize(135, 200);
                  this.routeLabel.overflow = Label.Overflow.SHRINK;
                  routeButton = this.button("M 路线图", 391, -55, function () {
                    return _this3.toggleMap();
                  }, this.node, 132, 46);
                  this.routeButtonLabel = routeButton.getChildByName("Label").getComponent(Label);
                  this.button("收起 / 显示地图", -390, 196, function () {
                    _this3.mapVisible = !_this3.mapVisible;
                  }, this.node, 145, 36);
                  interact = this.button("F 附近交互", 0, -250, function () {
                    return _this3.interact();
                  }, this.node, 182);
                  this.interactLabel = interact.getChildByName("Label").getComponent(Label);
                  this.interactLabel.fontSize = 15;
                  this.hud = this.label("", 80, 273, 20);
                  this.build = this.label("", 0, 235, 16);
                  skill = this.button("E 主动", 200, -250, function () {
                    var _this3$session;
                    return (_this3$session = _this3.session) == null ? void 0 : _this3$session.cast();
                  });
                  this.skillLabel = skill.getChildByName("Label").getComponent(Label);
                  ult = this.button("Q 终极", 388, -250, function () {
                    var _this3$session2;
                    return (_this3$session2 = _this3.session) == null ? void 0 : _this3$session2.cast(true);
                  });
                  this.ultimateLabel = ult.getChildByName("Label").getComponent(Label);
                  this.skillIcon = this.icon(skill, -65, 0, 28);
                  this.ultimateIcon = this.icon(ult, -65, 0, 28);
                  for (_i = 0, _arr = [this.skillLabel, this.ultimateLabel]; _i < _arr.length; _i++) {
                    label = _arr[_i];
                    label.fontSize = 16;
                    label.lineHeight = 23;
                    label.node.setPosition(16, 0);
                  }
                  for (i = 0; i < 6; i++) {
                    this.weaponIcons.push(this.icon(this.node, -432 + i * 146, 235, 24));
                    this.weaponLabels.push(this.label("", -361 + i * 146, 235, 13));
                  }
                  this.button("暂停 / 继续", -350, 273, function () {
                    return _this3.togglePause();
                  }, this.node, 156);
                  this.controlsHint = this.label("WASD 移动 · F 交互 · M 地图 · E / Q 技能 · Esc 暂停", 0, -306, 16);
                  _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop() {
                    var _arr2$_i, text, x, y, dx, dy, b, _i3, _arr3, event;
                    return _regeneratorRuntime().wrap(function _loop$(_context) {
                      while (1) switch (_context.prev = _context.next) {
                        case 0:
                          _arr2$_i = _arr2[_i2], text = _arr2$_i[0], x = _arr2$_i[1], y = _arr2$_i[2], dx = _arr2$_i[3], dy = _arr2$_i[4];
                          b = _this3.button(text, x, y, function () {}, _this3.node, 58, 46);
                          _this3.directionButtons.push({
                            node: b,
                            x: dx,
                            y: dy
                          });
                          b.on(Node.EventType.TOUCH_START, function (e) {
                            var _this3$session3;
                            if (_this3.canTouch(b) && ((_this3$session3 = _this3.session) == null ? void 0 : _this3$session3.state) === C.GameState.PLAYING) _this3.touch.beginMove(e.getID(), dx, dy);
                          });
                          b.on(Node.EventType.TOUCH_MOVE, function (e) {
                            var target = _this3.directionButtons.find(function (_ref) {
                              var node = _ref.node;
                              return _this3.canTouch(node) && node.getComponent(UITransform).hitTest(e.getLocation(), e.windowId);
                            });
                            _this3.touch.move(e.getID(), (target == null ? void 0 : target.x) || 0, (target == null ? void 0 : target.y) || 0);
                          });
                          for (_i3 = 0, _arr3 = [Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL]; _i3 < _arr3.length; _i3++) {
                            event = _arr3[_i3];
                            b.on(event, function (e) {
                              _this3.touch.endMove(e.getID());
                            });
                          }
                        case 6:
                        case "end":
                          return _context.stop();
                      }
                    }, _loop);
                  });
                  _i2 = 0, _arr2 = [["↑", -290, -224, 0, -1], ["←", -354, -275, -1, 0], ["↓", -290, -275, 0, 1], ["→", -226, -275, 1, 0]];
                case 42:
                  if (!(_i2 < _arr2.length)) {
                    _context6.next = 47;
                    break;
                  }
                  return _context6.delegateYield(_loop(), "t0", 44);
                case 44:
                  _i2++;
                  _context6.next = 42;
                  break;
                case 47:
                  this.menu = this.child("Selection");
                  this.panel(this.menu, 900, 600);
                  this.label("无相山海", 0, 244, 40, this.menu);
                  this.label("邪潮 · A10.37 融合详值版", 0, 201, 17, this.menu);
                  actor = this.child("Portrait", this.menu);
                  _loop2 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop2(_i4) {
                    var b, l;
                    return _regeneratorRuntime().wrap(function _loop2$(_context4) {
                      while (1) switch (_context4.prev = _context4.next) {
                        case 0:
                          b = _this3.button("", (_i4 - 2) * 274, 158, function () {
                            _this3.slot = _i4;
                            _this3.editingNew = false;
                            _this3.confirmNew = false;
                            var saved = _this3.store.slots()[_i4 - 1];
                            if (saved) {
                              _this3.selected = Math.max(0, _this3.heroes.findIndex(function (h) {
                                return h.id === saved.selectedHeroId;
                              }));
                              _this3.talent = Math.max(0, _this3.heroes[_this3.selected].talents.findIndex(function (t) {
                                return t.id === saved.selectedHeroTalentId;
                              }));
                              _this3.mode = saved.runMode;
                              _this3.stageIndex = Math.max(0, ["forest", "crypt", "tundra"].indexOf(saved.stageId));
                            }
                            _this3.describe();
                          }, _this3.menu, 258, 46);
                          l = b.getChildByName("Label").getComponent(Label);
                          l.fontSize = 14;
                          l.lineHeight = 18;
                          l.node.getComponent(UITransform).setContentSize(246, 44);
                          l.overflow = Label.Overflow.SHRINK;
                          _this3.slotLabels.push(l);
                        case 7:
                        case "end":
                          return _context4.stop();
                      }
                    }, _loop2);
                  });
                  _i4 = 1;
                case 54:
                  if (!(_i4 <= 3)) {
                    _context6.next = 59;
                    break;
                  }
                  return _context6.delegateYield(_loop2(_i4), "t1", 56);
                case 56:
                  _i4++;
                  _context6.next = 54;
                  break;
                case 59:
                  actor.setPosition(-255, 32);
                  actor.addComponent(UITransform).setContentSize(256, 256);
                  this.portrait = actor.addComponent(Sprite);
                  this.portrait.sizeMode = Sprite.SizeMode.CUSTOM;
                  this.portrait.trim = false;
                  this.title = this.label("正在载入已有像素素材…", 125, 112, 29, this.menu);
                  this.detail = this.label("", 125, 62, 18, this.menu);
                  this.talentText = this.label("", 125, -12, 17, this.menu);
                  this.talentText.node.getComponent(UITransform).setContentSize(420, 90);
                  this.talentText.overflow = Label.Overflow.SHRINK;
                  this.menuChoices.push(this.button("上一位", -307, -131, function () {
                    return _this3.cycle(-1);
                  }, this.menu, 150));
                  this.menuChoices.push(this.button("下一位", -129, -131, function () {
                    return _this3.cycle(1);
                  }, this.menu, 150));
                  this.menuChoices.push(this.button("切换初始天赋", 152, -131, function () {
                    if (_this3.ready) {
                      _this3.talent = (_this3.talent + 1) % 3;
                      _this3.describe();
                    }
                  }, this.menu, 240));
                  modeButton = this.button("", -198, -188, function () {
                    _this3.mode = _this3.mode === "chapter" ? "endless" : "chapter";
                    _this3.describe();
                  }, this.menu, 340, 38);
                  this.modeLabel = modeButton.getChildByName("Label").getComponent(Label);
                  this.menuChoices.push(modeButton);
                  stageButton = this.button("", 198, -188, function () {
                    _this3.stageIndex = (_this3.stageIndex + 1) % 3;
                    _this3.describe();
                  }, this.menu, 340, 38);
                  this.stageLabel = stageButton.getChildByName("Label").getComponent(Label);
                  this.menuChoices.push(stageButton);
                  difficultyButton = this.button("切换难度", 395, -131, function () {
                    _this3.difficulty = difficultyIds[(difficultyIds.indexOf(_this3.difficulty) + 1) % difficultyIds.length];
                    _this3.describe();
                  }, this.menu, 180);
                  this.difficultyLabel = difficultyButton.getChildByName("Label").getComponent(Label);
                  this.menuChoices.push(difficultyButton);
                  this.journeySummary = this.label("", -255, -85, 15, this.menu);
                  startButton = this.button("进入战斗", 0, -244, function () {
                    return _this3.startCombat();
                  }, this.menu, 260, 56);
                  this.startLabel = startButton.getChildByName("Label").getComponent(Label);
                  this.newButton = this.button("重新开始…", 300, -244, function () {
                    if (!_this3.confirmNew) {
                      _this3.editingNew = true;
                      _this3.describe();
                      _this3.confirmNew = true;
                      _this3.notice.string = "再次点击“确认覆盖”才会放弃当前命契；其余两份保留。";
                      _this3.newButton.getChildByName("Label").getComponent(Label).string = "确认覆盖";
                      return;
                    }
                    _this3.confirmNew = false;
                    _this3.startCombat(true);
                  }, this.menu, 210, 48);
                  this.newButton.active = false;
                  this.button("命契管理", -300, -80, function () {
                    return _this3.manager.open();
                  }, this.menu, 180, 42);
                  this.button("设置", 300, -80, function () {
                    return _this3.openSettings();
                  }, this.menu, 180, 42);
                  this.button("命府 · 等级 / 天赋 / 图鉴", 0, -80, function () {
                    return _this3.openProfile();
                  }, this.menu, 360, 42);
                  this.notice = this.label("", 0, -286, 14, this.menu);
                  this.notice.node.getComponent(UITransform).setContentSize(830, 32);
                  for (_i5 = 0; _i5 < 3; _i5++) {
                    l = this.label("", 130, 45 - _i5 * 34, 17, this.menu);
                    this.kitLabels.push(l);
                    this.kitIcons.push(this.icon(l.node, -190, 0, 24));
                  }
                  this.cancelNew = this.button("取消新局配置", -320, -280, function () {
                    return _this3.cancelNewRun();
                  }, this.menu, 210);
                  this.button("操作指南", -320, -210, function () {
                    return _this3.openGuide();
                  }, this.menu, 180);
                  this.notice.overflow = Label.Overflow.SHRINK;
                  this.overlay = this.child("Pause / Upgrade");
                  this.panel(this.overlay, 870, 430);
                  this.overlay.active = false;
                  this.overlayTitle = this.label("", 0, 165, 26, this.overlay);
                  this.pauseDetail = this.label("", 0, 30, 18, this.overlay);
                  this.pauseDetail.node.getComponent(UITransform).setContentSize(780, 220);
                  this.pauseDetail.overflow = Label.Overflow.SHRINK;
                  _loop3 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop3(_i6) {
                    var b;
                    return _regeneratorRuntime().wrap(function _loop3$(_context5) {
                      while (1) switch (_context5.prev = _context5.next) {
                        case 0:
                          b = _this3.button("", 0, 85 - _i6 * 70, function () {
                            _this3.chooseOption(_i6);
                          }, _this3.overlay, 790, 58);
                          _this3.choiceButtons.push(b);
                          _this3.choiceLabels.push(b.getChildByName("Label").getComponent(Label));
                          _this3.choiceLabels[_i6].fontSize = 17;
                          _this3.choiceIcons.push(_this3.icon(b, -361, 0, 36));
                        case 5:
                        case "end":
                          return _context5.stop();
                      }
                    }, _loop3);
                  });
                  _i6 = 0;
                case 104:
                  if (!(_i6 < 3)) {
                    _context6.next = 109;
                    break;
                  }
                  return _context6.delegateYield(_loop3(_i6), "t2", 106);
                case 106:
                  _i6++;
                  _context6.next = 104;
                  break;
                case 109:
                  this.resumeButton = this.button("继续战斗", -180, -163, function () {
                    return _this3.closeOverlay();
                  }, this.overlay, 210);
                  exitButton = this.button("保存并退出", 180, -163, function () {
                    return _this3.toMenu();
                  }, this.overlay, 260);
                  this.exitLabel = exitButton.getChildByName("Label").getComponent(Label);
                  this.saveButton = this.button("保存命契", 0, -111, function () {
                    var _this3$session4;
                    (_this3$session4 = _this3.session) == null || _this3$session4.saveCurrentCovenant();
                    if (_this3.session) _this3.renderOverlay(_this3.session);
                  }, this.overlay, 180, 38);
                  this.detailsButton = this.button("行囊 · 物品详情", 290, -111, function () {
                    return _this3.openDetails();
                  }, this.overlay, 230, 38);
                  this.settingsButton = this.button("设置", -290, -111, function () {
                    return _this3.openSettings();
                  }, this.overlay, 200, 38);
                  this.saveNotice = this.label("", 0, -204, 13, this.overlay);
                  this.guidePause = this.button("操作指南", 0, -57, function () {
                    return _this3.openGuide();
                  }, this.overlay, 210, 44);
                  this.mapPanel = this.child("Route map");
                  this.panel(this.mapPanel, 870, 560);
                  this.label("山海道途 · 当前房高亮", 0, 235, 26, this.mapPanel);
                  this.label("沿方向门前进；已清房可返回。地图打开时暂停。", 0, -196, 16, this.mapPanel);
                  this.mapGraphics = this.child("Connections", this.mapPanel).addComponent(Graphics);
                  for (_i7 = 0; _i7 < 9; _i7++) {
                    _l = this.label("", (_i7 % 3 - 1) * 250, 130 - Math.floor(_i7 / 3) * 125, 16, this.mapPanel);
                    _l.node.getComponent(UITransform).setContentSize(218, 88);
                    _l.overflow = Label.Overflow.SHRINK;
                    this.mapLabels.push(_l);
                  }
                  mapClose = this.button("关闭地图 · M / Esc", 0, -246, function () {
                    return _this3.toggleMap();
                  }, this.mapPanel, 250, 44);
                  this.mapCloseLabel = mapClose.getChildByName("Label").getComponent(Label);
                  this.mapPanel.active = false;
                  this.buildProfilePanel();
                  this.buildDetailsPanel();
                  this.buildSettingsPanel();
                  this.buildGuide();
                  this.manager = new BackupPanel(this);
                  this.fpsLabel = this.label("", 398, 305, 12);
                  this.padHint = this.label("", 0, 310, 12);
                  this.sound = new CocosAudio(this.node);
                  void this.sound.load();
                  this.applySettings();
                  this.joystick = new CocosJoystick(this);
                  this.movementToggle = this.button("使用方向键", -290, -172, function () {
                    _this3.clearInput();
                    _this3.directionMode = !_this3.directionMode;
                    _this3.movementToggle.getChildByName("Label").getComponent(Label).string = _this3.directionMode ? "使用摇杆" : "使用方向键";
                  }, this.node, 156, 48);
                  this.movementToggle.active = false;
                  this.responsive = new ResponsiveLayout(this);
                  input.on(Input.EventType.KEY_DOWN, this.keyDown, this);
                  input.on(Input.EventType.KEY_UP, this.keyUp, this);
                  input.on(Input.EventType.GAMEPAD_CHANGE, this.gamepadEvent, this);
                  input.on(Input.EventType.GAMEPAD_INPUT, this.gamepadEvent, this);
                  game.on(Game.EVENT_HIDE, this.hide, this);
                  globalThis.__cocosCheck = function () {
                    var _this3$manager$pendin, _this3$padScope, _this3$padFocus, _this3$padFocus2, _this3$session5;
                    return {
                      ready: _this3.ready,
                      resources: _this3.frames.size,
                      selection: _this3.heroes[_this3.selected].id,
                      selectedTalent: _this3.heroes[_this3.selected].talents[_this3.talent].id,
                      menu: _this3.menu.active,
                      editingNew: _this3.editingNew,
                      guideOpen: _this3.guidePanel.active,
                      guideText: _this3.guidePanel.active ? _this3.guideBody.string : null,
                      mode: _this3.mode,
                      stage: ["forest", "crypt", "tundra"][_this3.stageIndex],
                      mapOpen: _this3.mapOpen,
                      slot: _this3.slot,
                      slots: _this3.store.slots().map(function (v) {
                        return C.covenantSummary(v);
                      }),
                      saveHealth: _this3.store.health(),
                      profileOpen: _this3.profilePanel.active,
                      profileTab: _this3.profileTab,
                      profilePage: _this3.profilePage,
                      profileGroup: C.COLLECTION_KINDS[_this3.profileGroup],
                      profile: JSON.parse(JSON.stringify(_this3.profile.data)),
                      profileHealth: _this3.profile.code,
                      detailsOpen: _this3.detailsPanel.active,
                      detailsNumbers: _this3.detailsPinned || _this3.keys.has(KeyCode.SHIFT_LEFT) || _this3.keys.has(KeyCode.SHIFT_RIGHT),
                      detailsPage: _this3.detailsPage,
                      detailsText: _this3.detailsPanel.active ? _this3.detailsBody.string : null,
                      settingsOpen: _this3.settingsPanel.active,
                      managerOpen: _this3.manager.node.active,
                      managerPending: ((_this3$manager$pendin = _this3.manager.pending) == null ? void 0 : _this3$manager$pendin.kind) || null,
                      managerMessage: _this3.manager.message,
                      vaultHealth: _this3.vault.code,
                      settings: JSON.parse(JSON.stringify(_this3.settings.data)),
                      settingsHealth: _this3.settings.code,
                      settingsMessage: _this3.settingsMessage,
                      bindingAction: _this3.bindingAction,
                      controller: {
                        id: _this3.controller.id,
                        blocked: _this3.controller.blocked,
                        scope: ((_this3$padScope = _this3.padScope) == null ? void 0 : _this3$padScope.name) || "battle",
                        focus: ((_this3$padFocus = _this3.padFocus) == null || (_this3$padFocus = _this3$padFocus.getChildByName("Label")) == null || (_this3$padFocus = _this3$padFocus.getComponent(Label)) == null ? void 0 : _this3$padFocus.string) || null,
                        focusName: ((_this3$padFocus2 = _this3.padFocus) == null ? void 0 : _this3$padFocus2.name) || null,
                        notice: _this3.padNotice
                      },
                      audio: _this3.sound.snapshot(),
                      layout: _this3.responsive.snapshot(),
                      terrain: _this3.terrain.snapshot(),
                      reducedMotion: _this3.reducedMotion(),
                      engine: "3.8.8",
                      session: ((_this3$session5 = _this3.session) == null ? void 0 : _this3$session5.snapshot()) || null
                    };
                  };
                  _context6.prev = 146;
                  _loop4 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop4() {
                    var group, manifest;
                    return _regeneratorRuntime().wrap(function _loop4$(_context3) {
                      while (1) switch (_context3.prev = _context3.next) {
                        case 0:
                          group = _arr4[_i8];
                          _context3.next = 3;
                          return _this3.load(group + "/manifest", JsonAsset);
                        case 3:
                          manifest = _context3.sent;
                          _context3.next = 6;
                          return Promise.all(manifest.json.files.map( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(file) {
                            var name, texture, frame;
                            return _regeneratorRuntime().wrap(function _callee$(_context2) {
                              while (1) switch (_context2.prev = _context2.next) {
                                case 0:
                                  name = file.filename.replace(/\.png$/, "");
                                  _context2.next = 3;
                                  return _this3.load(group + "/" + name + "/texture", Texture2D);
                                case 3:
                                  texture = _context2.sent;
                                  texture.setFilters(Texture2D.Filter.NEAREST, Texture2D.Filter.NEAREST);
                                  frame = new SpriteFrame();
                                  frame.texture = texture;
                                  _this3.frames.set(name, frame);
                                case 8:
                                case "end":
                                  return _context2.stop();
                              }
                            }, _callee);
                          }))));
                        case 6:
                        case "end":
                          return _context3.stop();
                      }
                    }, _loop4);
                  });
                  _i8 = 0, _arr4 = ["heroes", "enemies", "icons", "world"];
                case 149:
                  if (!(_i8 < _arr4.length)) {
                    _context6.next = 154;
                    break;
                  }
                  return _context6.delegateYield(_loop4(), "t3", 151);
                case 151:
                  _i8++;
                  _context6.next = 149;
                  break;
                case 154:
                  if (!(this.frames.size !== 194)) {
                    _context6.next = 156;
                    break;
                  }
                  throw new Error("英雄、邪物与技能图标未完整加载");
                case 156:
                  this.ready = true;
                  this.describe();
                  void this.terrain.load().then(function () {
                    if (_this3.isValid && _this3.menu.active && _this3.terrain.status === "unavailable") _this3.detail.string += "\n地面素材不可用：已回退基础地面，可继续游玩。";
                  });
                  _context6.next = 166;
                  break;
                case 161:
                  _context6.prev = 161;
                  _context6.t4 = _context6["catch"](146);
                  this.title.string = "素材加载失败";
                  this.detail.string = "请刷新重试；原版不受影响。";
                  console.error(_context6.t4);
                case 166:
                case "end":
                  return _context6.stop();
              }
            }, _callee2, this, [[146, 161]]);
          }));
          function onLoad() {
            return _onLoad.apply(this, arguments);
          }
          return onLoad;
        }();
        _proto.reloadDataStores = function reloadDataStores() {
          this.store = new CovenantStore(this.vault);
          this.profile = new ProfileStore(this.store.storage);
          this.settings = new SettingsStore(this.store.storage);
          this.applySettings();
          this.describe();
        };
        _proto.keyName = function keyName(action) {
          return String.fromCharCode(this.settings.data.bindings[action]);
        };
        _proto.buildGuide = function buildGuide() {
          var _this4 = this;
          this.guidePanel = this.child("操作指南");
          this.panel(this.guidePanel, 870, 560);
          this.guideTitle = this.label("操作指南", 0, 226, 28, this.guidePanel);
          this.guideBody = this.label("", 0, 25, 20, this.guidePanel);
          this.guideBody.node.getComponent(UITransform).setContentSize(760, 330);
          this.guideBody.overflow = Label.Overflow.CLAMP;
          this.guideBody.horizontalAlign = Label.HorizontalAlign.LEFT;
          this.button("上一页", -260, -210, function () {
            return _this4.turnGuide(-1);
          }, this.guidePanel, 180);
          this.button("下一页", 260, -210, function () {
            return _this4.turnGuide(1);
          }, this.guidePanel, 180);
          this.guideBack = this.button("返回", 0, -210, function () {
            return _this4.closeGuide();
          }, this.guidePanel, 180);
          this.guidePanel.active = false;
        };
        _proto.openGuide = function openGuide() {
          if (!this.ready) return;
          if (this.session && this.session.state !== C.GameState.PAUSED) return;
          this.clearInput();
          this.guidePage = 0;
          this.guidePanel.active = true;
          this.turnGuide(0);
        };
        _proto.turnGuide = function turnGuide(delta) {
          var _this5 = this,
            _this$responsive;
          var keys = Object.fromEntries(Object.keys(this.settings.data.bindings).map(function (k) {
            return [k, _this5.keyName(k)];
          }));
          var current = this.menu.active ? null : this.session;
          var pages = guidePages(keys, (current == null ? void 0 : current.runMode) || this.mode, (current == null ? void 0 : current.stageId) || ["forest", "crypt", "tundra"][this.stageIndex], (current == null ? void 0 : current.save.settings.difficulty) || this.difficulty);
          this.guidePage = (this.guidePage + delta + pages.length) % pages.length;
          this.guideTitle.string = pages[this.guidePage].title + " \xB7 " + (this.guidePage + 1) + " / " + pages.length;
          this.guideBody.string = pages[this.guidePage].text;
          (_this$responsive = this.responsive) == null || _this$responsive.readingStart(this.guidePanel);
        };
        _proto.closeGuide = function closeGuide() {
          this.guidePanel.active = false;
          this.clearInput();
        };
        _proto.cancelNewRun = function cancelNewRun() {
          this.editingNew = false;
          this.confirmNew = false;
          this.clearInput();
          this.describe();
        };
        _proto.reducedMotion = function reducedMotion() {
          return this.settings.data.reducedMotion || C.heroPrefersReducedMotion();
        };
        _proto.applySettings = function applySettings() {
          var _this$sound,
            _this6 = this;
          this.coach = new CombatCoach(this.settings.data.hintHistory);
          this.coachText = "";
          (_this$sound = this.sound) == null || _this$sound.mixer.configure(this.settings.data.audio);
          if (this.session) Object.assign(this.session.save.settings, this.settings.data, {
            criticalFlash: false,
            difficulty: this.session.save.settings.difficulty
          });
          this.clearInput();
          this.controlsText = ["up", "left", "down", "right"].map(function (a) {
            return _this6.keyName(a);
          }).join("") + " / \u65B9\u5411\u952E\u79FB\u52A8 \xB7 " + this.keyName("interact") + " \u4EA4\u4E92 \xB7 " + this.keyName("map") + " \u5730\u56FE \xB7 " + this.keyName("skill") + " / " + this.keyName("ultimate") + " \u6280\u80FD \xB7 Esc \u6682\u505C";
          this.controlsHint.string = this.controlsText;
          this.routeButtonLabel.string = this.keyName("map") + " 路线图";
          this.mapCloseLabel.string = "关闭地图 · " + this.keyName("map") + " / Esc";
          this.fpsLabel.node.active = this.settings.data.showFPS;
        };
        _proto.buildSettingsPanel = function buildSettingsPanel() {
          var _this7 = this;
          this.settingsPanel = this.child("设置");
          this.settingsPanel.addComponent(UITransform).setContentSize(960, 640);
          this.settingsPanel.addComponent(BlockInputEvents);
          this.panel(this.settingsPanel, 960, 640);
          this.label("设置 · 显示、声音与操作", 0, 252, 28, this.settingsPanel);
          var _loop5 = function _loop5() {
            var _arr5$_i = _arr5[_i9],
              name = _arr5$_i[0],
              id = _arr5$_i[1],
              x = _arr5$_i[2];
            var b = _this7.button(name, x, 194, function () {
              _this7.settingsTab = id;
              _this7.settingsPage = 0;
              _this7.bindingAction = null;
              _this7.resetSettingsConfirmed = false;
              _this7.renderSettings();
            }, _this7.settingsPanel, 250, 44);
            _this7.settingsTabs.push(b.getChildByName("Label").getComponent(Label));
          };
          for (var _i9 = 0, _arr5 = [["显示与反馈", "display", -280], ["声音", "audio", 0], ["键盘操作", "keys", 280]]; _i9 < _arr5.length; _i9++) {
            _loop5();
          }
          var _loop6 = function _loop6(i) {
            var y = 116 - i * 80,
              l = _this7.label("", -96, y, 18, _this7.settingsPanel);
            l.node.getComponent(UITransform).setContentSize(560, 64);
            l.horizontalAlign = Label.HorizontalAlign.LEFT;
            l.overflow = Label.Overflow.SHRINK;
            _this7.settingsRows.push(l);
            var b = _this7.button("", 315, y, function () {
              return _this7.changeSetting(i);
            }, _this7.settingsPanel, 160, 48);
            _this7.settingsActions.push(b.getChildByName("Label").getComponent(Label));
            _this7.audioMinus.push(_this7.button("减少", 175, y, function () {
              _this7.settingResult(_this7.settings.sound(["muted", "master", "sfx", "music"][i], -20));
              _this7.renderSettings();
            }, _this7.settingsPanel, 64, 48));
          };
          for (var i = 0; i < 4; i++) {
            _loop6(i);
          }
          this.settingsFooter = this.label("", 0, -180, 14, this.settingsPanel);
          this.settingsFooter.node.getComponent(UITransform).setContentSize(800, 44);
          this.settingsFooter.overflow = Label.Overflow.SHRINK;
          var previous = this.button("上一页", -310, -224, function () {
            if (_this7.settingsTab === "audio") {
              _this7.sound.mixer.gesture();
              var played = _this7.sound.mixer.play("bossWarn", true);
              _this7.settingsMessage = played ? "试听首领预警。实际音量还受系统音量与输出设备影响。" : "未播放：请检查静音、总音量、音效音量或音频加载状态。";
              _this7.renderSettings();
              return;
            }
            _this7.settingsPage = 0;
            _this7.bindingAction = null;
            _this7.renderSettings();
          }, this.settingsPanel, 180, 40);
          var reset = this.button("恢复默认", 0, -224, function () {
            if (!_this7.resetSettingsConfirmed) {
              _this7.resetSettingsConfirmed = true;
              _this7.settingsMessage = "再次点击恢复默认；不会删除命契或局外进度。";
            } else {
              _this7.resetSettingsConfirmed = false;
              _this7.settingResult(_this7.settings.reset());
            }
            _this7.renderSettings();
          }, this.settingsPanel, 260, 40);
          this.settingsReset = reset.getChildByName("Label").getComponent(Label);
          var next = this.button("下一页", 310, -224, function () {
            if (_this7.settingsTab !== "audio") _this7.settingsPage = 1;
            _this7.bindingAction = null;
            _this7.renderSettings();
          }, this.settingsPanel, 180, 40);
          this.settingsNav = [previous, next];
          this.button("返回 · Esc", -175, -273, function () {
            return _this7.closeSettings();
          }, this.settingsPanel, 300, 40);
          this.button("重读本地设置", 175, -273, function () {
            _this7.bindingAction = null;
            _this7.resetSettingsConfirmed = false;
            var ok = _this7.settings.reload();
            if (ok) _this7.applySettings();
            _this7.settingsMessage = ok ? "已重新读取本地设置。" : "读取失败：保留当前设置，未覆盖原记录。";
            _this7.renderSettings();
          }, this.settingsPanel, 300, 40);
          this.settingsPanel.active = false;
        };
        _proto.openSettings = function openSettings() {
          var _this$session;
          if (this.detailsPanel.active || this.profilePanel.active || this.mapOpen) return;
          (_this$session = this.session) == null || _this$session.pause();
          this.sound.mixer.mode(false);
          this.sound.mixer.stopEffects();
          this.clearInput();
          this.settingsTab = "display";
          this.settingsPage = 0;
          this.bindingAction = null;
          this.resetSettingsConfirmed = false;
          this.settingsMessage = "";
          this.settingsPanel.active = true;
          this.overlay.active = false;
          this.renderSettings();
        };
        _proto.closeSettings = function closeSettings() {
          this.sound.mixer.stopEffects();
          this.settingsPanel.active = false;
          this.bindingAction = null;
          this.resetSettingsConfirmed = false;
          this.clearInput();
          if (this.session) this.renderOverlay(this.session);
        };
        _proto.settingResult = function settingResult(ok) {
          if (ok) this.applySettings();
          this.settingsMessage = ok ? "已保存并应用；不改变本局战斗数值。" : "保存失败，新设置未生效。原设置保留，请重试或返回。";
        };
        _proto.changeSetting = function changeSetting(i) {
          this.resetSettingsConfirmed = false;
          if (this.settingsTab === "keys") {
            this.bindingAction = ACTIONS[this.settingsPage * 4 + i];
            this.settingsMessage = "请按 A–Z 中的一个字母；Esc 取消，重复键会被拒绝。";
          } else if (this.settingsTab === "audio") {
            this.settingResult(this.settings.sound(["muted", "master", "sfx", "music"][i]));
          } else if (this.settingsPage === 1 && i === 1) {
            this.settingResult(this.settings.rememberHints([]));
          } else this.settingResult(this.settings.toggle(SETTING_KEYS[this.settingsPage * 4 + i]));
          this.renderSettings();
        };
        _proto.renderSettings = function renderSettings() {
          var _this8 = this;
          this.settingsNav[0].active = this.settingsTab !== "audio" && this.settingsPage === 1 || this.settingsTab === "audio";
          this.settingsNav[0].getChildByName("Label").getComponent(Label).string = this.settingsTab === "audio" ? "试听预警" : "上一页";
          this.settingsNav[1].active = this.settingsTab !== "audio" && this.settingsPage === 0;
          var names = ["减少动效", "伤害数字", "轮廓辅助", "显示 FPS", "战场操作提示", "重新显示提示"],
            copy = ["固定角色与邪物姿态，保留真实危险范围。", "显示伤害和恢复数值；关闭不影响实际效果。", "为人物与敌人标记稳定边缘，不使用闪白。", "每秒更新实际渲染帧率，非原生性能认证。", "按当前情境简短提示，不暂停、不遮挡操作。", "清除已读提示记录；不改变命契、物品或成长。"];
          this.settingsTabs.forEach(function (l, i) {
            return l.color = new Color(["display", "audio", "keys"][i] === _this8.settingsTab ? "#eed493" : "#c9d4c2");
          });
          for (var i = 0; i < 4; i++) {
            var isAudio = this.settingsTab === "audio";
            var displayIndex = this.settingsPage * 4 + i;
            var visible = this.settingsTab !== "display" || displayIndex < names.length;
            this.settingsRows[i].node.active = visible;
            this.settingsActions[i].node.parent.active = visible;
            this.audioMinus[i].active = isAudio && i > 0;
            this.settingsRows[i].node.getComponent(UITransform).setContentSize(isAudio ? 460 : 560, 64);
            if (this.settingsTab === "keys") {
              var index = this.settingsPage * 4 + i,
                action = ACTIONS[index];
              this.settingsRows[i].string = ACTION_NAMES[index] + "\n当前按键 " + this.keyName(action);
              this.settingsActions[i].string = this.bindingAction === action ? "等待按键…" : "更改";
            } else if (isAudio) {
              var a = this.settings.data.audio,
                key = ["muted", "master", "sfx", "music"][i];
              this.settingsRows[i].string = ["全部静音\n保留音量值，取消静音后恢复。", "\u603B\u97F3\u91CF " + a.master + "%\n\u5171\u540C\u63A7\u5236\u97F3\u6548\u4E0E\u97F3\u4E50\u3002", "\u97F3\u6548 " + a.sfx + "%\n\u6B66\u5668\u3001\u53D7\u51FB\u3001\u62FE\u53D6\u548C\u9996\u9886\u9884\u8B66\u3002", "\u97F3\u4E50 " + a.music + "%\n0% \u5173\u95ED\uFF1B\u4EC5\u6218\u6597\u4E2D\u5FAA\u73AF\u3002"][i];
              this.settingsActions[i].string = i === 0 ? a.muted ? "已静音" : "声音开启" : a[key] === 100 ? "已最大" : "增加";
            } else {
              this.settingsRows[i].string = visible ? names[displayIndex] + "\n" + copy[displayIndex] : "";
              this.settingsActions[i].string = displayIndex === 5 ? "重新提示" : this.settings.data[SETTING_KEYS[displayIndex]] ? "已开启" : "已关闭";
            }
          }
          this.settingsFooter.string = this.settingsMessage || (!["ok", "recovered"].includes(this.settings.code) ? "设置读取异常，使用页内配置；可重读本地，不会清空命契。" : this.settingsTab === "audio" ? this.sound.status === "ready" ? "声音就绪 · 暂停/后台停音；试听不会恢复战斗。" : this.sound.status === "loading" ? "音频加载中；不阻止游玩。稍后重新进入此页查看。" : "音频加载失败，当前静音游玩；刷新可重试，存档不受影响。" : this.settingsTab === "keys" ? "\u7B2C " + (this.settingsPage + 1) + " / 2 \u9875 \xB7 Esc \u6682\u505C / \u8FD4\u56DE\uFF0CShift \u8BE6\u503C\u30011\u20133 \u9009\u62E9\u548C\u65B9\u5411\u952E\u4FDD\u7559\u3002" : C.heroPrefersReducedMotion() ? "系统已启用减少动效，优先于游戏开关；返回后仍保持暂停。" : "\u663E\u793A\u7B2C " + (this.settingsPage + 1) + " / 2 \u9875 \xB7 \u63D0\u793A\u53EF\u5173\u95ED\uFF0C\u8FD4\u56DE\u540E\u4ECD\u4FDD\u6301\u6682\u505C\u3002");
          this.settingsFooter.color = new Color(this.settings.code === "write-failed" ? "#edaa92" : "#c9d4c2");
          if (C.heroPrefersReducedMotion()) this.settingsFooter.string += "\n系统减少动效已开启，优先于游戏开关。";
          this.settingsReset.string = this.resetSettingsConfirmed ? "确认恢复默认" : "恢复默认";
        };
        _proto.buildDetailsPanel = function buildDetailsPanel() {
          var _this9 = this;
          this.detailsPanel = this.child("行囊详情");
          this.detailsPanel.addComponent(UITransform).setContentSize(960, 640);
          this.detailsPanel.addComponent(BlockInputEvents);
          this.panel(this.detailsPanel, 900, 590);
          this.label("行囊 · 外界时间静止", 0, 252, 28, this.detailsPanel);
          var attributesTab = this.button("人物属性", -235, 202, function () {
            _this9.detailsItems = false;
            _this9.detailsPage = 0;
            _this9.renderDetails();
          }, this.detailsPanel, 230, 42);
          var itemsTab = this.button("功法 / 装备 / 天赋", 120, 202, function () {
            _this9.detailsItems = true;
            _this9.detailsPage = 0;
            _this9.renderDetails();
          }, this.detailsPanel, 360, 42);
          this.detailsTabs = [attributesTab, itemsTab].map(function (n) {
            return n.getChildByName("Label").getComponent(Label);
          });
          this.detailsTitle = this.label("", 25, 153, 22, this.detailsPanel);
          this.detailsTitle.node.getComponent(UITransform).setContentSize(720, 40);
          this.detailsTitle.overflow = Label.Overflow.SHRINK;
          this.detailsIcon = this.icon(this.detailsPanel, -390, 153, 44);
          this.detailsBody = this.label("", 0, -15, 18, this.detailsPanel);
          this.detailsBody.node.getComponent(UITransform).setContentSize(760, 292);
          this.detailsBody.horizontalAlign = Label.HorizontalAlign.LEFT;
          this.detailsBody.lineHeight = 29;
          this.detailsBody.overflow = Label.Overflow.SHRINK;
          this.detailsFooter = this.label("", 0, -188, 14, this.detailsPanel);
          var previous = this.button("上一项", -305, -224, function () {
            return _this9.turnDetails(-1);
          }, this.detailsPanel, 180, 40);
          var toggle = this.button("", 0, -224, function () {
            _this9.detailsPinned = !_this9.detailsPinned;
            _this9.renderDetails();
          }, this.detailsPanel, 350, 40);
          this.detailsToggle = toggle.getChildByName("Label").getComponent(Label);
          var next = this.button("下一项", 305, -224, function () {
            return _this9.turnDetails(1);
          }, this.detailsPanel, 180, 40);
          this.detailsNav = [previous, next];
          var close = this.button("返回暂停 · Esc", -175, -273, function () {
            return _this9.closeDetails();
          }, this.detailsPanel, 300, 40);
          this.detailsClose = close.getChildByName("Label").getComponent(Label);
          var detailsExit = this.button("保存并返回菜单", 175, -273, function () {
            _this9.closeDetails();
            _this9.toMenu();
          }, this.detailsPanel, 300, 40);
          this.detailsExit = detailsExit.getChildByName("Label").getComponent(Label);
          this.detailsPanel.active = false;
        };
        _proto.openDetails = function openDetails() {
          var s = this.session;
          if (!s || ![C.GameState.PAUSED, C.GameState.BUILD_CHOICE, C.GameState.GAMEOVER].includes(s.state)) return;
          this.detailsItems = false;
          this.detailsPage = 0;
          this.detailsPinned = false;
          this.clearInput();
          this.detailsPanel.active = true;
          this.overlay.active = false;
          this.renderDetails();
        };
        _proto.closeDetails = function closeDetails() {
          this.detailsPanel.active = false;
          this.detailsPinned = false;
          this.clearInput();
          if (this.session) this.renderOverlay(this.session);
        };
        _proto.detailsModel = function detailsModel() {
          var s = this.session;
          if (!s) return {
            attributes: [],
            cards: []
          };
          s.save.collection = this.profile.data.collection;
          var model = C.buildPauseCodex(s);
          for (var _iterator = _createForOfIteratorHelperLoose(s.runMetaTalents || []), _step; !(_step = _iterator()).done;) {
            var id = _step.value;
            var def = C.META_TALENTS[id];
            if (def) model.cards.push({
              category: "局外天赋",
              artId: s.player.heroId,
              artKind: "hero",
              name: def.name,
              level: "本局开局装配",
              lore: "命府留下的前尘，随行者带入这一场试炼。",
              effect: def.branch + "\u8DEF\u7EBF\u5929\u8D4B\uFF1B\u672C\u5C40\u4FDD\u6301\u5F00\u5C40\u65F6\u7684\u6548\u679C\uFF0C\u4E0D\u968F\u547D\u5E9C\u540E\u7EED\u88C5\u914D\u6539\u53D8\u3002",
              attackMode: "被动生效；复起次数等消耗以人物当前属性为准，不会读档补回。",
              numbers: def.description
            });
          }
          return model;
        };
        _proto.turnDetails = function turnDetails(direction) {
          if (!this.detailsItems) return;
          var count = this.detailsModel().cards.length;
          if (count) this.detailsPage = (this.detailsPage + direction + count) % count;
          this.renderDetails();
        };
        _proto.renderDetails = function renderDetails() {
          var _this$detailsPanel,
            _this10 = this;
          if (!((_this$detailsPanel = this.detailsPanel) != null && _this$detailsPanel.active) || !this.session) return;
          var model = this.detailsModel(),
            numbers = this.detailsPinned || this.keys.has(KeyCode.SHIFT_LEFT) || this.keys.has(KeyCode.SHIFT_RIGHT);
          this.detailsExit.string = this.session.state === C.GameState.GAMEOVER ? "返回菜单" : "保存并返回菜单";
          this.detailsToggle.string = numbers ? "详值已展开 · 点击切换" : "按住 Shift / 点击查看详值";
          this.detailsTabs.forEach(function (label, index) {
            return label.color = new Color(index === 1 === _this10.detailsItems ? "#eed493" : "#c9d4c2");
          });
          this.detailsNav.forEach(function (node) {
            return node.active = _this10.detailsItems && model.cards.length > 1;
          });
          this.detailsClose.string = this.session.state === C.GameState.GAMEOVER ? "返回结算 · Esc" : this.session.state === C.GameState.BUILD_CHOICE ? "返回抉择 · Esc" : "返回暂停 · Esc";
          this.detailsIcon.node.active = false;
          if (!this.detailsItems) {
            this.detailsTitle.string = "人物属性 · 当前构筑";
            this.detailsBody.string = model.attributes.map(function (a) {
              return a.name + " · " + (numbers ? a.numbers : a.summary);
            }).join("\n");
            this.detailsFooter.string = "物品页包含当前持有的武器、功法、遗物、诅咒与融合。";
            return;
          }
          this.detailsPage = Math.min(this.detailsPage, Math.max(0, model.cards.length - 1));
          var item = model.cards[this.detailsPage];
          if (!item) {
            this.detailsTitle.string = "尚无记录";
            this.detailsBody.string = "探索与成长后，已获得的物品会在这里显示。";
            return;
          }
          this.detailsTitle.string = item.category + " · " + item.name;
          this.detailsBody.string = numbers ? "\u5177\u4F53\u6570\u503C\n" + (item.numbers || "无独立数值") + "\n\n\u653B\u51FB / \u751F\u6548\u65B9\u5F0F\n" + (item.attackMode || "被动生效") : "\u4E16\u754C\u80CC\u666F\n" + (item.lore || "来历尚待探索") + "\n\n\u4F5C\u7528\u529F\u6548\n" + (item.effect || "见当前属性") + "\n\n\u653B\u51FB / \u751F\u6548\u65B9\u5F0F\n" + (item.attackMode || "被动生效");
          this.detailsIcon.spriteFrame = item.artKind === "hero" ? this.frames.get(item.artId + "-walk-1") : this.frames.get(item.artKind + "-" + item.artId);
          this.detailsIcon.node.active = !!this.detailsIcon.spriteFrame;
          this.detailsFooter.string = this.detailsPage + 1 + " / " + model.cards.length + " \xB7 " + (item.level || "") + " \xB7 \u2190 / \u2192 \u5207\u6362\u7269\u54C1";
        };
        _proto.buildProfilePanel = function buildProfilePanel() {
          var _this11 = this;
          this.profilePanel = this.child("命府");
          this.panel(this.profilePanel, 900, 590);
          this.profileTitle = this.label("命府 · 三命契共享", 0, 254, 28, this.profilePanel);
          this.profileSummary = this.label("", 0, 207, 18, this.profilePanel);
          this.button("局外天赋", -260, 153, function () {
            _this11.profileTab = "talents";
            _this11.profilePage = 0;
            _this11.profileMessage = "";
            _this11.renderProfile();
          }, this.profilePanel, 180, 44);
          this.button("图鉴与融合", -50, 153, function () {
            _this11.profileTab = "codex";
            _this11.profilePage = 0;
            _this11.profileMessage = "";
            _this11.renderProfile();
          }, this.profilePanel, 180, 44);
          this.profileGroupButton = this.button("", 240, 153, function () {
            _this11.profileGroup = (_this11.profileGroup + 1) % C.COLLECTION_KINDS.length;
            _this11.profilePage = 0;
            _this11.renderProfile();
          }, this.profilePanel, 290, 44);
          var _loop7 = function _loop7(i) {
            var y = 65 - i * 91,
              icon = _this11.child("Catalogue icon", _this11.profilePanel);
            icon.setPosition(-380, y);
            icon.addComponent(UITransform).setContentSize(48, 48);
            _this11.profileIcons.push(icon.addComponent(Sprite));
            var row = _this11.label("", -88, y, 16, _this11.profilePanel);
            row.node.getComponent(UITransform).setContentSize(525, 82);
            row.overflow = Label.Overflow.SHRINK;
            row.horizontalAlign = Label.HorizontalAlign.LEFT;
            row.lineHeight = 23;
            _this11.profileRows.push(row);
            _this11.profileActions.push(_this11.button("", 300, y, function () {
              return _this11.actProfile(i);
            }, _this11.profilePanel, 190, 48));
          };
          for (var i = 0; i < 3; i++) {
            _loop7(i);
          }
          this.button("上一页", -300, -206, function () {
            return _this11.turnProfile(-1);
          }, this.profilePanel, 180, 44);
          this.profilePageLabel = this.label("", 0, -206, 16, this.profilePanel);
          this.button("下一页", 300, -206, function () {
            return _this11.turnProfile(1);
          }, this.profilePanel, 180, 44);
          this.profileNotice = this.label("", 0, -238, 14, this.profilePanel);
          this.profileNotice.node.getComponent(UITransform).setContentSize(820, 25);
          this.profileNotice.overflow = Label.Overflow.SHRINK;
          this.button("返回选人 · Esc", -155, -273, function () {
            return _this11.closeProfile();
          }, this.profilePanel, 260, 40);
          this.button("重读本地记录", 155, -273, function () {
            _this11.profile.reload();
            _this11.profileMessage = "";
            _this11.renderProfile();
          }, this.profilePanel, 260, 40);
          this.profilePanel.active = false;
        };
        _proto.openProfile = function openProfile() {
          if (!this.ready || !this.menu.active) return;
          this.menu.active = false;
          this.profilePanel.active = true;
          this.profileMessage = "";
          this.renderProfile();
          this.clearInput();
        };
        _proto.closeProfile = function closeProfile() {
          this.profilePanel.active = false;
          this.menu.active = true;
          this.clearInput();
          this.describe();
        };
        _proto.turnProfile = function turnProfile(direction) {
          var pages = Math.max(1, Math.ceil(this.profileEntries.length / (this.profileTab === "talents" ? 3 : 1)));
          this.profilePage = (this.profilePage + direction + pages) % pages;
          this.renderProfile();
        };
        _proto.actProfile = function actProfile(index) {
          if (this.profileTab !== "talents") return;
          var def = this.profileEntries[this.profilePage * 3 + index];
          if (!def) return;
          var owned = this.profile.data.meta.purchasedTalents.includes(def.id),
            result = this.profile.talent(def.id);
          var errors = {
            storage: "保存失败，未扣命砂或更改装备；请重试。",
            locked: "尚未达到该天赋的解锁等级。",
            currency: "命砂不足，继续试炼积累。",
            slots: "最多装备 3 个天赋，请先卸下一个。",
            unowned: "请先购买天赋。"
          };
          this.profileMessage = result.ok ? owned ? result.equipped ? "已装备，下次新局生效。" : "已卸下，下次新局生效。" : "已购买；再点“装备”才会用于新局。" : errors[result.reason] || "操作未完成。";
          this.renderProfile();
        };
        _proto.renderProfile = function renderProfile() {
          var _this12 = this;
          var meta = this.profile.data.meta,
            talents = this.profileTab === "talents";
          var pageSize = talents ? 3 : 1;
          var names = {
            heroes: "行者",
            monsters: "邪物",
            weapons: "武器",
            passives: "功法",
            relics: "遗物",
            curses: "诅咒",
            fusions: "融合",
            reactions: "反应",
            events: "事件"
          };
          var group = C.COLLECTION_KINDS[this.profileGroup];
          this.profileTitle.string = talents ? "命府 · 局外天赋" : "山海图鉴 · 三命契共享";
          this.profileSummary.string = "\u7B49\u7EA7 " + meta.level + " / " + C.META_LEVEL_CAP + " \xB7 \u9605\u5386 " + meta.xp + " / " + C.metaXpForNext(meta.level) + " \xB7 \u547D\u7802 " + meta.currency + " \xB7 \u5929\u8D4B " + meta.equippedTalents.length + " / 3";
          this.profileGroupButton.active = !talents;
          this.profileGroupButton.getChildByName("Label").getComponent(Label).string = "切换分类：" + names[group];
          this.profileEntries = talents ? Object.values(C.META_TALENTS) : C.collectionView(this.profile.data).find(function (g) {
            return g.kind === group;
          }).entries;
          this.profilePage = Math.min(this.profilePage, Math.max(0, Math.ceil(this.profileEntries.length / pageSize) - 1));
          this.profilePageLabel.string = this.profilePage + 1 + " / " + Math.max(1, Math.ceil(this.profileEntries.length / pageSize)) + " \xB7 \u2190 / \u2192 \u7FFB\u9875";
          var icons = {
            tempered_body: "passive-max_hp",
            spirit_purse: "relic-coin_sword_tassel",
            paper_rebirth: "relic-paper_heart",
            warding_bone: "passive-armor",
            blood_contract: "passive-hungry_soul",
            echo_weapon: "weapon-whip",
            mirror_thorns: "relic-bone_mirror",
            swift_star: "passive-star_step",
            void_focus: "passive-ritual_focus"
          };
          var _loop8 = function _loop8() {
            var d = i < pageSize ? _this12.profileEntries[_this12.profilePage * pageSize + i] : null,
              row = _this12.profileRows[i],
              button = _this12.profileActions[i],
              icon = _this12.profileIcons[i];
            row.node.active = !!d;
            button.active = !!d && talents;
            icon.node.active = !!d;
            if (!d) return 1; // continue
            row.node.setPosition(talents ? -88 : 10, talents ? 65 - i * 91 : 0);
            row.node.getComponent(UITransform).setContentSize(talents ? 525 : 670, talents ? 82 : 250);
            row.fontSize = talents ? 16 : 20;
            row.lineHeight = talents ? 23 : 32;
            var frame;
            if (talents) {
              var owned = meta.purchasedTalents.includes(d.id),
                equipped = meta.equippedTalents.includes(d.id),
                locked = meta.level < d.unlockLevel;
              var action = equipped ? "卸下" : owned ? "装备" : locked ? "\u7B49\u7EA7 " + d.unlockLevel + " \u89E3\u9501" : "\u8D2D\u4E70 \xB7 " + d.cost + " \u547D\u7802";
              button.getChildByName("Label").getComponent(Label).string = action;
              row.string = d.name + " \xB7 " + d.branch + " \xB7 " + (equipped ? "已装备" : owned ? "已拥有" : locked ? "未解锁" : "可购买") + "\n" + d.description + "\n\u7B49\u7EA7 " + d.unlockLevel + " \u89E3\u9501 \xB7 " + d.cost + " \u547D\u7802 \xB7 \u5DF2\u6709\u547D\u5951\u4E0D\u53D7\u6539\u52A8";
              row.color = new Color(equipped ? "#eed493" : locked ? "#b6c5b0" : "#e2e6cf");
              frame = icons[d.id];
            } else {
              var _Object$values$find;
              row.string = d.name + " \xB7 " + (d.obtained ? "已发现" : "未发现") + "\n" + (d.description || d.role || d.condition || "随探索记录于山海。") + (d.recipe ? "\n" + (group === "fusions" ? "融合条件：" : "可融合：") + d.recipe : "") + (d.heroId ? "\n专属行者：" + C.getHero(d.heroId).name : "");
              row.color = new Color(d.obtained ? "#eed493" : "#b6c5b0");
              frame = ({
                weapons: "weapon-",
                passives: "passive-",
                relics: "relic-"
              }[group] || "") + d.id;
              if (group === "fusions") {
                var _d$requirements;
                var requirement = (_d$requirements = d.requirements) == null ? void 0 : _d$requirements.find(function (r) {
                  return r.kind === "weapon";
                });
                frame = "weapon-" + (requirement == null ? void 0 : requirement.id);
              }
              if (group === "monsters") frame = /^(forest|crypt|tundra)_\d$/.test(d.id) ? d.id.replace("_", "-") + "-0" : "ritual-" + d.id + "-0";
              if (group === "heroes") row.string += "\n\u521D\u59CB\u6B66\u5668\uFF1A" + ((_Object$values$find = Object.values(C.WEAPONS).find(function (w) {
                return w.id === d.startingWeapon;
              })) == null ? void 0 : _Object$values$find["name"]) + "\n\u4E3B\u52A8\uFF1A" + d.skillName + " \xB7 \u7EC8\u5F0F\uFF1A" + d.ultimateName + "\n" + d.talentDescription;
            }
            icon.spriteFrame = group === "heroes" && !talents ? _this12.frames.get(d.id + "-walk-1") : _this12.frames.get(frame);
            icon.node.active = !!icon.spriteFrame;
          };
          for (var i = 0; i < 3; i++) {
            if (_loop8()) continue;
          }
          this.profileNotice.string = !["ok", "recovered"].includes(this.profile.code) ? "命府存储异常：操作未入账，请重试或重读本地记录，暂勿关闭。" : this.profileMessage || (this.profile.recovered ? "已回退有效备份，进度可能回退；请检查后继续。" : talents ? "命砂用于永久购买，最多携带 3 个天赋；装备只影响新局，不叠加到旧档。" : "未发现条目也可查看配方，实际获得后才点亮；不同命契共同记录。");
        };
        _proto.child = function child(name, parent) {
          if (parent === void 0) {
            parent = this.node;
          }
          var n = new Node(name);
          n.layer = this.node.layer;
          parent.addChild(n);
          return n;
        };
        _proto.icon = function icon(parent, x, y, size) {
          var n = this.child("Pixel icon", parent);
          n.setPosition(x, y);
          n.addComponent(UITransform).setContentSize(size, size);
          var s = n.addComponent(Sprite);
          s.sizeMode = Sprite.SizeMode.CUSTOM;
          return s;
        };
        _proto.label = function label(text, x, y, size, parent) {
          if (parent === void 0) {
            parent = this.node;
          }
          var n = this.child("Label", parent);
          n.setPosition(x, y);
          var l = n.addComponent(Label);
          l.string = text;
          l.fontSize = size;
          l.lineHeight = size + 8;
          l.color = new Color(226, 230, 207);
          return l;
        };
        _proto.panel = function panel(parent, w, h) {
          var g = this.child("Panel", parent).addComponent(Graphics);
          g.node.getComponent(UITransform).setContentSize(w, h);
          g.fillColor = new Color(22, 32, 29, 255);
          g.rect(-w / 2, -h / 2, w, h);
          g.fill();
          g.strokeColor = new Color(110, 134, 108);
          g.lineWidth = 1;
          g.rect(-w / 2, -h / 2, w, h);
          g.stroke();
          g.node.addComponent(PanelInk);
        };
        _proto.button = function button(text, x, y, action, parent, w, h) {
          var _this13 = this;
          if (parent === void 0) {
            parent = this.node;
          }
          if (w === void 0) {
            w = 170;
          }
          if (h === void 0) {
            h = 52;
          }
          var n = this.child(text || "Choice", parent);
          n.setPosition(x, y);
          n.addComponent(UITransform).setContentSize(w, h);
          this.panel(n, w, h);
          this.label(text, 0, 0, 18, n);
          var ring = this.child("ControllerFocus", n);
          var ink = ring.addComponent(Graphics);
          ink.strokeColor = new Color("#eed493");
          ink.lineWidth = 3;
          ink.rect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);
          ink.stroke();
          ring.active = false;
          this.padButtons.push({
            node: n,
            action: action,
            ring: ring
          });
          var press = this.child("TouchPress", n);
          var pressInk = press.addComponent(Graphics);
          pressInk.strokeColor = new Color("#eed493");
          pressInk.lineWidth = 3;
          pressInk.rect(-w / 2, -h / 2, w, h);
          pressInk.stroke();
          press.getComponent(UITransform).setContentSize(w, h);
          press.active = false;
          n.on(Node.EventType.TOUCH_START, function (e) {
            if (_this13.canTouch(n)) _this13.touch.beginPress(e.getID(), n.uuid);
          });
          n.on(Node.EventType.TOUCH_MOVE, function (e) {
            if (!n.getComponent(UITransform).hitTest(e.getLocation(), e.windowId)) _this13.touch.cancelPress(e.getID(), n.uuid);
          });
          n.on(Node.EventType.TOUCH_CANCEL, function (e) {
            _this13.touch.cancelPress(e.getID(), n.uuid);
          });
          n.on(Node.EventType.TOUCH_END, function (e) {
            var _this13$sound;
            if (!_this13.touch.endPress(e.getID(), n.uuid, _this13.canTouch(n))) return;
            _this13.padVisible = false;
            (_this13$sound = _this13.sound) == null || _this13$sound.mixer.gesture();
            action();
          });
          return n;
        };
        _proto.canTouch = function canTouch(n) {
          var scope = this.controllerScope();
          return n.activeInHierarchy && (scope ? n.isChildOf(scope) : n.parent === this.node);
        };
        _proto.load = function load(path, type) {
          return new Promise(function (resolve, reject) {
            return resources.load(path, type, function (e, a) {
              return e ? reject(e) : resolve(a);
            });
          });
        };
        _proto.describe = function describe() {
          var _this14 = this;
          this.confirmNew = false;
          var slots = this.store.slots(),
            health = this.store.health();
          var saved = slots[this.slot - 1];
          if (saved && !this.editingNew) {
            this.selected = Math.max(0, this.heroes.findIndex(function (h) {
              return h.id === saved.selectedHeroId;
            }));
            this.talent = Math.max(0, this.heroes[this.selected].talents.findIndex(function (t) {
              return t.id === saved.selectedHeroTalentId;
            }));
            this.mode = saved.runMode;
            this.difficulty = difficultyIds.includes(saved.cocosDifficulty) ? saved.cocosDifficulty : "normal";
            this.stageIndex = Math.max(0, ["forest", "crypt", "tundra"].indexOf(saved.stageId));
          }
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.menuChoices), _step2; !(_step2 = _iterator2()).done;) {
            var n = _step2.value;
            n.active = !saved || this.editingNew;
          }
          this.cancelNew.active = !!saved && this.editingNew;
          for (var i = 0; i < 3; i++) {
            var summary = C.covenantSummary(slots[i]);
            this.slotLabels[i].string = (this.slot === i + 1 ? "● " : "") + "命契" + (i + 1) + " · " + summary.title + "\n" + summary.detail;
            this.slotLabels[i].color = new Color(this.slot === i + 1 ? "#eed493" : "#c9d4c2");
          }
          this.startLabel.string = slots[this.slot - 1] ? "继续命契" + this.slot : "开始命契" + this.slot;
          this.newButton.active = !!slots[this.slot - 1];
          this.newButton.getChildByName("Label").getComponent(Label).string = this.editingNew ? "准备覆盖此命契" : "重新开始…";
          this.notice.string = !["ok", "recovered"].includes(health.code) ? "本地存储不可用或记录损坏；写入失败会保留本次进度，请勿直接关闭。" : health.recovered ? "已读取上一份有效备份，进度可能回退；原异常记录会保留。" : slots[this.slot - 1] ? this.editingNew ? "正在配置新局；确认覆盖前旧进度保留。点击继续仍恢复原命契。" : "已保存的角色与地图如下。继续恢复旧局；重新开始才修改新局选项。" : "三份局内进度互不覆盖 · 当前为此浏览器 / 此设备本地保存";
          var h = this.heroes[this.selected],
            t = h.talents[this.talent];
          this.modeLabel.string = this.mode === "chapter" ? "切换模式：章节道途" : "切换模式：无尽大荒";
          this.stageLabel.string = "切换主题：" + Object.values(C.STAGES)[this.stageIndex].name;
          this.difficultyLabel.string = "难度：" + difficultyLabel(this.difficulty);
          this.journeySummary.string = Object.values(C.STAGES)[this.stageIndex].name + "\n" + (this.mode === "chapter" ? "章节道途" : "无尽大荒") + " · " + difficultyLabel(this.difficulty);
          this.title.string = h.name;
          this.detail.string = h.epithet + "\n" + h.role;
          if (this.terrain.status === "unavailable") this.detail.string += "\n地面素材不可用：已回退基础地面，可继续游玩。";
          this.talentText.string = t.name + "\n" + t.description;
          this.portrait.spriteFrame = this.frames.get(h.id + "-walk-1");
          heroKit(h.id).forEach(function (entry, i) {
            _this14.kitLabels[i].string = entry.text;
            _this14.kitIcons[i].spriteFrame = _this14.frames.get(entry.icon);
          });
        };
        _proto.cycle = function cycle(delta) {
          if (!this.ready || !this.menu.active) return;
          if (this.store.slots()[this.slot - 1] && !this.editingNew) return;
          this.selected = (this.selected + delta + 4) % 4;
          this.talent = 0;
          this.describe();
        };
        _proto.startCombat = function startCombat(fresh) {
          var _this15 = this;
          if (fresh === void 0) {
            fresh = false;
          }
          if (!this.ready || !this.menu.active) return;
          var saved = fresh ? null : this.store.slots()[this.slot - 1];
          var maxSerial = Math.max.apply(Math, [0].concat(this.store.slots().map(function (s) {
            return Number.isSafeInteger(s == null ? void 0 : s.cocosRunSerial) ? s.cocosRunSerial : 0;
          })));
          if (!this.profile.ensureSerial(maxSerial)) {
            this.notice.string = "命府存储异常，旧命契保留。请进入命府重读本地记录后重试。";
            return;
          }
          if (saved != null && saved.cocosRunSerial && this.profile.isSettled(this.slot, saved.cocosRunSerial)) {
            if (this.store.write(this.slot, null)) {
              this.describe();
              this.notice.string = "这份命契已结算入账，旧续玩记录已关闭。";
            } else this.notice.string = "结算已入账，但关闭旧命契失败；请重试。";
            return;
          }
          var serial = (saved == null ? void 0 : saved.cocosRunSerial) || this.profile.allocate();
          if (!serial) {
            this.notice.string = "命府保存失败，未开始新局。进入命府重读或重试；旧命契保留。";
            return;
          }
          var h = saved ? C.getHero(saved.selectedHeroId) : this.heroes[this.selected];
          this.session = new CombatSession(h.id, (saved == null ? void 0 : saved.selectedHeroTalentId) || h.talents[this.talent].id, {
            mode: (saved == null ? void 0 : saved.runMode) || this.mode,
            stage: (saved == null ? void 0 : saved.stageId) || ["forest", "crypt", "tundra"][this.stageIndex],
            difficulty: this.difficulty,
            snapshot: saved,
            store: this.store,
            slot: this.slot,
            profile: this.profile,
            serial: serial
          });
          this.applySettings();
          var _loop9 = function _loop9() {
            var id = _Object$keys[_i10];
            _this15.session.audio[id] = function () {
              return _this15.sound.mixer.play(id);
            };
          };
          for (var _i10 = 0, _Object$keys = Object.keys(this.session.audio); _i10 < _Object$keys.length; _i10++) {
            _loop9();
          }
          if (saved != null && saved.cocosCompletion) this.session.finishCovenant();else if ((!saved || !saved.cocosRunSerial) && !this.session.saveCurrentCovenant()) this.session.pause();
          this.menu.active = false;
          this.editingNew = false;
          this.lastState = this.session.state;
          this.clearInput();
          this.renderOverlay(this.session);
        };
        _proto.toMenu = function toMenu() {
          var s = this.session;
          if (s) {
            if (s.state === C.GameState.LEVEL_UP) return;
            var done = s.state === C.GameState.GAMEOVER;
            if (!done) s.pause();
            var saved = done ? s.finishCovenant() : s.saveCurrentCovenant();
            if (!saved) {
              s.saveMessage = "保存失败，仍留在本局。请重试，暂勿刷新或关闭。";
              s.saveFailed = true;
              this.clearInput();
              this.renderOverlay(s);
              return;
            }
          }
          this.mapOpen = false;
          this.detailsPanel.active = false;
          this.mapPanel.active = false;
          this.session = null;
          this.sound.mixer.mode(false);
          this.sound.mixer.stopEffects();
          this.sound.music.stop();
          this.menu.active = true;
          this.overlay.active = false;
          this.clearInput();
          this.describe();
        };
        _proto.gamepadEvent = function gamepadEvent(event) {
          var d = event.gamepad;
          if (d.connected) this.padDevices.set(d.deviceId, d);else this.padDevices["delete"](d.deviceId);
        };
        _proto.controllerScope = function controllerScope() {
          for (var _i11 = 0, _arr6 = [(_this$manager = this.manager) == null ? void 0 : _this$manager.node, this.guidePanel, this.settingsPanel, this.detailsPanel, this.profilePanel, this.mapPanel, this.menu, this.overlay]; _i11 < _arr6.length; _i11++) {
            var _this$manager;
            var n = _arr6[_i11];
            if (n != null && n.activeInHierarchy) return n;
          }
          return null;
        };
        _proto.pollController = function pollController(dt) {
          var _this16 = this,
            _this$responsive2;
          var scope = this.controllerScope();
          if (scope !== this.padScope) {
            this.padScope = scope;
            this.padFocus = null;
            this.controller.block();
          }
          var devices = [];
          for (var _i12 = 0, _Array$from = Array.from(this.padDevices.values()); _i12 < _Array$from.length; _i12++) {
            var d = _Array$from[_i12];
            if (!d.connected) continue;
            try {
              var stick = d.leftStick.getValue(),
                arrows = d.dpad.getValue();
              var value = function value(button) {
                return ((button == null ? void 0 : button.getValue()) || 0) > 0.5;
              };
              devices.push({
                id: d.deviceId,
                x: arrows.x || stick.x,
                y: -(arrows.y || stick.y),
                buttons: {
                  confirm: value(d.buttonSouth),
                  back: value(d.buttonEast),
                  skill: value(d.buttonWest),
                  ultimate: value(d.buttonNorth),
                  previous: value(d.buttonL1),
                  next: value(d.buttonR1),
                  map: value(d.buttonShare),
                  pause: value(d.buttonOptions) || value(d.buttonStart)
                }
              });
            } catch (_unused) {
              /* A missing/unreadable active device follows disconnect safety. */
            }
          }
          var frame = this.controller.step(devices, dt);
          this.padMove = {
            x: frame.x,
            y: frame.y
          };
          if (frame.lost) {
            var _this$session2;
            (_this$session2 = this.session) == null || _this$session2.pause();
            this.clearInput();
            if (this.session) this.renderOverlay(this.session);
            this.padNotice = "手柄已断开 · 战斗已暂停，请重新连接或用键鼠手动继续";
          }
          if (frame.actions.length || frame.x || frame.y) {
            var _game$canvas, _this$sound2;
            // Cocos Web keyboard events target the canvas, not document/window.
            // A controller-only start must still allow a later keyboard takeover.
            if (!this.padVisible && sys.isBrowser) (_game$canvas = game.canvas) == null || _game$canvas.focus({
              preventScroll: true
            });
            this.padVisible = true;
            this.padNotice = "";
            (_this$sound2 = this.sound) == null || _this$sound2.mixer.gesture();
          }
          var buttons = this.padButtons.filter(function (b) {
            return b.node.activeInHierarchy && !!scope && b.node.isChildOf(scope);
          });
          if (!buttons.some(function (b) {
            return b.node === _this16.padFocus;
          })) {
            var _this$startLabel, _buttons$find, _buttons$;
            var preferred = scope === this.menu ? (_this$startLabel = this.startLabel) == null ? void 0 : _this$startLabel.node.parent : scope === this.overlay ? this.resumeButton : null;
            this.padFocus = ((_buttons$find = buttons.find(function (b) {
              return b.node === preferred;
            })) == null ? void 0 : _buttons$find.node) || ((_buttons$ = buttons[0]) == null ? void 0 : _buttons$.node) || null;
          }
          // One UI action per frame; a held confirm never selects the next modal too.
          for (var _iterator3 = _createForOfIteratorHelperLoose(frame.actions), _step3; !(_step3 = _iterator3()).done;) {
            var _this$session3;
            var action = _step3.value;
            if (action === "back" || action === "pause") {
              this.keyDown({
                keyCode: KeyCode.ESCAPE
              });
              this.keyUp({
                keyCode: KeyCode.ESCAPE
              });
              this.padVisible = true;
              break;
            }
            if (scope) {
              if (this.bindingAction) break; // Keyboard rebinding deliberately needs a keyboard; B cancels.
              var i = buttons.findIndex(function (b) {
                return b.node === _this16.padFocus;
              });
              if (action === "confirm" && i >= 0) {
                if (this.padFocus.name === "选择备份文件") this.padNotice = "系统文件选择器需要鼠标/触摸点击「选择备份文件」";else buttons[i].action();
                break;
              }
              if ((action === "next" || action === "previous") && buttons.length) this.padFocus = buttons[(i + (action === "next" ? 1 : -1) + buttons.length) % buttons.length].node;
              if (["up", "down", "left", "right"].includes(action) && i >= 0) {
                var positions = buttons.map(function (b) {
                  return {
                    node: b.node,
                    x: b.node.worldPosition.x,
                    y: b.node.worldPosition.y
                  };
                });
                this.padFocus = neighbour(positions, positions[i], action).node;
              }
            } else if (((_this$session3 = this.session) == null ? void 0 : _this$session3.state) === C.GameState.PLAYING) {
              if (action === "confirm") this.interact();
              if (action === "skill") this.session.cast();
              if (action === "ultimate") this.session.cast(true);
              if (action === "map") this.toggleMap();
              if (["confirm", "skill", "ultimate", "map"].includes(action)) break;
            }
          }
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.padButtons), _step4; !(_step4 = _iterator4()).done;) {
            var b = _step4.value;
            b.ring.active = this.padVisible && this.controller.id !== null && b.node === this.padFocus && scope === this.controllerScope();
          }
          this.padHint.string = this.padNotice || (this.controller.id === null ? "" : this.controller.blocked ? "手柄就绪 · 请先松开所有按键与摇杆" : this.bindingAction ? "改键需要键盘输入 · B 取消" : scope ? "手柄：方向/摇杆选择 · A 确认 · B 返回 · LB / RB 遍历选项" : "手柄：左摇杆移动 · A 交互 · X / Y 技能 · View 地图 · Start 暂停");
          this.padHint.node.setSiblingIndex(this.node.children.length - 1);
          if (this.padVisible) (_this$responsive2 = this.responsive) == null || _this$responsive2.followFocus(this.padFocus);
        };
        _proto.clearInput = function clearInput() {
          var _this$joystick, _this$session4;
          this.controller.block();
          this.padMove = {
            x: 0,
            y: 0
          };
          this.keys.clear();
          this.touch.clear();
          (_this$joystick = this.joystick) == null || _this$joystick.clear();
          (_this$session4 = this.session) == null || _this$session4.setMove(0, 0);
        };
        _proto.togglePause = function togglePause() {
          if (this.settingsPanel.active) {
            this.closeSettings();
            return;
          }
          if (!this.session) return;
          if (this.detailsPanel.active) {
            this.closeDetails();
            return;
          }
          if (this.mapOpen) {
            this.toggleMap();
            return;
          }
          if (this.session.state === C.GameState.INTERACTION) {
            this.closeOverlay();
            return;
          }
          if (this.session.state === C.GameState.PLAYING) this.session.pause();else this.session.resume();
          this.clearInput();
          this.lastState = this.session.state;
          this.renderOverlay(this.session);
        };
        _proto.hide = function hide() {
          var _this$session5;
          this.sound.mixer.hide();
          (_this$session5 = this.session) == null || _this$session5.pause();
          if (this.session && !this.session.pendingLevelUps) this.session.saveCurrentCovenant();
          this.clearInput();
          this.renderDetails();
          if (this.settingsPanel.active) {
            this.bindingAction = null;
            this.settingsMessage = "已暂停并清空按住状态；返回后手动继续。";
            this.renderSettings();
          }
        };
        _proto.keyDown = function keyDown(event) {
          var _this$sound3, _this$session6, _this$session7;
          // The native MOBILE_BACK signal is distinct from desktop Escape.
          // Android OS/gesture delivery is verified separately from this UI route.
          // Reuse the same modal/paused navigation without mutating the input event.
          if (event.keyCode === KeyCode.MOBILE_BACK) event = new EventKeyboard(KeyCode.ESCAPE, Input.EventType.KEY_DOWN);
          this.padVisible = false;
          (_this$sound3 = this.sound) == null || _this$sound3.mixer.gesture();
          if (this.keys.has(event.keyCode)) return;
          this.keys.add(event.keyCode);
          if (this.guidePanel.active) {
            if (event.keyCode === KeyCode.ESCAPE) this.closeGuide();
            if (event.keyCode === KeyCode.ARROW_LEFT) this.turnGuide(-1);
            if (event.keyCode === KeyCode.ARROW_RIGHT) this.turnGuide(1);
            return;
          }
          if (this.manager.node.active) {
            if (event.keyCode === KeyCode.ESCAPE) this.manager.close();
            return;
          }
          if (this.settingsPanel.active) {
            if (event.keyCode === KeyCode.ESCAPE) {
              if (this.bindingAction) {
                this.bindingAction = null;
                this.settingsMessage = "已取消改键。";
                this.renderSettings();
              } else this.closeSettings();
              return;
            }
            if (this.bindingAction) {
              var result = this.settings.bind(this.bindingAction, event.keyCode);
              if (result === "ok") {
                this.bindingAction = null;
                this.settingResult(true);
              } else if (result === "conflict") this.settingsMessage = "该按键已用于其他动作，请选另一个字母。";else if (result === "unsupported") this.settingsMessage = "仅可绑定 A–Z；Esc / Shift / 数字 / 方向键保留。";else {
                this.bindingAction = null;
                this.settingResult(false);
              }
              this.renderSettings();
            }
            return;
          }
          if (this.detailsPanel.active) {
            if (event.keyCode === KeyCode.ESCAPE) this.closeDetails();
            if (event.keyCode === KeyCode.ARROW_LEFT) this.turnDetails(-1);
            if (event.keyCode === KeyCode.ARROW_RIGHT) this.turnDetails(1);
            if (event.keyCode === KeyCode.SHIFT_LEFT || event.keyCode === KeyCode.SHIFT_RIGHT) this.renderDetails();
            return;
          }
          if (this.profilePanel.active) {
            if (event.keyCode === KeyCode.ESCAPE) this.closeProfile();
            if (event.keyCode === KeyCode.ARROW_LEFT) this.turnProfile(-1);
            if (event.keyCode === KeyCode.ARROW_RIGHT) this.turnProfile(1);
            return;
          }
          if (this.menu.active) {
            if (event.keyCode === KeyCode.ESCAPE && this.editingNew) this.cancelNewRun();
            if (event.keyCode === KeyCode.KEY_H) this.cycle(1);
            if (event.keyCode === KeyCode.ENTER) this.startCombat();
            return;
          }
          if (event.keyCode === KeyCode.ESCAPE) this.togglePause();
          if (event.keyCode === this.settings.data.bindings.map) this.toggleMap();
          if (event.keyCode === this.settings.data.bindings.interact) this.interact();
          if (event.keyCode === this.settings.data.bindings.skill) (_this$session6 = this.session) == null || _this$session6.cast();
          if (event.keyCode === this.settings.data.bindings.ultimate) (_this$session7 = this.session) == null || _this$session7.cast(true);
          if (event.keyCode >= KeyCode.DIGIT_1 && event.keyCode <= KeyCode.DIGIT_3) {
            this.chooseOption(event.keyCode - KeyCode.DIGIT_1);
          }
        };
        _proto.keyUp = function keyUp(event) {
          if (event.keyCode === KeyCode.MOBILE_BACK) event = new EventKeyboard(KeyCode.ESCAPE, Input.EventType.KEY_UP);
          this.keys["delete"](event.keyCode);
          if (event.keyCode === KeyCode.SHIFT_LEFT || event.keyCode === KeyCode.SHIFT_RIGHT) this.renderDetails();
        };
        _proto.lateUpdate = function lateUpdate() {
          var _this$responsive3,
            _this$joystick2,
            _this17 = this;
          (_this$responsive3 = this.responsive) == null || _this$responsive3.tick();
          this.refreshInteractionVisibility();
          (_this$joystick2 = this.joystick) == null || _this$joystick2.draw();
          var _loop10 = function _loop10() {
            var node = _step5.value.node;
            var mark = node.getChildByName("TouchPress");
            if (!mark) return 1; // continue
            var direction = _this17.directionButtons.find(function (d) {
              return d.node === node;
            });
            mark.active = _this17.canTouch(node) && (_this17.touch.pressed(node.uuid) || !!direction && _this17.touch.moving(direction.x, direction.y));
            if (mark.active) {
              var ui = node.getComponent(UITransform),
                own = mark.getComponent(UITransform);
              if (own.width !== ui.width || own.height !== ui.height) {
                own.setContentSize(ui.width, ui.height);
                var g = mark.getComponent(Graphics);
                g.clear();
                g.rect(-ui.width / 2, -ui.height / 2, ui.width, ui.height);
                g.stroke();
              }
            }
          };
          for (var _iterator5 = _createForOfIteratorHelperLoose(this.padButtons), _step5; !(_step5 = _iterator5()).done;) {
            if (_loop10()) continue;
          }
        };
        _proto.update = function update(dt) {
          var _this$sound4,
            _this$sound5,
            _this18 = this;
          if (this.ready) this.pollController(dt);
          (_this$sound4 = this.sound) == null || _this$sound4.mixer.tick(dt);
          var systemMotion = C.heroPrefersReducedMotion();
          if (systemMotion !== this.lastSystemMotion) {
            this.lastSystemMotion = systemMotion;
            if (this.settingsPanel.active) this.renderSettings();
          }
          if (Number.isFinite(dt) && dt > 0) {
            this.fpsTime += dt;
            this.fpsFrames++;
            if (this.fpsTime >= 1) {
              this.fpsLabel.string = Math.round(this.fpsFrames / this.fpsTime) + " FPS";
              this.fpsTime = 0;
              this.fpsFrames = 0;
            }
          }
          var s = this.session;
          (_this$sound5 = this.sound) == null || _this$sound5.mixer.mode(!!s && s.state === C.GameState.PLAYING);
          if (!s || !this.ready) {
            this.enemyFeedback.reset();
            return;
          }
          var touch = this.touch.vector;
          s.setMove(Number(this.keys.has(this.settings.data.bindings.right) || this.keys.has(KeyCode.ARROW_RIGHT)) - Number(this.keys.has(this.settings.data.bindings.left) || this.keys.has(KeyCode.ARROW_LEFT)) + touch.x + this.padMove.x, Number(this.keys.has(this.settings.data.bindings.down) || this.keys.has(KeyCode.ARROW_DOWN)) - Number(this.keys.has(this.settings.data.bindings.up) || this.keys.has(KeyCode.ARROW_UP)) + touch.y + this.padMove.y);
          if (!s.direction.x && !s.direction.y && this.joystick.node.active) {
            var value = this.joystick.state.value;
            s.setMove(value.x, value.y, true);
          }
          var hp = s.player.hp,
            level = s.player.level,
            state = s.state;
          this.observeEnemyFeedback(s);
          s.update(dt);
          this.observeEnemyFeedback(s);
          this.sound.mixer.mode(s.state === C.GameState.PLAYING);
          if (s.player.hp < hp) this.sound.mixer.play("damage");
          if (s.player.level > level || state !== C.GameState.LEVEL_UP && s.state === C.GameState.LEVEL_UP) this.sound.mixer.play("levelUp", true);
          if (state !== C.GameState.GAMEOVER && s.state === C.GameState.GAMEOVER) this.sound.mixer.play(s.player.dead ? "death" : "achievement", true);
          this.refreshInteractionVisibility();
          this.renderBattle(s);
          this.renderNavigation(s);
          var a = s.heroSkills.getSnapshot();
          var coaching = this.settings.data.contextHints !== false;
          var id = coaching ? this.coach.step({
            time: s.gameTime,
            playing: s.state === C.GameState.PLAYING && !this.controllerScope(),
            x: s.player.x,
            y: s.player.y,
            collected: s.run.orbsCollected || 0,
            level: s.player.level,
            orbs: s.expOrbs.length,
            enemies: s.enemies.length,
            near: !!s.interactions.nearby && !s.interactions.nearby.used,
            interacting: !!s.activeInteraction,
            roomReady: s.runMode === "chapter" && s.chapterRoute.roomReady,
            skillReady: a.skillReady,
            ultimateReady: a.ultimateReady
          }) : null;
          if (!coaching) this.coach.suspend();
          var learned = this.coach.historyChange();
          if (coaching && learned) this.settings.rememberHints(learned);
          this.coachText = id ? coachCopy(id, this.controller.id !== null ? "pad" : this.responsive.compact ? "touch" : "keys", Object.fromEntries(Object.keys(this.settings.data.bindings).map(function (k) {
            return [k, _this18.keyName(k)];
          }))) : "";
          this.controlsHint.string = this.coachText || this.controlsText;
          this.controlsHint.node.active = !this.controllerScope() && (!this.responsive.compact || !!this.coachText);
          this.hud.string = this.responsive.compact ? healthText(s.player.hp, s.player.maxHp) + " \u547D\nLv." + s.player.level : healthText(s.player.hp, s.player.maxHp) + " \u547D     Lv." + s.player.level + "     " + Math.floor(s.gameTime) + " \u79D2     " + s.kills + " \u65A9     " + s.runCoins + " \u94DC\u94B1";
          this.build.string = "";
          for (var i = 0; i < 6; i++) {
            var w = s.player.weapons[i];
            this.weaponIcons[i].node.active = !!w;
            this.weaponLabels[i].string = w ? w.name + " " + w.level : "";
            if (w) this.weaponIcons[i].spriteFrame = this.frames.get("weapon-" + w.id);
          }
          this.skillIcon.spriteFrame = this.frames.get("skill-" + a.skillIcon);
          this.ultimateIcon.spriteFrame = this.frames.get("fusion-" + a.skillIcon + "_ultimate");
          this.skillLabel.string = this.keyName("skill") + " " + a.skillName + "\n" + skillCooldownText(a.skillCooldown, a.skillReady);
          this.ultimateLabel.string = this.keyName("ultimate") + " " + a.ultimateName + "\n" + a.ultimateEnergy + " / 100";
          if (this.lastState !== s.state) {
            this.lastState = s.state;
            this.clearInput();
            this.renderOverlay(s);
          }
        };
        _proto.interact = function interact() {
          var _this$session8;
          if ((_this$session8 = this.session) != null && _this$session8.interact()) {
            this.clearInput();
            this.renderOverlay(this.session);
          }
        };
        _proto.chooseOption = function chooseOption(index) {
          var s = this.session;
          if (!s || this.mapOpen || this.detailsPanel.active || this.settingsPanel.active) return;
          var changed = s.state === C.GameState.INTERACTION ? s.resolveInteraction(index) : s.state === C.GameState.MILESTONE ? s.checkpoint(index === 0 ? "continue" : index === 1 ? "settle" : "") : s.state === C.GameState.BUILD_CHOICE ? s.chooseBuild(index) : s.choose(index);
          if (changed) {
            this.clearInput();
            this.lastState = s.state;
            this.renderOverlay(s);
          }
        };
        _proto.closeOverlay = function closeOverlay() {
          var s = this.session;
          if (!s) return;
          if (s.state === C.GameState.INTERACTION) s.closeWorldInteraction();else s.resume();
          this.clearInput();
          this.lastState = s.state;
          this.renderOverlay(s);
        };
        _proto.toggleMap = function toggleMap() {
          var s = this.session;
          if (!s) return;
          if (this.mapOpen) {
            this.mapOpen = false;
            this.mapPanel.active = false;
            s.resume();
            this.clearInput();
            this.lastState = s.state;
            this.renderOverlay(s);
            return;
          }
          if (s.state !== C.GameState.PLAYING) return;
          s.pause();
          this.clearInput();
          this.mapOpen = true;
          this.mapPanel.active = true;
          this.overlay.active = false;
          this.lastState = s.state;
          this.mapGraphics.clear();
          var g = this.mapGraphics,
            grid = s.chapterRoute.mapModel().grid;
          for (var i = 0; i < 9; i++) {
            var node = s.runMode === "chapter" ? grid[Math.floor(i / 3)][i % 3] : null,
              l = this.mapLabels[i];
            l.string = node ? node.id + " " + node.name + "\n" + (node.state === "current" ? "所在房间" : node.state === "cleared" ? "已清除" : node.label) + (node.killTarget ? " · " + node.killTarget + " 目标" : "") : i === 4 && s.runMode === "endless" ? "无尽大荒无固定房间路线\n使用左侧关键物地图探索" : "";
            if (!node) continue;
            var x = (i % 3 - 1) * 250,
              y = 130 - Math.floor(i / 3) * 125;
            g.strokeColor = new Color(node.state === "current" ? "#e4cc8b" : "#637c6b");
            g.lineWidth = 2;
            g.rect(x - 114, y - 49, 228, 98);
            g.stroke();
            var _loop11 = function _loop11() {
              var target = _Object$values[_i13];
              var other = grid.flat().find(function (v) {
                return (v == null ? void 0 : v.id) === target;
              });
              if (!other) return 1; // continue
              var tx = (other.gridX - 1) * 250,
                ty = 130 - other.gridY * 125;
              g.moveTo(x + (tx - x) * 0.46, y + (ty - y) * 0.4);
              g.lineTo(x + (tx - x) * 0.54, y + (ty - y) * 0.6);
              g.stroke();
            };
            for (var _i13 = 0, _Object$values = Object.values(node.links || {}); _i13 < _Object$values.length; _i13++) {
              if (_loop11()) continue;
            }
          }
        };
        _proto.renderOverlay = function renderOverlay(s) {
          var _this$detailsPanel2, _this$settingsPanel, _s$activeInteraction;
          if (s.state !== C.GameState.PLAYING) {
            this.coachText = "";
            this.controlsHint.node.active = false;
          }
          this.guidePause.active = s.state === C.GameState.PAUSED;
          var level = s.state === C.GameState.LEVEL_UP,
            buildChoice = s.state === C.GameState.BUILD_CHOICE,
            interaction = s.state === C.GameState.INTERACTION,
            milestone = s.state === C.GameState.MILESTONE,
            dead = s.state === C.GameState.GAMEOVER;
          this.overlay.active = !this.mapOpen && !((_this$detailsPanel2 = this.detailsPanel) != null && _this$detailsPanel2.active) && !((_this$settingsPanel = this.settingsPanel) != null && _this$settingsPanel.active) && s.state !== C.GameState.PLAYING;
          if (!this.overlay.active) return;
          this.saveButton.active = !level && !dead;
          this.detailsButton.active = s.state === C.GameState.PAUSED || buildChoice || dead;
          this.settingsButton.active = s.state === C.GameState.PAUSED || buildChoice;
          this.exitLabel.node.parent.active = !level;
          this.exitLabel.string = dead ? "返回菜单" : "保存并退出";
          this.saveNotice.string = buildChoice && !s.saveFailed ? "时间静止 · 请选择一项，或保存退出；退出不会刷新本次选项。" : s.saveMessage || "每 15 秒自动保存；手动保存成功后可安全退出";
          this.saveNotice.color = new Color(s.saveFailed ? "#edaa92" : "#bacdb7");
          this.saveNotice.node.getComponent(UITransform).setContentSize(800, 22);
          this.saveNotice.overflow = Label.Overflow.SHRINK;
          this.overlayTitle.string = level ? "悟道 · 三选一（1 / 2 / 3）" : buildChoice ? "异变抉择 · 三选一（1 / 2 / 3）" : interaction ? ((_s$activeInteraction = s.activeInteraction) == null ? void 0 : _s$activeInteraction.name) + " · 时间静止" : milestone ? "三劫已渡 · 结算或继续无尽" : dead ? (s.outcome ? "此行告捷" : "此行结束") + " · " + s.kills + " 斩 / " + Math.floor(s.gameTime) + " 秒" : "已暂停 · 外界时间静止";
          this.resumeButton.active = !level && !dead && !milestone && !buildChoice;
          this.resumeButton.getChildByName("Label").getComponent(Label).string = interaction ? "关闭 · 继续探索" : "继续战斗";
          this.pauseDetail.node.active = !level && !interaction && !milestone && !buildChoice;
          var h = C.getHero(s.player.heroId),
            t = h.talents.find(function (v) {
              return v.id === s.player.heroTalentId;
            });
          this.pauseDetail.string = h.name + " · " + h.role + "\n" + t.name + "：" + t.description + "\n生命 " + healthText(s.player.hp, s.player.maxHp) + " · 伤害倍率 " + s.player.getDamageMult().toFixed(2) + "\n向下滚动查看构筑与操作；详解见行囊。\n\n" + pauseLoadout(s.player, Array.from(s.buildSystem.relics).map(function (id) {
            var _C$RELICS$id;
            return ((_C$RELICS$id = C.RELICS[id]) == null ? void 0 : _C$RELICS$id.name) || id;
          })) + "\n\n" + "命契" + this.slot + "独立保存；旧浏览器原型存档不受影响。";
          if (dead && s.metaReward) {
            var r = s.metaReward;
            this.pauseDetail.string = "\u672C\u6B21\u547D\u7802 +" + r.currency + " \xB7 \u9605\u5386 +" + r.xp + "\n\u5171\u4EAB\u7B49\u7EA7 " + this.profile.data.meta.level + " / " + C.META_LEVEL_CAP + " \xB7 \u547D\u7802 " + this.profile.data.meta.currency + "\n\u8868\u73B0 " + r.score + " / \u95E8\u69DB " + r.threshold + " \xB7 " + (r.qualified ? "已达标" : "未达标，命砂为 0") + "\n\u672C\u65E5\u540C\u56FE\u7B2C " + r.repeatIndex + " \u6B21 \xB7 \u6536\u76CA " + Math.round(r.repeatMultiplier * 100) + "% \xB7 \u5355\u5C40\u547D\u7802\u4E0A\u9650 30\n\u4E09\u4EFD\u547D\u5951\u5171\u4EAB\u6210\u957F\uFF1B\u8FD4\u56DE\u547D\u5E9C\u53EF\u8D2D\u4E70\u5E76\u88C5\u5907\u5929\u8D4B\u3002";
          }
          if (dead) this.pauseDetail.string += "\n" + C.damageRecap(s);
          for (var i = 0; i < 3; i++) {
            var _s$buildChoice;
            var c = level ? s.choices[i] : buildChoice ? (_s$buildChoice = s.buildChoice) == null ? void 0 : _s$buildChoice.choices[i] : interaction ? s._interactionOptions[i] : milestone ? [{
              name: "继续无尽",
              description: "继续迎战更强时间首领。"
            }, {
              name: "结算本次远征",
              description: "按表现结算共享命砂与阅历；未达门槛不发命砂。"
            }][i] : null;
            this.choiceButtons[i].active = !!c;
            if (!c) continue;
            var data = level ? c.data : c;
            this.choiceLabels[i].string = i + 1 + ". " + data.name + (data.price != null ? " · " + data.price + " 铜钱" : "") + (data.disabled ? " · 不可选" : "") + "\n" + (data.description || data.desc || "装备后自动生效") + (data.meta ? " · " + data.meta : "");
            this.choiceLabels[i].color = new Color(data.disabled ? "#889486" : "#e2e6cf");
            this.choiceLabels[i].node.setPosition(25, 0);
            this.choiceLabels[i].node.getComponent(UITransform).setContentSize(680, 54);
            this.choiceLabels[i].overflow = Label.Overflow.SHRINK;
            this.choiceIcons[i].spriteFrame = level ? this.frames.get(c.type + "-" + data.id) || null : buildChoice ? this.frames.get(s.buildChoice.kind + "-" + data.id) || null : this.frames.get(data.artKind + "-" + data.artId) || null;
          }
        };
        _proto.refreshInteractionVisibility = function refreshInteractionVisibility() {
          var s = this.session,
            near = s == null ? void 0 : s.interactions.nearby;
          if (!this.interactLabel || !this.responsive) return;
          this.interactLabel.node.parent.active = contextInteractionVisible(this.responsive.compact, (s == null ? void 0 : s.state) === C.GameState.PLAYING && !this.controllerScope(), !!near && !near.used);
        };
        _proto.renderNavigation = function renderNavigation(s) {
          var room = s.chapterRoute.current(),
            near = s.interactions.nearby;
          this.interactLabel.string = this.keyName("interact") + (near ? " " + near.name : " 附近暂无交互");
          this.routeLabel.string = s.runMode === "chapter" ? room.id + " " + room.name + "\n\n" + (s.chapterRoute.roomReady ? "房间已清除\n沿方向门前进" : room.type === "boss" ? "击败守关首领" : s.chapterRoute.roomKills + " / " + room.killTarget + " 斩") : "无尽大荒\n\n下次时间首领\n" + Math.max(0, Math.ceil((s.endlessRun.nextDefinition(s.stageId).spawnAt || 0) - s.gameTime)) + " 秒";
          var g = this.miniMap;
          g.clear();
          this.markers.node.active = this.mapVisible;
          if (!this.mapVisible) return;
          var p = s.player,
            objects = s.interactions.objects.filter(function (o) {
              return !o.used;
            }).concat(s.enemies.filter(function (e) {
              return e.boss && e.hp > 0;
            }).map(function (e) {
              return {
                x: e.x,
                y: e.y,
                name: e.type.name,
                kind: "boss",
                expiresAt: Infinity
              };
            })),
            scale = s.runMode === "chapter" ? 120 / s.arenaWidth : 0.045;
          g.fillColor = new Color("#101b18");
          g.rect(-66, -64, 132, 128);
          g.fill();
          g.strokeColor = new Color("#637c6b");
          g.rect(-66, -64, 132, 128);
          g.stroke();
          var map = function map(x, y) {
            return [Math.max(-59, Math.min(59, (x - p.x) * scale)), Math.max(-56, Math.min(56, -(y - p.y) * scale))];
          };
          for (var _iterator6 = _createForOfIteratorHelperLoose(objects), _step6; !(_step6 = _iterator6()).done;) {
            var o = _step6.value;
            var _map = map(o.x, o.y),
              x = _map[0],
              y = _map[1];
            g.fillColor = new Color(o.kind === "boss" ? "#cf796f" : o.kind === "portal" ? "#89b5c2" : o.kind === "chest" ? "#e3c281" : "#adba8e");
            g.rect(x - 3, y - 3, 6, 6);
            g.fill();
          }
          g.fillColor = new Color("#f0e8cb");
          g.circle(0, 0, 4);
          g.fill();
          this.markers.string = objects.sort(function (a, b) {
            return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y);
          }).slice(0, 4).map(function (o) {
            var dx = o.x - p.x,
              dy = o.y - p.y,
              dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "东" : "西" : dy > 0 ? "南" : "北";
            return o.name + "\n" + dir + " · " + Math.round(Math.hypot(dx, dy) / 10) + " 步" + (Number.isFinite(o.expiresAt) ? " · " + Math.max(0, Math.ceil(o.expiresAt - s.gameTime)) + "秒" : "");
          }).join("\n\n") || "尚无关键物\n随探索逐步出现";
        };
        _proto.renderBattle = function renderBattle(s) {
          var _this19 = this,
            _ref3,
            _action$frame,
            _ref4,
            _action$facing,
            _this$dangerLayout;
          this.ground.clear();
          this.front.clear();
          var used = 0,
            textUsed = 0;
          var p = s.player,
            scale = this.battleRenderScale,
            field = this.battle.getComponent(UITransform),
            view = visualBattleView({
              playerX: p.x,
              playerY: p.y,
              fieldWidth: field.width,
              fieldHeight: field.height,
              scale: scale,
              runMode: s.runMode,
              arenaWidth: s.arenaWidth,
              arenaHeight: s.arenaHeight,
              logicalCenterX: s.camera.worldX + s.canvas.width / 2,
              logicalCenterY: s.camera.worldY + s.canvas.height / 2,
              // Native compact landscape has touch panels on both sides. Center the
              // visual actor even near room walls; do not mutate simulation camera.
              followPlayer: sys.isNative && sys.os === sys.OS.ANDROID && this.responsive.compact && scale <= 0.525,
              edgeOverscan: scale > 0.525 ? {
                left: 176,
                right: 240,
                top: 112,
                bottom: 240
              } : 0
            }),
            halfW = view.width / 2,
            halfH = view.height / 2,
            cx = view.cx,
            cy = view.cy;
          var drawText = function drawText(value, x, y, size, color) {
            if (Math.abs(x) > halfW * scale + 24 || Math.abs(y) > halfH * scale + 24) return;
            var l = _this19.worldTexts[textUsed++];
            if (!l) {
              l = _this19.label("", 0, 0, 12, _this19.battle);
              _this19.worldTexts.push(l);
            }
            l.node.active = true;
            l.node.setPosition(x, y);
            l.fontSize = Math.max(9, size);
            l.lineHeight = l.fontSize + 3;
            l.color = color;
            l.string = value;
          };
          var paintViewport = {
            left: -halfW * scale,
            right: halfW * scale,
            bottom: -halfH * scale,
            top: halfH * scale
          };
          var g = new GraphicsPainter(this.ground, 0, 0, drawText, paintViewport),
            f = new GraphicsPainter(this.front, 0, 0, drawText, paintViewport);
          for (var _i14 = 0, _arr7 = [g, f]; _i14 < _arr7.length; _i14++) {
            var painter = _arr7[_i14];
            painter.scale(scale, scale);
            painter.translate(-cx, -cy);
          }
          g.fillStyle = s.stageId === "crypt" ? "#292330" : s.stageId === "tundra" ? "#283947" : "#202e29";
          var textured = this.terrain.draw(s, scale, view);
          if (!textured) g.fillRect(view.x, view.y, view.width, view.height);
          // Fixed world marks: camera movement never reseeds the floor.
          g.fillStyle = s.stageId === "crypt" ? "#383041" : s.stageId === "tundra" ? "#354958" : "#2b3c32";
          if (!textured) for (var y = Math.floor((cy - halfH) / 96) * 96; y < cy + halfH; y += 96) for (var x = Math.floor((cx - halfW) / 96) * 96; x < cx + halfW; x += 96) g.fillRect(x + Math.abs(y) % 19, y, 20, 3);
          if (s.runMode === "chapter") {
            g.strokeStyle = "#8c997d";
            g.lineWidth = 8;
            g.strokeRect(4, 4, s.arenaWidth - 8, s.arenaHeight - 8);
          }
          for (var _iterator7 = _createForOfIteratorHelperLoose(s.expOrbs), _step7; !(_step7 = _iterator7()).done;) {
            var _o = _step7.value;
            g.fillStyle = "#86b68b";
            g.fillRect(_o.x - 4, _o.y - 4, 8, 8);
          }
          s.combatVisuals.render(g, "ground");
          s.hostileFields.render(g, {
            labels: false
          });
          for (var _iterator8 = _createForOfIteratorHelperLoose(s.mines), _step8; !(_step8 = _iterator8()).done;) {
            var mine = _step8.value;
            mine.render(g);
          }
          var sprite = function sprite(key, x, y, size, facing, alpha) {
            if (alpha === void 0) {
              alpha = 1;
            }
            if (Math.abs(x - cx) > halfW + size / 2 || Math.abs(y - cy) > halfH + size / 2) return;
            var n = _this19.sprites[used++];
            if (!n) {
              n = _this19.child("Actor", _this19.actors);
              n.addComponent(UITransform);
              var _sp = n.addComponent(Sprite);
              _sp.sizeMode = Sprite.SizeMode.CUSTOM;
              _sp.trim = false;
              _this19.sprites.push(n);
            }
            n.active = true;
            n.setPosition((x - cx) * scale, -(y - cy) * scale);
            n.setScale(facing, 1, 1);
            n.getComponent(UITransform).setContentSize(size * scale, size * scale);
            var sp = n.getComponent(Sprite);
            sp.spriteFrame = _this19.frames.get(key);
            // Pooled nodes must reset opacity for the next live actor/building.
            var opacity = Math.round(255 * alpha);
            if (sp.color.a !== opacity) sp.color = new Color(255, 255, 255, opacity);
          };
          for (var _i15 = 0, _arr8 = [].concat(s.worldMap.visibleStructures, s.interactions.objects); _i15 < _arr8.length; _i15++) {
            var o = _arr8[_i15];
            if (o.used && !C.isRetainedBuilding(o)) continue;
            var box = C.buildingBounds(o);
            if (box) {
              var kind = ["shop", "pavilion"].includes(o.kind) ? "shop" : ["relic", "ruin", "shrine"].includes(o.kind) ? "relic" : o.kind === "gate" ? "gate" : "heal";
              sprite("building-" + s.stageId + "-" + kind, o.x, o.y, (o.radius || 62) * 192 / 72, 1);
              if (o === s.interactions.nearby) {
                g.strokeStyle = "#eed493";
                g.lineWidth = 2;
                g.strokeRect(box.left - 3, box.top - 3, box.right - box.left + 6, box.bottom - box.top + 6);
              }
            } else {
              g.fillStyle = o.kind === "portal" ? "#87adba" : "#bb9d64";
              if (o.kind === "portal") {
                g.lineWidth = 4;
                g.strokeStyle = "#b6d5d8";
                g.beginPath();
                g.arc(o.x, o.y, o.radius || 48, 0, Math.PI * 2);
                g.stroke();
              } else {
                g.fillRect(o.x - 15, o.y - 12, 30, 24);
                g.strokeStyle = "#e5d1a2";
                g.strokeRect(o.x - 15, o.y - 12, 30, 24);
              }
            }
            f.fillStyle = "#e6dfc2";
            f.font = "20px sans-serif";
            f.fillText(o.used ? C.closedBuildingLabel(o) : o.name || "封存遗迹", o.x, o.y + (o.radius || 48) + 26);
          }
          for (var _iterator9 = _createForOfIteratorHelperLoose(this.enemyFeedback.deaths), _step9; !(_step9 = _iterator9()).done;) {
            var d = _step9.value;
            sprite(d.key, d.x, d.y, d.size, d.facing, this.enemyFeedback.deathAlpha(d.remaining));
          }
          for (var _iterator10 = _createForOfIteratorHelperLoose(s.enemies.filter(function (e) {
              return e.hp > 0;
            }).sort(function (a, b) {
              return a.y - b.y;
            })), _step10; !(_step10 = _iterator10()).done;) {
            var e = _step10.value;
            var pose = this.enemyPose(e);
            C.renderEnemyCast(f, e);
            sprite(pose.key, pose.x, pose.y, pose.size, pose.facing);
            if (this.enemyFeedback.hits.has(e)) renderEnemyHit(f, e.x, e.y, C.enemyHitRadius(e));
            if (e.hp < e.maxHp) {
              f.fillStyle = "#ad735f";
              f.fillRect(e.x - 18, e.y - e.visualDiameter / 2 - 6, 36 * Math.max(0, e.hp / e.maxHp), 3);
            }
            if (this.settings.data.highContrast) {
              f.strokeStyle = "#e9b19b";
              f.lineWidth = 2;
              f.beginPath();
              f.arc(e.x, e.y, C.enemyHitRadius(e), 0, Math.PI * 2);
              f.stroke();
            }
          }
          var action = this.reducedMotion() ? null : p.heroAction;
          sprite(p.heroId + "-" + (action ? "action" : "walk") + "-" + (this.reducedMotion() ? 1 : (_ref3 = (_action$frame = action == null ? void 0 : action.frame) != null ? _action$frame : p.walkFrame) != null ? _ref3 : 1), p.x, p.y, 128, (_ref4 = (_action$facing = action == null ? void 0 : action.facing) != null ? _action$facing : p.walkFacing) != null ? _ref4 : 1);
          for (var i = used; i < this.sprites.length; i++) this.sprites[i].active = false;
          for (var _iterator11 = _createForOfIteratorHelperLoose(s.projectiles), _step11; !(_step11 = _iterator11()).done;) {
            var shot = _step11.value;
            shot.render(f);
          }
          for (var _iterator12 = _createForOfIteratorHelperLoose(s.enemyProjectiles), _step12; !(_step12 = _iterator12()).done;) {
            var _shot = _step12.value;
            _shot.render(f);
          }
          for (var _iterator13 = _createForOfIteratorHelperLoose(p.weapons), _step13; !(_step13 = _iterator13()).done;) {
            var w = _step13.value;
            for (var _iterator15 = _createForOfIteratorHelperLoose(w._shards || []), _step15; !(_step15 = _iterator15()).done;) {
              var shard = _step15.value;
              shard.render(f);
            }
          }
          s.combatVisuals.render(f, "foreground");
          if (this.settings.data.highContrast) {
            f.strokeStyle = "#f6e4a4";
            f.lineWidth = 3;
            f.beginPath();
            f.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            f.stroke();
          }
          if (this.settings.data.damageNumbers) {
            for (var _iterator14 = _createForOfIteratorHelperLoose(s.texts), _step14; !(_step14 = _iterator14()).done;) {
              var t = _step14.value;
              f.fillStyle = t.color;
              f.font = "22px sans-serif";
              f.fillText(t.text, t.x, t.y - (this.reducedMotion() ? 0 : (0.7 - t.life) * 18));
            }
          }
          for (var _i16 = textUsed; _i16 < this.worldTexts.length; _i16++) this.worldTexts[_i16].node.active = false;
          // Labels are UI-sized, independent of world zoom. All danger circles still render.
          var blocked = [{
            x: (p.x - cx) * scale,
            y: -(p.y - cy) * scale,
            width: 128 * scale,
            height: 128 * scale
          }];
          var origin = this.battle.worldPosition,
            unit = this.battle.worldScale;
          for (var _i17 = 0, _arr9 = [this.skillLabel.node.parent, this.ultimateLabel.node.parent, this.interactLabel.node.parent, this.hud.node, this.controlsHint.node, this.routeLabel.node, this.responsive.battleStatusNode, this.miniMap.node, this.joystick.node, this.movementToggle].concat(this.weaponIcons.map(function (icon) {
              return icon.node;
            }), this.directionButtons.map(function (b) {
              return b.node;
            })); _i17 < _arr9.length; _i17++) {
            var n = _arr9[_i17];
            var ui = n == null ? void 0 : n.getComponent(UITransform);
            if (!(n != null && n.activeInHierarchy) || !ui) continue;
            var pos = n.worldPosition,
              ns = n.worldScale;
            blocked.push({
              x: (pos.x - origin.x) / unit.x,
              y: (pos.y - origin.y) / unit.y,
              width: ui.width * ns.x / unit.x,
              height: ui.height * ns.y / unit.y
            });
          }
          var labelView = {
            cx: cx,
            cy: cy,
            scale: scale,
            width: field.width,
            height: field.height
          };
          var incoming = incomingThreats(s.enemies, s.enemyProjectiles, p, labelView, blocked, function (ax, ay, bx, by, radius) {
            return s.worldMap.projectileHit(ax, ay, bx, by, radius);
          });
          var annotations = [].concat(incoming, hazardLabels(s.hostileFields.fields, labelView, [].concat(blocked, incoming)));
          var layoutKey = cx + ":" + cy + ":" + scale + ":" + field.width + ":" + field.height;
          // Hiding controls for a modal must not shuffle a frozen battlefield's cues.
          // Rotation changes the key and deliberately recomposes the new viewport.
          if (s.state !== C.GameState.PLAYING && ((_this$dangerLayout = this.dangerLayout) == null ? void 0 : _this$dangerLayout.session) === s && this.dangerLayout.key === layoutKey) annotations = this.dangerLayout.annotations;else this.dangerLayout = {
            session: s,
            key: layoutKey,
            annotations: annotations
          };
          var ink = this.hazardInk;
          ink.clear();
          for (var _i18 = 0; _i18 < annotations.length; _i18++) {
            var a = annotations[_i18];
            ink.fillColor = new Color(23, 23, 25, 255);
            ink.rect(a.x - a.width / 2, a.y - a.height / 2, a.width, a.height);
            ink.fill();
            ink.strokeColor = new Color(130, 164, 171, 255);
            ink.lineWidth = 1;
            ink.rect(a.x - a.width / 2, a.y - a.height / 2, a.width, a.height);
            ink.stroke();
            var l = this.hazardTexts[_i18];
            if (!l) {
              l = this.label("", 0, 0, 16, ink.node);
              l.node.name = "Danger label";
              this.hazardTexts.push(l);
            }
            l.node.active = true;
            l.node.setPosition(a.x, a.y);
            l.fontSize = a.fontSize;
            l.lineHeight = 22;
            l.color = new Color(245, 231, 201);
            l.string = a.text;
          }
          for (var _i19 = annotations.length; _i19 < this.hazardTexts.length; _i19++) this.hazardTexts[_i19].node.active = false;
        };
        _proto.onDestroy = function onDestroy() {
          var _this$terrain, _this$sound6;
          (_this$terrain = this.terrain) == null || _this$terrain.destroy();
          (_this$sound6 = this.sound) == null || _this$sound6.destroy();
          input.off(Input.EventType.KEY_DOWN, this.keyDown, this);
          input.off(Input.EventType.KEY_UP, this.keyUp, this);
          input.off(Input.EventType.GAMEPAD_CHANGE, this.gamepadEvent, this);
          input.off(Input.EventType.GAMEPAD_INPUT, this.gamepadEvent, this);
          this.padDevices.clear();
          game.off(Game.EVENT_HIDE, this.hide, this);
          delete globalThis.__cocosCheck;
        };
        return GameBoot;
      }(Component)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GraphicsPainter.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, Color, Graphics;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      Graphics = module.Graphics;
    }],
    execute: function () {
      cclegacy._RF.push({}, "34146XVmVZProAstwZlalvn", "GraphicsPainter", undefined);
      /** Existing skill geometry -> native Cocos Graphics, no Canvas/DOM/WebView.
       * Glow is intentionally omitted. World coordinates retain original hit geometry. */
      var GraphicsPainter = exports('GraphicsPainter', /*#__PURE__*/function () {
        function GraphicsPainter(graphics, x, y, text, viewport) {
          if (x === void 0) {
            x = 0;
          }
          if (y === void 0) {
            y = 0;
          }
          this.fillStyle = "#fff";
          this.strokeStyle = "#fff";
          this.globalAlpha = 1;
          this.lineWidth = 1;
          this.shadowColor = "";
          this.shadowBlur = 0;
          this.font = "12px sans-serif";
          this.textAlign = "center";
          this.lineCap = "butt";
          this.matrix = [1, 0, 0, 1, 0, 0];
          this.stack = [];
          this.path = [];
          this.current = [0, 0];
          this.graphics = graphics;
          this.text = text;
          this.viewport = viewport;
          this.translate(x, y);
        }
        var _proto = GraphicsPainter.prototype;
        _proto.save = function save() {
          this.stack.push({
            matrix: [].concat(this.matrix),
            fillStyle: this.fillStyle,
            strokeStyle: this.strokeStyle,
            globalAlpha: this.globalAlpha,
            lineWidth: this.lineWidth,
            font: this.font,
            textAlign: this.textAlign,
            lineCap: this.lineCap
          });
        };
        _proto.restore = function restore() {
          var state = this.stack.pop();
          if (state) Object.assign(this, state);
        };
        _proto.translate = function translate(x, y) {
          var m = this.matrix;
          m[4] += m[0] * x + m[2] * y;
          m[5] += m[1] * x + m[3] * y;
        };
        _proto.scale = function scale(x, y) {
          var m = this.matrix;
          m[0] *= x;
          m[1] *= x;
          m[2] *= y;
          m[3] *= y;
        };
        _proto.rotate = function rotate(angle) {
          var _this$matrix = this.matrix,
            a = _this$matrix[0],
            b = _this$matrix[1],
            c = _this$matrix[2],
            d = _this$matrix[3],
            s = Math.sin(angle),
            co = Math.cos(angle);
          this.matrix[0] = a * co + c * s;
          this.matrix[1] = b * co + d * s;
          this.matrix[2] = c * co - a * s;
          this.matrix[3] = d * co - b * s;
        };
        _proto.point = function point(x, y) {
          var m = this.matrix;
          return [m[0] * x + m[2] * y + m[4], -(m[1] * x + m[3] * y + m[5])];
        };
        _proto.beginPath = function beginPath() {
          this.path = [];
        };
        _proto.moveTo = function moveTo(x, y) {
          this.path.push(["M"].concat(this.point(x, y)));
          this.current = [x, y];
        };
        _proto.lineTo = function lineTo(x, y) {
          this.path.push(["L"].concat(this.point(x, y)));
          this.current = [x, y];
        };
        _proto.closePath = function closePath() {
          this.path.push(["Z"]);
        };
        _proto.quadraticCurveTo = function quadraticCurveTo(cx, cy, x, y) {
          var _this$current = this.current,
            sx = _this$current[0],
            sy = _this$current[1];
          for (var i = 1; i <= 12; i++) {
            var t = i / 12,
              u = 1 - t;
            this.lineTo(u * u * sx + 2 * u * t * cx + t * t * x, u * u * sy + 2 * u * t * cy + t * t * y);
          }
        };
        _proto.arc = function arc(x, y, r, start, end, anticlockwise) {
          if (anticlockwise === void 0) {
            anticlockwise = false;
          }
          var sweep = end - start;
          if (anticlockwise && sweep > 0) sweep -= Math.PI * 2;
          if (!anticlockwise && sweep < 0) sweep += Math.PI * 2;
          var steps = Math.max(3, Math.ceil(Math.abs(sweep) * 12));
          for (var i = 0; i <= steps; i++) {
            var a = start + sweep * i / steps,
              px = x + Math.cos(a) * r,
              py = y + Math.sin(a) * r;
            if (i === 0 && !this.path.length) this.moveTo(px, py);else this.lineTo(px, py);
          }
        };
        _proto.rectPath = function rectPath(x, y, w, h) {
          this.beginPath();
          this.moveTo(x, y);
          this.lineTo(x + w, y);
          this.lineTo(x + w, y + h);
          this.lineTo(x, y + h);
          this.closePath();
        };
        _proto.fillRect = function fillRect(x, y, w, h) {
          var p = this.path;
          this.rectPath(x, y, w, h);
          this.fill();
          this.path = p;
        };
        _proto.strokeRect = function strokeRect(x, y, w, h) {
          var p = this.path;
          this.rectPath(x, y, w, h);
          this.stroke();
          this.path = p;
        };
        _proto.color = function color(value) {
          var rgba = value.match(/^rgba?\(([^)]+)\)/);
          var color = new Color();
          if (rgba) {
            var _values$;
            var values = rgba[1].split(",").map(Number);
            color.set(values[0], values[1], values[2], Math.round(((_values$ = values[3]) != null ? _values$ : 1) * 255));
          } else Color.fromHEX(color, value);
          color.a = Math.round(color.a * Math.max(0, Math.min(1, this.globalAlpha)));
          return color;
        };
        _proto.emit = function emit() {
          var g = this.graphics;
          for (var _iterator = _createForOfIteratorHelperLoose(this.path), _step; !(_step = _iterator()).done;) {
            var p = _step.value;
            if (p[0] === "M") g.moveTo(p[1], p[2]);else if (p[0] === "L") g.lineTo(p[1], p[2]);else g.close();
          }
        }
        /** Conservative rejection in already-transformed Cocos coordinates.
         * Never clip or move vertices: a crossing/enclosing path is drawn unchanged.
         * Unknown/non-finite geometry falls back to the original renderer.
         */;
        _proto.pathVisible = function pathVisible(padding) {
          if (padding === void 0) {
            padding = 0;
          }
          var v = this.viewport;
          if (!v) return true;
          if (![v.left, v.right, v.bottom, v.top, padding].every(Number.isFinite) || v.left > v.right || v.bottom > v.top || padding < 0) return true;
          var left = Infinity,
            right = -Infinity,
            bottom = Infinity,
            top = -Infinity;
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.path), _step2; !(_step2 = _iterator2()).done;) {
            var p = _step2.value;
            if (p[0] === "Z") continue;
            if (!Number.isFinite(p[1]) || !Number.isFinite(p[2])) return true;
            left = Math.min(left, p[1]);
            right = Math.max(right, p[1]);
            bottom = Math.min(bottom, p[2]);
            top = Math.max(top, p[2]);
          }
          // Keep a two-pixel guard for rasterization at the viewport boundary.
          var guard = padding + 2;
          return right + guard >= v.left && left - guard <= v.right && top + guard >= v.bottom && bottom - guard <= v.top;
        };
        _proto.fill = function fill() {
          if (!this.pathVisible()) return;
          this.graphics.fillColor = this.color(this.fillStyle);
          this.emit();
          this.graphics.fill();
        };
        _proto.stroke = function stroke() {
          var width = this.lineWidth * Math.hypot(this.matrix[0], this.matrix[1]);
          // Cocos defaults to miter joins. Include the complete possible join/cap
          // extension, not just half a line width, to avoid popping near the edge.
          var padding = Math.abs(width) * Math.max(1, this.graphics.miterLimit || 10);
          if (!this.pathVisible(padding)) return;
          this.graphics.strokeColor = this.color(this.strokeStyle);
          this.graphics.lineWidth = width;
          this.graphics.lineCap = this.lineCap === "round" ? Graphics.LineCap.ROUND : Graphics.LineCap.BUTT;
          this.emit();
          this.graphics.stroke();
        };
        _proto.fillText = function fillText(value, x, y) {
          var _this$text;
          var _this$point = this.point(x, y),
            px = _this$point[0],
            py = _this$point[1];
          var size = (parseFloat(this.font) || 12) * Math.hypot(this.matrix[0], this.matrix[1]);
          (_this$text = this.text) == null || _this$text.call(this, value, px, py + size / 2, size, this.color(this.fillStyle));
        };
        return GraphicsPainter;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HazardLabels.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        hazardLabels: hazardLabels,
        overlaps: overlaps
      });
      cclegacy._RF.push({}, "aa8c2sDJ/NJCYE/0DICF20Q", "HazardLabels", undefined);
      /** Render-only screen-space annotation. Never mutates fields or combat clocks. */
      function overlaps(a, b, gap) {
        if (gap === void 0) {
          gap = 4;
        }
        return Math.abs(a.x - b.x) < (a.width + b.width) / 2 + gap && Math.abs(a.y - b.y) < (a.height + b.height) / 2 + gap;
      }
      function hazardLabels(fields, view, blocked) {
        if (blocked === void 0) {
          blocked = [];
        }
        var placed = [];
        var fontSize = 16,
          height = 28,
          margin = 8;
        for (var _iterator = _createForOfIteratorHelperLoose(fields.slice(0, 24)), _step; !(_step = _iterator()).done;) {
          var f = _step.value;
          if (![f.x, f.y, f.radius, f.age, f.warning, f.duration].every(Number.isFinite) || f.radius <= 0 || f.age >= f.warning + f.duration) continue;
          var x = (f.x - view.cx) * view.scale,
            y = -(f.y - view.cy) * view.scale;
          var r = f.radius * view.scale;
          if (Math.abs(x) > view.width / 2 + r || Math.abs(y) > view.height / 2 + r) continue;
          var name = String(f.label || '异变').replace(/[\r\n\t]/g, '').slice(0, 8);
          var text = name + " \xB7 " + (f.age < f.warning ? '将至' : '危险');
          var width = Math.max(132, text.length * fontSize + 16);
          // Fixed candidate order. No nearest-first sorting or oscillating animation.
          var offset = r + height / 2 + 8;
          var candidates = [[x, y - offset], [x, y + offset], [x - r - width / 2 - 8, y], [x + r + width / 2 + 8, y]];
          var _loop = function _loop() {
              var _candidates$_i = _candidates[_i],
                px = _candidates$_i[0],
                py = _candidates$_i[1];
              var rect = {
                x: px,
                y: py,
                width: width,
                height: height
              };
              if (Math.abs(px) + width / 2 > view.width / 2 - margin || Math.abs(py) + height / 2 > view.height / 2 - margin || blocked.some(function (b) {
                return overlaps(rect, b);
              }) || placed.some(function (b) {
                return overlaps(rect, b);
              })) return 0; // continue
              placed.push(_extends({}, rect, {
                text: text,
                fontSize: fontSize,
                anchorX: x,
                anchorY: y
              }));
              return 1; // break
            },
            _ret;
          for (var _i = 0, _candidates = candidates; _i < _candidates.length; _i++) {
            _ret = _loop();
            if (_ret === 0) continue;
            if (_ret === 1) break;
          }
        }
        return placed;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/IncomingThreats.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './HazardLabels.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, cclegacy, overlaps;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      overlaps = module.overlaps;
    }],
    execute: function () {
      exports('incomingThreats', incomingThreats);
      cclegacy._RF.push({}, "6e3aauTYPFDp51a8llJJ9gc", "IncomingThreats", undefined);
      /** First entry into the visible world rectangle, not the direction to the enemy. */
      function entry(ray, view) {
        var halfW = view.width / view.scale / 2,
          halfH = view.height / view.scale / 2;
        var left = view.cx - halfW,
          right = view.cx + halfW;
        var top = view.cy - halfH,
          bottom = view.cy + halfH;
        var a = ray.a,
          dx = ray.b.x - a.x,
          dy = ray.b.y - a.y;
        if (a.x >= left - ray.radius && a.x <= right + ray.radius && a.y >= top - ray.radius && a.y <= bottom + ray.radius) return null;
        var enter = 0,
          leave = 1,
          side = null;
        for (var _i = 0, _arr = [[a.x, dx, left, right, "left", "right"], [a.y, dy, top, bottom, "top", "bottom"]]; _i < _arr.length; _i++) {
          var _arr$_i = _arr[_i],
            start = _arr$_i[0],
            delta = _arr$_i[1],
            min = _arr$_i[2],
            max = _arr$_i[3],
            near = _arr$_i[4],
            far = _arr$_i[5];
          if (Math.abs(delta) < 1e-9) {
            if (start < min || start > max) return null;
          } else {
            var t0 = (min - start) / delta,
              t1 = (max - start) / delta;
            var next = Math.min(t0, t1);
            if (next > enter) {
              enter = next;
              side = t0 < t1 ? near : far;
            }
            leave = Math.min(leave, Math.max(t0, t1));
            if (enter > leave) return null;
          }
        }
        return side;
      }

      /** Pure presentation only. No timers, opacity pulses, random calls or combat writes. */
      function incomingThreats(enemies, shots, player, view, blocked, wallHit) {
        if (blocked === void 0) {
          blocked = [];
        }
        var placed = [];
        if (![view.cx, view.cy, view.scale, view.width, view.height, player.x, player.y, player.size].every(Number.isFinite) || view.scale <= 0 || view.width < 120 || view.height < 64) return placed;
        var sides = new Set();
        var inspect = function inspect(ray) {
          if (![ray.a.x, ray.a.y, ray.b.x, ray.b.y, ray.radius].every(Number.isFinite)) return;
          var dx = ray.b.x - ray.a.x,
            dy = ray.b.y - ray.a.y,
            length2 = dx * dx + dy * dy;
          if (length2 < 1e-6) return;
          var t = Math.max(0, Math.min(1, ((player.x - ray.a.x) * dx + (player.y - ray.a.y) * dy) / length2));
          var closest = {
            x: ray.a.x + dx * t,
            y: ray.a.y + dy * t
          };
          // Nearby trajectory corridor, not an assertion that this shot must hit.
          if (Math.hypot(closest.x - player.x, closest.y - player.y) > player.size + ray.radius + 64) return;
          var side = entry(ray, view);
          if (!side || sides.has(side) || wallHit != null && wallHit(ray.a.x, ray.a.y, closest.x, closest.y, ray.radius)) return;
          sides.add(side);
        };
        for (var _iterator = _createForOfIteratorHelperLoose(enemies), _step; !(_step = _iterator()).done;) {
          var e = _step.value;
          var aim = e.hp > 0 && e.rangedAim;
          if (!aim || !Number.isFinite(aim.remaining) || aim.remaining <= 0 || !Number.isFinite(aim.length) || aim.length <= 0) continue;
          inspect({
            a: {
              x: aim.x,
              y: aim.y
            },
            b: {
              x: aim.x + Math.cos(aim.angle) * aim.length,
              y: aim.y + Math.sin(aim.angle) * aim.length
            },
            radius: 6
          });
        }
        for (var _iterator2 = _createForOfIteratorHelperLoose(shots), _step2; !(_step2 = _iterator2()).done;) {
          var s = _step2.value;
          if (s.shouldRemove || !Number.isFinite(s.life) || s.life <= 0) continue;
          var horizon = Math.min(s.life, 1.5);
          inspect({
            a: {
              x: s.x,
              y: s.y
            },
            b: {
              x: s.x + s.vx * horizon,
              y: s.y + s.vy * horizon
            },
            radius: s.size || 6
          });
        }
        var names = {
          left: "左侧来袭",
          right: "右侧来袭",
          top: "上方来袭",
          bottom: "下方来袭"
        };
        var width = 96,
          height = 28,
          margin = 8;
        // One fixed-position label per edge. Quantity and remaining time never pulse it.
        for (var _i2 = 0, _arr2 = ["left", "right", "top", "bottom"]; _i2 < _arr2.length; _i2++) {
          var edge = _arr2[_i2];
          if (!sides.has(edge)) continue;
          var done = false;
          // Fixed inner rows let top HUD/bottom touch controls keep their space.
          for (var _i3 = 0, _arr3 = [0, 36, 72, 108, 144, 180, 216]; _i3 < _arr3.length; _i3++) {
            var inset = _arr3[_i3];
            var _loop = function _loop() {
                var offset = _arr4[_i4];
                var vertical = edge === "left" || edge === "right";
                var depth = vertical ? view.width / 2 - width / 2 - margin - inset : view.height / 2 - height / 2 - margin - inset;
                if (depth <= 0) return 0; // continue
                var x = vertical ? (edge === "left" ? -1 : 1) * depth : offset * view.width;
                var y = vertical ? offset * view.height : (edge === "top" ? 1 : -1) * depth;
                var rect = {
                  x: x,
                  y: y,
                  width: width,
                  height: height
                };
                if (Math.abs(x) + width / 2 > view.width / 2 - margin || Math.abs(y) + height / 2 > view.height / 2 - margin || blocked.some(function (b) {
                  return overlaps(rect, b);
                }) || placed.some(function (b) {
                  return overlaps(rect, b);
                })) return 0; // continue
                placed.push(_extends({}, rect, {
                  edge: edge,
                  text: names[edge],
                  fontSize: 16
                }));
                done = true;
                return 1; // break
              },
              _ret;
            for (var _i4 = 0, _arr4 = [0, .22, -.22, .36, -.36]; _i4 < _arr4.length; _i4++) {
              _ret = _loop();
              if (_ret === 0) continue;
              if (_ret === 1) break;
            }
            if (done) break;
          }
        }
        return placed;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/JoystickState.ts", ['cc', './shared-core.js'], function (exports) {
  var cclegacy, sampleJoystick;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      sampleJoystick = module.sampleJoystick;
    }],
    execute: function () {
      cclegacy._RF.push({}, "65f59N0pktGkZjpDol9C0CA", "JoystickState", undefined);
      var JoystickState = exports('JoystickState', /*#__PURE__*/function () {
        function JoystickState() {
          this.owner = null;
          this.value = sampleJoystick(0, 0);
        }
        var _proto = JoystickState.prototype;
        _proto.begin = function begin(id, x, y) {
          if (this.owner !== null || id === null || !Number.isInteger(id) || id < 0) return;
          this.owner = id;
          this.move(id, x, y);
        };
        _proto.move = function move(id, x, y) {
          if (this.owner === null || this.owner !== id) return;
          this.value = sampleJoystick(x, y, 50);
        };
        _proto.end = function end(id) {
          if (this.owner === id) this.clear();
        };
        _proto.clear = function clear() {
          this.owner = null;
          this.value = sampleJoystick(0, 0);
        };
        return JoystickState;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/main", ['./AudioMixer.ts', './BackupFiles.ts', './BackupPanel.ts', './BackupVault.ts', './CocosAudio.ts', './CocosJoystick.ts', './CocosTerrain.ts', './CombatCoach.ts', './CombatSession.ts', './ControllerState.ts', './CovenantStore.ts', './EnemyFeedback.ts', './GameBoot.ts', './GraphicsPainter.ts', './HazardLabels.ts', './IncomingThreats.ts', './JoystickState.ts', './MenuCopy.ts', './NativeBackupTransfer.ts', './PanelInk.ts', './ProfileStore.ts', './ResponsiveLayout.ts', './SettingsStore.ts', './TerrainPlan.ts', './TouchState.ts', './shared-core.js'], function () {
  return {
    setters: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    execute: function () {}
  };
});

System.register("chunks:///_virtual/MenuCopy.ts", ['cc', './shared-core.js'], function (exports) {
  var cclegacy, Difficulty, STAGES, HEROES, WEAPONS;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      Difficulty = module.Difficulty;
      STAGES = module.STAGES;
      HEROES = module.HEROES;
      WEAPONS = module.WEAPONS;
    }],
    execute: function () {
      exports({
        difficultyLabel: difficultyLabel,
        guidePages: guidePages,
        healthText: healthText,
        heroKit: heroKit,
        journeyInfo: journeyInfo,
        pauseLoadout: pauseLoadout,
        skillCooldownText: skillCooldownText
      });
      cclegacy._RF.push({}, "938c9Mv6hlJ+5FsUDUKaXKH", "MenuCopy", undefined);
      var difficultyIds = exports('difficultyIds', ["easy", "normal", "hard", "nightmare"]);
      // Presentation only: never round a positive cooldown down to an apparently
      // usable zero. Readiness still comes from the ability, not this label.
      function skillCooldownText(remaining, ready) {
        if (!Number.isFinite(remaining)) return "冷却中";
        if (remaining > 0) return (Math.ceil(remaining * 10) / 10).toFixed(1) + " \u79D2";
        return ready ? "就绪" : "冷却中";
      }
      // Presentation only: a living fraction must not look dead, and current/max
      // values use the same rounding. Never assign these rounded values to combat.
      function healthText(hp, maxHp) {
        var display = function display(value) {
          if (!Number.isFinite(value)) return "—";
          if (value <= 0) return "0";
          // Discard only roundoff-sized tails near an integer (e.g. 100 * 1.12).
          // Cap the tolerance so large values still retain genuine fractions.
          var integer = Math.round(value);
          var tolerance = Math.min(1e-9, Number.EPSILON * Math.max(1, value) * 4);
          var stable = Math.abs(value - integer) <= tolerance ? integer : value;
          return String(Math.max(1, Math.ceil(stable)));
        };
        return display(hp) + " / " + display(maxHp);
      }
      /** One owned item per line; detailed lore and numbers remain in the codex. */
      function pauseLoadout(player, relicNames) {
        if (relicNames === void 0) {
          relicNames = [];
        }
        var weapons = player.weapons.map(function (w) {
          return w.name + " Lv." + w.level;
        });
        var passives = Object.values(player.passives).map(function (v) {
          return v.def.name + " \xD7" + v.count;
        });
        var section = function section(name, items, cap) {
          return name + " " + items.length + " / " + cap + "\n" + (items.length ? items.join("\n") : "尚未获得");
        };
        return [section("武器", weapons, 6), section("功法", passives, 6), section("遗物", relicNames, 3)].join("\n\n");
      }
      function difficultyLabel(id) {
        return {
          easy: "轻松",
          normal: "普通",
          hard: "困难",
          nightmare: "梦魇"
        }[id] || "普通";
      }
      function journeyInfo(mode, stage, difficulty) {
        if (mode === void 0) {
          mode = "chapter";
        }
        if (stage === void 0) {
          stage = "forest";
        }
        if (difficulty === void 0) {
          difficulty = "normal";
        }
        var d = Difficulty[difficulty.toUpperCase()] || Difficulty.NORMAL;
        var map = Object.values(STAGES).find(function (s) {
          return s.id === stage;
        });
        var environment = {
          forest: "纸人驿道与黑水竹海，敌群分布均衡，适合熟悉构筑。",
          crypt: "邪教城中远程敌人更常见，注意弹道并利用建筑遮挡。",
          tundra: "星蚀环境：移速降低 10%，敌人生命增加 20%。周期侵蚀可借恢复建筑的避星灯暂缓。"
        }[stage] || "";
        return {
          title: "地图与难度",
          text: ((map == null ? void 0 : map.name) || "雾隐青冥山") + " \xB7 " + (mode === "chapter" ? "章节道途" : "无尽大荒") + "\n" + environment + "\n\n" + (mode === "chapter" ? "完成房间目标后开放出口，沿分支前往守关 Boss。换房不跳战斗时间，难度随时间和路线逐步增长。" : "地图无限延伸，强度随时间增长。20、30、45 分钟迎来时间 Boss，结算后可继续挑战。") + "\n\n" + difficultyLabel(d.id) + "\uFF1A\u654C\u4EBA\u751F\u547D \xD7" + d.hpMult + "\uFF0C\u4F24\u5BB3 \xD7" + d.dmgMult + "\uFF0C\u5237\u602A\u9891\u7387 \xD7" + d.spawnMult + "\uFF1B\u5730\u56FE\u4FEE\u6B63\u53E6\u884C\u53E0\u52A0\u3002\u96BE\u5EA6\u4E0D\u989D\u5916\u589E\u52A0\u7ED3\u7B97\u5956\u52B1\u3002\n\n\u96BE\u5EA6\u968F\u547D\u5951\u4FDD\u5B58\uFF0C\u4EC5\u65B0\u5C40\u53EF\u9009\uFF1B\u65E7\u7248\u547D\u5951\u9ED8\u8BA4\u666E\u901A\u3002"
        };
      }
      function heroKit(id) {
        var hero = HEROES[id] || HEROES.sword;
        var weapon = Object.values(WEAPONS).find(function (w) {
          return w.id === hero.startingWeapon;
        });
        return [{
          icon: "weapon-" + weapon.id,
          text: "\u521D\u59CB\u6B66\u5668 \xB7 " + weapon.name
        }, {
          icon: "skill-" + hero.skillIcon,
          text: "\u4E3B\u52A8 \xB7 " + hero.skillName
        }, {
          icon: "fusion-" + hero.skillIcon + "_ultimate",
          text: "\u7EC8\u6781 \xB7 " + hero.ultimateName
        }];
      }
      function guidePages(keys, mode, stage, difficulty) {
        if (mode === void 0) {
          mode = "chapter";
        }
        if (stage === void 0) {
          stage = "forest";
        }
        if (difficulty === void 0) {
          difficulty = "normal";
        }
        return [{
          title: "移动与出手",
          text: "\u81EA\u52A8\u6B66\u5668\u4F1A\u81EA\u884C\u653B\u51FB\u3002\u5148\u79FB\u52A8\u907F\u5F00\u602A\u7FA4\uFF0C\u62FE\u53D6\u7ECF\u9A8C\uFF0C\u5347\u7EA7\u65F6\u9009\u62E9\u65B0\u7684\u6B66\u5668\u6216\u529F\u6CD5\u3002\n\n\u952E\u76D8\uFF1A\u65B9\u5411\u952E\u6216 " + keys.up + keys.left + keys.down + keys.right + " \u79FB\u52A8\uFF1B" + keys.skill + " \u4E3B\u52A8\uFF0C" + keys.ultimate + " \u7EC8\u6781\u3002\u4E3B\u52A8\u770B\u51B7\u5374\uFF0C\u7EC8\u6781\u9700\u8981\u79EF\u6EE1\u80FD\u91CF\u3002\n\n\u89E6\u5C4F\uFF1A\u5DE6\u4FA7\u6447\u6746\u8F7B\u63A8\u6162\u8D70\uFF0C\u53F3\u4FA7\u6280\u80FD\u53EF\u7528\u53E6\u4E00\u6307\u91CA\u653E\u3002\u624B\u67C4\uFF1A\u5DE6\u6447\u6746\u79FB\u52A8\uFF0C\u897F\u952E\u4E3B\u52A8\u3001\u5317\u952E\u7EC8\u6781\u3002"
        }, {
          title: "找路与交互",
          text: "\u9760\u8FD1\u5546\u5E97\u3001\u5B9D\u7BB1\u6216\u901A\u9053\uFF0C\u51FA\u73B0\u540D\u79F0\u540E\u6309 " + keys.interact + " \u6216\u70B9\u51FB\u4EA4\u4E92\u6309\u94AE\uFF1B\u4E0D\u4F1A\u8D70\u8FD1\u5C31\u81EA\u52A8\u8D2D\u4E70\u3002\u624B\u67C4\u7528\u5357\u952E\u3002\n\n\u9009\u5956\u52B1\u548C\u8D2D\u7269\u65F6\u6218\u6597\u6682\u505C\u3002\u5173\u6389\u4EA4\u4E92\u540E\u56DE\u5230\u6218\u6597\uFF1B\u94DC\u94B1\u7528\u4E8E\u672C\u5C40\u5546\u5E97\uFF0C\u5546\u54C1\u6709\u9650\u8D2D\u4E14\u4F1A\u6DA8\u4EF7\u3002\n\n" + keys.map + " \u6253\u5F00\u8DEF\u7EBF\u56FE\uFF0CEsc \u8FD4\u56DE\u3002\u7AE0\u8282\u623F\u5B8C\u6210\u76EE\u6807\u624D\u5F00\u653E\u51FA\u53E3\uFF0C\u5DF2\u6E05\u623F\u53EF\u4EE5\u8FD4\u56DE\uFF1B\u65E0\u5C3D\u5927\u8352\u8FFD\u8E2A\u5173\u952E\u5730\u70B9\u7684\u65B9\u4F4D\u3001\u8DDD\u79BB\u548C\u5269\u4F59\u65F6\u95F4\u3002"
        }, {
          title: "构筑与命契",
          text: "最多 6 武器、6 功法、3 遗物；主动和终极属于英雄。公共武器和功法人人可选，专属天赋与融合体现角色差异。\n\nEsc 暂停 → 行囊：查看背景、功效和攻击方式。按住 Shift 或点详值看具体数值；命府图鉴可以查融合条件。\n\n暂停 → 保存并退出，再选同一命契继续。三档局内进度独立，命府成长与图鉴共享。重新开始会覆盖该档，请先确认；命契管理可导出本地备份。"
        }, journeyInfo(mode, stage, difficulty)];
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/NativeBackupTransfer.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('nativeRequestJson', nativeRequestJson);
      cclegacy._RF.push({}, "bf4b155Pp5EsYE3fCP7O2/3", "NativeBackupTransfer", undefined);
      /** One in-flight native file operation. The platform adapter never changes saves. */
      // Cocos 3.8.8's JS -> Java reflection uses JNI NewStringUTF (modified UTF-8).
      // ASCII JSON avoids embedded NUL / supplementary-character conversion ambiguity.
      function nativeRequestJson(value) {
        return JSON.stringify(value).replace(/[\u007f-\uffff]/g, function (c) {
          return "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0");
        });
      }
      var NativeBackupTransfer = exports('NativeBackupTransfer', /*#__PURE__*/function () {
        function NativeBackupTransfer(transport) {
          this.active = null;
          this.transport = transport;
        }
        var _proto = NativeBackupTransfer.prototype;
        _proto.run = function run(kind, limit, text) {
          var _this = this;
          if (this.active) return Promise.reject(Error("文件操作正在进行，请先完成或取消。"));
          var id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
          return new Promise(function (resolve, reject) {
            var timer;
            var finish = function finish(value, error) {
              var _this$active;
              if (((_this$active = _this.active) == null ? void 0 : _this$active.id) !== id) return;
              clearInterval(timer);
              _this.active = null;
              error ? reject(error) : resolve(value);
            };
            _this.active = {
              id: id,
              finish: finish
            };
            var poll = function poll() {
              try {
                var raw = _this.transport.poll(id);
                if (!raw) return;
                var result = JSON.parse(raw);
                if (result.id !== id) throw Error("文件操作响应不匹配，未导入任何资料。");
                if (result.status === "cancel") finish(null);else if (result.status === "error") finish(null, Error(result.message || "文件操作失败，原进度未改变。"));else if (result.status === "ok" && typeof result.text === "string") finish(result.text);else throw Error("文件操作响应无效，原进度未改变。");
              } catch (error) {
                try {
                  _this.transport.cancel(id);
                } catch (_unused) {/* retain original error */}
                finish(null, error);
              }
            };
            try {
              _this.transport.request(nativeRequestJson({
                id: id,
                kind: kind,
                limit: limit,
                text: text,
                name: "无相山海-Cocos备份-" + new Date().toISOString().slice(0, 10) + ".json"
              }));
              timer = setInterval(poll, 200);
              poll();
            } catch (error) {
              finish(null, error);
            }
          });
        };
        _proto.cancel = function cancel() {
          var current = this.active;
          if (!current) return;
          try {
            this.transport.cancel(current.id);
          } catch (_unused2) {/* Closing the panel must remain possible even if JNI is unavailable. */} finally {
            current.finish(null);
          }
        };
        return NativeBackupTransfer;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PanelInk.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _inheritsLoose, cclegacy, _decorator, Graphics, UITransform, Component;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Graphics = module.Graphics;
      UITransform = module.UITransform;
      Component = module.Component;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "6bc22uF+RZBLodhvoaFJKcY", "PanelInk", undefined);
      var ccclass = _decorator.ccclass;

      /** Native Graphics releases its render data when disabled. Restore the actual
       * panel rectangle on every enable, including ancestor and reparent toggles. */
      var PanelInk = exports('PanelInk', (_dec = ccclass("PanelInk"), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(PanelInk, _Component);
        function PanelInk() {
          return _Component.apply(this, arguments) || this;
        }
        var _proto = PanelInk.prototype;
        _proto.onEnable = function onEnable() {
          var g = this.getComponent(Graphics);
          var ui = this.getComponent(UITransform);
          if (!g || !ui) return;
          var width = ui.width,
            height = ui.height;
          g.clear();
          g.rect(-width / 2, -height / 2, width, height);
          g.fill();
          g.rect(-width / 2, -height / 2, width, height);
          g.stroke();
        };
        return PanelInk;
      }(Component)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ProfileStore.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CombatSession.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, C;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      C = module.CombatCore;
    }],
    execute: function () {
      cclegacy._RF.push({}, "1577aFipoRPY4kbk8Gi+//8", "ProfileStore", undefined);
      var KEY = exports('PROFILE_KEY', "wuxiang_cocos_profile_v1");
      var clone = function clone(value) {
        return JSON.parse(JSON.stringify(value));
      };
      var fresh = function fresh() {
        return {
          version: 1,
          meta: C.freshMetaProgression(),
          collection: C.emptyCollection(),
          nextSerial: 1,
          settled: [{
            serial: 0,
            reward: null
          }, {
            serial: 0,
            reward: null
          }, {
            serial: 0,
            reward: null
          }]
        };
      };
      var valid = exports('validProfile', function valid(value) {
        return C.isRecord(value) && value.version === 1 && C.isRecord(value.meta) && ["level", "xp", "currency", "lifetimeCurrency"].every(function (key) {
          return Number.isFinite(value.meta[key]) && value.meta[key] >= 0;
        }) && ["purchasedTalents", "equippedTalents"].every(function (key) {
          return Array.isArray(value.meta[key]) && value.meta[key].every(function (id) {
            return typeof id === "string";
          });
        }) && C.isRecord(value.collection) && C.COLLECTION_KINDS.every(function (kind) {
          return Array.isArray(value.collection[kind]) && value.collection[kind].every(function (id) {
            return typeof id === "string";
          });
        }) && Number.isSafeInteger(value.nextSerial) && value.nextSerial >= 1 && Array.isArray(value.settled) && value.settled.length === 3 && value.settled.every(function (v) {
          return C.isRecord(v) && Number.isSafeInteger(v.serial) && v.serial >= 0 && v.serial < value.nextSerial;
        });
      });

      /** Shared growth rules, separate native profile. Commit state only after durable write. */
      var ProfileStore = exports('ProfileStore', /*#__PURE__*/function () {
        function ProfileStore(storage) {
          this.data = fresh();
          this.code = "unknown";
          this.recovered = false;
          this.storage = void 0;
          this.storage = storage;
          this.reload();
        }
        var _proto = ProfileStore.prototype;
        _proto.reload = function reload() {
          var result = C.readJournal(this.storage, KEY, valid);
          this.code = result.code;
          this.recovered || (this.recovered = result.code === "recovered");
          if (result.value) {
            this.data = result.value;
            this.data.meta = C.normalizeMetaProgression(this.data.meta);
            C.ensureCollection(this.data);
          } else if (result.code === "ok") this.data = fresh();
          return ["ok", "recovered"].includes(this.code);
        };
        _proto.commit = function commit(candidate) {
          if (["corrupt", "unavailable", "memory"].includes(this.code)) return false;
          var result = C.writeJournal(this.storage, KEY, candidate, valid);
          this.code = result.code;
          if (result.ok) this.data = candidate;
          return result.ok;
        };
        _proto.allocate = function allocate() {
          if (!["ok", "recovered", "write-failed"].includes(this.code)) return null;
          var next = clone(this.data),
            serial = next.nextSerial++;
          return this.commit(next) ? serial : null;
        };
        _proto.ensureSerial = function ensureSerial(serial) {
          if (!["ok", "recovered", "write-failed"].includes(this.code)) return false;
          if (serial < this.data.nextSerial) return true;
          var next = clone(this.data);
          next.nextSerial = serial + 1;
          return this.commit(next);
        };
        _proto.isSettled = function isSettled(slot, serial) {
          var _this$data$settled;
          return Number.isSafeInteger(serial) && serial > 0 && serial <= ((_this$data$settled = this.data.settled[slot - 1]) == null ? void 0 : _this$data$settled.serial);
        };
        _proto.merge = function merge(target, discoveries) {
          for (var _iterator = _createForOfIteratorHelperLoose(C.COLLECTION_KINDS), _step; !(_step = _iterator()).done;) {
            var kind = _step.value;
            for (var _i = 0, _Array$from = Array.from((discoveries == null ? void 0 : discoveries[kind]) || []); _i < _Array$from.length; _i++) {
              var id = _Array$from[_i];
              C.recordDiscovery(target, kind, id);
            }
          }
        };
        _proto.discover = function discover(discoveries) {
          var next = clone(this.data);
          this.merge(next, discoveries);
          if (JSON.stringify(next.collection) === JSON.stringify(this.data.collection) && ["ok", "recovered"].includes(this.code)) return true;
          return this.commit(next);
        };
        _proto.settle = function settle(slot, serial, completion, discoveries) {
          if (this.isSettled(slot, serial)) return {
            ok: true,
            reward: this.data.settled[slot - 1].reward,
            repeated: true
          };
          if (!Number.isSafeInteger(serial) || serial < 1 || serial >= this.data.nextSerial || slot < 1 || slot > 3) return {
            ok: false
          };
          var next = clone(this.data);
          this.merge(next, discoveries);
          var reward = C.grantRunProgress(next.meta, completion.run, {
            dateKey: completion.dateKey
          });
          next.settled[slot - 1] = {
            serial: serial,
            reward: reward
          };
          return {
            ok: this.commit(next),
            reward: reward,
            repeated: false
          };
        };
        _proto.talent = function talent(id) {
          var next = clone(this.data);
          var result = next.meta.purchasedTalents.includes(id) ? C.toggleMetaTalent(next.meta, id) : C.purchaseMetaTalent(next.meta, id);
          if (!result.ok) return result;
          if (!this.commit(next)) return {
            ok: false,
            reason: "storage"
          };
          return result;
        };
        return ProfileStore;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ResponsiveLayout.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, _createClass, cclegacy, UITransform, Label, Graphics, Color, Sprite, view, sys, native, screen, ResolutionPolicy, Vec2, Mask, ScrollView, BlockInputEvents;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
      UITransform = module.UITransform;
      Label = module.Label;
      Graphics = module.Graphics;
      Color = module.Color;
      Sprite = module.Sprite;
      view = module.view;
      sys = module.sys;
      native = module.native;
      screen = module.screen;
      ResolutionPolicy = module.ResolutionPolicy;
      Vec2 = module.Vec2;
      Mask = module.Mask;
      ScrollView = module.ScrollView;
      BlockInputEvents = module.BlockInputEvents;
    }],
    execute: function () {
      exports({
        battleRenderScale: battleRenderScale,
        battleViewport: battleViewport,
        compactSize: compactSize,
        contextInteractionVisible: contextInteractionVisible,
        logicalViewport: logicalViewport,
        textBlockHeight: textBlockHeight,
        visualBattleView: visualBattleView
      });
      cclegacy._RF.push({}, "51b98mUp29HmZ+JT7XECkiq", "ResponsiveLayout", undefined);

      /** Empty mobile actions must not cover the battlefield; desktop stays unchanged. */
      function contextInteractionVisible(compact, playing, available) {
        return !compact || playing && available;
      }
      function textBlockHeight(text, width, font, line) {
        if (font === void 0) {
          font = 18;
        }
        if (line === void 0) {
          line = 26;
        }
        var capacity = Math.max(1, width / font);
        return text.split("\n").reduce(function (sum, row) {
          return sum + Math.max(1, Math.ceil(Array.from(row).reduce(function (n, c) {
            return n + (c.charCodeAt(0) > 255 ? 1 : 0.58);
          }, 0) / capacity)) * line;
        }, 0);
      }
      /** Android's Cocos 3.8.8 CommonScreen DPR is 1; use actual Android dp for UI only. */
      function logicalViewport(width, height, density) {
        if (density === void 0) {
          density = 1;
        }
        var scale = Number.isFinite(density) && density >= 0.5 && density <= 8 ? density : 1;
        return {
          width: Math.round(width / scale),
          height: Math.round(height / scale)
        };
      }
      function compactSize(width, height) {
        return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 && (width < 900 || height < 600);
      }

      /** Battle remains the focal surface; fixed controls only occupy its edges. */
      function battleViewport(w, h) {
        var landscape = w > h;
        var top = h / 2 - 72;
        var bottom = -h / 2 + (landscape ? 24 : 160);
        return {
          w: w - 16,
          h: Math.max(80, top - bottom),
          y: (top + bottom) / 2,
          top: top
        };
      }

      /**
       * Portrait screens need a closer presentation to keep actors, hit silhouettes
       * and attack ranges legible. This is render-only: the combat canvas, camera,
       * collision radii and spawn simulation continue to use the baseline scale.
       */
      function battleRenderScale(w, h) {
        return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > w ? 0.68 : 0.525;
      }
      /**
       * Render-only camera for a zoomed battle field. The simulation keeps using its
       * baseline canvas/camera; portrait rendering follows the hero and may reveal a
       * small strip outside a chapter wall so the full actor sprite stays visible.
       */
      function visualBattleView(options) {
        var finite = function finite(value, fallback) {
            return Number.isFinite(value) ? value : fallback;
          },
          scale = Math.max(0.01, finite(options.scale, 0.525)),
          width = Math.max(1, finite(options.fieldWidth, 1) / scale),
          height = Math.max(1, finite(options.fieldHeight, 1) / scale),
          halfW = width / 2,
          halfH = height / 2,
          playerX = finite(options.playerX, 0),
          playerY = finite(options.playerY, 0),
          logicalCenterX = finite(options.logicalCenterX, playerX),
          logicalCenterY = finite(options.logicalCenterY, playerY);
        var cx = logicalCenterX,
          cy = logicalCenterY;
        // The baseline view is intentionally byte-for-byte compatible with the old
        // camera. Only a closer visual zoom needs an independent framing center.
        if (options.followPlayer || scale > 0.525 + 1e-6) {
          cx = playerX;
          cy = playerY;
          if (options.runMode === "chapter" && !options.followPlayer) {
            var _options$edgeOverscan;
            var arenaWidth = Math.max(1, finite(options.arenaWidth, width)),
              arenaHeight = Math.max(1, finite(options.arenaHeight, height)),
              rawOverscan = (_options$edgeOverscan = options.edgeOverscan) != null ? _options$edgeOverscan : 0,
              edge = typeof rawOverscan === "number" ? {
                left: rawOverscan,
                right: rawOverscan,
                top: rawOverscan,
                bottom: rawOverscan
              } : rawOverscan,
              left = Math.max(0, finite(edge.left, 0)),
              right = Math.max(0, finite(edge.right, 0)),
              top = Math.max(0, finite(edge.top, 0)),
              bottom = Math.max(0, finite(edge.bottom, 0)),
              minX = halfW - left,
              maxX = arenaWidth - halfW + right,
              minY = halfH - top,
              maxY = arenaHeight - halfH + bottom;
            cx = minX <= maxX ? Math.max(minX, Math.min(maxX, playerX)) : arenaWidth / 2;
            cy = minY <= maxY ? Math.max(minY, Math.min(maxY, playerY)) : arenaHeight / 2;
          }
        }
        return {
          x: cx - halfW,
          y: cy - halfH,
          width: width,
          height: height,
          cx: cx,
          cy: cy
        };
      }

      /** Responsive composition of the existing native nodes, never duplicate game state/actions. */
      var ResponsiveLayout = exports('ResponsiveLayout', /*#__PURE__*/function () {
        function ResponsiveLayout(h) {
          var _this = this;
          this.compact = false;
          this.width = 960;
          this.height = 640;
          this.frame = "";
          this.pages = [];
          this.originalRoot = [];
          this.originalAll = [];
          this.focused = null;
          this.status = void 0;
          this.battleStats = void 0;
          this.safe = {
            x: 0,
            y: 0,
            w: 960,
            h: 640
          };
          this.h = h;
          this.originalRoot = this.capture(h.node, false);
          this.originalAll = this.capture(h.node, true);
          this.battleStats = h.label("", 0, 0, 14);
          this.battleStats.node.active = false;
          var page = function page(root, footer, map) {
            var _originals$filter$sor;
            if (map === void 0) {
              map = false;
            }
            var originals = _this.capture(root, false),
              all = _this.capture(root, true);
            var title = (_originals$filter$sor = originals.filter(function (s) {
              return s.node.getComponent(Label);
            }).sort(function (a, b) {
              return b.y - a.y;
            })[0]) == null ? void 0 : _originals$filter$sor.node;
            var viewport = h.child("Adaptive scroll", root);
            viewport.addComponent(UITransform);
            viewport.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
            var content = h.child("Flow content", viewport);
            content.addComponent(UITransform).setAnchorPoint(0.5, 1);
            var scroll = viewport.addComponent(ScrollView);
            scroll.content = content;
            scroll.horizontal = map;
            scroll.vertical = true;
            scroll.inertia = false;
            scroll.elastic = false;
            scroll.cancelInnerEvents = true;
            viewport.active = false;
            if (!root.getComponent(UITransform)) root.addComponent(UITransform);
            if (!root.getComponent(BlockInputEvents)) root.addComponent(BlockInputEvents);
            _this.pages.push({
              root: root,
              originals: originals,
              all: all,
              viewport: viewport,
              content: content,
              scroll: scroll,
              title: title,
              footer: footer,
              signature: "",
              fresh: true,
              map: map
            });
          };
          var named = function named(root, re) {
            return root.children.find(function (n) {
              return re.test(n.name);
            }) || null;
          };
          page(h.menu, function () {
            return h.startLabel.node.parent;
          });
          page(h.overlay, function () {
            return h.resumeButton.active ? h.resumeButton : h.exitLabel.node.parent.active ? h.exitLabel.node.parent : null;
          });
          page(h.settingsPanel, function () {
            return named(h.settingsPanel, /^返回/);
          });
          page(h.detailsPanel, function () {
            return h.detailsClose.node.parent;
          });
          page(h.profilePanel, function () {
            return named(h.profilePanel, /^返回/);
          });
          page(h.manager.node, function () {
            return named(h.manager.node, /^取消/);
          });
          page(h.guidePanel, function () {
            return h.guideBack;
          });
          page(h.mapPanel, function () {
            return h.mapCloseLabel.node.parent;
          }, true);
          this.status = h.label("", 0, 0, 15);
          this.status.node.active = false;
        }
        var _proto = ResponsiveLayout.prototype;
        _proto.capture = function capture(root, deep) {
          var result = [];
          for (var _iterator = _createForOfIteratorHelperLoose(root.children), _step; !(_step = _iterator()).done;) {
            var n = _step.value;
            var ui = n.getComponent(UITransform),
              l = n.getComponent(Label);
            result.push({
              node: n,
              parent: root,
              index: n.getSiblingIndex(),
              x: n.position.x,
              y: n.position.y,
              w: (ui == null ? void 0 : ui.width) || 0,
              h: (ui == null ? void 0 : ui.height) || 0,
              sx: n.scale.x,
              sy: n.scale.y,
              font: l == null ? void 0 : l.fontSize,
              line: l == null ? void 0 : l.lineHeight,
              overflow: l == null ? void 0 : l.overflow,
              wrap: l == null ? void 0 : l.enableWrapText,
              align: l == null ? void 0 : l.horizontalAlign
            });
            if (deep) result.push.apply(result, this.capture(n, true));
          }
          return result;
        };
        _proto.restore = function restore(list) {
          for (var _iterator2 = _createForOfIteratorHelperLoose(list), _step2; !(_step2 = _iterator2()).done;) {
            var _n$getComponent;
            var s = _step2.value;
            var n = s.node;
            this.parent(n, s.parent);
            n.setSiblingIndex(s.index);
            n.setPosition(s.x, s.y);
            n.setScale(s.sx, s.sy, 1);
            var l = n.getComponent(Label);
            if (l) {
              l.fontSize = s.font;
              l.lineHeight = s.line;
              l.overflow = s.overflow;
              l.enableWrapText = s.wrap;
              l.horizontalAlign = s.align;
            }
            (_n$getComponent = n.getComponent(UITransform)) == null || _n$getComponent.setContentSize(s.w, s.h);
            if (n.name === "Panel") this.box(n, s.w, s.h);
            if (n.name === "ControllerFocus") {
              var parent = n.parent.getComponent(UITransform);
              this.box(n, parent.width + 4, parent.height + 4, true);
            }
          }
        };
        _proto.box = function box(n, w, h, ring) {
          if (ring === void 0) {
            ring = false;
          }
          var g = n.getComponent(Graphics);
          if (!g) return;
          var ui = n.getComponent(UITransform);
          if (n.__boxSize === w + "," + h) return;
          n.__boxSize = w + "," + h;
          ui == null || ui.setContentSize(w, h);
          g.clear();
          if (!ring) {
            var _n$parent;
            g.fillColor = (_n$parent = n.parent) != null && _n$parent.getChildByName("ControllerFocus") ? new Color(34, 49, 40, 255) : new Color(22, 32, 29, 255);
            g.rect(-w / 2, -h / 2, w, h);
            g.fill();
          }
          g.strokeColor = new Color(ring ? "#eed493" : "#6e866c");
          g.lineWidth = ring ? 3 : 1;
          g.rect(-w / 2, -h / 2, w, h);
          g.stroke();
        };
        _proto.parent = function parent(n, target) {
          if (n.parent === target) return;
          // Cocos 3.8 reattaches masks on reparent but does not invalidate pointer
          // ordering when both parents are active. Public deactivate/reactivate also
          // refreshes native render/event state without private engine hooks.
          var active = n.active;
          n.active = false;
          n.setParent(target);
          n.active = active;
        };
        _proto.label = function label(n, w, font) {
          if (font === void 0) {
            font = 18;
          }
          var l = n.getComponent(Label);
          if (!l) return 0;
          l.fontSize = font;
          l.lineHeight = font + 8;
          l.enableWrapText = true;
          l.overflow = Label.Overflow.CLAMP;
          var height = textBlockHeight(l.string, w, font, font + 8);
          n.getComponent(UITransform).setContentSize(w, height);
          return height;
        };
        _proto.button = function button(n, w) {
          var _n$getChildByName;
          var l = (_n$getChildByName = n.getChildByName("Label")) == null ? void 0 : _n$getChildByName.getComponent(Label);
          if (!l) return 52;
          var icons = n.children.filter(function (c) {
            return c.getComponent(Sprite);
          });
          var tw = w - (icons.length ? 76 : 24),
            height = Math.max(52, this.label(l.node, tw, 18) + 20);
          l.node.setPosition(icons.length ? 24 : 0, 0);
          n.getComponent(UITransform).setContentSize(w, height);
          for (var _iterator3 = _createForOfIteratorHelperLoose(icons), _step3; !(_step3 = _iterator3()).done;) {
            var c = _step3.value;
            c.setPosition(-w / 2 + 30, 0);
            c.getComponent(UITransform).setContentSize(36, 36);
          }
          var bg = n.getChildByName("Panel"),
            ring = n.getChildByName("ControllerFocus");
          if (bg) this.box(bg, w, height);
          if (ring) this.box(ring, w + 4, height + 4, true);
          return height;
        };
        _proto.tick = function tick() {
          var _this2 = this;
          var frame = view.getFrameSize(),
            key = Math.round(frame.width) + "," + Math.round(frame.height);
          if (key !== this.frame) {
            var f = frame;
            if (sys.isNative && sys.os === sys.OS.ANDROID) {
              var density = 1;
              try {
                density = native.reflection.callStaticMethod("com/cocos/game/AppActivity", "getUiDensity", "()F");
              } catch (_unused) {/* Older host: retain valid pixel geometry rather than stopping the game. */}
              var physical = screen.windowSize;
              f = logicalViewport(physical.width, physical.height, density);
            }
            var was = this.frame;
            this.frame = key;
            this.focused = null;
            this.compact = compactSize(f.width, f.height);
            this.width = this.compact ? Math.round(f.width) : 960;
            this.height = this.compact ? Math.round(f.height) : 640;
            view.setDesignResolutionSize(this.width, this.height, ResolutionPolicy.SHOW_ALL);
            this.restore(this.originalAll);
            for (var _iterator4 = _createForOfIteratorHelperLoose(this.pages), _step4; !(_step4 = _iterator4()).done;) {
              var p = _step4.value;
              this.restore(p.all);
              p.viewport.active = this.compact;
              p.signature = "";
              p.fresh = true;
              p.root.setPosition(0, 0);
            }
            if (was && this.h.session) {
              this.h.session.pause();
              this.h.clearInput();
              this.h.renderOverlay(this.h.session);
            }
            var safe = sys.getSafeAreaRect(false);
            this.safe = {
              x: safe.x + safe.width / 2 - this.width / 2,
              y: safe.y + safe.height / 2 - this.height / 2,
              w: Math.min(this.width, safe.width),
              h: Math.min(this.height, safe.height)
            };
            if (!this.compact) {
              this.h.joystick.setVisible(false);
              this.h.movementToggle.active = false;
              for (var _iterator5 = _createForOfIteratorHelperLoose(this.h.directionButtons), _step5; !(_step5 = _iterator5()).done;) {
                var d = _step5.value;
                d.node.active = true;
              }
              this.h.battle.getComponent(UITransform).setContentSize(630, 420);
              this.status.node.active = false;
              this.battleStats.node.active = false;
              for (var _i = 0, _arr = [this.h.miniMap.node, this.h.markers.node, this.h.routeLabel.node, this.h.controlsHint.node].concat(this.h.weaponLabels.map(function (l) {
                  return l.node;
                })); _i < _arr.length; _i++) {
                var n = _arr[_i];
                n.active = true;
              }
              this.originalRoot.find(function (s) {
                return /^收起 \/ 显示地图/.test(s.node.name);
              }).node.active = true;
              if (this.h.session) {
                this.h.session.canvas.width = 1200;
                this.h.session.canvas.height = 800;
                this.h.session._updateCamera();
              }
            }
          }
          if (!this.compact) {
            if (this.h.menu.activeInHierarchy) this.menuDesktop();
            // Long pause/settlement copy needs the same readable flow as mobile.
            // Keep choice/interaction screens on their existing desktop geometry.
            var _p = this.pages.find(function (page) {
              return page.root === _this2.h.overlay;
            });
            var reading = _p.root.activeInHierarchy && this.h.pauseDetail.node.active;
            if (reading) {
              _p.viewport.active = true;
              this.flow(_p, {
                x: 0,
                y: 0,
                w: 870,
                h: 560
              });
            } else {
              if (_p.viewport.active) {
                this.restore(_p.all);
                _p.viewport.active = false;
                _p.root.setPosition(0, 0);
              }
              _p.fresh = true;
              _p.signature = "";
            }
            return;
          }
          for (var _iterator6 = _createForOfIteratorHelperLoose(this.pages), _step6; !(_step6 = _iterator6()).done;) {
            var _p2 = _step6.value;
            if (!_p2.root.activeInHierarchy) {
              _p2.fresh = true;
              continue;
            }
            this.flow(_p2);
          }
          this.battle();
        };
        _proto.menuDesktop = function menuDesktop() {
          var _this3 = this,
            _p$originals$find2;
          var h = this.h,
            p = this.pages.find(function (p) {
              return p.root === h.menu;
            });
          var signature = "desktop:" + h.editingNew + p.originals.map(function (s) {
            var _s$node$getComponent, _s$node$getChildByNam;
            return s.node.active + ":" + (((_s$node$getComponent = s.node.getComponent(Label)) == null ? void 0 : _s$node$getComponent.string) || ((_s$node$getChildByNam = s.node.getChildByName("Label")) == null || (_s$node$getChildByNam = _s$node$getChildByNam.getComponent(Label)) == null ? void 0 : _s$node$getChildByNam.string) || "");
          }).join("|");
          if (p.signature === signature) return;
          p.signature = signature;
          var text = function text(l, x, y, w, height, font) {
            l.node.setPosition(x, y);
            l.node.getComponent(UITransform).setContentSize(w, height);
            l.fontSize = font;
            l.lineHeight = font + 7;
            l.enableWrapText = true;
            l.overflow = Label.Overflow.CLAMP;
          };
          var button = function button(n, x, y, w) {
            if (!n) return;
            _this3.button(n, w);
            n.setPosition(x, y);
          };
          var named = function named(name) {
            var _p$originals$find;
            return (_p$originals$find = p.originals.find(function (s) {
              return s.node.name === name;
            })) == null ? void 0 : _p$originals$find.node;
          };
          this.box(h.menu.getChildByName("Panel"), 944, 636);
          text(p.title.getComponent(Label), -270, 275, 320, 48, 34);
          var caption = (_p$originals$find2 = p.originals.find(function (s) {
            return s.y === 201;
          })) == null ? void 0 : _p$originals$find2.node.getComponent(Label);
          if (caption) text(caption, 170, 280, 510, 28, 14);
          h.slotLabels.forEach(function (l, i) {
            button(l.node.parent, (i - 1) * 292, 209, 278);
            l.fontSize = 15;
            l.lineHeight = 20;
            l.node.getComponent(UITransform).setContentSize(254, 42);
          });
          h.portrait.node.setPosition(-292, 66);
          h.portrait.node.getComponent(UITransform).setContentSize(196, 196);
          text(h.journeySummary, -292, -42, 278, 44, 15);
          text(h.title, 135, 140, 506, 46, 32);
          text(h.detail, 135, 91, 506, 62, 17);
          h.kitLabels.forEach(function (l, i) {
            text(l, 163, 36 - i * 34, 392, 29, 17);
            l.horizontalAlign = Label.HorizontalAlign.LEFT;
            h.kitIcons[i].node.setPosition(-232, 0);
          });
          text(h.talentText, 135, -88, 506, 76, 16);
          button(named("上一位"), -366, -91, 132);
          button(named("下一位"), -220, -91, 132);
          button(named("切换初始天赋"), 5, -147, 238);
          button(h.difficultyLabel.node.parent, 265, -147, 238);
          button(h.modeLabel.node.parent, 5, -208, 238);
          button(h.stageLabel.node.parent, 265, -208, 238);
          button(named("命契管理"), -366, -151, 132);
          button(named("设置"), -220, -151, 132);
          var profile = named("命府 · 等级 / 天赋 / 图鉴");
          profile.getChildByName("Label").getComponent(Label).string = "命府 / 图鉴";
          button(profile, -366, -211, 132);
          button(named("操作指南"), -220, -211, 132);
          button(h.startLabel.node.parent, h.editingNew ? 286 : 135, -275, h.editingNew ? 240 : 498);
          button(h.newButton, h.editingNew ? 25 : -292, -275, h.editingNew ? 240 : 278);
          button(h.cancelNew, -292, -275, 278);
          text(h.notice, 0, -310, 900, 24, 12);
        };
        _proto.flow = function flow(p, area) {
          var _this4 = this;
          if (area === void 0) {
            area = this.safe;
          }
          var _area = area,
            w = _area.w,
            h = _area.h,
            x = _area.x,
            y = _area.y;
          p.root.setPosition(x, y);
          p.root.getComponent(UITransform).setContentSize(w, h);
          var background = p.root.getChildByName("Panel");
          if (background) this.box(background, w, h);
          var footer = p.footer();
          var signature = p.originals.map(function (s) {
            var _s$node$getComponent2, _s$node$getChildByNam2;
            return s.node.active + ":" + (((_s$node$getComponent2 = s.node.getComponent(Label)) == null ? void 0 : _s$node$getComponent2.string) || ((_s$node$getChildByNam2 = s.node.getChildByName("Label")) == null || (_s$node$getChildByNam2 = _s$node$getChildByNam2.getComponent(Label)) == null ? void 0 : _s$node$getChildByNam2.string) || "");
          }).join("|") + (footer == null ? void 0 : footer.uuid) + (w + "," + h);
          if (!p.fresh && signature === p.signature) return;
          var previous = p.scroll.getScrollOffset();
          p.signature = signature;
          var landscape = w > h,
            portrait = p.root === this.h.menu ? this.h.portrait.node : null;
          var sidePortrait = portrait && landscape;
          var flowW = Math.min(720, w - 32 - (sidePortrait ? 164 : 0)),
            centerX = sidePortrait ? 82 : 0;
          // Saving must acknowledge success/failure without another scroll gesture.
          var notice = p.root === this.h.overlay && this.h.pauseDetail.node.active ? this.h.saveNotice.node : null;
          var noticeHeight = notice ? this.label(notice, flowW, 14) : 0;
          var noticeSpace = notice ? noticeHeight + 8 : 0;
          var viewportH = Math.max(100, h - 144 - noticeSpace);
          p.viewport.setPosition(centerX, noticeSpace / 2);
          p.viewport.getComponent(UITransform).setContentSize(flowW, viewportH);
          p.content.setPosition(0, viewportH / 2);
          if (p.title) {
            this.parent(p.title, p.root);
            this.label(p.title, w - 32, 24);
            p.title.setPosition(0, h / 2 - 42);
          }
          if (footer) {
            this.parent(footer, p.root);
            var bh = this.button(footer, Math.min(w - 32, 480));
            footer.setPosition(0, -h / 2 + bh / 2 + 12);
            if (notice) {
              this.parent(notice, p.root);
              notice.setPosition(0, -h / 2 + 12 + bh + 8 + noticeHeight / 2);
            }
          }
          var guideNav = p.root === this.h.guidePanel ? p.originals.filter(function (s) {
            return ["上一页", "下一页"].includes(s.node.name);
          }).map(function (s) {
            return s.node;
          }) : [];
          if (guideNav.length && footer) {
            var width = Math.min(180, (w - 48) / 3);
            for (var _iterator7 = _createForOfIteratorHelperLoose([guideNav[0], footer, guideNav[1]].entries()), _step7; !(_step7 = _iterator7()).done;) {
              var _step7$value = _step7.value,
                i = _step7$value[0],
                n = _step7$value[1];
              this.parent(n, p.root);
              var _bh = this.button(n, width);
              n.setPosition((i - 1) * (width + 8), -h / 2 + _bh / 2 + 12);
            }
          }
          if (sidePortrait) {
            this.parent(portrait, p.root);
            portrait.setPosition(-w / 2 + 90, 0);
            portrait.getComponent(UITransform).setContentSize(148, 148);
          }
          var items = p.originals.filter(function (s) {
            var _s$node$getComponent3;
            return s.node !== p.title && s.node !== footer && s.node !== notice && !guideNav.includes(s.node) && s.node !== background && s.node.active && (((_s$node$getComponent3 = s.node.getComponent(Label)) == null ? void 0 : _s$node$getComponent3.string) || s.node.getChildByName("Label") || s.node.getComponent(Sprite) || p.map && s.node === _this4.h.mapGraphics.node) && !(sidePortrait && s.node === portrait);
          });
          var height = 0;
          if (p.map) {
            for (var _iterator8 = _createForOfIteratorHelperLoose(items), _step8; !(_step8 = _iterator8()).done;) {
              var s = _step8.value;
              this.parent(s.node, p.content);
              s.node.setPosition(s.x, s.y - 220);
            }
            height = 1000;
            p.content.getComponent(UITransform).setContentSize(780, height);
          } else {
            var priority = function priority(s) {
              if (p.root !== _this4.h.menu) return -s.y;
              if (s.node === portrait) return -1000;
              if (s.node === _this4.h.title.node) return -990;
              if (s.node === _this4.h.detail.node) return -980;
              if (s.node === _this4.h.talentText.node) return -970;
              if (s.node === _this4.h.journeySummary.node) return -979;
              if (_this4.h.kitLabels.some(function (l) {
                return l.node === s.node;
              })) return -975 + _this4.h.kitLabels.findIndex(function (l) {
                return l.node === s.node;
              });
              if (_this4.h.slotLabels.some(function (l) {
                return l.node.parent === s.node;
              })) return -1100;
              if (["上一位", "下一位", "切换初始天赋"].includes(s.node.name)) return -960;
              return -s.y;
            };
            items.sort(function (a, b) {
              return priority(a) - priority(b) || a.x - b.x;
            });
            var _loop = function _loop(_i3) {
              var s = items[_i3],
                n = s.node;
              _this4.parent(n, p.content);
              var isButton = !!n.getChildByName("ControllerFocus");
              if (isButton) {
                var group = [s];
                var j = _i3 + 1;
                while (j < items.length && Math.abs(items[j].y - s.y) < 2 && items[j].node.getChildByName("ControllerFocus")) {
                  group.push(items[j++]);
                }
                var _short = group.every(function (v) {
                  var t = v.node.getChildByName("Label").getComponent(Label).string;
                  return !t.includes("\n") && t.length <= 12;
                });
                var cols = _short ? Math.min(group.length, flowW >= 600 ? 3 : 2) : 1,
                  bw = (flowW - (cols - 1) * 8) / cols;
                var _loop2 = function _loop2() {
                  var row = group.slice(k, k + cols),
                    heights = row.map(function (v) {
                      _this4.parent(v.node, p.content);
                      return _this4.button(v.node, bw);
                    }),
                    rh = Math.max.apply(Math, heights);
                  row.forEach(function (v, c) {
                    return v.node.setPosition(-flowW / 2 + bw / 2 + c * (bw + 8), -height - rh / 2);
                  });
                  height += rh + 12;
                };
                for (var k = 0; k < group.length; k += cols) {
                  _loop2();
                }
                _i3 = j;
                _i2 = _i3;
                return 1; // continue
              }

              var l = n.getComponent(Label);
              var rh = 0;
              if (l) {
                rh = _this4.label(n, flowW, s.node === _this4.h.title.node ? 26 : 18);
                if (_this4.h.kitLabels.some(function (l) {
                  return l.node === n;
                })) {
                  rh = _this4.label(n, flowW - 46, 18);
                  n.children.filter(function (c) {
                    return c.getComponent(Sprite);
                  }).forEach(function (c) {
                    return c.setPosition(-flowW / 2 + 12, 0);
                  });
                }
              } else if (n.getComponent(Sprite)) {
                rh = n === portrait ? 124 : 48;
                n.getComponent(UITransform).setContentSize(rh, rh);
              }
              n.setPosition(0, -height - rh / 2);
              height += rh + 12;
              _i3++;
              _i2 = _i3;
            };
            for (var _i2 = 0; _i2 < items.length;) {
              if (_loop(_i2)) continue;
            }
            p.content.getComponent(UITransform).setContentSize(flowW, Math.max(viewportH, height));
          }
          if (p.fresh) p.scroll.scrollToTopLeft(0);else p.scroll.scrollToOffset(new Vec2(Math.max(0, previous.x), Math.min(Math.max(0, height - viewportH), Math.max(0, previous.y))), 0);
          p.fresh = false;
        };
        _proto.battle = function battle() {
          var _this5 = this,
            _h$session;
          var h = this.h,
            _w$height = {
              w: this.safe.w,
              height: this.safe.h
            },
            w = _w$height.w,
            height = _w$height.height,
            landscape = w > height,
            cx = this.safe.x,
            cy = this.safe.y;
          var rootButton = function rootButton(re) {
            var _this5$originalRoot$f;
            return (_this5$originalRoot$f = _this5.originalRoot.find(function (s) {
              return re.test(s.node.name) && s.node.getChildByName("ControllerFocus");
            })) == null ? void 0 : _this5$originalRoot$f.node;
          };
          var place = function place(n, x, y, width) {
            if (!n) return;
            if (n === h.skillLabel.node.parent || n === h.ultimateLabel.node.parent) {
              var l = n.getChildByName("Label"),
                lh = _this5.label(l, width - 12, 16),
                _bh2 = Math.max(88, lh + 40);
              l.setPosition(0, -14);
              n.getComponent(UITransform).setContentSize(width, _bh2);
              for (var _iterator9 = _createForOfIteratorHelperLoose(n.children.filter(function (c) {
                  return c.getComponent(Sprite);
                })), _step9; !(_step9 = _iterator9()).done;) {
                var icon = _step9.value;
                icon.setPosition(0, _bh2 / 2 - 17);
                icon.getComponent(UITransform).setContentSize(24, 24);
              }
              _this5.box(n.getChildByName("Panel"), width, _bh2);
              _this5.box(n.getChildByName("ControllerFocus"), width + 4, _bh2 + 4, true);
            } else _this5.button(n, width);
            n.setPosition(cx + x, cy + y);
          };
          var pause = rootButton(/^暂停/);
          pause.getChildByName("Label").getComponent(Label).string = ((_h$session = h.session) == null ? void 0 : _h$session.state) === "paused" ? "继续" : "暂停";
          place(pause, -w / 2 + 44, height / 2 - 36, 64);
          place(this.h.routeButtonLabel.node.parent, w / 2 - 56, height / 2 - 36, 100);
          var hud = this.h.hud.node;
          this.label(hud, w - 188, 14);
          hud.setPosition(cx - 12, cy + height / 2 - 36);
          this.battleStats.node.active = !!h.session && !h.controllerScope();
          this.label(this.battleStats.node, w - 24, 14);
          this.battleStats.node.setPosition(cx, cy + height / 2 - 76);
          if (h.session) {
            var s = h.session,
              seconds = Math.floor(s.gameTime);
            this.battleStats.string = Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0") + "  \xB7  " + s.kills + " \u65A9  \xB7  " + s.runCoins + " \u94DC\u94B1";
          }
          var bottom = -height / 2 + 16;
          var dirs = [[/^↑$/, -w / 2 + 92, bottom + 146], [/^←$/, -w / 2 + 36, bottom + 82], [/^↓$/, -w / 2 + 92, bottom + 82], [/^→$/, -w / 2 + 148, bottom + 82]];
          var controlsVisible = !!h.session && !h.controllerScope();
          for (var _i4 = 0, _dirs = dirs; _i4 < _dirs.length; _i4++) {
            var _dirs$_i = _dirs[_i4],
              re = _dirs$_i[0],
              x = _dirs$_i[1],
              y = _dirs$_i[2];
            var n = rootButton(re);
            n.active = controlsVisible && h.directionMode;
            place(n, x, y, 48);
          }
          h.joystick.setVisible(controlsVisible && !h.directionMode);
          h.joystick.node.setPosition(cx - w / 2 + 94, cy + bottom + 126);
          h.movementToggle.active = controlsVisible;
          place(h.movementToggle, -w / 2 + 94, bottom + 16, 156);
          place(h.skillLabel.node.parent, w / 2 - 72, bottom + 164, 120);
          place(h.ultimateLabel.node.parent, w / 2 - 72, bottom + 64, 120);
          place(h.interactLabel.node.parent, landscape ? 0 : 0, landscape ? bottom + 40 : bottom + 248, landscape ? Math.max(160, w - 392) : w - 32);
          var field = battleViewport(w, height),
            bh = field.h,
            bw = field.w;
          h.battleRenderScale = battleRenderScale(w, height);
          h.battle.setPosition(cx, cy + field.y);
          h.battle.getComponent(UITransform).setContentSize(bw, bh);
          if (h.session) {
            h.session.canvas.width = bw / 0.525;
            h.session.canvas.height = bh / 0.525;
            h.session._updateCamera();
          }
          var mapPage = this.pages.find(function (p) {
            return p.map;
          });
          if (h.mapOpen) {
            this.parent(h.miniMap.node, mapPage.content);
            h.miniMap.node.setScale(1, 1, 1);
            h.miniMap.node.setPosition(-280, -650);
            this.parent(h.markers.node, mapPage.content);
            this.label(h.markers.node, 470, 18);
            h.markers.node.setPosition(80, -690);
            h.miniMap.node.active = true;
            h.markers.node.active = true;
          } else {
            this.parent(h.miniMap.node, h.node);
            h.miniMap.node.setScale(0.5, 0.5, 1);
            h.miniMap.node.setPosition(cx + bw / 2 - (landscape ? 180 : 40), cy + height / 2 - 166);
            h.miniMap.node.active = !!h.session && !h.controllerScope();
            h.markers.node.active = false;
          }
          h.routeLabel.node.active = false;
          rootButton(/^收起 \/ 显示地图/).active = false;
          for (var i = 0; i < h.weaponIcons.length; i++) {
            h.weaponIcons[i].node.setPosition(cx - w / 2 + 24 + i * 32, cy + height / 2 - 140);
            h.weaponLabels[i].node.active = false;
          }
          h.controlsHint.node.active = !!h.coachText && controlsVisible;
          this.label(h.controlsHint.node, landscape ? Math.max(120, w - 425) : w - 112, 13);
          h.controlsHint.node.getComponent(UITransform).setContentSize(landscape ? Math.max(120, w - 425) : w - 112, 40);
          h.controlsHint.lineHeight = 18;
          h.controlsHint.node.setPosition(cx + (landscape ? -8 : -44), cy + height / 2 - (landscape ? 140 : 180));
          this.status.node.active = !!h.session && !h.controllerScope();
          this.label(this.status.node, w - 24, 14);
          this.status.node.setPosition(cx, cy + height / 2 - 106);
          this.status.string = h.session ? h.routeLabel.string.split("\n").filter(Boolean).join(" · ") : "";
          h.padHint.node.setPosition(cx, cy + height / 2 - 8);
          h.padHint.fontSize = 10;
          h.fpsLabel.node.setPosition(cx + w / 2 - 32, cy + height / 2 - 10);
        };
        _proto.reveal = function reveal(n) {
          if (!n) return;
          var p = this.pages.find(function (p) {
            return p.viewport.active && n.isChildOf(p.content);
          });
          if (!p) return;
          var pos = n.position,
            ui = n.getComponent(UITransform),
            vh = p.viewport.getComponent(UITransform).height;
          var top = -pos.y - ui.height / 2,
            bottom = -pos.y + ui.height / 2,
            offset = p.scroll.getScrollOffset();
          if (top < offset.y) p.scroll.scrollToOffset(new Vec2(offset.x, top), 0);else if (bottom > offset.y + vh) p.scroll.scrollToOffset(new Vec2(offset.x, Math.max(0, bottom - vh)), 0);
        };
        _proto.readingStart = function readingStart(root) {
          var p = this.pages.find(function (p) {
            return p.root === root;
          });
          if (!p) return;
          p.scroll.stopAutoScroll();
          p.fresh = true;
          p.signature = "";
        };
        _proto.followFocus = function followFocus(n) {
          if (n !== this.focused) {
            this.focused = n;
            this.reveal(n);
          }
        };
        _proto.legacyButton = function legacyButton(x, y) {
          var _this$pages$find, _buttons$find, _buttons$find2;
          var scope = this.h.controllerScope();
          var all = scope ? ((_this$pages$find = this.pages.find(function (p) {
            return p.root === scope;
          })) == null ? void 0 : _this$pages$find.originals) || [] : this.originalRoot;
          var buttons = all.filter(function (s) {
            return s.node.activeInHierarchy && s.node.getChildByName("ControllerFocus");
          });
          return ((_buttons$find = buttons.find(function (s) {
            return s.node.activeInHierarchy && s.node.getChildByName("ControllerFocus") && Math.abs(s.x - x) < 2 && Math.abs(s.y - y) < 2;
          })) == null ? void 0 : _buttons$find.node) || ((_buttons$find2 = buttons.find(function (s) {
            return Math.abs(s.x - x) <= s.w / 2 && Math.abs(s.y - y) <= s.h / 2;
          })) == null ? void 0 : _buttons$find2.node) || null;
        };
        _proto.snapshot = function snapshot() {
          var _this$h$joystick;
          return {
            compact: this.compact,
            movement: this.compact && !this.h.directionMode ? "joystick" : "buttons",
            joystick: (_this$h$joystick = this.h.joystick) == null ? void 0 : _this$h$joystick.state.value,
            battleViewport: this.compact ? battleViewport(this.safe.w, this.safe.h) : null,
            battleRenderScale: this.h.battleRenderScale,
            width: this.width,
            height: this.height,
            safe: this.safe,
            pages: this.pages.filter(function (p) {
              return p.root.activeInHierarchy;
            }).map(function (p) {
              return {
                name: p.root.name,
                offset: p.scroll.getScrollOffset(),
                height: p.content.getComponent(UITransform).height
              };
            })
          };
        };
        _createClass(ResponsiveLayout, [{
          key: "battleStatusNode",
          get: function get() {
            var _this$status;
            return (_this$status = this.status) == null ? void 0 : _this$status.node;
          }
        }]);
        return ResponsiveLayout;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SettingsStore.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CombatSession.ts', './AudioMixer.ts', './CombatCoach.ts'], function (exports) {
  var _extends, cclegacy, C, defaultAudio, validAudio, COACH_IDS;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      C = module.CombatCore;
    }, function (module) {
      defaultAudio = module.defaultAudio;
      validAudio = module.validAudio;
    }, function (module) {
      COACH_IDS = module.COACH_IDS;
    }],
    execute: function () {
      exports('validSettings', validSettings);
      cclegacy._RF.push({}, "f6ed4iJdyRDzZUSNCe0flPH", "SettingsStore", undefined);
      var ACTIONS = exports('ACTIONS', ["up", "down", "left", "right", "skill", "ultimate", "interact", "map"]);
      var ACTION_NAMES = exports('ACTION_NAMES', ["向上", "向下", "向左", "向右", "主动技能", "终极技能", "附近交互", "路线地图"]);
      var SETTING_KEYS = exports('SETTING_KEYS', ["reducedMotion", "damageNumbers", "highContrast", "showFPS", "contextHints"]);
      var SETTINGS_KEY = exports('SETTINGS_KEY', "wuxiang_cocos_settings_v1");
      var defaultSettings = exports('defaultSettings', function defaultSettings() {
        return {
          version: 1,
          reducedMotion: false,
          damageNumbers: true,
          highContrast: false,
          showFPS: false,
          contextHints: true,
          hintHistory: [],
          audio: defaultAudio(),
          bindings: {
            up: 87,
            down: 83,
            left: 65,
            right: 68,
            skill: 69,
            ultimate: 81,
            interact: 70,
            map: 77
          }
        };
      });
      function validSettings(v) {
        return C.isRecord(v) && v.version === 1 && (v.audio === undefined || validAudio(v.audio)) && SETTING_KEYS.slice(0, 4).every(function (k) {
          return typeof v[k] === "boolean";
        }) && (v.contextHints === undefined || typeof v.contextHints === "boolean") && (v.hintHistory === undefined || Array.isArray(v.hintHistory) && v.hintHistory.length <= COACH_IDS.length && new Set(v.hintHistory).size === v.hintHistory.length && v.hintHistory.every(function (id) {
          return COACH_IDS.includes(id);
        })) && C.isRecord(v.bindings) && ACTIONS.every(function (a) {
          return Number.isInteger(v.bindings[a]) && v.bindings[a] >= 65 && v.bindings[a] <= 90;
        }) && new Set(ACTIONS.map(function (a) {
          return v.bindings[a];
        })).size === ACTIONS.length;
      }
      /** Native key codes, unlike the browser keymap's DOM strings. Same durable journal. */
      var SettingsStore = exports('SettingsStore', /*#__PURE__*/function () {
        function SettingsStore(storage) {
          this.data = defaultSettings();
          this.code = "unknown";
          this.storage = storage;
          this.reload();
        }
        var _proto = SettingsStore.prototype;
        _proto.reload = function reload() {
          var r = C.readJournal(this.storage, SETTINGS_KEY, validSettings);
          this.code = r.code;
          if (r.value) this.data = _extends({}, defaultSettings(), r.value, {
            audio: r.value.audio || defaultAudio()
          });else if (r.code === "ok") this.data = defaultSettings();
          return ["ok", "recovered"].includes(this.code);
        };
        _proto.commit = function commit(candidate) {
          if (!validSettings(candidate) || ["corrupt", "unavailable", "memory"].includes(this.code)) return false;
          var r = C.writeJournal(this.storage, SETTINGS_KEY, candidate, validSettings);
          this.code = r.code;
          if (r.ok) this.data = JSON.parse(JSON.stringify(candidate));
          return r.ok;
        };
        _proto.toggle = function toggle(key) {
          var _extends2;
          if (!SETTING_KEYS.includes(key)) return false;
          return this.commit(_extends({}, this.data, (_extends2 = {}, _extends2[key] = !this.data[key], _extends2)));
        };
        _proto.rememberHints = function rememberHints(ids) {
          return this.commit(_extends({}, this.data, {
            hintHistory: ids
          }));
        };
        _proto.sound = function sound(key, delta) {
          if (delta === void 0) {
            delta = 20;
          }
          if (!["muted", "master", "sfx", "music"].includes(key)) return false;
          var audio = _extends({}, this.data.audio || defaultAudio());
          if (key === "muted") audio.muted = !audio.muted;else audio[key] = Math.max(0, Math.min(100, audio[key] + delta));
          return this.commit(_extends({}, this.data, {
            audio: audio
          }));
        };
        _proto.bind = function bind(action, code) {
          var _this = this,
            _extends3;
          if (!ACTIONS.includes(action) || !Number.isInteger(code) || code < 65 || code > 90) return "unsupported";
          if (ACTIONS.some(function (a) {
            return a !== action && _this.data.bindings[a] === code;
          })) return "conflict";
          return this.commit(_extends({}, this.data, {
            bindings: _extends({}, this.data.bindings, (_extends3 = {}, _extends3[action] = code, _extends3))
          })) ? "ok" : "write-failed";
        };
        _proto.reset = function reset() {
          return this.commit(defaultSettings());
        };
        return SettingsStore;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/shared-core.js", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, _createClass, cclegacy;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        _applyColdTick: _applyColdTick,
        _computeDifficultyMults: _computeDifficultyMults,
        _grantWorldItem: _grantWorldItem,
        _handleChapterRoomClear: _handleChapterRoomClear,
        _itemOption: _itemOption,
        _resolveWorldInteraction: _resolveWorldInteraction,
        _sceneItemOptions: _sceneItemOptions,
        _selectWave: _selectWave,
        _setupChapterRoom: _setupChapterRoom,
        _spawnBoss: _spawnBoss,
        _spawnChapterExits: _spawnChapterExits,
        _spawnLogic: _spawnLogic,
        _spawnOne: _spawnOne,
        _supplyOption: _supplyOption,
        _tickEndlessBoss: _tickEndlessBoss,
        _worldInteractionOptions: _worldInteractionOptions,
        addMetaXp: addMetaXp,
        applyGamepadDeadzone: applyGamepadDeadzone,
        applyHeroTalent: applyHeroTalent,
        applyLevelReward: applyLevelReward,
        applyMetaTalents: applyMetaTalents,
        bossCombatSnapshot: bossCombatSnapshot,
        buildCovenantSnapshot: buildCovenantSnapshot,
        buildPauseCodex: buildPauseCodex,
        buildingBounds: buildingBounds,
        closedBuildingLabel: closedBuildingLabel,
        collectionProgress: collectionProgress,
        collectionView: collectionView,
        covenantSummary: covenantSummary,
        damageHistoryCard: damageHistoryCard,
        damageRecap: damageRecap,
        deleteCovenant: deleteCovenant,
        emptyCollection: emptyCollection,
        endlessDifficultyScales: endlessDifficultyScales,
        enemyArchetypeSlot: enemyArchetypeSlot,
        enemyDamageSource: enemyDamageSource,
        enemyHitRadius: enemyHitRadius,
        ensureCollection: ensureCollection,
        eventDiscoveryId: eventDiscoveryId,
        fireBossFan: fireBossFan,
        freshMetaProgression: freshMetaProgression,
        getBossesFor: getBossesFor,
        getCovenant: getCovenant,
        getHero: getHero,
        getSaveHealth: getSaveHealth,
        getStageModifiers: getStageModifiers,
        getWavesFor: getWavesFor,
        grantRunProgress: grantRunProgress,
        heroPrefersReducedMotion: heroPrefersReducedMotion,
        isRecord: isRecord,
        isRetainedBuilding: isRetainedBuilding,
        killCoinReward: killCoinReward,
        levelChoices: levelChoices,
        loadCovenants: loadCovenants,
        localDateKey: localDateKey,
        metaXpForNext: metaXpForNext,
        normalizeMetaProgression: normalizeMetaProgression,
        onBossAbility: onBossAbility,
        performanceScore: performanceScore,
        purchaseMetaTalent: purchaseMetaTalent,
        readJournal: readJournal,
        recordDiscovery: recordDiscovery,
        recordHealthLoss: recordHealthLoss,
        registerWeaponClass: registerWeaponClass,
        renderEnemyCast: renderEnemyCast,
        resolveRectObstacle: resolveRectObstacle,
        restoreBossCombat: restoreBossCombat,
        restoreCovenantState: restoreCovenantState,
        restoreDamageHistory: restoreDamageHistory,
        ritualActionFrame: ritualActionFrame,
        sampleJoystick: sampleJoystick,
        saveCovenant: saveCovenant,
        segmentRectHit: segmentRectHit,
        spawnBossMinions: spawnBossMinions,
        terrainCourtyard: terrainCourtyard,
        terrainRoads: terrainRoads,
        toggleMetaTalent: toggleMetaTalent,
        updateEnemies: updateEnemies,
        updateEnemyProjectiles: updateEnemyProjectiles,
        updateExpOrbs: updateExpOrbs,
        updateHeroAnimation: updateHeroAnimation,
        updateMines: updateMines,
        updateProjectiles: updateProjectiles,
        validCovenants: validCovenants,
        writeCovenants: writeCovenants,
        writeJournal: writeJournal
      });
      cclegacy._RF.push({}, "4af47yrNtdOSKkx0ceAJQ36", "shared-core", undefined);
      // prototype-2d-pixel/src/config.js
      var CONFIG = exports('CONFIG', {
        CANVAS_WIDTH: 1200,
        // viewport width (camera projection size)
        CANVAS_HEIGHT: 800,
        // viewport height
        // A chapter room is bounded but equals a 3x3 set of viewports. The camera
        // follows the hero and clamps at the outer wall.
        ARENA_WIDTH: 3600,
        ARENA_HEIGHT: 2400,
        PLAYER_SPEED: 240,
        // px / second (was 4 px/frame => 240 @ 60fps)
        PLAYER_SIZE: 20,
        MAX_ENEMIES: 300,
        SPAWN_RADIUS: 900,
        DESPAWN_RADIUS: 1200,
        EXP_ORB_LIFETIME: 30,
        // seconds
        INVINCIBILITY_TIME: 0.5,
        // seconds
        PICKUP_DISTANCE: 24,
        MAGNET_BASE: 120,
        MAX_WEAPONS: 6,
        MAX_PASSIVES: 6,
        MAX_RELICS: 3,
        WEAPON_MAX_LEVEL: 5,
        WEAPON_EVOLVE_LEVEL: 5,
        PASSIVE_MAX_STACK: 5,
        TARGET_FPS: 60,
        GRID_SIZE: 50,
        // background grid overlay step
        SPATIAL_CELL_SIZE: 64,
        // spatial-hash cell size for broad-phase collision
        DT_CLAMP: 0.05,
        // max dt per frame (s); guards against tab-resume explosions
        WAVE_DURATION: 30,
        // seconds per wave announcement
        HIGHSCORE_SLOTS: 10,
        // --- v2.4: speedrun + launch tuning ---------------------------------
        SPEEDRUN_SEED: 1398231630,
        // 'SPRN' — deterministic per run
        SPEEDRUN_SPLITS: [60, 180, 300, 450, 600, 720],
        // secs: 1,3,5,7.5,10,12 min
        SPEEDRUN_MAX_SLOTS: 10,
        LEADERBOARD_PAGE_SIZE: 20,
        // how many rows the scroll UI renders at a time
        EARLY_EVOLVE_THRESHOLD: 420,
        // seconds — used by Early Evolve achievement
        NOVA_SLOW_DEFAULT: 0.5,
        // fallback slow % when def omits slowPct
        BOMBER_DEFAULT_RADIUS: 120,
        // used if data.js omits blastRadius
        // --- v2.5: polish + reflection -------------------------------------
        SEEN_BUILDS_CAP: 1e3,
        // hard upper bound on unique builds tracked in totals
        VERSION: "1.15.5-shared-world"
      });
      var GameState = exports('GameState', Object.freeze({
        MENU: "menu",
        PLAYING: "playing",
        PAUSED: "paused",
        LEVEL_UP: "levelup",
        BUILD_CHOICE: "build-choice",
        INTERACTION: "interaction",
        MILESTONE: "milestone",
        MAP: "map",
        GAMEOVER: "gameover",
        SETTINGS: "settings"
      }));
      var Difficulty = exports('Difficulty', Object.freeze({
        EASY: {
          id: "easy",
          label: "Easy",
          hpMult: 0.75,
          dmgMult: 0.75,
          spawnMult: 0.8
        },
        NORMAL: {
          id: "normal",
          label: "Normal",
          hpMult: 1,
          dmgMult: 1,
          spawnMult: 1
        },
        HARD: {
          id: "hard",
          label: "Hard",
          hpMult: 1.3,
          dmgMult: 1.25,
          spawnMult: 1.25
        },
        NIGHTMARE: {
          id: "nightmare",
          label: "Nightmare",
          hpMult: 1.75,
          dmgMult: 1.5,
          spawnMult: 1.6
        }
      }));

      // prototype-2d-pixel/src/enemy-atlas.js
      var RITUAL_SPRITES = Object.freeze({
        reaper: [0, 0],
        necromancer: [1, 0],
        ice_queen: [2, 0],
        void_lord: [3, 0],
        chrono_lich: [0, 1],
        bramble_seer: [1, 1],
        thread_chanter: [2, 1],
        frost_eye: [3, 1]
      });

      // prototype-2d-pixel/src/hero-animation.js
      var HERO_ACTION_DURATION = 0.48;
      var HERO_AUTO_ACTION_INTERVAL = 1.5;
      var reducedMotionQuery = globalThis.matchMedia == null ? void 0 : globalThis.matchMedia("(prefers-reduced-motion: reduce)");
      function heroPrefersReducedMotion() {
        return (reducedMotionQuery == null ? void 0 : reducedMotionQuery.matches) || false;
      }
      function startHeroAction(player, facing, reducedMotion) {
        if (facing === void 0) {
          facing = 1;
        }
        if (reducedMotion === void 0) {
          reducedMotion = false;
        }
        if (reducedMotion || heroPrefersReducedMotion() || player.heroAction && player.heroAction.source !== "weapon") return false;
        player.heroAction = {
          elapsed: 0,
          frame: 0,
          facing: facing < 0 ? -1 : 1,
          source: "skill"
        };
        player.autoActionQuiet = HERO_AUTO_ACTION_INTERVAL;
        return true;
      }
      function startHeroWeaponAction(player, weaponId, facing, reducedMotion) {
        if (facing === void 0) {
          facing = 1;
        }
        if (reducedMotion === void 0) {
          reducedMotion = false;
        }
        if (player.dead || reducedMotion || heroPrefersReducedMotion() || player.heroAction || (player.autoActionQuiet || 0) > 0) return false;
        player.heroAction = {
          elapsed: 0,
          frame: 0,
          facing: facing < 0 ? -1 : 1,
          source: "weapon",
          weaponId: weaponId
        };
        player.autoActionQuiet = HERO_AUTO_ACTION_INTERVAL;
        return true;
      }
      function updateHeroAnimation(player, dt, reducedMotion) {
        var _player$prevX, _player$prevY;
        if (reducedMotion === void 0) {
          reducedMotion = false;
        }
        if (Number.isFinite(dt) && dt > 0) player.autoActionQuiet = Math.max(0, (player.autoActionQuiet || 0) - Math.min(dt, 0.05));
        if (reducedMotion) player.heroAction = null;else if (player.heroAction && Number.isFinite(dt) && dt > 0) {
          var action = player.heroAction;
          action.elapsed += Math.min(dt, 0.05);
          action.frame = Math.min(3, Math.floor(action.elapsed / (HERO_ACTION_DURATION / 4)));
          if (action.elapsed >= HERO_ACTION_DURATION) player.heroAction = null;
        }
        var dx = player.x - ((_player$prevX = player.prevX) != null ? _player$prevX : player.x),
          dy = player.y - ((_player$prevY = player.prevY) != null ? _player$prevY : player.y);
        var distance = Math.hypot(dx, dy);
        if (Math.abs(dx) > 0.05) player.walkFacing = dx < 0 ? -1 : 1;
        player.walkFacing || (player.walkFacing = 1);
        if (reducedMotion || !Number.isFinite(distance) || distance < 0.01 || !(dt > 0)) {
          player.walkPhase = 0;
          player.walkFrame = 1;
          return;
        }
        player.walkPhase = ((player.walkPhase || 0) + Math.min(distance / 36, Math.min(dt, 0.05) * 7)) % 4;
        player.walkFrame = Math.floor(player.walkPhase);
      }
      function drawAnimatedHero(ctx, player) {
        return false;
      }

      // prototype-2d-pixel/src/fusion-mechanics.js
      function hasFusion(weapon, id) {
        var _weapon$fusion, _weapon$fusion2;
        return (weapon == null || (_weapon$fusion = weapon.fusion) == null ? void 0 : _weapon$fusion.id) === id || !!(weapon != null && (_weapon$fusion2 = weapon.fusion) != null && (_weapon$fusion2 = _weapon$fusion2.ids) != null && _weapon$fusion2.includes(id));
      }
      function conductHit(origin, damage, game) {
        var _game$spatial, _game$combatVisuals;
        var targets = [].concat(((_game$spatial = game.spatial) == null || _game$spatial.queryRect == null ? void 0 : _game$spatial.queryRect(origin.x, origin.y, 140)) || game.enemies).filter(function (enemy) {
          return enemy !== origin && enemy.hp > 0 && Math.hypot(enemy.x - origin.x, enemy.y - origin.y) <= 140;
        }).sort(function (a, b) {
          return Math.hypot(a.x - origin.x, a.y - origin.y) - Math.hypot(b.x - origin.x, b.y - origin.y);
        }).slice(0, 2);
        for (var _iterator3 = _createForOfIteratorHelperLoose(targets), _step3; !(_step3 = _iterator3()).done;) {
          var _game$reactions;
          var enemy = _step3.value;
          enemy.takeDamage(damage * 0.3);
          (_game$reactions = game.reactions) == null || _game$reactions.applyHit == null || _game$reactions.applyHit(enemy, "thunder", damage * 0.3);
        }
        if (targets.length) (_game$combatVisuals = game.combatVisuals) == null || _game$combatVisuals.lightning == null || _game$combatVisuals.lightning([origin].concat(targets).map(function (enemy) {
          return {
            x: enemy.x,
            y: enemy.y
          };
        }), {
          fused: true
        });
        return targets.length;
      }
      function mergeFusion(previous, recipe, output) {
        var ids = Array.from( /* @__PURE__ */new Set([].concat((previous == null ? void 0 : previous.ids) || (previous != null && previous.id ? [previous.id] : []), [recipe.id])));
        var names = Array.from( /* @__PURE__ */new Set([].concat((previous == null ? void 0 : previous.names) || (previous != null && previous.name ? [previous.name] : []), [recipe.name])));
        return {
          id: recipe.id,
          ids: ids,
          names: names,
          name: names.join(" / "),
          damageMult: Math.max((previous == null ? void 0 : previous.damageMult) || 1, 1.6, output.damageMult || 1),
          cooldownMult: Math.min((previous == null ? void 0 : previous.cooldownMult) || 1, 0.78, output.cooldownMult || 1),
          rangeMult: Math.max((previous == null ? void 0 : previous.rangeMult) || 1, 1.3, output.rangeMult || 1),
          projectileBonus: Math.max((previous == null ? void 0 : previous.projectileBonus) || 0, (output.projectileBonus || 0) + 1),
          visualTier: "mythic"
        };
      }
      var FusionFields = /*#__PURE__*/function () {
        function FusionFields() {
          this.fields = [];
          this.serial = 0;
        }
        var _proto = FusionFields.prototype;
        _proto.add = function add(x, y, radius, damage, element, duration) {
          if (duration === void 0) {
            duration = 2;
          }
          if (![x, y, radius, damage, duration].every(Number.isFinite)) return;
          this.fields.push({
            id: ++this.serial,
            x: x,
            y: y,
            radius: radius,
            damage: damage,
            element: element,
            remaining: duration,
            tick: 0.5
          });
          if (this.fields.length > 8) this.fields.shift();
        };
        _proto.update = function update(dt, game, weaponId) {
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.fields), _step4; !(_step4 = _iterator4()).done;) {
            var _game$combatVisuals2;
            var field = _step4.value;
            var activeDt = Math.min(Math.max(dt, 0), field.remaining);
            field.remaining -= activeDt;
            field.tick -= activeDt;
            while (field.tick <= 1e-8) {
              var _game$spatial2;
              field.tick += 0.5;
              var enemies = ((_game$spatial2 = game.spatial) == null || _game$spatial2.queryRect == null ? void 0 : _game$spatial2.queryRect(field.x, field.y, field.radius + 80)) || game.enemies;
              for (var _iterator5 = _createForOfIteratorHelperLoose(enemies), _step5; !(_step5 = _iterator5()).done;) {
                var _ref, _enemy$hitRadius, _game$reactions2;
                var enemy = _step5.value;
                if (enemy.hp <= 0 || Math.hypot(enemy.x - field.x, enemy.y - field.y) > field.radius + ((_ref = (_enemy$hitRadius = enemy.hitRadius) != null ? _enemy$hitRadius : enemy.size) != null ? _ref : 12)) continue;
                enemy.takeDamage(field.damage);
                if (field.element === "frost") {
                  enemy.slowPct = Math.max(enemy.slowTimer > 0 ? enemy.slowPct || 0 : 0, enemy.boss ? 0.15 : 0.5);
                  enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.65);
                }
                (_game$reactions2 = game.reactions) == null || _game$reactions2.applyHit == null || _game$reactions2.applyHit(enemy, field.element, field.damage);
              }
            }
            if (field.remaining > 0) (_game$combatVisuals2 = game.combatVisuals) == null || _game$combatVisuals2.field == null || _game$combatVisuals2.field(field.x, field.y, field.radius, field.element, {
              fused: true,
              sustained: true,
              key: "fusion:" + weaponId + ":" + field.id,
              duration: Math.min(0.15, field.remaining)
            });
          }
          this.fields = this.fields.filter(function (field) {
            return field.remaining > 0;
          });
        };
        _proto.snapshot = function snapshot() {
          return this.fields.map(function (field) {
            return _extends({}, field);
          });
        };
        _proto.restore = function restore(fields) {
          var _this = this;
          this.fields = (Array.isArray(fields) ? fields : []).filter(function (field) {
            return field && ["x", "y", "radius", "damage", "remaining", "tick"].every(function (key) {
              return Number.isFinite(field[key]);
            }) && field.remaining > 0 && field.remaining <= 3 && field.radius > 0 && field.radius <= 500 && field.damage >= 0 && field.tick >= 0 && field.tick <= 0.5 && ["blade", "thunder", "fire", "frost"].includes(field.element);
          }).slice(-8).map(function (field) {
            return _extends({}, field, {
              id: ++_this.serial
            });
          });
        };
        return FusionFields;
      }();

      // prototype-2d-pixel/src/data.js
      var WEAPONS = exports('WEAPONS', {
        WHIP: {
          id: "whip",
          name: "\u9752\u950B\u5251\u6C14",
          icon: "\u2694\uFE0F",
          description: "\u81EA\u52A8\u671D\u8FD1\u5904\u90AA\u7269\u5B9A\u5411\uFF0C\u5411\u4E24\u4FA7\u65A9\u51FA\u5251\u6C14\uFF1B\u6F14\u5316\u540E\u5F62\u6210\u73AF\u8EAB\u4E00\u5468\u7684\u8840\u6708\u5251\u7F61\u3002",
          baseDamage: 20,
          baseCooldown: 1.5,
          baseRange: 90,
          projectileCount: 1,
          piercing: false,
          type: "melee",
          element: "blade",
          evolveLevel: 5,
          evolveName: "\u8840\u6708\u5468\u5929"
        },
        MAGIC_WAND: {
          id: "magic_wand",
          name: "\u8FFD\u9B42\u7B26",
          icon: "\uD83D\uDD2E",
          description: "\u81EA\u52A8\u8FFD\u7D22\u6700\u8FD1\u90AA\u7269\uFF1B\u6F14\u5316\u540E\u4E09\u7B26\u9F50\u53D1\u3002",
          baseDamage: 15,
          baseCooldown: 1.2,
          baseRange: 320,
          projectileCount: 1,
          piercing: false,
          type: "projectile",
          element: "seal",
          speed: 420,
          homing: true,
          evolveLevel: 5,
          evolveName: "\u4E09\u6E05\u7D22\u547D\u7B26"
        },
        KNIFE: {
          id: "knife",
          name: "\u65A9\u5996\u98DE\u5251",
          icon: "\uD83D\uDDE1\uFE0F",
          description: "\u5411\u524D\u6295\u5C04\u8D2F\u7A7F\u98DE\u5251\uFF1B\u6F14\u5316\u540E\u5316\u4E3A\u4E94\u5251\u6247\u9762\u3002",
          baseDamage: 12,
          baseCooldown: 0.4,
          baseRange: 420,
          projectileCount: 1,
          piercing: true,
          type: "projectile",
          speed: 620,
          evolveLevel: 5,
          evolveName: "\u4E94\u72F1\u5251\u9635",
          // iter-14 evolution micro-tweak: the fan also gets a flat +10% crit
          // chance on top of the player's current critChance roll. Picked up
          // by Weapon._rollCrit when the weapon `isEvolved()`.
          evolveBonusCrit: 0.1
        },
        ORBIT: {
          id: "orbit",
          name: "\u62A4\u8EAB\u5251\u8F6E",
          icon: "\uD83D\uDCAB",
          description: "\u788E\u5251\u73AF\u8EAB\u65CB\u8F6C\uFF1B\u6F14\u5316\u540E\u5F62\u6210\u5185\u5916\u53CC\u8F6E\u3002",
          baseDamage: 16,
          baseCooldown: 0.4,
          // used as "tick" for damage re-hit window
          baseRange: 120,
          // orbit radius
          projectileCount: 2,
          piercing: true,
          type: "orbit",
          evolveLevel: 5,
          evolveName: "\u53CC\u4EEA\u5251\u73AF",
          // iter-14: evolved Twin Halo also boosts shard damage by +10%.
          evolveDamageMult: 1.1
        },
        LIGHTNING: {
          id: "lightning",
          name: "\u4E5D\u9704\u96F7\u7BC6",
          icon: "\u26A1",
          description: "\u8F70\u51FB\u968F\u673A\u90AA\u7269\uFF0C\u4E09\u7EA7\u540E\u8FDE\u9501\uFF1B\u6F14\u5316\u540E\u5F15\u53D1\u96F7\u66B4\u3002",
          baseDamage: 35,
          baseCooldown: 3,
          baseRange: 420,
          piercing: true,
          type: "instant",
          element: "thunder",
          chain: true,
          chainCount: 3,
          evolveLevel: 5,
          evolveName: "\u4E07\u96F7\u671D\u5B97",
          // iter-14: evolved Thunder Call rolls a +15% crit on the strikes.
          evolveBonusCrit: 0.15
        },
        MINE: {
          id: "mine",
          name: "\u9547\u90AA\u7206\u7B26",
          icon: "\uD83D\uDCA3",
          description: "\u7559\u4E0B\u5EF6\u65F6\u7206\u88C2\u7B26\uFF1B\u6F14\u5316\u540E\u8FDE\u7EED\u5E03\u4E0B\u53CC\u7B26\u3002",
          baseDamage: 45,
          baseCooldown: 2.2,
          baseRange: 100,
          // explosion radius
          projectileCount: 1,
          piercing: true,
          type: "mine",
          element: "fire",
          fuse: 1.2,
          evolveLevel: 5,
          evolveName: "\u8FDE\u73AF\u9547\u715E\u9635"
        },
        GARLIC: {
          id: "garlic",
          name: "\u9955\u992E\u715E\u73AF",
          icon: "\uD83E\uDDC4",
          description: "\u98DF\u715E\u7AE5\u5B50\u7684\u62A4\u4F53\u541E\u566C\u9886\u57DF\uFF1B\u6301\u7EED\u5543\u566C\u8FD1\u8EAB\u90AA\u7269\uFF0C\u5E76\u9002\u914D\u751F\u547D\u3001\u62A4\u7532\u6D41\u6D3E\u3002",
          baseDamage: 5,
          baseCooldown: 0.2,
          baseRange: 110,
          piercing: true,
          type: "aura",
          element: "ward",
          continuous: true
        },
        // --- v2.4 additions ---------------------------------------------------
        FROST_NOVA: {
          id: "frost_nova",
          name: "\u592A\u9634\u5BD2\u6F6E",
          icon: "\u2744\uFE0F",
          description: "\u91CA\u653E\u6269\u5F20\u5BD2\u73AF\u5E76\u51CF\u901F\uFF1B\u6F14\u5316\u540E\u89E6\u53D1\u53CC\u91CD\u5BD2\u6F6E\u3002",
          baseDamage: 28,
          baseCooldown: 3.2,
          baseRange: 200,
          // blast radius
          projectileCount: 1,
          piercing: true,
          type: "nova",
          element: "frost",
          slowPct: 0.5,
          slowDuration: 1.2,
          evolveLevel: 5,
          evolveName: "\u5E7F\u5BD2\u91CD\u52AB"
        },
        SOUL_DRAIN: {
          id: "soul_drain",
          name: "\u566C\u9B42\u8840\u7EBF",
          icon: "\uD83E\uDE78",
          description: "\u8FDE\u63A5\u6700\u8FD1\u90AA\u7269\u5E76\u6C72\u53D6\u751F\u547D\uFF1B\u6F14\u5316\u540E\u540C\u65F6\u7F20\u4F4F\u4E24\u4E2A\u76EE\u6807\u3002",
          baseDamage: 8,
          baseCooldown: 0.25,
          // tick rate
          baseRange: 260,
          projectileCount: 1,
          piercing: true,
          type: "drain",
          element: "blood",
          lifestealPct: 0.25,
          evolveLevel: 5,
          evolveName: "\u53CC\u751F\u566C\u9B42\u7D22"
        },
        BOOMERANG: {
          id: "boomerang",
          name: "\u56DE\u98CE\u5203",
          icon: "\uD83E\uDE83",
          description: "\u98DE\u51FA\u540E\u6298\u8FD4\uFF1B\u6F14\u5316\u540E\u5F62\u6210\u53CC\u5F27\u56DE\u65CB\u3002",
          baseDamage: 18,
          baseCooldown: 1.1,
          baseRange: 340,
          projectileCount: 1,
          piercing: true,
          type: "projectile",
          speed: 380,
          boomerang: true,
          evolveLevel: 5,
          evolveName: "\u9634\u9633\u56DE\u98CE\u65A9",
          // iter-14: Twin Arc fires 5% faster than its base cooldown formula.
          evolveCooldownMult: 0.95
        },
        // --- iter-20: Konami Code unlock --------------------------------------
        // Hidden weapon awarded on the first time the player enters the Konami
        // Code on the main menu. Behaves like a fast piercing projectile (a nod
        // to retro shoot-'em-ups). Not part of the regular drop pool — only
        // available as a starter once UNLOCKS.konami_code is earned.
        RETRO_BLASTER: {
          id: "retro_blaster",
          name: "\u661F\u8680\u53E4\u70AE",
          icon: "\uD83D\uDC7E",
          description: "\u9690\u85CF\u661F\u5916\u9057\u7269\uFF0C\u5411\u524D\u8D2F\u7A7F\u8FDE\u5C04\uFF1B\u6F14\u5316\u540E\u4E09\u675F\u9F50\u53D1\u3002",
          baseDamage: 14,
          baseCooldown: 0.5,
          baseRange: 480,
          projectileCount: 2,
          piercing: true,
          type: "projectile",
          speed: 700,
          evolveLevel: 5,
          evolveName: "\u4E09\u57A3\u661F\u7206"
        }
      });
      var PASSIVES = exports('PASSIVES', {
        MAX_HP: {
          id: "max_hp",
          name: "\u70BC\u4F53",
          icon: "\u2764\uFE0F",
          description: "\u6700\u5927\u751F\u547D +20%",
          effect: {
            maxHpMult: 0.2
          }
        },
        RECOVERY: {
          id: "recovery",
          name: "\u5410\u7EB3",
          icon: "\uD83D\uDC9A",
          description: "\u6BCF\u79D2\u6062\u590D +0.5",
          effect: {
            hpRegen: 0.5
          }
        },
        ARMOR: {
          id: "armor",
          name: "\u91D1\u949F",
          icon: "\uD83D\uDEE1\uFE0F",
          description: "\u53D7\u5230\u7684\u4F24\u5BB3 -1",
          effect: {
            armor: 1
          }
        },
        MOVESPEED: {
          id: "movespeed",
          name: "\u8E0F\u7F61",
          icon: "\uD83D\uDC5F",
          description: "\u79FB\u52A8\u901F\u5EA6 +10%",
          effect: {
            speedMult: 0.1
          }
        },
        MIGHT: {
          id: "might",
          name: "\u7834\u715E",
          icon: "\uD83D\uDCAA",
          description: "\u4F24\u5BB3 +10%",
          effect: {
            damageMult: 0.1
          }
        },
        AREA: {
          id: "area",
          name: "\u6CD5\u57DF",
          icon: "\uD83D\uDCCF",
          description: "\u6B66\u5668\u8303\u56F4 +10%",
          effect: {
            areaMult: 0.1
          }
        },
        COOLDOWN: {
          id: "cooldown",
          name: "\u6025\u5F8B",
          icon: "\u23F1\uFE0F",
          description: "\u653B\u51FB\u901F\u5EA6 +8%",
          effect: {
            cooldownMult: -0.08
          }
        },
        MAGNET: {
          id: "magnet",
          name: "\u6444\u7269",
          icon: "\uD83E\uDDF2",
          description: "\u62FE\u53D6\u8303\u56F4 +25%",
          effect: {
            magnetMult: 0.25
          }
        },
        GROWTH: {
          id: "growth",
          name: "\u609F\u9053",
          icon: "\uD83D\uDCC8",
          description: "\u7ECF\u9A8C\u83B7\u53D6 +10%",
          effect: {
            expMult: 0.1
          }
        },
        LUCK: {
          id: "luck",
          name: "\u547D\u6570",
          icon: "\uD83C\uDF40",
          description: "\u66B4\u51FB\u7387 +5%",
          effect: {
            critChance: 0.05
          }
        },
        // --- iter-14 passives -------------------------------------------------
        // The three new passives all hook into existing player stats so the level-
        // up roller pool grows without any new code path. `dodgeChance` is summed
        // (capped at 0.6 in entities.js) and consulted before damage is applied;
        // `magnetMult` is reused for Pickup Magnet+ which stacks multiplicatively
        // on the existing MAGNET passive; `damageReduction` is summed and clamped
        // to a soft 0.6 cap on the consumer side so the player can't go fully
        // immortal even with five stacks.
        DODGE: {
          id: "dodge",
          name: "\u7F29\u5730",
          icon: "\uD83D\uDCA8",
          description: "\u95EA\u907F\u7387 +5%",
          effect: {
            dodgeChance: 0.05
          }
        },
        MAGNET_PLUS: {
          id: "magnet_plus",
          name: "\u5927\u6444\u7269\u672F",
          icon: "\uD83E\uDDF2",
          description: "\u62FE\u53D6\u8303\u56F4 +35%",
          effect: {
            magnetMult: 0.35
          }
        },
        DAMAGE_REDUCTION: {
          id: "damage_reduction",
          name: "\u7384\u6B66\u969C",
          icon: "\uD83D\uDEE1\uFE0F",
          description: "\u53D7\u5230\u7684\u4F24\u5BB3 -8%",
          effect: {
            damageReduction: 0.08
          }
        },
        INK_BODY: {
          id: "ink_body",
          name: "\u58A8\u9AA8\u8EAB",
          icon: "\u58A8",
          description: "\u6700\u5927\u751F\u547D +12%\uFF0C\u6700\u7EC8\u51CF\u4F24 +3%",
          effect: {
            maxHpMult: 0.12,
            damageReduction: 0.03
          }
        },
        STAR_STEP: {
          id: "star_step",
          name: "\u661F\u6B65\u6B8B\u5377",
          icon: "\u661F",
          description: "\u79FB\u52A8\u901F\u5EA6 +8%\uFF0C\u95EA\u907F\u7387 +2%",
          effect: {
            speedMult: 0.08,
            dodgeChance: 0.02
          }
        },
        RITUAL_FOCUS: {
          id: "ritual_focus",
          name: "\u658B\u91AE\u5B9A\u795E",
          icon: "\u91AE",
          description: "\u653B\u51FB\u901F\u5EA6 +5%\uFF0C\u6B66\u5668\u8303\u56F4 +5%",
          effect: {
            cooldownMult: -0.05,
            areaMult: 0.05
          }
        },
        HUNGRY_SOUL: {
          id: "hungry_soul",
          name: "\u9965\u9B42\u5410\u7EB3",
          icon: "\u9B42",
          description: "\u6BCF\u79D2\u6062\u590D +0.25\uFF0C\u62FE\u53D6\u8303\u56F4 +15%",
          effect: {
            hpRegen: 0.25,
            magnetMult: 0.15
          }
        }
      });
      var ENEMIES = exports('ENEMIES', {
        BRAMBLE_SEER: {
          id: "bramble_seer",
          name: "\u7F20\u6839\u5C71\u795D",
          archetype: "controller",
          hp: 48,
          speed: 55,
          damage: 14,
          exp: 28,
          color: "#96be85",
          size: 18,
          control: {
            label: "\u7F20\u6839",
            color: "#96be85",
            radius: 90,
            slow: 0.25,
            interval: 6.5
          }
        },
        THREAD_CHANTER: {
          id: "thread_chanter",
          name: "\u7275\u4E1D\u620F\u795D",
          archetype: "controller",
          hp: 44,
          speed: 65,
          damage: 16,
          exp: 30,
          color: "#d3877e",
          size: 18,
          control: {
            label: "\u7275\u4E1D",
            color: "#d3877e",
            radius: 105,
            slow: 0.3,
            interval: 7
          }
        },
        FROST_EYE: {
          id: "frost_eye",
          name: "\u51DD\u971C\u661F\u77B3",
          archetype: "controller",
          hp: 54,
          speed: 50,
          damage: 15,
          exp: 30,
          color: "#82d6ef",
          size: 18,
          control: {
            label: "\u51DD\u971C",
            color: "#82d6ef",
            radius: 100,
            slow: 0.35,
            interval: 7
          }
        },
        BAT: {
          id: "bat",
          name: "\u540A\u6B7B\u9B3C\u86FE",
          archetype: "chaser",
          hp: 15,
          speed: 110,
          damage: 10,
          exp: 10,
          color: "#8844ff",
          size: 12
        },
        ZOMBIE: {
          id: "zombie",
          name: "\u884C\u5C38\u9999\u5BA2",
          archetype: "chaser",
          hp: 30,
          speed: 70,
          damage: 15,
          exp: 15,
          color: "#44aa44",
          size: 18
        },
        SKELETON: {
          id: "skeleton",
          name: "\u767D\u9AA8\u4F36\u4EBA",
          archetype: "chaser",
          hp: 25,
          speed: 95,
          damage: 12,
          exp: 12,
          color: "#dddddd",
          size: 14
        },
        WOLF: {
          id: "wolf",
          name: "\u98DF\u6708\u72C8",
          archetype: "dasher",
          dasher: true,
          dashSpeed: 320,
          dashInterval: 3.5,
          dashDuration: 0.6,
          hp: 40,
          speed: 150,
          damage: 20,
          exp: 20,
          color: "#aa6644",
          size: 16
        },
        GOLEM: {
          id: "golem",
          name: "\u9999\u7070\u50A9\u50CF",
          archetype: "shielded",
          shielded: true,
          shieldHp: 60,
          damageReduction: 0.5,
          hp: 120,
          speed: 45,
          damage: 30,
          exp: 50,
          color: "#888888",
          size: 28
        },
        GHOST: {
          id: "ghost",
          name: "\u65E0\u9762\u6E38\u9B42",
          archetype: "chaser",
          hp: 20,
          speed: 130,
          damage: 18,
          exp: 18,
          color: "#88ccff",
          size: 15,
          ghost: true
        },
        // --- New archetypes --------------------------------------------------
        MAGE: {
          id: "mage",
          name: "\u89C2\u661F\u90AA\u6559\u5F92",
          archetype: "ranged",
          ranged: true,
          firingRange: 360,
          keepDistance: 260,
          projectileSpeed: 220,
          projectileDamage: 14,
          fireCooldown: 2.4,
          shotWindup: 0.65,
          hp: 28,
          speed: 70,
          damage: 8,
          exp: 22,
          color: "#cc44cc",
          size: 14
        },
        SLIME: {
          id: "slime",
          name: "\u8089\u829D",
          archetype: "splitter",
          splitter: true,
          splitCount: 2,
          hp: 55,
          speed: 65,
          damage: 14,
          exp: 24,
          color: "#33cc88",
          size: 20
        },
        SLIMELING: {
          id: "slimeling",
          name: "\u5E7C\u8089\u829D",
          archetype: "chaser",
          hp: 18,
          speed: 105,
          damage: 8,
          exp: 6,
          color: "#66ddaa",
          size: 10
        },
        // --- v2.4 additions: bomber (self-destructs) + illusionist (clone) ---
        BOMBER: {
          id: "bomber",
          name: "\u7206\u809A\u7AE5\u5B50",
          archetype: "bomber",
          bomber: true,
          fuseRange: 80,
          // begins countdown when within this distance
          fuseTime: 1.4,
          // seconds before detonation
          blastRadius: 120,
          blastDamage: 40,
          hp: 35,
          speed: 120,
          damage: 10,
          exp: 28,
          color: "#ff6644",
          size: 14
        },
        ILLUSIONIST: {
          id: "illusionist",
          name: "\u955C\u4E2D\u9053\u58EB",
          archetype: "illusionist",
          illusionist: true,
          cloneCooldown: 5.5,
          cloneCount: 2,
          hp: 42,
          speed: 95,
          damage: 12,
          exp: 30,
          color: "#cc88ff",
          size: 15
        }
      });
      ENEMIES.SLIME.splitInto = "slimeling";
      var BOSSES = exports('BOSSES', {
        REAPER: {
          id: "reaper",
          name: "\u7EB8\u5AC1\u8863\u65E0\u5E38",
          hp: 2500,
          speed: 80,
          damage: 40,
          exp: 500,
          color: "#220033",
          size: 48,
          boss: true,
          ability: "summon",
          spawnAt: 300
          // 5 minutes
        },

        VOID_LORD: {
          id: "void_lord",
          name: "\u65E0\u76F8\u661F\u541B",
          hp: 6e3,
          speed: 60,
          damage: 60,
          exp: 1200,
          color: "#550077",
          size: 64,
          boss: true,
          ability: "charge",
          spawnAt: 600
          // 10 minutes
        },

        // --- v2.4 mid/late bosses --------------------------------------------
        NECROMANCER: {
          id: "necromancer",
          name: "\u620F\u795E\u5C38\u738B",
          hp: 4200,
          speed: 70,
          damage: 50,
          exp: 850,
          color: "#3a1a4a",
          size: 54,
          boss: true,
          ability: "summon",
          spawnAt: 450
          // 7:30
        },

        CHRONO_LICH: {
          id: "chrono_lich",
          name: "\u592A\u5C81\u65F6\u8839",
          hp: 1e4,
          speed: 55,
          damage: 75,
          exp: 2e3,
          color: "#0b2a4a",
          size: 72,
          boss: true,
          ability: "charge",
          spawnAt: 720
          // 12:00
        },

        // --- iter-14 tundra final boss ---------------------------------------
        // IceQueen is a frost-palette variant of the 10-minute boss. The tundra
        // stage swaps her in for VoidLord via `bossOverrides`; on other stages she
        // never auto-spawns. Listed here so the boss list, daily-mode replays and
        // achievement registry can reference her by id without a special case.
        ICE_QUEEN: {
          id: "ice_queen",
          name: "\u6708\u8680\u9F99\u5973",
          hp: 6200,
          speed: 55,
          damage: 60,
          exp: 1300,
          color: "#88ccff",
          size: 66,
          boss: true,
          ability: "charge",
          // Listed at 660 to keep the BOSSES timeline strictly ascending
          // (Reaper 300 < Necro 450 < VoidLord 600 < IceQueen 660 < ChronoLich
          // 720). Tundra's `bossOverrides` swaps her into VoidLord's 600 slot
          // at runtime; this raw value is never read on tundra (the override
          // path uses the source boss's spawnAt + offset).
          spawnAt: 660,
          iceQueen: true
          // visual flag, read by entities renderer for frost halo
        }
      });

      var WAVES = [{
        from: 0,
        to: 30,
        pool: ["bat", "zombie"],
        spawnMult: 1,
        label: "\u90AA\u6F6E\u521D\u8D77"
      }, {
        from: 30,
        to: 60,
        pool: ["bat", "zombie", "skeleton"],
        spawnMult: 1.1,
        label: "\u7EB8\u706F\u5F15\u9B42"
      }, {
        from: 60,
        to: 90,
        pool: ["zombie", "skeleton", "mage"],
        spawnMult: 1.15,
        label: "\u90AA\u6559\u89C2\u661F"
      }, {
        from: 90,
        to: 120,
        pool: ["skeleton", "wolf", "ghost", "mage"],
        spawnMult: 1.2,
        label: "\u98DF\u6708\u6210\u7FA4"
      }, {
        from: 120,
        to: 180,
        pool: ["wolf", "ghost", "slime", "mage", "bomber"],
        spawnMult: 1.3,
        label: "\u8089\u829D\u589E\u6B96"
      }, {
        from: 180,
        to: 240,
        pool: ["wolf", "golem", "ghost", "slime", "bomber"],
        spawnMult: 1.4,
        label: "\u50A9\u50CF\u5F00\u9053"
      }, {
        from: 240,
        to: 300,
        pool: ["golem", "ghost", "slime", "mage", "illusionist"],
        spawnMult: 1.5,
        label: "\u767E\u9B3C\u538B\u5883"
      }, {
        from: 300,
        to: 420,
        pool: ["wolf", "golem", "ghost", "slime", "mage", "bomber", "illusionist"],
        spawnMult: 1.6,
        label: "\u65E0\u5E38\u8FC7\u5883"
      }, {
        from: 420,
        to: 600,
        pool: ["golem", "slime", "mage", "ghost", "wolf", "illusionist"],
        spawnMult: 1.75,
        label: "\u5929\u95E8\u6E10\u88C2"
      }, {
        from: 600,
        to: Infinity,
        pool: ["golem", "slime", "mage", "ghost", "wolf", "skeleton", "bomber", "illusionist"],
        spawnMult: 2,
        label: "\u7FA4\u661F\u5F52\u4F4D"
      }];

      // prototype-2d-pixel/src/enemy-skins.js
      var ENEMY_THEME_SKINS = Object.freeze({
        forest: Object.freeze([Object.freeze({
          id: "forest_0",
          name: "\u7EB8\u9A6C\u6E38\u9B42",
          atlasColumn: 0,
          atlasRow: 0,
          projectileStyle: "paper",
          projectileColor: "#e8d8aa"
        }), Object.freeze({
          id: "forest_1",
          name: "\u6CFC\u58A8\u5C71\u72FC",
          atlasColumn: 1,
          atlasRow: 0,
          projectileStyle: "ink",
          projectileColor: "#536f5d"
        }), Object.freeze({
          id: "forest_2",
          name: "\u575F\u773C\u6BD2\u87FE",
          atlasColumn: 2,
          atlasRow: 0,
          projectileStyle: "ember",
          projectileColor: "#b7cf63"
        }), Object.freeze({
          id: "forest_3",
          name: "\u7AF9\u5203\u50A9\u5996",
          atlasColumn: 3,
          atlasRow: 0,
          projectileStyle: "blade",
          projectileColor: "#9fcf9d"
        })]),
        crypt: Object.freeze([Object.freeze({
          id: "crypt_0",
          name: "\u60AC\u4E1D\u68FA\u5076",
          atlasColumn: 0,
          atlasRow: 1,
          projectileStyle: "skull",
          projectileColor: "#a34d45"
        }), Object.freeze({
          id: "crypt_1",
          name: "\u65E0\u706F\u5F15\u9B42\u9B3C",
          atlasColumn: 1,
          atlasRow: 1,
          projectileStyle: "lantern",
          projectileColor: "#f1a13b"
        }), Object.freeze({
          id: "crypt_2",
          name: "\u767D\u9AA8\u796D\u5E08",
          atlasColumn: 2,
          atlasRow: 1,
          projectileStyle: "skull",
          projectileColor: "#c8b39b"
        }), Object.freeze({
          id: "crypt_3",
          name: "\u65E0\u9762\u620F\u715E",
          atlasColumn: 3,
          atlasRow: 1,
          projectileStyle: "mask",
          projectileColor: "#d94e62"
        })]),
        tundra: Object.freeze([Object.freeze({
          id: "tundra_0",
          name: "\u51BB\u5C38\u661F\u58F3",
          atlasColumn: 0,
          atlasRow: 2,
          projectileStyle: "ice",
          projectileColor: "#8ce6ff"
        }), Object.freeze({
          id: "tundra_1",
          name: "\u6676\u810A\u730E\u72AC",
          atlasColumn: 1,
          atlasRow: 2,
          projectileStyle: "ice",
          projectileColor: "#61cbea"
        }), Object.freeze({
          id: "tundra_2",
          name: "\u7AA5\u661F\u90AA\u773C",
          atlasColumn: 2,
          atlasRow: 2,
          projectileStyle: "star",
          projectileColor: "#d36bff"
        }), Object.freeze({
          id: "tundra_3",
          name: "\u5F57\u7532\u5DE8\u7075",
          atlasColumn: 3,
          atlasRow: 2,
          projectileStyle: "comet",
          projectileColor: "#cf59dc"
        })])
      });
      function enemyArchetypeSlot(enemy) {
        if (enemy === void 0) {
          enemy = {};
        }
        if (enemy.control) return 2;
        var identitySlots = {
          bat: 0,
          ghost: 0,
          slime: 0,
          slimeling: 0,
          wolf: 1,
          zombie: 2,
          mage: 2,
          illusionist: 2,
          skeleton: 3,
          golem: 3,
          bomber: 3
        };
        if (identitySlots[enemy.id] !== void 0) return identitySlots[enemy.id];
        if (enemy.shielded || enemy.bomber || enemy.id === "golem") return 3;
        if (enemy.ranged || enemy.illusionist || enemy.id === "mage") return 2;
        if (enemy.dasher || enemy.id === "wolf") return 1;
        return 0;
      }
      function enemySkinFor(stageId, enemy) {
        var set = ENEMY_THEME_SKINS[stageId] || ENEMY_THEME_SKINS.forest;
        return set[enemyArchetypeSlot(enemy)];
      }

      // prototype-2d-pixel/src/plain-state.js
      function clonePlainState(value) {
        if (Array.isArray(value)) return value.map(clonePlainState);
        if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(function (_ref2) {
          var key = _ref2[0],
            item = _ref2[1];
          return [key, clonePlainState(item)];
        }));
        return value;
      }

      // prototype-2d-pixel/src/damage-history.js
      var KINDS = Object.freeze({
        contact: "\u8FD1\u8EAB\u78B0\u649E",
        projectile: "\u8FDC\u7A0B\u5F39\u9053",
        field: "\u5730\u9762\u5371\u9669",
        blast: "\u8FD1\u8EAB\u81EA\u7206",
        environment: "\u73AF\u5883\u4FB5\u8680",
        event: "\u4E8B\u4EF6\u4EE3\u4EF7",
        unknown: "\u672A\u660E\u6765\u6E90"
      });
      var TIPS = Object.freeze({
        contact: "\u4FDD\u6301\u9000\u8DEF\uFF0C\u907F\u514D\u88AB\u602A\u7FA4\u5305\u56F4\u3002",
        projectile: "\u770B\u5230\u84C4\u5C04\u65B9\u5411\u540E\u4FA7\u79FB\uFF1B\u5B9E\u4F53\u5EFA\u7B51\u53EF\u6321\u4F4F\u654C\u5F39\u3002",
        field: "\u9884\u8B66\u671F\u95F4\u79BB\u5F00\u6807\u8BB0\u533A\u57DF\uFF0C\u751F\u6548\u540E\u4E0D\u8981\u505C\u7559\u3002",
        blast: "\u5F15\u7206\u84C4\u52BF\u65F6\u62C9\u5F00\u8DDD\u79BB\uFF0C\u4E0D\u8981\u8D34\u8EAB\u505C\u7559\u3002",
        environment: "\u5BFB\u627E\u6062\u590D\u5EFA\u7B51\u7684\u907F\u661F\u706F\uFF1B\u4FB5\u8680\u6700\u4F4E\u4FDD\u7559\u4E00\u547D\u3002",
        event: "\u8FD9\u662F\u4E3B\u52A8\u4EA4\u6362\u7684\u4EE3\u4EF7\uFF0C\u4E0D\u662F\u602A\u7269\u653B\u51FB\u3002",
        unknown: "\u6765\u6E90\u672A\u8BB0\u5F55\uFF0C\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u5177\u4F53\u653B\u51FB\u3002"
      });
      var amount = function amount(n) {
        return Number.isFinite(n) && n >= 0 ? Math.min(n, 1e12) : 0;
      };
      var plain = function plain(value) {
        return typeof value === "string" ? value.replace(/[<>&"'\x00-\x1f]/g, "").slice(0, 48) : "";
      };
      function enemyDamageSource(enemy, kind) {
        var _enemy$type, _enemy$skin, _enemy$type2;
        if (kind === void 0) {
          kind = "contact";
        }
        return {
          kind: kind,
          label: enemy != null && enemy.boss ? ((_enemy$type = enemy.type) == null ? void 0 : _enemy$type.name) || enemy.id : (enemy == null || (_enemy$skin = enemy.skin) == null ? void 0 : _enemy$skin.name) || (enemy == null || (_enemy$type2 = enemy.type) == null ? void 0 : _enemy$type2.name) || "\u90AA\u7269"
        };
      }
      function restoreDamageHistory(saved, time) {
        if (time === void 0) {
          time = 0;
        }
        var valid = (saved == null ? void 0 : saved.version) === 1 && Array.isArray(saved.recent);
        var history = {
          version: 1,
          since: valid ? Math.min(amount(saved.since), amount(time)) : amount(time),
          totals: {},
          recent: []
        };
        for (var _i = 0, _Object$keys = Object.keys(KINDS); _i < _Object$keys.length; _i++) {
          var _saved$totals;
          var kind = _Object$keys[_i];
          history.totals[kind] = valid ? amount((_saved$totals = saved.totals) == null ? void 0 : _saved$totals[kind]) : 0;
        }
        if (valid) history.recent = saved.recent.slice(-12).filter(function (e) {
          return e && Number.isFinite(e.time) && e.time >= 0 && e.time <= time && Number.isFinite(e.loss) && e.loss > 0;
        }).map(function (e) {
          return {
            time: e.time,
            kind: Object.hasOwn(KINDS, e.kind) ? e.kind : "unknown",
            label: plain(e.label) || "\u672A\u660E\u6765\u6E90",
            loss: amount(e.loss),
            fatal: e.fatal === true,
            revived: e.revived === true
          };
        });
        return history;
      }
      function recordHealthLoss(game, source, loss, result) {
        if (result === void 0) {
          result = {};
        }
        if (!game || !Number.isFinite(loss) || loss <= 0) return;
        var h = game.damageHistory || (game.damageHistory = restoreDamageHistory(null, 0));
        var kind = Object.hasOwn(KINDS, source == null ? void 0 : source.kind) ? source.kind : "unknown";
        h.totals[kind] = amount((h.totals[kind] || 0) + loss);
        h.recent.push({
          time: amount(game.gameTime),
          kind: kind,
          label: plain(source == null ? void 0 : source.label) || KINDS[kind],
          loss: amount(loss),
          fatal: result.fatal === true,
          revived: result.revived === true
        });
        if (h.recent.length > 12) h.recent.shift();
      }
      function damageRecap(game, detailed) {
        if (detailed === void 0) {
          detailed = false;
        }
        var h = restoreDamageHistory(game.damageHistory, game.gameTime || 0);
        var last = h.recent[h.recent.length - 1];
        if (!last) return h.since > 0 ? "\u65E7\u547D\u5951\u4ECE\u672C\u6B21\u7EED\u73A9\u5F00\u59CB\u8BB0\u5F55\uFF1B\u5C1A\u65E0\u5931\u8840\u3002" : "\u5C1A\u65E0\u5B9E\u9645\u5931\u8840\u8BB0\u5F55\u3002";
        var title = (last.fatal ? "\u81F4\u547D\u4E00\u51FB" : "\u6700\u540E\u5931\u8840") + "\uFF1A" + last.label + " \xB7 " + KINDS[last.kind] + (last.revived ? "\uFF08\u501F\u547D\u590D\u8D77\uFF09" : "");
        var dominant = Object.keys(KINDS).reduce(function (a, b) {
          return h.totals[b] > h.totals[a] ? b : a;
        }, last.kind);
        if (!detailed) return title + "\n\u8BB0\u5F55\u671F\u95F4\u4E3B\u8981\u5931\u8840\uFF1A" + KINDS[dominant] + "\n" + TIPS[dominant];
        var clock = function clock(n) {
          return Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0");
        };
        var total = Object.entries(h.totals).filter(function (_ref3) {
          var v = _ref3[1];
          return v > 0;
        }).map(function (_ref4) {
          var k = _ref4[0],
            v = _ref4[1];
          return KINDS[k] + " " + v.toFixed(1);
        }).join(" / ");
        return "\u8BB0\u5F55\u8D77\u70B9 " + clock(h.since) + "\uFF1B\u7D2F\u8BA1\u5B9E\u9645\u5931\u8840\uFF08\u4E0D\u6263\u9664\u540E\u7EED\u6CBB\u7597\uFF09\n" + total + "\n\u6700\u8FD1\u5931\u8840\uFF1A\n" + h.recent.slice(-3).map(function (e) {
          return clock(e.time) + " " + e.label + "\uFF1A-" + e.loss.toFixed(1) + (e.fatal ? " \xB7 \u81F4\u547D" : e.revived ? " \xB7 \u590D\u8D77" : "");
        }).join("\n") + "\n\u95EA\u907F\u4E0E\u65E0\u654C\u6321\u4F24\u4E0D\u8BA1\uFF1B\u590D\u8D77\u6309\u590D\u6D3B\u524D\u6263\u8840\u8BA1\u7B97\u3002";
      }
      function damageHistoryCard(game) {
        var _game$player;
        return {
          category: "\u6218\u6597\u590D\u76D8",
          name: "\u4F24\u52BF\u8BB0\u5F55",
          level: "\u6700\u8FD1\u5931\u8840\u4E0E\u5E94\u5BF9",
          artKind: "hero",
          artId: ((_game$player = game.player) == null ? void 0 : _game$player.heroId) || "sword",
          lore: "\u547D\u5951\u8BB0\u4E0B\u6BCF\u6B21\u771F\u6B63\u5931\u53BB\u7684\u547D\u6570\uFF1B\u65E7\u547D\u5951\u6CA1\u6709\u7684\u5386\u53F2\u4E0D\u4F1A\u51ED\u7A7A\u8865\u9F50\u3002",
          effect: damageRecap(game),
          attackMode: "\u53EA\u8BB0\u5F55\u5B9E\u9645\u6263\u8840\uFF0C\u4E0D\u6539\u53D8\u6218\u6597\uFF1B\u6309\u4F4F Shift \u6216\u70B9\u51FB\u8BE6\u503C\u67E5\u770B\u5206\u7C7B\u7D2F\u8BA1\u4E0E\u6700\u8FD1\u4E09\u6B21\u3002",
          numbers: damageRecap(game, true)
        };
      }

      // prototype-2d-pixel/src/hostile-attacks.js
      function bossCombatSnapshot(boss) {
        if (!boss || boss.hp <= 0) return null;
        return {
          id: boss.id,
          x: boss.x,
          y: boss.y,
          hp: boss.hp,
          maxHp: boss.maxHp,
          damage: boss.damage,
          abilityTimer: boss.abilityTimer,
          cast: boss.cast ? clonePlainState(boss.cast) : null
        };
      }
      function restoreBossCombat(boss, saved) {
        if (!boss || !saved || saved.id && saved.id !== boss.id) return false;
        for (var _i2 = 0, _arr = ["x", "y", "maxHp", "damage", "abilityTimer"]; _i2 < _arr.length; _i2++) {
          var key = _arr[_i2];
          if (Number.isFinite(saved[key])) boss[key] = saved[key];
        }
        boss.maxHp = Math.max(1, boss.maxHp);
        boss.hp = Math.max(1, Math.min(boss.maxHp, Number(saved.hp) || boss.maxHp));
        boss.cast = saved.cast ? clonePlainState(saved.cast) : null;
        return true;
      }
      var HostileFieldSystem = exports('HostileFieldSystem', /*#__PURE__*/function () {
        function HostileFieldSystem() {
          this.fields = [];
        }
        var _proto2 = HostileFieldSystem.prototype;
        _proto2.reset = function reset() {
          this.fields = [];
        };
        _proto2.add = function add(spec) {
          if (this.fields.length >= 24) return false;
          this.fields.push(_extends({
            warning: 1.1,
            duration: 2.8,
            age: 0,
            tick: 0
          }, spec));
          return true;
        };
        _proto2.update = function update(dt, game) {
          for (var _iterator6 = _createForOfIteratorHelperLoose(this.fields), _step6; !(_step6 = _iterator6()).done;) {
            var field = _step6.value;
            field.age += dt;
            if (field.age < field.warning || field.age >= field.warning + field.duration) continue;
            field.tick -= dt;
            if (field.tick > 0) continue;
            field.tick = 0.6;
            var player = game.player;
            if (!Number.isFinite(player.x) || !Number.isFinite(player.y)) continue;
            if (Math.hypot(player.x - field.x, player.y - field.y) > field.radius + player.size || player.invincible) continue;
            var hp = player.hp;
            player.takeDamage(field.damage, game, field.source || {
              kind: "field",
              label: field.label
            });
            if (player.hp < hp) player.applyHindrance == null || player.applyHindrance(field.slow || 0, 1.2, field.label);
          }
          this.fields = this.fields.filter(function (f) {
            return f.age < f.warning + f.duration;
          });
        };
        _proto2.snapshot = function snapshot() {
          return this.fields.map(function (f) {
            return _extends({}, f);
          });
        };
        _proto2.restore = function restore(fields) {
          this.fields = Array.isArray(fields) ? fields.filter(function (f) {
            return [f.x, f.y, f.radius, f.age, f.warning, f.duration, f.damage].every(Number.isFinite) && f.radius > 0 && f.duration > 0;
          }).slice(0, 24).map(function (f) {
            return _extends({}, f);
          }) : [];
        };
        _proto2.render = function render(ctx, _temp) {
          var _ref5 = _temp === void 0 ? {} : _temp,
            _ref5$labels = _ref5.labels,
            labels = _ref5$labels === void 0 ? true : _ref5$labels;
          for (var _iterator7 = _createForOfIteratorHelperLoose(this.fields), _step7; !(_step7 = _iterator7()).done;) {
            var field = _step7.value;
            var warning = field.age < field.warning;
            ctx.save();
            ctx.fillStyle = field.color + "28";
            ctx.strokeStyle = field.color;
            ctx.lineWidth = warning ? 2 : 4;
            ctx.beginPath();
            ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            if (warning) {
              ctx.lineWidth = 5;
              ctx.beginPath();
              ctx.arc(field.x, field.y, field.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * field.age / field.warning);
              ctx.stroke();
            }
            if (!labels) {
              ctx.restore();
              continue;
            }
            ctx.fillStyle = "#171719";
            ctx.fillRect(field.x - 58, field.y + field.radius + 6, 116, 22);
            ctx.fillStyle = "#f5e7c9";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(field.label + " \xB7 " + (warning ? "\u5C06\u81F3" : "\u5371\u9669"), field.x, field.y + field.radius + 21);
            ctx.restore();
          }
        };
        return HostileFieldSystem;
      }());
      function beginEnemyCast(enemy, game) {
        if (enemy.cast || enemy.hp <= 0) return false;
        var player = game.player;
        var phase = enemy.boss && enemy.hp / enemy.maxHp <= 0.5 ? 2 : 1;
        var cast = {
          age: 0,
          warning: 1.1,
          recovery: 0.65,
          phase: phase,
          x: enemy.x,
          y: enemy.y,
          targetX: player.x,
          targetY: player.y,
          fired: false
        };
        var controller = enemy.type.control;
        if (controller || enemy.id === "ice_queen") {
          cast.kind = "field";
          cast.label = (controller == null ? void 0 : controller.label) || "\u6708\u8680\u5BD2\u9635";
          cast.color = (controller == null ? void 0 : controller.color) || "#82d6ef";
          var offsets = controller ? [0] : phase === 2 ? [-170, 0, 170] : [-135, 135];
          for (var _i3 = 0, _offsets = offsets; _i3 < _offsets.length; _i3++) {
            var _game$hostileFields;
            var offset = _offsets[_i3];
            (_game$hostileFields = game.hostileFields) == null || _game$hostileFields.add({
              x: player.x + offset,
              y: player.y,
              radius: (controller == null ? void 0 : controller.radius) || 105,
              warning: cast.warning,
              duration: controller ? 2.8 : 3.5,
              damage: enemy.damage * (controller ? 0.6 : 0.35),
              slow: (controller == null ? void 0 : controller.slow) || 0.35,
              label: cast.label,
              color: cast.color,
              source: _extends({}, enemyDamageSource(enemy, "field"), {
                label: cast.label
              })
            });
          }
        } else if (enemy.id === "reaper") {
          cast.kind = "summon";
          cast.label = "\u7EB8\u9A6C\u8FCE\u4EB2";
          cast.color = "#c7ad76";
        } else if (enemy.id === "necromancer") {
          cast.kind = "fan";
          cast.label = "\u767D\u9AA8\u6563\u620F";
          cast.color = "#df867a";
        } else {
          cast.kind = "charge";
          cast.label = enemy.id === "chrono_lich" ? "\u592A\u5C81\u51B2\u65F6" : "\u88C2\u7A7A\u51B2\u649E";
          cast.color = "#d48cb7";
          var dx = player.x - enemy.x,
            dy = player.y - enemy.y,
            distance = Math.hypot(dx, dy) || 1;
          var length = Math.min(440, Math.max(160, distance + 70));
          cast.endX = enemy.x + dx / distance * length;
          cast.endY = enemy.y + dy / distance * length;
          if (game.runMode === "chapter") {
            cast.endX = Math.max(enemy.size, Math.min(game.arenaWidth - enemy.size, cast.endX));
            cast.endY = Math.max(enemy.size, Math.min(game.arenaHeight - enemy.size, cast.endY));
          }
          cast.travel = 0.75;
          cast.radius = enemy.size;
        }
        enemy.cast = cast;
        return true;
      }
      function updateEnemyCast(enemy, dt, game) {
        var cast = enemy.cast;
        if (!cast) return false;
        cast.age += dt;
        if (cast.age >= cast.warning && !cast.fired) {
          cast.fired = true;
          if (cast.kind === "summon") game.spawnBossMinions == null || game.spawnBossMinions(enemy, cast.phase === 2 ? 4 : 3);
          if (cast.kind === "fan") game.fireBossFan == null || game.fireBossFan(enemy, cast);
        }
        if (cast.kind === "charge" && cast.age >= cast.warning) {
          var t = Math.min(1, (cast.age - cast.warning) / cast.travel);
          enemy.x = cast.x + (cast.endX - cast.x) * t;
          enemy.y = cast.y + (cast.endY - cast.y) * t;
        }
        if (cast.age >= cast.warning + (cast.travel || 0) + cast.recovery) enemy.cast = null;
        return true;
      }
      function renderEnemyCast(ctx, enemy) {
        var aim = enemy.hp > 0 && enemy.rangedAim;
        if (aim) {
          ctx.save();
          ctx.translate(aim.x, aim.y);
          ctx.rotate(aim.angle);
          ctx.strokeStyle = "#171719";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(enemy.size + 8, 0);
          ctx.lineTo(aim.length, 0);
          ctx.moveTo(aim.length - 12, -7);
          ctx.lineTo(aim.length, 0);
          ctx.lineTo(aim.length - 12, 7);
          ctx.stroke();
          ctx.strokeStyle = "#efcb8c";
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, enemy.size + 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.size + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, 1 - aim.remaining / aim.duration)));
          ctx.stroke();
          ctx.restore();
        }
        var cast = enemy.cast;
        if (!cast) return;
        ctx.save();
        ctx.strokeStyle = cast.color;
        ctx.fillStyle = cast.color + "28";
        if (cast.kind === "charge" && cast.age <= cast.warning + cast.travel) {
          ctx.lineCap = "round";
          ctx.lineWidth = cast.radius * 2;
          ctx.strokeStyle = cast.color + "38";
          ctx.beginPath();
          ctx.moveTo(cast.x, cast.y);
          ctx.lineTo(cast.endX, cast.endY);
          ctx.stroke();
          ctx.lineWidth = 2;
          ctx.strokeStyle = cast.color;
          ctx.beginPath();
          ctx.arc(cast.endX, cast.endY, cast.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = "#171719";
        ctx.fillRect(enemy.x - 60, enemy.y - enemy.size - 37, 120, 23);
        ctx.fillStyle = "#f5e7c9";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("" + cast.label + (cast.age < cast.warning ? " \xB7 \u84C4\u52BF" : ""), enemy.x, enemy.y - enemy.size - 21);
        ctx.restore();
      }
      var Player = exports('Player', /*#__PURE__*/function () {
        function Player(x, y) {
          this.x = x;
          this.y = y;
          this.size = CONFIG.PLAYER_SIZE;
          this.baseMaxHp = 100;
          this.maxHp = this.baseMaxHp;
          this.hp = this.baseMaxHp;
          this.level = 1;
          this.exp = 0;
          this.expToNext = 50;
          this.weapons = [];
          this.passives = /* @__PURE__ */Object.create(null);
          this.runModifiers = {
            damageMult: 1,
            areaMult: 1,
            cooldownMult: 1,
            speedMult: 1,
            expMult: 1,
            magnetMult: 1,
            incomingDamageMult: 1,
            maxHpMult: 1,
            armor: 0,
            critChance: 0,
            reviveCharges: 0,
            projectileBonus: 0,
            maxHpDamageRatio: 0,
            missingHpDamageRatio: 0,
            armorReflectRatio: 0,
            speedDamageRatio: 0,
            healingMult: 1
          };
          this.invincible = false;
          this.invincibleTimer = 0;
          this.dead = false;
          this.unhitTimer = 0;
          this.hindranceRemaining = 0;
          this.hindrancePower = 0;
          this.hindranceLabel = "";
          this.walkPhase = 0;
          this.walkFrame = 1;
          this.walkFacing = 1;
        }
        var _proto3 = Player.prototype;
        _proto3.update = function update(dt, game) {
          var _game$stageMods$playe, _game$stageMods;
          this.prevX = this.x;
          this.prevY = this.y;
          var v = game.input.getMoveVector();
          var stageSpeedMult = (_game$stageMods$playe = (_game$stageMods = game.stageMods) == null ? void 0 : _game$stageMods.playerSpeedMult) != null ? _game$stageMods$playe : 1;
          var hindered = (this.hindranceRemaining || 0) > 0;
          this.hindranceRemaining = Math.max(0, (this.hindranceRemaining || 0) - dt);
          var speed = CONFIG.PLAYER_SPEED * this.getSpeedMult() * stageSpeedMult * (hindered ? 1 - (this.hindrancePower || 0) : 1);
          this.x += v.x * speed * dt;
          this.y += v.y * speed * dt;
          if (game.runMode !== "endless") {
            var r = this.size;
            var W = game.arenaWidth || CONFIG.ARENA_WIDTH || CONFIG.CANVAS_WIDTH;
            var H = game.arenaHeight || CONFIG.ARENA_HEIGHT || CONFIG.CANVAS_HEIGHT;
            if (this.x < r) this.x = r;else if (this.x > W - r) this.x = W - r;
            if (this.y < r) this.y = r;else if (this.y > H - r) this.y = H - r;
          }
          for (var _iterator8 = _createForOfIteratorHelperLoose(this.weapons), _step8; !(_step8 = _iterator8()).done;) {
            var w = _step8.value;
            w.update(dt, this, game);
          }
          if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) this.invincible = false;
          }
          var regen = this._passiveSum("hpRegen");
          if (regen) this.heal(regen * dt);
          this.unhitTimer += dt;
          if (game.run) {
            if (this.unhitTimer > (game.run.longestUnhit || 0)) {
              game.run.longestUnhit = this.unhitTimer;
            }
          }
        };
        _proto3.applyHindrance = function applyHindrance(power, duration, label) {
          if (label === void 0) {
            label = "\u51CF\u901F";
          }
          this.hindrancePower = Math.min(0.4, Math.max(0, Number(power) || 0));
          this.hindranceRemaining = Math.min(2, Math.max(0, Number(duration) || 0));
          this.hindranceLabel = label;
        };
        _proto3.addPassive = function addPassive(def) {
          var _a$_b;
          var _a, _b;
          (_a$_b = (_a = this.passives)[_b = def.id]) != null ? _a$_b : _a[_b] = {
            def: def,
            count: 0
          };
          if (this.passives[def.id].count >= CONFIG.PASSIVE_MAX_STACK) return;
          this.passives[def.id].count++;
          this.recalculateStats();
        };
        _proto3._passiveSum = function _passiveSum(key) {
          var total = 0;
          for (var id in this.passives) {
            var p = this.passives[id];
            if (p.def.effect[key] !== void 0) total += p.def.effect[key] * p.count;
          }
          return total;
        };
        _proto3._passiveMult = function _passiveMult(key) {
          var mult = 1;
          for (var id in this.passives) {
            var p = this.passives[id];
            if (p.def.effect[key] !== void 0) mult *= Math.pow(1 + p.def.effect[key], p.count);
          }
          return mult;
        };
        _proto3.recalculateStats = function recalculateStats() {
          var _this$runModifiers$ma, _this$runModifiers;
          var prevMaxHp = this.maxHp;
          this.maxHp = this.baseMaxHp * this._passiveMult("maxHpMult") * ((_this$runModifiers$ma = (_this$runModifiers = this.runModifiers) == null ? void 0 : _this$runModifiers.maxHpMult) != null ? _this$runModifiers$ma : 1);
          this.hp += this.maxHp - prevMaxHp;
          this.hp = Math.min(this.hp, this.maxHp);
        };
        _proto3.getDamageMult = function getDamageMult() {
          var _this$runModifiers$da, _this$runModifiers2;
          var base = this._passiveMult("damageMult") * ((_this$runModifiers$da = (_this$runModifiers2 = this.runModifiers) == null ? void 0 : _this$runModifiers2.damageMult) != null ? _this$runModifiers$da : 1);
          return base * this.getHealthDamageMult() * this.getWoundedDamageMult() * this.getSpeedDamageMult();
        };
        _proto3.getHealthDamageMult = function getHealthDamageMult() {
          var _this$runModifiers3;
          var maxHpGrowth = Math.max(0, this.maxHp / this.baseMaxHp - 1);
          return 1 + maxHpGrowth * (((_this$runModifiers3 = this.runModifiers) == null ? void 0 : _this$runModifiers3.maxHpDamageRatio) || 0);
        };
        _proto3.getWoundedDamageMult = function getWoundedDamageMult() {
          var _this$runModifiers4;
          var missingHp = 1 - Math.max(0, this.hp) / Math.max(1, this.maxHp);
          return 1 + missingHp * (((_this$runModifiers4 = this.runModifiers) == null ? void 0 : _this$runModifiers4.missingHpDamageRatio) || 0);
        };
        _proto3.getSpeedDamageMult = function getSpeedDamageMult() {
          var _this$runModifiers5;
          var speedGrowth = Math.max(0, this.getSpeedMult() - 1);
          return 1 + speedGrowth * (((_this$runModifiers5 = this.runModifiers) == null ? void 0 : _this$runModifiers5.speedDamageRatio) || 0);
        };
        _proto3.getReflectDamage = function getReflectDamage(taken) {
          var _this$runModifiers6;
          if (taken === void 0) {
            taken = 0;
          }
          var ratio = ((_this$runModifiers6 = this.runModifiers) == null ? void 0 : _this$runModifiers6.armorReflectRatio) || 0;
          return ratio > 0 ? Math.max(1, (this.getArmor() + taken * 0.25) * ratio) : 0;
        };
        _proto3.getAreaMult = function getAreaMult() {
          var _this$runModifiers$ar, _this$runModifiers7;
          return this._passiveMult("areaMult") * ((_this$runModifiers$ar = (_this$runModifiers7 = this.runModifiers) == null ? void 0 : _this$runModifiers7.areaMult) != null ? _this$runModifiers$ar : 1);
        };
        _proto3.getCooldownMult = function getCooldownMult() {
          var _this$runModifiers$co, _this$runModifiers8;
          var mult = 1;
          for (var id in this.passives) {
            var p = this.passives[id];
            var v = p.def.effect.cooldownMult;
            if (v !== void 0) mult *= Math.pow(1 + v, p.count);
          }
          return Math.max(0.2, mult * ((_this$runModifiers$co = (_this$runModifiers8 = this.runModifiers) == null ? void 0 : _this$runModifiers8.cooldownMult) != null ? _this$runModifiers$co : 1));
        };
        _proto3.getSpeedMult = function getSpeedMult() {
          var _this$runModifiers$sp, _this$runModifiers9;
          return this._passiveMult("speedMult") * ((_this$runModifiers$sp = (_this$runModifiers9 = this.runModifiers) == null ? void 0 : _this$runModifiers9.speedMult) != null ? _this$runModifiers$sp : 1);
        };
        _proto3.getExpMult = function getExpMult() {
          var _this$runModifiers$ex, _this$runModifiers10;
          return this._passiveMult("expMult") * ((_this$runModifiers$ex = (_this$runModifiers10 = this.runModifiers) == null ? void 0 : _this$runModifiers10.expMult) != null ? _this$runModifiers$ex : 1);
        };
        _proto3.getMagnetRange = function getMagnetRange() {
          var _this$runModifiers$ma2, _this$runModifiers11;
          var mult = 1;
          for (var id in this.passives) {
            var p = this.passives[id];
            var v = p.def.effect.magnetMult;
            if (v !== void 0) mult *= Math.pow(1 + v, p.count);
          }
          return CONFIG.MAGNET_BASE * mult * ((_this$runModifiers$ma2 = (_this$runModifiers11 = this.runModifiers) == null ? void 0 : _this$runModifiers11.magnetMult) != null ? _this$runModifiers$ma2 : 1);
        };
        _proto3.getArmor = function getArmor() {
          var _this$runModifiers$ar2, _this$runModifiers12;
          return this._passiveSum("armor") + ((_this$runModifiers$ar2 = (_this$runModifiers12 = this.runModifiers) == null ? void 0 : _this$runModifiers12.armor) != null ? _this$runModifiers$ar2 : 0);
        };
        _proto3.getCritChance = function getCritChance() {
          var _this$runModifiers$cr, _this$runModifiers13;
          return this._passiveSum("critChance") + ((_this$runModifiers$cr = (_this$runModifiers13 = this.runModifiers) == null ? void 0 : _this$runModifiers13.critChance) != null ? _this$runModifiers$cr : 0);
        }
        /**
         * iter-14: dodge chance from the new Evasion passive. Soft-capped at 60%
         * so a player who stacks five copies still gets hit sometimes — full
         * immortality would break the late-game balance entirely.
         */;
        _proto3.getDodgeChance = function getDodgeChance() {
          return Math.min(0.6, this._passiveSum("dodgeChance"));
        }
        /**
         * iter-14: percentage damage reduction (Bulwark). Multiplies *after*
         * armor subtraction, soft-capped at 60% for the same reason as dodge.
         */;
        _proto3.getDamageReduction = function getDamageReduction() {
          return Math.min(0.6, this._passiveSum("damageReduction"));
        };
        _proto3.gainExp = function gainExp(amount2) {
          this.exp += amount2 * this.getExpMult();
          var levelUps = [];
          while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.level++;
            this.expToNext = Math.floor(this.expToNext * 1.2);
            this.heal(20);
            levelUps.push(this.level);
          }
          return levelUps;
        };
        _proto3.takeDamage = function takeDamage(damage, game, source) {
          var _this$runModifiers$in, _this$runModifiers14, _this$runModifiers15, _game$enemies;
          if (source === void 0) {
            source = null;
          }
          if (this.invincible || this.dead) return;
          var dodge = this.getDodgeChance();
          if (dodge > 0 && Math.random() < dodge) {
            game == null || game.createFloatingText == null || game.createFloatingText("Miss!", this.x, this.y - 30, "#88ffcc");
            return;
          }
          var afterArmor = Math.max(1, damage - this.getArmor());
          var taken = Math.max(1, afterArmor * (1 - this.getDamageReduction()) * ((_this$runModifiers$in = (_this$runModifiers14 = this.runModifiers) == null ? void 0 : _this$runModifiers14.incomingDamageMult) != null ? _this$runModifiers$in : 1));
          var hpBefore = this.hp;
          this.hp -= taken;
          this.invincible = true;
          this.invincibleTimer = CONFIG.INVINCIBILITY_TIME;
          this.unhitTimer = 0;
          if (game != null && game.run) game.run.tookAnyDamage = true;
          game == null || game.onPlayerHurt == null || game.onPlayerHurt(taken);
          var reflectRatio = ((_this$runModifiers15 = this.runModifiers) == null ? void 0 : _this$runModifiers15.armorReflectRatio) || 0;
          if (reflectRatio > 0 && game != null && (_game$enemies = game.enemies) != null && _game$enemies.length) {
            var reflected = this.getReflectDamage(taken);
            for (var _iterator9 = _createForOfIteratorHelperLoose(game.enemies), _step9; !(_step9 = _iterator9()).done;) {
              var enemy = _step9.value;
              if (enemy.hp > 0 && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= 150) {
                enemy.takeDamage(reflected);
                game.createFloatingText == null || game.createFloatingText("\u53CD " + Math.round(reflected), enemy.x, enemy.y - 20, "#d8b66c");
              }
            }
          }
          if (this.hp <= 0) {
            var _this$runModifiers16;
            if ((((_this$runModifiers16 = this.runModifiers) == null ? void 0 : _this$runModifiers16.reviveCharges) || 0) > 0) {
              this.runModifiers.reviveCharges--;
              this.hp = Math.max(1, this.maxHp * 0.4);
              this.invincible = true;
              this.invincibleTimer = 2;
              game == null || game.createFloatingText == null || game.createFloatingText("\u501F\u547D\u590D\u8D77", this.x, this.y - 42, "#ffdf8a");
            } else {
              this.hp = 0;
              this.dead = true;
            }
          }
          recordHealthLoss(game, source, Math.min(Math.max(0, hpBefore), taken), {
            fatal: this.dead,
            revived: hpBefore - taken <= 0 && !this.dead
          });
        };
        _proto3.heal = function heal(amount2) {
          var _this$runModifiers$he, _this$runModifiers17;
          this.hp = Math.min(this.hp + amount2 * ((_this$runModifiers$he = (_this$runModifiers17 = this.runModifiers) == null ? void 0 : _this$runModifiers17.healingMult) != null ? _this$runModifiers$he : 1), this.maxHp);
        };
        _proto3.render = function render(ctx) {
          ctx.save();
          ctx.globalAlpha = this.invincible ? 0.82 : 1;
          var x = Math.round(this.x);
          var y = Math.round(this.y);
          ctx.fillStyle = "rgba(14, 20, 22, 0.28)";
          ctx.fillRect(x - 28, y + 24, 56, 10);
          if (drawAnimatedHero()) ;else {
            ctx.fillStyle = "#335b70";
            ctx.fillRect(x - 16, y - 20, 32, 40);
            ctx.fillStyle = "#ecd79d";
            ctx.font = "700 14px monospace";
            ctx.textAlign = "center";
            ctx.fillText(this.heroGlyph || "\u547D", x, y + 5);
          }
          if (this.hindranceRemaining > 0) {
            ctx.fillStyle = "#171719";
            ctx.fillRect(x - 45, y + 37, 90, 21);
            ctx.fillStyle = "#eadac6";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(this.hindranceLabel + " \xB7 \u51CF\u901F", x, y + 52);
          }
          var garlic = this.weapons.find(function (w) {
            return w.id === "garlic";
          });
          if (garlic) {
            var range = garlic.getRange(this);
            ctx.fillStyle = "rgba(120, 205, 138, 0.08)";
            ctx.strokeStyle = "rgba(160,255,160,0.34)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, range, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          if (this.invincible) {
            ctx.strokeStyle = "rgba(210, 244, 255, 0.82)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 34, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        };
        return Player;
      }());
      function registerWeaponClass(_cls) {}
      function enemyHitRadius(enemy) {
        var _enemy$hitRadius2;
        return Math.max(1, Number((_enemy$hitRadius2 = enemy == null ? void 0 : enemy.hitRadius) != null ? _enemy$hitRadius2 : enemy == null ? void 0 : enemy.size) || 12);
      }
      var Enemy = exports('Enemy', /*#__PURE__*/function () {
        function _Enemy(x, y, type, hpMult, dmgMult) {
          this.x = x;
          this.y = y;
          this.type = type;
          this.size = type.size;
          this.visualDiameter = type.boss ? type.size * 2 : Math.max(42, Math.round(type.size * 2.6));
          this.hitRadius = type.boss ? type.size : this.visualDiameter / 2;
          this.maxHp = type.hp * hpMult;
          this.hp = this.maxHp;
          this.speed = type.speed;
          this.damage = type.damage * dmgMult;
          this.expValue = type.exp;
          this.color = type.color;
          this.id = type.id;
          this.boss = !!type.boss;
          this.flashTimer = 0;
          this.ability = type.ability;
          this.abilityTimer = 3;
          this.archetype = type.archetype || "chaser";
          this.ranged = !!type.ranged;
          this.splitter = !!type.splitter;
          this.dasher = !!type.dasher;
          this.shielded = !!type.shielded;
          this.bomber = !!type.bomber;
          this.illusionist = !!type.illusionist;
          this.fireTimer = type.fireCooldown ? type.fireCooldown * (0.5 + Math.random() * 0.5) : 0;
          this.rangedAim = null;
          this.dashTimer = type.dashInterval ? type.dashInterval * (0.3 + Math.random() * 0.7) : 0;
          this.dashActive = 0;
          this.dashAngle = 0;
          this.shieldHp = type.shieldHp ? type.shieldHp * hpMult : 0;
          this.fuseTimer = 0;
          this.fuseArmed = false;
          this.cloneTimer = type.cloneCooldown ? type.cloneCooldown * (0.6 + Math.random() * 0.8) : 0;
          this.slowTimer = 0;
          this.slowPct = 0;
          this.isClone = false;
        }
        var _proto4 = _Enemy.prototype;
        _proto4.update = function update(dt, game) {
          if (this.hp <= 0) return;
          this.skin || (this.skin = enemySkinFor(game.stageId, this.type));
          this.prevX = this.x;
          this.prevY = this.y;
          if (this.rangedAim) {
            var aim = this.rangedAim;
            if (Math.hypot(this.x - aim.x, this.y - aim.y) > 0.01) {
              this.rangedAim = null;
              this.fireTimer = Math.max(this.fireTimer, 0.35);
              return;
            }
            aim.remaining -= dt;
            this.fireTimer -= dt;
            if (this.slowTimer > 0) this.slowTimer -= dt;
            if (this.flashTimer > 0) this.flashTimer -= dt;
            if (aim.remaining <= 0) {
              var _game$audio;
              game.enemyProjectiles || (game.enemyProjectiles = []);
              game.enemyProjectiles.push(new EnemyProjectile(aim.x, aim.y, aim.angle, this.type.projectileSpeed || 220, this.type.projectileDamage * (game.enemyDmgMult || 1), this.skin, enemyDamageSource(this, "projectile")));
              this.rangedAim = null;
              (_game$audio = game.audio) == null || _game$audio.shoot == null || _game$audio.shoot();
            }
            return;
          }
          if (updateEnemyCast(this, dt, game)) return;
          var dx = game.player.x - this.x;
          var dy = game.player.y - this.y;
          var d = Math.hypot(dx, dy);
          var vx = 0,
            vy = 0;
          var tx = d > 0.01 ? dx / d : 0;
          var ty = d > 0.01 ? dy / d : 0;
          if (this.type.control) {
            this.abilityTimer -= dt;
            if (this.abilityTimer <= 0 && d < 480) {
              this.abilityTimer = this.type.control.interval || 6;
              beginEnemyCast(this, game);
              return;
            }
          }
          if (this.slowTimer > 0) this.slowTimer -= dt;
          var slowMult = this.slowTimer > 0 ? 1 - (this.slowPct || 0) : 1;
          if (this.bomber) {
            var fuseRange = this.type.fuseRange || 80;
            if (d < fuseRange) {
              this.fuseArmed = true;
            }
            if (this.fuseArmed) {
              this.fuseTimer += dt;
              if (this.fuseTimer >= (this.type.fuseTime || 1.4)) {
                var _game$audio2;
                var br = this.type.blastRadius || 120;
                var bd = (this.type.blastDamage || 40) * (game.enemyDmgMult || 1);
                var pd = Math.hypot(game.player.x - this.x, game.player.y - this.y);
                if (pd < br && !game.player.invincible) {
                  game.player.takeDamage(bd, game, enemyDamageSource(this, "blast"));
                  game.createFloatingText(Math.round(bd), game.player.x, game.player.y - 28, "#ff4433");
                }
                game.createParticles(this.x, this.y, "#ff8833", 24);
                game.shake == null || game.shake(0.25);
                (_game$audio2 = game.audio) == null || _game$audio2.explosion == null || _game$audio2.explosion();
                this.hp = 0;
                return;
              }
            }
            vx = tx * this.speed * slowMult;
            vy = ty * this.speed * slowMult;
            this.x += vx * dt;
            this.y += vy * dt;
            if (this.flashTimer > 0) this.flashTimer -= dt;
            return;
          }
          if (this.illusionist && !this.isClone) {
            this.cloneTimer -= dt;
            if (this.cloneTimer <= 0 && game.enemies.length < CONFIG.MAX_ENEMIES) {
              this.cloneTimer = this.type.cloneCooldown || 5.5;
              var n = this.type.cloneCount || 2;
              for (var i = 0; i < n && game.enemies.length < CONFIG.MAX_ENEMIES; i++) {
                var a = i / n * Math.PI * 2 + Math.random() * 0.4;
                var clone = new _Enemy(this.x + Math.cos(a) * 24, this.y + Math.sin(a) * 24, this.type, this.maxHp / Math.max(1, this.type.hp), (game.enemyDmgMult || 1) * 0.6);
                clone.isClone = true;
                clone.hp = Math.max(8, this.type.hp * 0.4);
                clone.maxHp = clone.hp;
                clone.color = "#e0b0ff";
                game.enemies.push(clone);
              }
              game.createParticles(this.x, this.y, "#cc88ff", 12);
            }
          }
          if (this.ranged && this.type.keepDistance) {
            var keep = this.type.keepDistance;
            var dir = d > keep + 30 ? 1 : d < keep - 30 ? -1 : 0;
            vx = tx * this.speed * dir * slowMult;
            vy = ty * this.speed * dir * slowMult;
            this.fireTimer -= dt;
            if (this.fireTimer <= 0 && d < this.type.firingRange) {
              var duration = this.type.shotWindup || 0.65;
              this.rangedAim = {
                x: this.x,
                y: this.y,
                angle: Math.atan2(dy, dx),
                length: Math.min(this.type.firingRange, d + 48),
                duration: duration,
                remaining: duration
              };
              this.fireTimer = this.type.fireCooldown || 2;
              return;
            }
          } else if (this.dasher) {
            this.dashTimer -= dt;
            if (this.dashActive > 0) {
              this.dashActive -= dt;
              vx = Math.cos(this.dashAngle) * (this.type.dashSpeed || 300) * slowMult;
              vy = Math.sin(this.dashAngle) * (this.type.dashSpeed || 300) * slowMult;
            } else if (this.dashTimer <= 0) {
              this.dashAngle = Math.atan2(dy, dx);
              this.dashActive = this.type.dashDuration || 0.5;
              this.dashTimer = this.type.dashInterval || 3.5;
            } else {
              vx = tx * this.speed * slowMult;
              vy = ty * this.speed * slowMult;
            }
          } else {
            vx = tx * this.speed * slowMult;
            vy = ty * this.speed * slowMult;
          }
          this.x += vx * dt;
          this.y += vy * dt;
          if (this.flashTimer > 0) this.flashTimer -= dt;
          if (this.boss) {
            this.abilityTimer -= dt;
            if (this.abilityTimer <= 0) {
              this.abilityTimer = this.type.abilityInterval || (this.ability === "summon" ? 6 : 4.5);
              game.onBossAbility == null || game.onBossAbility(this);
            }
          }
        };
        _proto4.takeDamage = function takeDamage(damage) {
          var dmg = damage;
          if (this.shielded && this.shieldHp > 0) {
            var _this$type$damageRedu;
            var reduction = (_this$type$damageRedu = this.type.damageReduction) != null ? _this$type$damageRedu : 0.5;
            dmg = damage * (1 - reduction);
            this.shieldHp -= damage * reduction;
            if (this.shieldHp <= 0) {
              this.shieldHp = 0;
              this.shielded = false;
            }
          }
          this.hp -= dmg;
          this.flashTimer = 0.08;
        };
        _proto4.render = function render(ctx) {
          ctx.save();
          if (this.slowTimer > 0) {
            ctx.fillStyle = "#88ccff";
          } else if (this.bomber && this.fuseArmed) {
            ctx.fillStyle = "#d95c48";
          } else {
            ctx.fillStyle = this.color;
          }
          var px = Math.max(4, Math.round(this.size / 5));
          var x = Math.round(this.x);
          var y = Math.round(this.y);
          ctx.fillRect(x - px * 4, y - px * 4, px * 8, px * 8);
          ctx.fillRect(x - px * 5, y - px * 2, px * 10, px * 4);
          ctx.fillStyle = "rgba(255,255,255,0.24)";
          ctx.fillRect(x - px * 2, y - px * 2, px, px);
          ctx.fillRect(x + px, y - px * 2, px, px);
          ctx.fillStyle = "#171015";
          ctx.fillRect(x - px, y + px, px * 2, px);
          if (this.flashTimer > 0) {
            ctx.strokeStyle = "rgba(255, 226, 170, 0.82)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.hitRadius + 3, 0, Math.PI * 2);
            ctx.stroke();
          }
          if (this.bomber && this.fuseArmed) {
            var fuseRatio = Math.max(0, Math.min(1, this.fuseTimer / (this.type.fuseTime || 1)));
            ctx.strokeStyle = "#ff9a72";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.hitRadius + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fuseRatio);
            ctx.stroke();
          }
          if (this.shielded && this.shieldHp > 0) {
            ctx.strokeStyle = "rgba(160,200,255,0.6)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
            ctx.stroke();
          }
          var pct = Math.max(0, this.hp / this.maxHp);
          var w = this.boss ? 80 : 30;
          ctx.fillStyle = "#222";
          ctx.fillRect(this.x - w / 2, this.y - this.size - 10, w, 4);
          ctx.fillStyle = pct > 0.5 ? "#44ff44" : pct > 0.25 ? "#ffaa33" : "#ff4444";
          ctx.fillRect(this.x - w / 2, this.y - this.size - 10, w * pct, 4);
          if (this.boss) {
            var _this$type;
            if ((_this$type = this.type) != null && _this$type.iceQueen) {
              ctx.strokeStyle = "rgba(170,220,255,0.85)";
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
              ctx.stroke();
              ctx.strokeStyle = "rgba(220,240,255,0.45)";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(this.x, this.y, this.size + 10, 0, Math.PI * 2);
              ctx.stroke();
            } else {
              ctx.strokeStyle = "#ff33aa";
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
          ctx.restore();
        };
        return _Enemy;
      }());
      var EnemyProjectile = exports('EnemyProjectile', /*#__PURE__*/function () {
        function EnemyProjectile(x, y, angle, speed, damage, skin, source) {
          var _skin, _skin2;
          if (skin === void 0) {
            skin = null;
          }
          if (source === void 0) {
            source = null;
          }
          this.x = x;
          this.y = y;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed;
          this.damage = damage;
          this.life = 3;
          this.skin = skin;
          this.source = source || {
            kind: "projectile",
            label: ((_skin = skin) == null ? void 0 : _skin.name) || "\u654C\u65B9\u98DE\u5F39"
          };
          this.size = ["skull", "comet", "mask"].includes((_skin2 = skin) == null ? void 0 : _skin2.projectileStyle) ? 10 : 6;
          this.shouldRemove = false;
        }
        var _proto5 = EnemyProjectile.prototype;
        _proto5.update = function update(dt, game) {
          var _game$worldMap;
          var oldX = this.x,
            oldY = this.y;
          this.x += this.vx * dt;
          this.y += this.vy * dt;
          this.life -= dt;
          var wall = (_game$worldMap = game.worldMap) == null || _game$worldMap.projectileHit == null ? void 0 : _game$worldMap.projectileHit(oldX, oldY, this.x, this.y, this.size);
          if (wall) {
            this.x = wall.x;
            this.y = wall.y;
            this.shouldRemove = true;
            return;
          }
          if (this.life <= 0) {
            this.shouldRemove = true;
            return;
          }
          var p = game.player;
          var d = Math.hypot(this.x - p.x, this.y - p.y);
          if (d < p.size + this.size) {
            if (!p.invincible) {
              p.takeDamage(this.damage, game, this.source || {
                kind: "projectile",
                label: "\u654C\u65B9\u98DE\u5F39"
              });
              game.createFloatingText(Math.round(this.damage), p.x, p.y - 30, "#ff6644");
            }
            this.shouldRemove = true;
          }
        };
        _proto5.render = function render(ctx) {
          var _this$skin, _this$skin2;
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(Math.atan2(this.vy, this.vx));
          var style = ((_this$skin = this.skin) == null ? void 0 : _this$skin.projectileStyle) || "orb";
          var color = ((_this$skin2 = this.skin) == null ? void 0 : _this$skin2.projectileColor) || "#ff44aa";
          ctx.fillStyle = color;
          if (style === "paper") {
            ctx.fillRect(-10, -5, 20, 10);
            ctx.fillStyle = "#9e2e39";
            ctx.fillRect(-3, -3, 2, 6);
            ctx.fillRect(2, -2, 5, 2);
          } else if (style === "blade" || style === "ice") {
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(-7, -5);
            ctx.lineTo(-2, 0);
            ctx.lineTo(-7, 5);
            ctx.closePath();
            ctx.fill();
          } else if (style === "star" || style === "comet") {
            ctx.fillRect(-this.size * 2, -2, this.size * 2, 4);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.62)";
            ctx.fillRect(-2, -2, 4, 4);
          }
          ctx.restore();
        };
        return EnemyProjectile;
      }());
      var Projectile = exports('Projectile', /*#__PURE__*/function () {
        function _Projectile(x, y, angle, def, damage, level, player) {
          this.x = x;
          this.y = y;
          this.startX = x;
          this.startY = y;
          this.angle = angle;
          this.def = def;
          this.damage = damage;
          this.level = level;
          this.size = 8;
          this.speed = def.speed || 300;
          this.piercing = !!def.piercing;
          this.homing = !!def.homing;
          this.arc = !!def.arc;
          this.boomerang = !!def.boomerang;
          this.explode = !!def.explode;
          this.explodeRadius = def.explodeRadius || 60;
          this.vx = Math.cos(angle) * this.speed;
          this.vy = Math.sin(angle) * this.speed;
          this.life = 4;
          this.hitEnemies = /* @__PURE__ */new Set();
          this.shouldRemove = false;
          this.travelDist = 0;
          this.maxDist = (def.baseRange || 300) * (player ? player.getAreaMult() : 1);
          this.id = def.id;
          this.retargetsRemaining = 0;
          this.fusionFieldOwner = null;
          this.splitOnHit = false;
          this.conductive = false;
          this.returnStrike = false;
          this.returning = false;
        }
        var _proto6 = _Projectile.prototype;
        _proto6.onFusionHit = function onFusionHit(enemy, game) {
          var _game$spatial3;
          if (this.conductive) conductHit(enemy, this.damage, game);
          if (this.splitOnHit) {
            this.splitOnHit = false;
            for (var _i4 = 0, _arr2 = [-1, 1]; _i4 < _arr2.length; _i4++) {
              var side = _arr2[_i4];
              if (game.projectiles.length >= 240) break;
              var shard = new _Projectile(this.x, this.y, this.angle + side * Math.PI / 2, this.def, this.damage * 0.45, this.level, game.player);
              shard.maxDist = 180;
              shard.life = 1;
              shard.hitEnemies.add(enemy);
              game.projectiles.push(shard);
            }
          }
          if (this.fusionFieldOwner) this.fusionFieldOwner.fusionFields.add(enemy.x, enemy.y, 55, this.damage * 0.2, "thunder");
          if (this.retargetsRemaining <= 0) return false;
          var candidates = ((_game$spatial3 = game.spatial) == null || _game$spatial3.queryRect == null ? void 0 : _game$spatial3.queryRect(this.x, this.y, 240)) || game.enemies;
          var target = null,
            nearest = 240;
          for (var _iterator10 = _createForOfIteratorHelperLoose(candidates), _step10; !(_step10 = _iterator10()).done;) {
            var other = _step10.value;
            if (other === enemy || other.hp <= 0 || this.hitEnemies.has(other)) continue;
            var distance = Math.hypot(other.x - this.x, other.y - this.y);
            if (distance < nearest) {
              nearest = distance;
              target = other;
            }
          }
          if (!target) return false;
          this.retargetsRemaining--;
          this.damage *= 0.75;
          this.angle = Math.atan2(target.y - this.y, target.x - this.x);
          this.vx = Math.cos(this.angle) * this.speed;
          this.vy = Math.sin(this.angle) * this.speed;
          this.maxDist = Math.max(this.maxDist, this.travelDist + 240);
          return true;
        };
        _proto6.update = function update(dt, game) {
          var _game$worldMap2;
          if (this.homing && this.hitEnemies.size === 0) {
            var target = game.spatial.findNearestEnemy(this.x, this.y, 9999);
            if (target) {
              var ta = Math.atan2(target.y - this.y, target.x - this.x);
              var diff = ta - this.angle;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              this.angle += diff * Math.min(1, 6 * dt);
              this.vx = Math.cos(this.angle) * this.speed;
              this.vy = Math.sin(this.angle) * this.speed;
            }
          }
          if (this.arc) {
            this.vy += 420 * dt;
          }
          if (this.boomerang) {
            var d = Math.hypot(this.x - this.startX, this.y - this.startY);
            if (!this.returning && d > this.maxDist * 0.5) {
              this.returning = true;
              if (this.returnStrike) {
                this.hitEnemies.clear();
                this.damage *= 1.25;
              }
            }
            if (this.returning) {
              var ra = Math.atan2(game.player.y - this.y, game.player.x - this.x);
              this.angle = ra;
              this.vx = Math.cos(ra) * this.speed;
              this.vy = Math.sin(ra) * this.speed;
            }
          }
          var oldX = this.x,
            oldY = this.y;
          this.x += this.vx * dt;
          this.y += this.vy * dt;
          var blockedByBuildings = this.id === "knife";
          var wall = blockedByBuildings && ((_game$worldMap2 = game.worldMap) == null || _game$worldMap2.projectileHit == null ? void 0 : _game$worldMap2.projectileHit(oldX, oldY, this.x, this.y, this.size));
          if (wall) {
            this.x = wall.x;
            this.y = wall.y;
            this._onEnd(game);
            this.shouldRemove = true;
            return;
          }
          this.travelDist += Math.hypot(this.vx, this.vy) * dt;
          this.life -= dt;
          if (this.travelDist > this.maxDist || this.life <= 0) {
            this._onEnd(game);
            this.shouldRemove = true;
          }
          if (this.boomerang) {
            var dp = Math.hypot(this.x - game.player.x, this.y - game.player.y);
            if (dp < 24 && this.travelDist > 60) {
              this._onEnd(game);
              this.shouldRemove = true;
            }
          }
        };
        _proto6._onEnd = function _onEnd(game) {
          if (this.explode) {
            game.audio.explosion();
            var cands = game != null && game.spatial ? game.spatial.queryRect(this.x, this.y, this.explodeRadius) : game.enemies;
            for (var _iterator11 = _createForOfIteratorHelperLoose(cands), _step11; !(_step11 = _iterator11()).done;) {
              var enemy = _step11.value;
              var d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
              if (d < this.explodeRadius + enemyHitRadius(enemy)) enemy.takeDamage(this.damage * 0.6);
            }
            game.createParticles(this.x, this.y, "#ff8800", 20);
            game.shake(0.15);
          }
        };
        _proto6.render = function render(ctx) {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.angle);
          switch (this.id) {
            case "knife":
              ctx.fillStyle = "#dfe8e9";
              ctx.fillRect(-13, -2, 22, 4);
              ctx.fillStyle = "#7f9da2";
              ctx.fillRect(7, -5, 4, 10);
              ctx.fillStyle = "#9c6f3d";
              ctx.fillRect(11, -2, 7, 4);
              ctx.fillStyle = "#f7f0cf";
              ctx.beginPath();
              ctx.moveTo(-18, 0);
              ctx.lineTo(-10, -5);
              ctx.lineTo(-10, 5);
              ctx.closePath();
              ctx.fill();
              break;
            case "magic_wand":
              ctx.fillStyle = "#e8d7a6";
              ctx.fillRect(-13, -7, 26, 14);
              ctx.fillStyle = "#a33245";
              ctx.fillRect(-8, -4, 3, 8);
              ctx.fillRect(-2, -5, 3, 10);
              ctx.fillRect(4, -3, 6, 2);
              ctx.strokeStyle = "#d36ba1";
              ctx.lineWidth = 2;
              ctx.strokeRect(-13, -7, 26, 14);
              break;
            case "boomerang":
              ctx.strokeStyle = "#c8ded7";
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.arc(-5, 0, 12, -1.15, 1.15);
              ctx.stroke();
              ctx.strokeStyle = "#5c8b83";
              ctx.lineWidth = 2;
              ctx.stroke();
              break;
            case "retro_blaster":
              ctx.fillStyle = "#7ee7db";
              ctx.fillRect(-16, -3, 30, 6);
              ctx.fillStyle = "#f4d26d";
              ctx.fillRect(-18, -1, 8, 2);
              break;
            case "axe":
              ctx.fillStyle = "#b0b5b8";
              ctx.beginPath();
              ctx.arc(0, 0, 10, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = "#555";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, 10, 0, Math.PI * 2);
              ctx.stroke();
              break;
            case "cross":
              ctx.fillStyle = "#fff3a0";
              ctx.fillRect(-10, -3, 20, 6);
              ctx.fillRect(-3, -10, 6, 20);
              break;
            case "fire_wand":
              ctx.fillStyle = "#ff6600";
              ctx.beginPath();
              ctx.arc(0, 0, 9, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#ffcc00";
              ctx.beginPath();
              ctx.arc(0, 0, 5, 0, Math.PI * 2);
              ctx.fill();
              break;
            default:
              ctx.fillStyle = "#e8dcc0";
              ctx.fillRect(-7, -3, 14, 6);
          }
          ctx.restore();
        };
        return _Projectile;
      }());
      var OrbitShard = /*#__PURE__*/function () {
        function OrbitShard(weapon, index, total, radius, damage) {
          this.weapon = weapon;
          this.index = index;
          this.total = total;
          this.radius = radius;
          this.damage = damage;
          this.angle = index / total * Math.PI * 2;
          this.hitTimers = /* @__PURE__ */new Map();
          this.x = 0;
          this.y = 0;
        }
        var _proto7 = OrbitShard.prototype;
        _proto7.update = function update(dt, player, game) {
          this.angle += dt * 2.4 * (this.direction || 1);
          this.x = player.x + Math.cos(this.angle) * this.radius;
          this.y = player.y + Math.sin(this.angle) * this.radius;
          if (this.guarding && this.weapon.guardCooldown <= 0) {
            for (var _iterator12 = _createForOfIteratorHelperLoose(game.enemyProjectiles || []), _step12; !(_step12 = _iterator12()).done;) {
              var shot = _step12.value;
              if (shot.shouldRemove || Math.hypot(shot.x - this.x, shot.y - this.y) > 10 + shot.size) continue;
              shot.shouldRemove = true;
              this.weapon.guardCooldown = 0.35;
              break;
            }
          }
          for (var _iterator13 = _createForOfIteratorHelperLoose(this.hitTimers), _step13; !(_step13 = _iterator13()).done;) {
            var _step13$value = _step13.value,
              enemy = _step13$value[0],
              t = _step13$value[1];
            var nt = t - dt;
            if (nt <= 0) this.hitTimers["delete"](enemy);else this.hitTimers.set(enemy, nt);
          }
          var SHARD_HIT = 10;
          var queryR = SHARD_HIT + 80;
          for (var _iterator14 = _createForOfIteratorHelperLoose(game.spatial.queryRect(this.x, this.y, queryR)), _step14; !(_step14 = _iterator14()).done;) {
            var e = _step14.value;
            if (e.hp <= 0 || this.hitTimers.has(e)) continue;
            var d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < enemyHitRadius(e) + SHARD_HIT) {
              e.takeDamage(this.damage);
              this.hitTimers.set(e, 0.5);
              game.createFloatingText(Math.round(this.damage), e.x, e.y - 18, "#ffffcc");
            }
          }
        };
        _proto7.render = function render(ctx) {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.angle + Math.PI / 2);
          ctx.fillStyle = this.direction === -1 ? "#b4dced" : "#fff1a8";
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(-3, -5);
          ctx.lineTo(-2, 4);
          ctx.lineTo(2, 4);
          ctx.lineTo(3, -5);
          ctx.closePath();
          ctx.fill();
          ctx.fillRect(-6, 3, 12, 2);
          ctx.fillRect(-1, 5, 2, 4);
          ctx.restore();
        };
        return OrbitShard;
      }();
      var Mine = /*#__PURE__*/function () {
        function _Mine(x, y, radius, damage, fuse, element) {
          if (element === void 0) {
            element = null;
          }
          this.x = x;
          this.y = y;
          this.radius = radius;
          this.damage = damage;
          this.fuse = fuse;
          this.element = element;
          this.maxFuse = fuse;
          this.relay = false;
          this.relayTriggered = false;
          this.shouldRemove = false;
        }
        var _proto8 = _Mine.prototype;
        _proto8.update = function update(dt, game) {
          if (this.shouldRemove) return;
          this.fuse -= dt;
          if (this.fuse <= 0) {
            var _game$audio3;
            this.shouldRemove = true;
            if (this.relay) {
              for (var _iterator15 = _createForOfIteratorHelperLoose(game.mines || []), _step15; !(_step15 = _iterator15()).done;) {
                var other = _step15.value;
                if (other === this || other.shouldRemove || !other.relay || other.relayTriggered || other.fuse <= 0.45) continue;
                if (Math.hypot(other.x - this.x, other.y - this.y) > this.radius + other.radius) continue;
                other.fuse = 0.45;
                other.relayTriggered = true;
                other.damage *= 1.25;
              }
            }
            var cands = game != null && game.spatial ? game.spatial.queryRect(this.x, this.y, this.radius) : game.enemies;
            for (var _iterator16 = _createForOfIteratorHelperLoose(cands), _step16; !(_step16 = _iterator16()).done;) {
              var enemy = _step16.value;
              var d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
              if (d < this.radius + enemyHitRadius(enemy)) {
                var _game$reactions4;
                enemy.takeDamage(this.damage);
                game == null || (_game$reactions4 = game.reactions) == null || _game$reactions4.applyHit == null || _game$reactions4.applyHit(enemy, this.element, this.damage);
                game.createFloatingText(Math.round(this.damage), enemy.x, enemy.y - 20, "#ff9944");
              }
            }
            game.createParticles(this.x, this.y, "#ff8833", 20);
            if (this.element === "fire") {
              var _game$player2;
              var x = this.x;
              var y = this.y;
              var radius = this.radius * 0.82;
              var tickDamage = this.damage * 0.28;
              var owner = (_game$player2 = game.player) == null || (_game$player2 = _game$player2.weapons) == null ? void 0 : _game$player2.find(function (weapon) {
                return weapon.id === "mine";
              });
              if (owner != null && owner.fusionFields) owner.fusionFields.add(x, y, radius, tickDamage, "fire", 1.5);else {
                var _game$combatVisuals3;
                (_game$combatVisuals3 = game.combatVisuals) == null || _game$combatVisuals3.firePatch == null || _game$combatVisuals3.firePatch(x, y, radius, 1.45);
                for (var _i5 = 0, _arr3 = [0.35, 0.7, 1.05]; _i5 < _arr3.length; _i5++) {
                  var _game$effects;
                  var delay = _arr3[_i5];
                  (_game$effects = game.effects) == null || _game$effects.schedule == null || _game$effects.schedule(delay, function () {
                    var _game$spatial4;
                    var targets = ((_game$spatial4 = game.spatial) == null || _game$spatial4.queryRect == null ? void 0 : _game$spatial4.queryRect(x, y, radius)) || game.enemies;
                    for (var _iterator17 = _createForOfIteratorHelperLoose(targets), _step17; !(_step17 = _iterator17()).done;) {
                      var _game$reactions3;
                      var enemy = _step17.value;
                      if (Math.hypot(enemy.x - x, enemy.y - y) > radius + enemyHitRadius(enemy)) continue;
                      enemy.takeDamage(tickDamage);
                      (_game$reactions3 = game.reactions) == null || _game$reactions3.applyHit == null || _game$reactions3.applyHit(enemy, "fire", tickDamage);
                    }
                  });
                }
              }
            }
            game.shake(0.25);
            (_game$audio3 = game.audio) == null || _game$audio3.explosion == null || _game$audio3.explosion();
            this.shouldRemove = true;
          }
        };
        _proto8.snapshot = function snapshot() {
          return {
            x: this.x,
            y: this.y,
            radius: this.radius,
            damage: this.damage,
            fuse: this.fuse,
            maxFuse: this.maxFuse,
            element: this.element,
            relay: this.relay,
            relayTriggered: this.relayTriggered
          };
        };
        _Mine.restore = function restore(value) {
          if (!value || !["x", "y", "radius", "damage", "fuse", "maxFuse"].every(function (key) {
            return Number.isFinite(value[key]);
          }) || value.radius <= 0 || value.radius > 1e3 || value.damage < 0 || value.fuse <= 0 || value.fuse > 10 || value.maxFuse <= 0 || value.maxFuse > 10) return null;
          var mine = new _Mine(value.x, value.y, value.radius, value.damage, value.fuse, value.element === "fire" ? "fire" : null);
          mine.maxFuse = value.maxFuse;
          mine.relay = value.relay === true;
          mine.relayTriggered = value.relayTriggered === true;
          return mine;
        };
        _proto8.render = function render(ctx) {
          var armed = this.fuse < this.maxFuse * 0.5;
          var fuseRatio = Math.max(0, Math.min(1, this.fuse / this.maxFuse));
          ctx.save();
          ctx.fillStyle = armed ? "rgba(255,80,80,0.38)" : "rgba(180,74,74,0.25)";
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = armed ? "#ffad86" : "#c47769";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fuseRatio);
          ctx.stroke();
          ctx.fillStyle = armed ? "#ff4444" : "#aa4444";
          ctx.beginPath();
          ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        };
        return _Mine;
      }();
      var ExpOrb = exports('ExpOrb', /*#__PURE__*/function () {
        function ExpOrb(x, y, value) {
          this.x = x;
          this.y = y;
          this.value = value;
          this.size = 4 + Math.log(value + 1) * 1.5;
          this.shouldRemove = false;
          this.magnetSpeed = 0;
          this.life = CONFIG.EXP_ORB_LIFETIME;
        }
        var _proto9 = ExpOrb.prototype;
        _proto9.update = function update(dt, game) {
          this.life -= dt;
          if (this.life <= 0) {
            this.shouldRemove = true;
            return;
          }
          var p = game.player;
          var dx = p.x - this.x;
          var dy = p.y - this.y;
          var d = Math.hypot(dx, dy);
          var mag = p.getMagnetRange();
          if (d < CONFIG.PICKUP_DISTANCE) {
            p.gainExp(this.value);
            game.createFloatingText("+" + this.value + "XP", p.x, p.y - 40, "#66bbff");
            game.audio.pickup();
            if (game.run) game.run.orbsCollected = (game.run.orbsCollected || 0) + 1;
            this.shouldRemove = true;
            return;
          }
          if (d < mag) {
            this.magnetSpeed = Math.min(this.magnetSpeed + 600 * dt, 560);
            this.x += dx / d * this.magnetSpeed * dt;
            this.y += dy / d * this.magnetSpeed * dt;
          }
        };
        _proto9.render = function render(ctx) {
          var a = this.life < 2 ? Math.max(0, this.life / 2) : 1;
          ctx.save();
          ctx.globalAlpha = a;
          var g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2.2);
          g.addColorStop(0, "rgba(100,180,255,0.55)");
          g.addColorStop(1, "rgba(100,180,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#7ab8ff";
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };
        return ExpOrb;
      }());
      function findEnemyDef(id) {
        for (var _i6 = 0, _Object$values = Object.values(ENEMIES); _i6 < _Object$values.length; _i6++) {
          var def = _Object$values[_i6];
          if (def.id === id) return def;
        }
        return null;
      }

      // prototype-2d-pixel/src/weapons.js
      var Weapon = exports('Weapon', /*#__PURE__*/function () {
        function Weapon(def) {
          this.def = def;
          this.id = def.id;
          this.name = def.name;
          this.icon = def.icon;
          this.level = 1;
          this.cooldown = 0;
          this._shards = null;
          this.fusion = null;
          this.fusionFields = new FusionFields();
          this.guardCooldown = 0;
          this.presentationHold = 0;
        }
        var _proto10 = Weapon.prototype;
        _proto10.levelUp = function levelUp() {
          this.level++;
        };
        _proto10.isEvolved = function isEvolved() {
          return !!this.def.evolveLevel && this.level >= this.def.evolveLevel;
        };
        _proto10.update = function update(dt, player, game) {
          this.presentationHold = Math.max(0, this.presentationHold - dt);
          this.fusionFields.update(dt, game, this.id);
          this.guardCooldown = Math.max(0, this.guardCooldown - dt);
          if (this.def.type === "orbit") {
            var activating = !this._shards;
            this._ensureShards(player);
            if (activating) this._showCast(player, game);
            for (var _iterator18 = _createForOfIteratorHelperLoose(this._shards), _step18; !(_step18 = _iterator18()).done;) {
              var s = _step18.value;
              s.update(dt, player, game);
            }
            return;
          }
          this.cooldown -= dt;
          if (this.cooldown <= 0) {
            var fired = this.fire(player, game);
            this.cooldown = fired === false ? 0 : this.getCooldown(player);
          }
        };
        _proto10.getDamage = function getDamage(player) {
          var _this$fusion$damageMu, _this$fusion;
          var base = this.def.baseDamage * (1 + (this.level - 1) * 0.2) * player.getDamageMult();
          if (this.isEvolved() && this.def.evolveDamageMult) {
            base *= this.def.evolveDamageMult;
          }
          base *= (_this$fusion$damageMu = (_this$fusion = this.fusion) == null ? void 0 : _this$fusion.damageMult) != null ? _this$fusion$damageMu : 1;
          if (hasFusion(this, "black_tortoise_breath")) base += ((player.getArmor == null ? void 0 : player.getArmor()) || 0) * 0.25;
          if (hasFusion(this, "taotie_ward_body")) base += player.maxHp * 8e-3 + ((player.getArmor == null ? void 0 : player.getArmor()) || 0) * 0.3;
          return base;
        };
        _proto10._rollCrit = function _rollCrit(player, game, baseDamage, x, y, color) {
          var chance = player.getCritChance();
          if (this.isEvolved() && this.def.evolveBonusCrit) {
            chance += this.def.evolveBonusCrit;
          }
          if (chance > 0 && Math.random() < chance) {
            var dmg = baseDamage * 2;
            game.createFloatingText(Math.round(dmg), x, y, "#ffee44", {
              crit: true
            });
            return dmg;
          }
          game.createFloatingText(Math.round(baseDamage), x, y, color);
          return baseDamage;
        };
        _proto10.getCooldown = function getCooldown(player) {
          var _this$fusion$cooldown, _this$fusion2;
          var cd = this.def.baseCooldown * Math.pow(0.92, this.level - 1) * player.getCooldownMult();
          if (this.isEvolved() && this.def.evolveCooldownMult) {
            cd *= this.def.evolveCooldownMult;
          }
          cd *= (_this$fusion$cooldown = (_this$fusion2 = this.fusion) == null ? void 0 : _this$fusion2.cooldownMult) != null ? _this$fusion$cooldown : 1;
          return cd;
        };
        _proto10.getRange = function getRange(player) {
          var _this$fusion$rangeMul, _this$fusion3;
          return this.def.baseRange * (1 + (this.level - 1) * 0.1) * player.getAreaMult() * ((_this$fusion$rangeMul = (_this$fusion3 = this.fusion) == null ? void 0 : _this$fusion3.rangeMult) != null ? _this$fusion$rangeMul : 1);
        };
        _proto10.getOrbitShardCount = function getOrbitShardCount(player) {
          var _player$runModifiers, _player$passives, _this$fusion4;
          var n = this.def.projectileCount + Math.floor((this.level - 1) / 2) + (((_player$runModifiers = player.runModifiers) == null ? void 0 : _player$runModifiers.projectileBonus) || 0);
          if (this.isEvolved()) n = n * 2;
          var extra = Math.floor((((_player$passives = player.passives) == null || (_player$passives = _player$passives.cooldown) == null ? void 0 : _player$passives.count) || 0) / 2);
          return Math.min(12, n + extra + (((_this$fusion4 = this.fusion) == null ? void 0 : _this$fusion4.projectileBonus) || 0));
        };
        _proto10._ensureShards = function _ensureShards(player) {
          var count = this.getOrbitShardCount(player);
          var radius = this.getRange(player);
          var dual = hasFusion(this, "twin_guard_halo");
          var dmg = this.getDamage(player);
          if (!this._shards || this._shards.length !== count) {
            this._shards = [];
            for (var i = 0; i < count; i++) {
              this._shards.push(new OrbitShard(this, i, count, radius, dmg));
            }
          } else {
            for (var _iterator19 = _createForOfIteratorHelperLoose(this._shards), _step19; !(_step19 = _iterator19()).done;) {
              var s = _step19.value;
              s.radius = radius;
              s.damage = dmg;
              s.total = count;
            }
          }
          for (var _iterator20 = _createForOfIteratorHelperLoose(this._shards), _step20; !(_step20 = _iterator20()).done;) {
            var shard = _step20.value;
            shard.direction = dual && shard.index % 2 ? -1 : 1;
            shard.radius = dual && shard.index % 2 ? radius * 0.58 : radius;
            shard.guarding = dual;
          }
        };
        _proto10.renderExtras = function renderExtras(ctx) {
          if (this.def.type === "orbit" && this._shards) {
            for (var _iterator21 = _createForOfIteratorHelperLoose(this._shards), _step21; !(_step21 = _iterator21()).done;) {
              var s = _step21.value;
              s.render(ctx);
            }
          }
        };
        _proto10.fire = function fire(player, game) {
          switch (this.def.type) {
            case "melee":
              return this._fireMelee(player, game);
            case "projectile":
              return this._fireProjectile(player, game);
            case "instant":
              return this._fireInstant(player, game);
            case "aura":
              return this._fireAura(player, game);
            case "mine":
              return this._fireMine(player, game);
            case "nova":
              return this._fireNova(player, game);
            case "drain":
              return this._fireDrain(player, game);
          }
        };
        _proto10._showCast = function _showCast(player, game, angle, sustained) {
          var _game$save;
          if (sustained === void 0) {
            sustained = false;
          }
          var alreadyChanneling = sustained && this.presentationHold > 0;
          if (sustained) this.presentationHold = Math.max(0.75, this.getCooldown(player) * 1.8);
          if (alreadyChanneling) return;
          var facing = Number.isFinite(angle) ? Math.cos(angle) : player.walkFacing || 1;
          startHeroWeaponAction(player, this.id, facing, ((_game$save = game.save) == null || (_game$save = _game$save.settings) == null ? void 0 : _game$save.reducedMotion) || false);
        };
        _proto10._damageEnemy = function _damageEnemy(enemy, damage, game) {
          var _game$reactions5;
          enemy.takeDamage(damage);
          game == null || (_game$reactions5 = game.reactions) == null || _game$reactions5.applyHit == null || _game$reactions5.applyHit(enemy, this.def.element, damage);
          if (this.id === "lightning" && hasFusion(this, "three_pure_thunder")) conductHit(enemy, damage, game);
        };
        _proto10._fireMelee = function _fireMelee(player, game) {
          var _game$combatVisuals4;
          var range = this.getRange(player);
          var baseDmg = this.getDamage(player);
          var hit = /* @__PURE__ */new Set();
          var drained = 0;
          var evolved = this.isEvolved();
          var candidates = game != null && game.spatial ? game.spatial.queryRect(player.x, player.y, Math.max(range, 40) + 128) : game.enemies;
          var angle = 0;
          if (!evolved) {
            var nearest = Infinity;
            for (var _iterator22 = _createForOfIteratorHelperLoose(candidates), _step22; !(_step22 = _iterator22()).done;) {
              var enemy = _step22.value;
              var distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
              if (enemy.hp > 0 && distance <= range + enemyHitRadius(enemy) && distance < nearest) {
                nearest = distance;
                angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
              }
            }
            if (nearest === Infinity && !this.fusion) return false;
          }
          var cos = Math.cos(angle),
            sin = Math.sin(angle);
          for (var _iterator23 = _createForOfIteratorHelperLoose(candidates), _step23; !(_step23 = _iterator23()).done;) {
            var _enemy = _step23.value;
            var dx = _enemy.x - player.x;
            var dy = _enemy.y - player.y;
            var hitRadius = enemyHitRadius(_enemy);
            if (evolved) {
              if (Math.hypot(dx, dy) > range + hitRadius) continue;
            } else {
              var along = dx * cos + dy * sin;
              var across = -dx * sin + dy * cos;
              if (Math.hypot(Math.max(0, Math.abs(along) - range), Math.max(0, Math.abs(across) - 40)) > hitRadius) continue;
            }
            if (_enemy.hp <= 0 || hit.has(_enemy)) continue;
            hit.add(_enemy);
            var dmg = this._rollCrit(player, game, baseDmg, _enemy.x, _enemy.y - 20, "#ffaa00");
            var before = _enemy.hp;
            this._damageEnemy(_enemy, dmg, game);
            drained += Math.min(before, Math.max(0, before - _enemy.hp));
          }
          if (hasFusion(this, "blood_moon_cycle") && drained > 0) player.heal == null || player.heal(Math.min(player.maxHp * 0.02, drained * 0.08));
          if (evolved) {
            game.createParticles(player.x, player.y, "#ff6644", 12);
          } else {
            game.createParticles(player.x - cos * range / 2, player.y - sin * range / 2, "#ffaa00", 5);
            game.createParticles(player.x + cos * range / 2, player.y + sin * range / 2, "#ffaa00", 5);
          }
          (_game$combatVisuals4 = game.combatVisuals) == null || _game$combatVisuals4.swordSweep == null || _game$combatVisuals4.swordSweep(player.x, player.y, range, {
            fused: !!this.fusion,
            fullCircle: evolved,
            angle: angle
          });
          if (hasFusion(this, "causal_sword_domain")) {
            for (var _i7 = 0, _arr4 = [-1, 1]; _i7 < _arr4.length; _i7++) {
              var direction = _arr4[_i7];
              this.fusionFields.add(player.x + direction * cos * range * 0.5, player.y + direction * sin * range * 0.5, 44, baseDmg * 0.25, "blade");
            }
          }
          game.audio.shoot();
          this._showCast(player, game, angle);
        };
        _proto10._fireProjectile = function _fireProjectile(player, game) {
          var _this$fusion$projecti, _this$fusion5, _player$runModifiers2;
          var count = this.def.projectileCount + Math.floor((this.level - 1) / 2) + ((_this$fusion$projecti = (_this$fusion5 = this.fusion) == null ? void 0 : _this$fusion5.projectileBonus) != null ? _this$fusion$projecti : 0) + (((_player$runModifiers2 = player.runModifiers) == null ? void 0 : _player$runModifiers2.projectileBonus) || 0);
          if (this.isEvolved() && this.id === "knife") count = Math.max(count, 5);
          if (this.isEvolved() && this.id === "magic_wand") count += 2;
          var spreadDeg = count > 1 ? this.isEvolved() ? 24 : 14 : 0;
          var target = game.spatial.findNearestEnemy(player.x, player.y, this.getRange(player));
          if (!target) return;
          var base = Math.atan2(target.y - player.y, target.x - player.x);
          for (var i = 0; i < count; i++) {
            var offset = (i - (count - 1) / 2) * spreadDeg * Math.PI / 180;
            var projectile = new Projectile(player.x, player.y, base + offset, this.def, this.getDamage(player), this.level, player);
            projectile.maxDist = this.getRange(player);
            if (hasFusion(this, "paper_underworld_edict")) projectile.retargetsRemaining = 2;
            if (hasFusion(this, "three_wall_starfall")) projectile.fusionFieldOwner = this;
            projectile.splitOnHit = hasFusion(this, "five_prisons_array");
            if (hasFusion(this, "star_shard_bloom")) projectile.splitOnHit = true;
            projectile.conductive = hasFusion(this, "three_pure_thunder");
            projectile.returnStrike = hasFusion(this, "yin_yang_wind_cut");
            game.projectiles.push(projectile);
          }
          game.audio.shoot();
          this._showCast(player, game, base);
        };
        _proto10._fireInstant = function _fireInstant(player, game) {
          var _game$combatVisuals5;
          var range = this.getRange(player);
          var baseDmg = this.getDamage(player);
          var candIter = game != null && game.spatial ? game.spatial.queryRect(player.x, player.y, range) : game.enemies;
          var targets = [];
          for (var _iterator24 = _createForOfIteratorHelperLoose(candIter), _step24; !(_step24 = _iterator24()).done;) {
            var _e = _step24.value;
            if (Math.hypot(_e.x - player.x, _e.y - player.y) < range + enemyHitRadius(_e)) targets.push(_e);
          }
          if (!targets.length) return;
          var evolved = this.isEvolved();
          var strikes = evolved ? Math.min(3, targets.length) : 1;
          var picked = /* @__PURE__ */new Set();
          var visualPoints = [{
            x: player.x,
            y: player.y
          }];
          for (var i = 0; i < strikes; i++) {
            var target = null;
            while (picked.size < targets.length) {
              var cand = targets[Math.floor(Math.random() * targets.length)];
              if (!picked.has(cand)) {
                target = cand;
                picked.add(cand);
                break;
              }
            }
            if (!target) break;
            var dmg = this._rollCrit(player, game, baseDmg, target.x, target.y - 20, "#ffff66");
            this._damageEnemy(target, dmg, game);
            game.createParticles(target.x, target.y, "#ffff66", 14);
            visualPoints.push({
              x: target.x,
              y: target.y
            });
            if (this.def.chain && this.level >= 3) {
              var current = target;
              var chained = /* @__PURE__ */new Set([current]);
              var chainCount = evolved ? this.def.chainCount + 2 : this.def.chainCount;
              for (var c = 0; c < chainCount; c++) {
                var nearest = null,
                  minD = Infinity;
                var hopCands = game != null && game.spatial ? game.spatial.queryRect(current.x, current.y, 180) : game.enemies;
                for (var _iterator25 = _createForOfIteratorHelperLoose(hopCands), _step25; !(_step25 = _iterator25()).done;) {
                  var e = _step25.value;
                  if (chained.has(e)) continue;
                  var d = Math.hypot(e.x - current.x, e.y - current.y);
                  if (d < 180 && d < minD) {
                    minD = d;
                    nearest = e;
                  }
                }
                if (!nearest) break;
                this._damageEnemy(nearest, dmg * 0.7, game);
                game.createParticles(nearest.x, nearest.y, "#ffff66", 8);
                visualPoints.push({
                  x: nearest.x,
                  y: nearest.y
                });
                chained.add(nearest);
                current = nearest;
              }
            }
          }
          (_game$combatVisuals5 = game.combatVisuals) == null || _game$combatVisuals5.lightning == null || _game$combatVisuals5.lightning(visualPoints, {
            fused: !!this.fusion
          });
          game.audio.shoot();
          var first = visualPoints[1];
          if (first) this._showCast(player, game, Math.atan2(first.y - player.y, first.x - player.x));
        };
        _proto10._fireAura = function _fireAura(player, game) {
          var _game$combatVisuals6;
          var range = this.getRange(player);
          var devour = hasFusion(this, "taotie_ward_body");
          var dmg = this.getDamage(player);
          var consumed = false;
          var candidates = game != null && game.spatial ? game.spatial.queryRect(player.x, player.y, range) : game.enemies;
          for (var _iterator26 = _createForOfIteratorHelperLoose(candidates), _step26; !(_step26 = _iterator26()).done;) {
            var enemy = _step26.value;
            var d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            if (enemy.hp > 0 && d < range + enemyHitRadius(enemy)) {
              this._damageEnemy(enemy, dmg, game);
              if (enemy.hp <= 0) consumed = true;
              if (hasFusion(this, "black_tortoise_breath") && enemy.hp > 0) {
                enemy.slowPct = Math.max(enemy.slowTimer > 0 ? enemy.slowPct || 0 : 0, enemy.boss ? 0.12 : 0.4);
                enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.65);
              }
            }
          }
          if (devour && consumed) player.heal == null || player.heal(player.maxHp * 0.01);
          (_game$combatVisuals6 = game.combatVisuals) == null || _game$combatVisuals6.field == null || _game$combatVisuals6.field(player.x, player.y, range, this.def.element || "steam", {
            fused: !!this.fusion,
            sustained: true,
            key: "weapon-field:" + this.id,
            duration: Math.max(0.52, this.getCooldown(player) * 1.2)
          });
          this._showCast(player, game, void 0, true);
          if (Math.random() < 0.4) {
            var a = Math.random() * Math.PI * 2;
            var r = Math.random() * range;
            game.createParticles(player.x + Math.cos(a) * r, player.y + Math.sin(a) * r, "#88ff88", 1);
          }
        };
        _proto10._fireMine = function _fireMine(player, game) {
          var _this2 = this,
            _game$audio4;
          var radius = this.getRange(player);
          var dmg = this.getDamage(player);
          var fuse = this.def.fuse || 1.2;
          game.mines = game.mines || [];
          var previousCount = game.mines.length;
          var place = function place(x, y, r) {
            if (game.mines.length >= 24) return;
            var mine = new Mine(x, y, r, dmg, fuse, _this2.def.element);
            mine.relay = hasFusion(_this2, "endless_talisman_chain");
            game.mines.push(mine);
          };
          place(player.x, player.y, radius);
          if (this.isEvolved()) {
            var a = Math.random() * Math.PI * 2;
            place(player.x + Math.cos(a) * 60, player.y + Math.sin(a) * 60, radius * 0.8);
          }
          (_game$audio4 = game.audio) == null || _game$audio4.shoot == null || _game$audio4.shoot();
          if (game.mines.length > previousCount) this._showCast(player, game);
        }
        /**
         * Frost Nova: radial burst centred on the hero that damages every foe
         * within `range` and applies a timed slow. Evolved variant fires a
         * second delayed ring at 60% strength for a staggered AOE.
         */;
        _proto10._fireNova = function _fireNova(player, game) {
          var _this$def$slowPct,
            _this$def$slowDuratio,
            _game$combatVisuals7,
            _this3 = this,
            _game$audio5;
          var range = this.getRange(player);
          var baseDmg = this.getDamage(player);
          var slowPct = (_this$def$slowPct = this.def.slowPct) != null ? _this$def$slowPct : 0.5;
          var slowDur = (_this$def$slowDuratio = this.def.slowDuration) != null ? _this$def$slowDuratio : 1.2;
          var candidates = game != null && game.spatial ? game.spatial.queryRect(player.x, player.y, range) : game.enemies;
          for (var _iterator27 = _createForOfIteratorHelperLoose(candidates), _step27; !(_step27 = _iterator27()).done;) {
            var enemy = _step27.value;
            var d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            if (d < range + enemyHitRadius(enemy)) {
              var dmg = this._rollCrit(player, game, baseDmg, enemy.x, enemy.y - 20, "#88ddff");
              this._damageEnemy(enemy, dmg, game);
              if (!enemy.slowTimer || enemy.slowTimer < slowDur) {
                enemy.slowTimer = slowDur;
                enemy.slowPct = slowPct;
              }
            }
          }
          (_game$combatVisuals7 = game.combatVisuals) == null || _game$combatVisuals7.frost == null || _game$combatVisuals7.frost(player.x, player.y, range, {
            fused: !!this.fusion
          });
          if (hasFusion(this, "double_moon_cold_tide")) for (var _i8 = 0, _arr5 = [-1, 1]; _i8 < _arr5.length; _i8++) {
            var side = _arr5[_i8];
            this.fusionFields.add(player.x + side * range * 0.45, player.y, range * 0.5, baseDmg * 0.2, "frost");
          }
          game.createParticles(player.x, player.y, "#aaeeff", 24);
          if (this.isEvolved()) {
            var _game$effects2;
            var r = range;
            var d2 = baseDmg * 0.6;
            (_game$effects2 = game.effects) == null || _game$effects2.schedule == null || _game$effects2.schedule(0.4, function () {
              var _game$combatVisuals8;
              if (!game.player || game.player.dead) return;
              var cands = game != null && game.spatial ? game.spatial.queryRect(player.x, player.y, r) : game.enemies;
              for (var _iterator28 = _createForOfIteratorHelperLoose(cands), _step28; !(_step28 = _iterator28()).done;) {
                var e = _step28.value;
                var d = Math.hypot(e.x - player.x, e.y - player.y);
                if (d < r + enemyHitRadius(e)) _this3._damageEnemy(e, d2, game);
              }
              (_game$combatVisuals8 = game.combatVisuals) == null || _game$combatVisuals8.frost == null || _game$combatVisuals8.frost(player.x, player.y, r, {
                fused: !!_this3.fusion,
                second: true
              });
              game.createParticles(player.x, player.y, "#88ccff", 16);
            });
          }
          (_game$audio5 = game.audio) == null || _game$audio5.shoot == null || _game$audio5.shoot();
          this._showCast(player, game);
        }
        /**
         * Soul Drain: short-range tether to the nearest foe. Ticks damage each
         * fire, and heals the hero for `lifestealPct × damageDealt`. Evolved
         * variant drains two foes simultaneously.
         */;
        _proto10._fireDrain = function _fireDrain(player, game) {
          var _this$def$lifestealPc, _game$combatVisuals10;
          var range = this.getRange(player);
          var baseDmg = this.getDamage(player);
          var steal = (_this$def$lifestealPc = this.def.lifestealPct) != null ? _this$def$lifestealPc : 0.25;
          var targetCount = (this.isEvolved() ? 2 : 1) + (hasFusion(this, "returning_soul_chain") ? 1 : 0);
          var targets = [];
          var nearby = game.enemies.filter(function (e) {
            return e.hp > 0 && Math.hypot(e.x - player.x, e.y - player.y) < range + enemyHitRadius(e);
          }).sort(function (a, b) {
            return Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y);
          });
          for (var i = 0; i < targetCount && i < nearby.length; i++) targets.push(nearby[i]);
          if (!targets.length) return;
          var totalDmg = 0;
          for (var _i9 = 0, _targets = targets; _i9 < _targets.length; _i9++) {
            var _game$combatVisuals9;
            var e = _targets[_i9];
            var dmg = this._rollCrit(player, game, baseDmg, e.x, e.y - 16, "#ff66aa");
            var before = e.hp;
            this._damageEnemy(e, dmg, game);
            totalDmg += Math.min(before, Math.max(0, before - e.hp));
            game.createParticles((player.x + e.x) / 2, (player.y + e.y) / 2, "#ff88cc", 2);
            (_game$combatVisuals9 = game.combatVisuals) == null || _game$combatVisuals9.tether == null || _game$combatVisuals9.tether(player.x, player.y, e.x, e.y, {
              fused: !!this.fusion
            });
          }
          (_game$combatVisuals10 = game.combatVisuals) == null || _game$combatVisuals10.field == null || _game$combatVisuals10.field(player.x, player.y, range, "blood", {
            fused: !!this.fusion,
            sustained: true,
            key: "weapon-field:" + this.id,
            duration: Math.max(0.52, this.getCooldown(player) * 1.2)
          });
          if (player.heal) player.heal(totalDmg * steal);
          this._showCast(player, game, Math.atan2(targets[0].y - player.y, targets[0].x - player.x), true);
        };
        return Weapon;
      }());

      // prototype-2d-pixel/src/heroes.js
      var HEROES = exports('HEROES', Object.freeze({
        sword: Object.freeze({
          id: "sword",
          name: "\u65AD\u56E0\u5251\u80CE",
          epithet: "\u628A\u56E0\u679C\u65A9\u6210\u4E24\u622A\u7684\u4EBA",
          role: "\u5251\u6C14\u7206\u53D1 / \u66B4\u51FB",
          glyph: "\u5203",
          spriteIndex: 0,
          portraitPosition: "0% 0%",
          skillIcon: "slash",
          startingWeapon: "whip",
          skillName: "\u8E0F\u7F61\u65A9",
          ultimateName: "\u4E07\u5251\u5F52\u589F",
          talentName: "\u5148\u65AD\u540E\u95EE",
          talentDescription: "\u89D2\u8272\u5929\u8D4B\u9875\u4E09\u9009\u4E00\uFF1B\u9ED8\u8BA4\u6240\u6709\u4F24\u5BB3 +12%\u3002",
          signatureFusion: "causal_sword_domain",
          talents: Object.freeze([Object.freeze({
            id: "first_cut",
            name: "\u5148\u65AD\u540E\u95EE",
            description: "\u6240\u6709\u4F24\u5BB3 +12%\uFF0C\u521D\u59CB\u5251\u6C14\u548C\u540E\u7EED\u516C\u5171\u6B66\u5668\u5747\u53D7\u76CA\u3002",
            effects: {
              damageMult: 1.12
            }
          }), Object.freeze({
            id: "clear_sword_heart",
            name: "\u5251\u5FC3\u901A\u660E",
            description: "\u66B4\u51FB\u7387 +12%\uFF0C\u81EA\u52A8\u6B66\u5668\u51B7\u5374 -5%\u3002",
            effects: {
              critChance: 0.12,
              cooldownMult: 0.95
            }
          }), Object.freeze({
            id: "blood_edge",
            name: "\u8840\u5203\u517B\u950B",
            description: "\u6700\u5927\u751F\u547D -10%\uFF0C\u6BCF\u635F\u5931\u751F\u547D\u90FD\u4F1A\u63D0\u9AD8\u4F24\u5BB3\u3002",
            effects: {
              maxHpMult: 0.9,
              missingHpDamageRatio: 0.65
            }
          })])
        }),
        paper: Object.freeze({
          id: "paper",
          name: "\u7EB8\u7075\u6E21\u5BA2",
          epithet: "\u66FF\u6B7B\u4EBA\u8D70\u5B8C\u6700\u540E\u4E00\u7A0B",
          role: "\u7B26\u7B93\u8FFD\u8E2A / \u9AD8\u9891\u65BD\u672F",
          glyph: "\u7B26",
          spriteIndex: 1,
          portraitPosition: "100% 0%",
          skillIcon: "seal",
          startingWeapon: "magic_wand",
          skillName: "\u6555\u7EB8\u8FFD\u9B42",
          ultimateName: "\u5343\u7B26\u6E21\u5384",
          talentName: "\u501F\u7EB8\u8FD8\u9B42",
          talentDescription: "\u89D2\u8272\u5929\u8D4B\u9875\u4E09\u9009\u4E00\uFF1B\u9ED8\u8BA4\u81EA\u52A8\u6B66\u5668\u51B7\u5374 -9%\u3002",
          signatureFusion: "paper_underworld_edict",
          talents: Object.freeze([Object.freeze({
            id: "borrowed_paper_soul",
            name: "\u501F\u7EB8\u8FD8\u9B42",
            description: "\u7B26\u7B93\u4E0E\u6240\u6709\u81EA\u52A8\u6B66\u5668\u51B7\u5374 -9%\u3002",
            effects: {
              cooldownMult: 0.91
            }
          }), Object.freeze({
            id: "ten_thousand_talismans",
            name: "\u4E07\u7B26\u5F52\u5B97",
            description: "\u6295\u5C04\u7C7B\u6B66\u5668\u989D\u5916 +1 \u5F39\u9053\uFF0C\u4F46\u4F24\u5BB3 -8%\u3002",
            effects: {
              projectileBonus: 1,
              damageMult: 0.92
            }
          }), Object.freeze({
            id: "paper_substitute",
            name: "\u7EB8\u66FF\u771F\u5F62",
            description: "\u6700\u5927\u751F\u547D -12%\uFF0C\u672C\u5C40\u83B7\u5F97\u4E00\u6B21\u6FD2\u6B7B\u590D\u8D77\u3002",
            effects: {
              maxHpMult: 0.88,
              reviveCharges: 1
            }
          })])
        }),
        devourer: Object.freeze({
          id: "devourer",
          name: "\u98DF\u715E\u7AE5\u5B50",
          epithet: "\u7B11\u7740\u541E\u4E0B\u4E0D\u8BE5\u5B58\u5728\u7684\u4E1C\u897F",
          role: "\u751F\u547D\u8F6C\u4F24 / \u62A4\u7532\u53CD\u566C",
          glyph: "\u715E",
          spriteIndex: 2,
          portraitPosition: "0% 100%",
          skillIcon: "maw",
          startingWeapon: "garlic",
          skillName: "\u541E\u715E\u56DE\u751F",
          ultimateName: "\u767E\u9B3C\u5165\u8179",
          talentName: "\u767E\u715E\u517B\u8EAB",
          talentDescription: "\u89D2\u8272\u5929\u8D4B\u9875\u4E09\u9009\u4E00\uFF1B\u9ED8\u8BA4\u751F\u547D\u8F6C\u5316\u4E3A\u4F24\u5BB3\u3002",
          signatureFusion: "taotie_ward_body",
          talents: Object.freeze([Object.freeze({
            id: "hundred_banes_body",
            name: "\u767E\u715E\u517B\u8EAB",
            description: "\u6700\u5927\u751F\u547D +18%\uFF1B\u989D\u5916\u751F\u547D\u4F1A\u6309\u6BD4\u4F8B\u8F6C\u5316\u4E3A\u4F24\u5BB3\u3002",
            effects: {
              maxHpMult: 1.18,
              maxHpDamageRatio: 0.7
            }
          }), Object.freeze({
            id: "devouring_armor",
            name: "\u7384\u7532\u566C\u654C",
            description: "\u62A4\u7532 +3\uFF1B\u53D7\u51FB\u65F6\u6309\u62A4\u7532\u53CD\u566C\u9644\u8FD1\u654C\u4EBA\u3002",
            effects: {
              armor: 3,
              armorReflectRatio: 0.55
            }
          }), Object.freeze({
            id: "hungry_breath",
            name: "\u9965\u9B42\u5410\u7EB3",
            description: "\u53D7\u5230\u4F24\u5BB3 +8%\uFF0C\u4F46\u751F\u547D\u6062\u590D\u4E0E\u5438\u53D6\u6548\u679C\u63D0\u9AD8\u3002",
            effects: {
              incomingDamageMult: 1.08,
              healingMult: 1.45
            }
          })])
        }),
        star: Object.freeze({
          id: "star",
          name: "\u661F\u69CE\u9057\u6C11",
          epithet: "\u4ECE\u5929\u5916\u5760\u56DE\u4EBA\u95F4\u7684\u5F02\u4E61\u5BA2",
          role: "\u661F\u68B0\u8D2F\u7A7F / \u9AD8\u901F\u6E38\u8D70",
          glyph: "\u661F",
          spriteIndex: 3,
          portraitPosition: "100% 100%",
          skillIcon: "comet",
          startingWeapon: "retro_blaster",
          skillName: "\u661F\u6B65\u6298\u8DC3",
          ultimateName: "\u4E09\u57A3\u5760\u843D",
          talentName: "\u9006\u884C\u661F\u6B65",
          talentDescription: "\u89D2\u8272\u5929\u8D4B\u9875\u4E09\u9009\u4E00\uFF1B\u9ED8\u8BA4\u79FB\u52A8\u901F\u5EA6 +12%\u3002",
          signatureFusion: "three_wall_starfall",
          talents: Object.freeze([Object.freeze({
            id: "retrograde_step",
            name: "\u9006\u884C\u661F\u6B65",
            description: "\u79FB\u52A8\u901F\u5EA6 +12%\uFF0C\u661F\u68B0\u4FDD\u6301\u5B89\u5168\u5C04\u8DDD\u3002",
            effects: {
              speedMult: 1.12
            }
          }), Object.freeze({
            id: "orbit_overload",
            name: "\u661F\u8F68\u8FC7\u8F7D",
            description: "\u989D\u5916\u79FB\u901F\u4F1A\u8F6C\u5316\u4E3A\u4F24\u5BB3\uFF0C\u4F46\u53D7\u5230\u4F24\u5BB3 +8%\u3002",
            effects: {
              speedMult: 1.08,
              speedDamageRatio: 0.8,
              incomingDamageMult: 1.08
            }
          }), Object.freeze({
            id: "stellar_domain",
            name: "\u661F\u8680\u6CD5\u57DF",
            description: "\u6B66\u5668\u8303\u56F4 +18%\uFF0C\u51B7\u5374 -6%\u3002",
            effects: {
              areaMult: 1.18,
              cooldownMult: 0.94
            }
          })])
        })
      }));
      var DEFAULT_HERO_ID = "sword";
      function getHero(id) {
        return HEROES[id] || HEROES[DEFAULT_HERO_ID];
      }
      function getHeroTalent(hero, talentId) {
        var source = hero || HEROES[DEFAULT_HERO_ID];
        return source.talents.find(function (talent) {
          return talent.id === talentId;
        }) || source.talents[0];
      }
      function applyHeroTalent(player, hero, talentId) {
        if (!player || !hero) return;
        var talent = getHeroTalent(hero, talentId);
        player.heroId = hero.id;
        player.heroGlyph = hero.glyph;
        player.heroSpriteIndex = hero.spriteIndex;
        player.heroTalentId = talent.id;
        for (var _i10 = 0, _Object$entries = Object.entries(talent.effects || {}); _i10 < _Object$entries.length; _i10++) {
          var _Object$entries$_i = _Object$entries[_i10],
            key = _Object$entries$_i[0],
            value = _Object$entries$_i[1];
          if (["armor", "critChance", "reviveCharges", "projectileBonus"].includes(key)) {
            player.runModifiers[key] = (player.runModifiers[key] || 0) + value;
          } else {
            player.runModifiers[key] = value;
          }
        }
        player.recalculateStats == null || player.recalculateStats();
        player.hp = player.maxHp;
        return talent;
      }

      // prototype-2d-pixel/src/spatial-hash.js
      var SpatialHash = exports('SpatialHash', /*#__PURE__*/function () {
        /**
         * @param {number} cell - cell edge length in world units (px). 64 is a
         *     good default for this game: matches the biggest non-boss enemy
         *     bounding box so most queries hit a single cell.
         */
        function SpatialHash(cell) {
          if (cell === void 0) {
            cell = 64;
          }
          this.cell = cell;
          this.map = /* @__PURE__ */new Map();
          this._size = 0;
          this._occupiedBuckets = [];
          this._sortedBuckets = null;
        }
        /** Empty the index and invalidate the lazily sorted occupied-cell view. */
        var _proto11 = SpatialHash.prototype;
        _proto11.clear = function clear() {
          this.map.clear();
          this._size = 0;
          this._occupiedBuckets.length = 0;
          this._sortedBuckets = null;
        };
        _proto11._key = function _key(x, y) {
          return Math.floor(x / this.cell) + "," + Math.floor(y / this.cell);
        }
        /**
         * Insert a single item. The caller owns the item reference; the hash just
         * indexes it for fast neighbour lookup. Items are NOT de-duplicated.
         */;
        _proto11.insert = function insert(item) {
          var k = this._key(item.x, item.y);
          var bucket = this.map.get(k);
          if (!bucket) {
            bucket = [];
            this.map.set(k, bucket);
            this._occupiedBuckets.push({
              gx: Math.floor(item.x / this.cell),
              gy: Math.floor(item.y / this.cell),
              items: bucket
            });
            this._sortedBuckets = null;
          }
          bucket.push(item);
          this._size++;
        }
        /** Bulk-insert after a `clear()`. */;
        _proto11.insertAll = function insertAll(items) {
          this.clear();
          for (var _iterator29 = _createForOfIteratorHelperLoose(items), _step29; !(_step29 = _iterator29()).done;) {
            var it = _step29.value;
            this.insert(it);
          }
        }
        /** @deprecated alias kept for backwards compatibility with v2.x callers. */;
        _proto11.insertEnemies = function insertEnemies(enemies) {
          this.insertAll(enemies);
        }
        /**
         * Iterate every item whose cell overlaps the square `(x±r, y±r)`. Results
         * may include items further than `r` from the query centre — callers must
         * do the exact distance check. The generator yields each item at most
         * once (cells don't overlap by construction).
         *
         * iter-16 perf: returns a plain array instead of a generator. V8 inlines
         * tight `for (const e of arr)` loops aggressively, and avoiding the
         * generator suspend/resume bookkeeping is measurably faster on hot
         * weapon-fire paths (Lightning's chain hops alone can call this dozens
         * of times per fire). Callers that destructure to `[...sh.queryRect()]`
         * still work because Array is iterable.
         */;
        _proto11.queryRect = function queryRect(x, y, r) {
          if (!this._size || !Number.isFinite(x) || !Number.isFinite(y) || Number.isNaN(r) || r < 0) return [];
          var c = this.cell;
          var x0 = Math.floor((x - r) / c);
          var x1 = Math.floor((x + r) / c);
          var y0 = Math.floor((y - r) / c);
          var y1 = Math.floor((y + r) / c);
          var out = [];
          var cellCount = (x1 - x0 + 1) * (y1 - y0 + 1);
          if (cellCount > this.map.size * 4) {
            this._sortedBuckets || (this._sortedBuckets = [].concat(this._occupiedBuckets).sort(function (a, b) {
              return a.gx - b.gx || a.gy - b.gy;
            }));
            for (var _iterator30 = _createForOfIteratorHelperLoose(this._sortedBuckets), _step30; !(_step30 = _iterator30()).done;) {
              var bucket = _step30.value;
              if (bucket.gx < x0 || bucket.gx > x1 || bucket.gy < y0 || bucket.gy > y1) continue;
              for (var _iterator31 = _createForOfIteratorHelperLoose(bucket.items), _step31; !(_step31 = _iterator31()).done;) {
                var item = _step31.value;
                out.push(item);
              }
            }
            return out;
          }
          for (var gx = x0; gx <= x1; gx++) {
            for (var gy = y0; gy <= y1; gy++) {
              var b = this.map.get(gx + "," + gy);
              if (b) {
                for (var i = 0; i < b.length; i++) out.push(b[i]);
              }
            }
          }
          return out;
        }
        /**
         * Return the single closest item within `maxRange` (Euclidean distance),
         * or `null` if no bucket is populated within the search square.
         */;
        _proto11.findNearest = function findNearest(x, y, maxRange, predicate) {
          if (predicate === void 0) {
            predicate = null;
          }
          var best = null;
          var bestD = maxRange;
          for (var _iterator32 = _createForOfIteratorHelperLoose(this.queryRect(x, y, maxRange)), _step32; !(_step32 = _iterator32()).done;) {
            var e = _step32.value;
            if (predicate && !predicate(e)) continue;
            var d = Math.hypot(e.x - x, e.y - y);
            if (d < bestD) {
              bestD = d;
              best = e;
            }
          }
          return best;
        }
        /** Alias used throughout `weapons.js`/`entities.js`. */;
        _proto11.findNearestEnemy = function findNearestEnemy(x, y, maxRange) {
          return this.findNearest(x, y, maxRange, isLivingTarget);
        }
        /** Count cells currently holding at least one item (for diagnostics). */;
        _proto11.occupiedCellCount = function occupiedCellCount() {
          return this.map.size;
        };
        _createClass(SpatialHash, [{
          key: "size",
          get: function get() {
            return this._size;
          }
        }]);
        return SpatialHash;
      }());
      function isLivingTarget(item) {
        return !(item.hp <= 0);
      }

      // prototype-2d-pixel/src/build-system.js
      var RELICS = exports('RELICS', Object.freeze({
        bone_mirror: {
          id: "bone_mirror",
          name: "\u6B8B\u7F3A\u7167\u9AA8\u955C",
          icon: "\uD83E\uDE9E",
          description: "\u4F24\u5BB3 +12%\uFF1B\u53EF\u53C2\u4E0E\u9AD8\u9636\u878D\u5408\u3002",
          effects: {
            damageMult: 1.12
          }
        },
        coin_sword_tassel: {
          id: "coin_sword_tassel",
          name: "\u94DC\u94B1\u5251\u7A57",
          icon: "\uD83E\uDE99",
          description: "\u66B4\u51FB\u7387 +10%\u3002",
          effects: {
            critChance: 0.1
          }
        },
        paper_heart: {
          id: "paper_heart",
          name: "\u7EB8\u624E\u5FC3\u810F",
          icon: "\uD83E\uDEC0",
          description: "\u672C\u5C40\u83B7\u5F97\u4E00\u6B21\u6FD2\u6B7B\u590D\u8D77\u3002",
          effects: {
            reviveCharges: 1
          }
        },
        blind_beads: {
          id: "blind_beads",
          name: "\u95ED\u773C\u4F5B\u73E0",
          icon: "\uD83D\uDCFF",
          description: "\u6B66\u5668\u51B7\u5374 -10%\u3002",
          effects: {
            cooldownMult: 0.9
          }
        },
        blank_talisman: {
          id: "blank_talisman",
          name: "\u65E0\u5B57\u9053\u7252",
          icon: "\uD83D\uDCDC",
          description: "\u7ECF\u9A8C\u83B7\u53D6 +12%\u3002",
          effects: {
            expMult: 1.12
          }
        },
        outer_cord: {
          id: "outer_cord",
          name: "\u661F\u5916\u8110\u5E26",
          icon: "\uD83E\uDEB1",
          description: "\u6B66\u5668\u8303\u56F4 +18%\u3002",
          effects: {
            areaMult: 1.18
          }
        },
        nuo_mask_fragment: {
          id: "nuo_mask_fragment",
          name: "\u50A9\u9762\u788E\u7247",
          icon: "\uD83D\uDC7A",
          description: "\u62A4\u7532 +2\u3002",
          effects: {
            armor: 2
          }
        },
        black_water_gourd: {
          id: "black_water_gourd",
          name: "\u9ED1\u6C34\u846B\u82A6",
          icon: "\uD83C\uDFFA",
          description: "\u62FE\u53D6\u8303\u56F4 +55%\u3002",
          effects: {
            magnetMult: 1.55
          }
        },
        sealed_eye: {
          id: "sealed_eye",
          name: "\u5C01\u661F\u90AA\u773C",
          icon: "\u773C",
          description: "\u4F24\u5BB3 +10%\uFF0C\u6B66\u5668\u8303\u56F4 +12%\u3002",
          effects: {
            damageMult: 1.1,
            areaMult: 1.12
          }
        },
        taotie_tooth: {
          id: "taotie_tooth",
          name: "\u9955\u992E\u4E73\u9F7F",
          icon: "\u9F7F",
          description: "\u6700\u5927\u751F\u547D +15%\uFF0C\u62A4\u7532 +1\u3002",
          effects: {
            maxHpMult: 1.15,
            armor: 1
          }
        },
        broken_compass: {
          id: "broken_compass",
          name: "\u5931\u65B9\u7F57\u76D8",
          icon: "\u76D8",
          description: "\u79FB\u52A8\u901F\u5EA6 +10%\uFF0C\u62FE\u53D6\u8303\u56F4 +25%\u3002",
          effects: {
            speedMult: 1.1,
            magnetMult: 1.25
          }
        },
        cold_moon_scale: {
          id: "cold_moon_scale",
          name: "\u51B7\u6708\u9006\u9CDE",
          icon: "\u9CDE",
          description: "\u6B66\u5668\u51B7\u5374 -8%\uFF0C\u62A4\u7532 +1\u3002",
          effects: {
            cooldownMult: 0.92,
            armor: 1
          }
        }
      }));
      var CURSES = exports('CURSES', Object.freeze({
        inverted_sutra: {
          id: "inverted_sutra",
          name: "\u5012\u60AC\u7ECF",
          icon: "\uD83D\uDE43",
          description: "\u4F24\u5BB3 +28%\uFF0C\u6700\u5927\u751F\u547D -20%\u3002",
          effects: {
            damageMult: 1.28,
            maxHpMult: 0.8
          }
        },
        hundred_eyes: {
          id: "hundred_eyes",
          name: "\u767E\u76EE\u6CE8\u89C6",
          icon: "\uD83D\uDC41\uFE0F",
          description: "\u66B4\u51FB\u7387 +16%\uFF0C\u53D7\u5230\u4F24\u5BB3 +22%\u3002",
          effects: {
            critChance: 0.16,
            incomingDamageMult: 1.22
          }
        },
        faceless_incense: {
          id: "faceless_incense",
          name: "\u65E0\u9762\u9999\u706B",
          icon: "\uD83D\uDD6F\uFE0F",
          description: "\u6B66\u5668\u51B7\u5374 -16%\uFF0C\u62FE\u53D6\u8303\u56F4 -30%\u3002",
          effects: {
            cooldownMult: 0.84,
            magnetMult: 0.7
          }
        },
        blood_moon_fetus: {
          id: "blood_moon_fetus",
          name: "\u8840\u6708\u80CE\u52A8",
          icon: "\uD83C\uDF18",
          description: "\u6B66\u5668\u8303\u56F4 +32%\uFF0C\u79FB\u52A8\u901F\u5EA6 -15%\u3002",
          effects: {
            areaMult: 1.32,
            speedMult: 0.85
          }
        }
      }));
      var FUSION_RECIPES = exports('FUSION_RECIPES', Object.freeze([{
        id: "causal_sword_domain",
        heroId: "sword",
        name: "\u65AD\u56E0\u5251\u754C",
        description: "\u65AD\u56E0\u5251\u80CE\u4E13\u5C5E\uFF1A\u6325\u5251\u540E\u5728\u5DE6\u53F3\u5404\u7559\u4E0B\u4E00\u4E2A\u56FA\u5B9A\u5251\u75D5\u5708\uFF0C\u6301\u7EED 2 \u79D2\uFF0C\u6BCF 0.5 \u79D2\u9020\u6210\u8BE5\u6B21\u5251\u51FB 25% \u7684\u4F24\u5BB3\uFF1B\u654C\u4EBA\u8D70\u51FA\u8303\u56F4\u5373\u53EF\u8131\u79BB\u3002",
        requirements: [{
          kind: "weapon",
          id: "whip",
          level: 3
        }, {
          kind: "passive",
          id: "might",
          count: 2
        }],
        outputs: [{
          weaponId: "whip",
          damageMult: 1.6,
          rangeMult: 1.5,
          projectileBonus: 1
        }]
      }, {
        id: "paper_underworld_edict",
        heroId: "paper",
        name: "\u5E7D\u90FD\u4E07\u7B26\u6555",
        description: "\u7EB8\u7075\u6E21\u5BA2\u4E13\u5C5E\uFF1A\u6BCF\u5F20\u8FFD\u9B42\u7B26\u547D\u4E2D\u540E\u53EF\u5728 240 \u8303\u56F4\u5185\u7EE7\u7EED\u8F6C\u7D22\u4E24\u540D\u5C1A\u672A\u547D\u4E2D\u7684\u654C\u4EBA\uFF1B\u6BCF\u6B21\u8F6C\u7D22\u4FDD\u7559 75% \u4F24\u5BB3\uFF0C\u65E0\u76EE\u6807\u5219\u6D88\u6563\u3002",
        requirements: [{
          kind: "weapon",
          id: "magic_wand",
          level: 3
        }, {
          kind: "passive",
          id: "cooldown",
          count: 2
        }],
        outputs: [{
          weaponId: "magic_wand",
          damageMult: 1.55,
          cooldownMult: 0.72,
          projectileBonus: 2
        }]
      }, {
        id: "taotie_ward_body",
        heroId: "devourer",
        name: "\u9955\u992E\u62A4\u8EAB\u754C",
        description: "\u98DF\u715E\u7AE5\u5B50\u4E13\u5C5E\uFF1A\u6BCF\u6B21\u715E\u73AF\u989D\u5916\u9020\u6210\u6700\u5927\u751F\u547D \xD70.8%\uFF0B\u62A4\u7532 \xD70.3 \u7684\u4F24\u5BB3\uFF1B\u51FB\u6740\u8FD1\u654C\u56DE\u590D\u6700\u5927\u751F\u547D\u7684 1%\uFF0C\u6BCF\u6B21\u715E\u73AF\u6700\u591A\u56DE\u590D\u4E00\u6B21\u3002",
        requirements: [{
          kind: "weapon",
          id: "garlic",
          level: 3
        }, {
          kind: "passive",
          id: "max_hp",
          count: 2
        }],
        outputs: [{
          weaponId: "garlic",
          damageMult: 1.7,
          rangeMult: 1.45
        }]
      }, {
        id: "blood_moon_cycle",
        name: "\u8840\u6708\u5468\u5929\xB7\u771F",
        description: "\u5251\u6C14\u547D\u4E2D\u540E\u56DE\u590D\u5B9E\u9645\u6263\u8840\u7684 8%\uFF0C\u6BCF\u6B21\u6325\u5251\u6700\u591A\u56DE\u590D\u6700\u5927\u751F\u547D\u7684 2%\uFF1B\u4E0D\u4ECE\u5C38\u4F53\u548C\u8FC7\u91CF\u4F24\u5BB3\u4E2D\u5438\u8840\uFF0C\u6CBB\u7597\u52A0\u6210\u53E6\u8BA1\u3002",
        requirements: [{
          kind: "weapon",
          id: "whip",
          level: 5
        }, {
          kind: "passive",
          id: "area",
          count: 2
        }],
        outputs: [{
          weaponId: "whip",
          damageMult: 1.35,
          rangeMult: 1.4
        }]
      }, {
        id: "three_pure_thunder",
        name: "\u4E09\u6E05\u4E07\u96F7\u7B93",
        description: "\u8FFD\u9B42\u7B26\u4E0E\u5929\u96F7\u7684\u6BCF\u6B21\u76F4\u63A5\u547D\u4E2D\u5411 140 \u8303\u56F4\u5185\u6700\u8FD1\u4E24\u540D\u6D3B\u654C\u5BFC\u7535\uFF0C\u5404\u9020\u6210\u8BE5\u6B21\u57FA\u7840\u4F24\u5BB3\u7684 30%\uFF1B\u5BFC\u7535\u4E0D\u4F1A\u518D\u6B21\u9012\u5F52\u5BFC\u7535\u3002",
        requirements: [{
          kind: "weapon",
          id: "magic_wand",
          level: 5
        }, {
          kind: "weapon",
          id: "lightning",
          level: 5
        }, {
          kind: "relic",
          id: "bone_mirror"
        }],
        outputs: [{
          weaponId: "magic_wand",
          damageMult: 1.25,
          cooldownMult: 0.78,
          projectileBonus: 2
        }, {
          weaponId: "lightning",
          damageMult: 1.35,
          rangeMult: 1.2
        }]
      }, {
        id: "five_prisons_array",
        name: "\u4E94\u72F1\u65AD\u4E1A\u9635",
        description: "\u65A9\u5996\u98DE\u5251 \xD7 \u7834\u715E\uFF1A\u6BCF\u628A\u4E3B\u98DE\u5251\u9996\u6B21\u547D\u4E2D\u65F6\u5411\u5DE6\u53F3\u5206\u51FA\u4E24\u628A\u77ED\u7A0B\u98DE\u5251\uFF0C\u5404\u6709\u4E3B\u5251 45% \u4F24\u5BB3\u3001180 \u5C04\u7A0B\uFF1B\u5206\u5251\u4E0D\u518D\u5206\u88C2\u3002",
        requirements: [{
          kind: "weapon",
          id: "knife",
          level: 5
        }, {
          kind: "passive",
          id: "might",
          count: 2
        }],
        outputs: [{
          weaponId: "knife",
          damageMult: 1.32,
          rangeMult: 1.2,
          projectileBonus: 1
        }]
      }, {
        id: "twin_guard_halo",
        name: "\u4E24\u4EEA\u5B88\u85CF\u8F6E",
        description: "\u62A4\u8EAB\u5251\u8F6E \xD7 \u91D1\u949F\uFF1A\u5F62\u6210\u5916\u5708\u4E0E 58% \u534A\u5F84\u7684\u53CD\u8F6C\u5185\u5708\uFF1B\u98DE\u5251\u63A5\u89E6\u654C\u65B9\u5F39\u4E38\u53EF\u5C06\u5176\u62E6\u622A\uFF0C\u5168\u5251\u8F6E\u5171\u4EAB 0.35 \u79D2\u62E6\u622A\u95F4\u9694\uFF0C\u4E0D\u963B\u6321\u63A5\u89E6\u4F24\u5BB3\u6216\u5730\u9762\u6CD5\u672F\u3002",
        requirements: [{
          kind: "weapon",
          id: "orbit",
          level: 5
        }, {
          kind: "passive",
          id: "armor",
          count: 2
        }],
        outputs: [{
          weaponId: "orbit",
          damageMult: 1.25,
          rangeMult: 1.3,
          projectileBonus: 2
        }]
      }, {
        id: "endless_talisman_chain",
        name: "\u65E0\u5C3D\u9547\u715E\u8FDE\u73AF",
        description: "\u9547\u90AA\u7206\u7B26 \xD7 \u6CD5\u57DF\uFF1A\u7206\u70B8\u8303\u56F4\u78B0\u5230\u9644\u8FD1\u878D\u5408\u7206\u7B26\u65F6\uFF0C\u5C06\u5176\u5F15\u7EBF\u7F29\u77ED\u81F3 0.45 \u79D2\u5E76\u589E\u52A0 25% \u4F24\u5BB3\uFF1B\u6BCF\u679A\u7B26\u53EA\u5F3A\u5316\u4E00\u6B21\uFF0C\u4E0D\u989D\u5916\u751F\u6210\u7206\u7B26\u3002\u7206\u540E\u7559\u4E0B 1.5 \u79D2\u71C3\u70E7\u533A\u3002",
        requirements: [{
          kind: "weapon",
          id: "mine",
          level: 5
        }, {
          kind: "passive",
          id: "area",
          count: 2
        }],
        outputs: [{
          weaponId: "mine",
          damageMult: 1.3,
          rangeMult: 1.45,
          cooldownMult: 0.82
        }]
      }, {
        id: "black_tortoise_breath",
        name: "\u7384\u6B66\u541E\u715E\u606F",
        description: "\u715E\u73AF\u6BCF\u6B21\u4F24\u5BB3\u989D\u5916\u52A0\u62A4\u7532 \xD70.25\uFF0C\u5E76\u538B\u5236\u5708\u5185\u6D3B\u654C\uFF1A\u666E\u901A\u654C\u4EBA\u51CF\u901F 40%\uFF0CBoss \u51CF\u901F 12%\uFF0C\u79BB\u5F00\u540E 0.65 \u79D2\u89E3\u9664\u3002\u53EF\u4E0E\u98DF\u715E\u4E13\u5C5E\u878D\u5408\u5E76\u5B58\u3002",
        requirements: [{
          kind: "weapon",
          id: "garlic",
          level: 5
        }, {
          kind: "passive",
          id: "max_hp",
          count: 2
        }],
        outputs: [{
          weaponId: "garlic",
          damageMult: 1.38,
          rangeMult: 1.35
        }]
      }, {
        id: "double_moon_cold_tide",
        name: "\u53CC\u6708\u5E7F\u5BD2\u52AB",
        description: "\u5BD2\u6F6E\u540E\u7559\u4E0B\u5DE6\u53F3\u4E24\u7247\u56FA\u5B9A\u5BD2\u57DF\uFF0C\u6301\u7EED 2 \u79D2\uFF1B\u6BCF 0.5 \u79D2\u9020\u6210\u5BD2\u6F6E\u57FA\u7840\u4F24\u5BB3\u7684 20%\uFF0C\u5E76\u51CF\u901F\u666E\u901A\u654C\u4EBA 50%\u3001Boss 15%\uFF0C\u51CF\u901F\u6301\u7EED 0.65 \u79D2\u3002",
        requirements: [{
          kind: "weapon",
          id: "frost_nova",
          level: 5
        }, {
          kind: "passive",
          id: "cooldown",
          count: 2
        }],
        outputs: [{
          weaponId: "frost_nova",
          damageMult: 1.28,
          rangeMult: 1.3,
          cooldownMult: 0.78
        }]
      }, {
        id: "returning_soul_chain",
        name: "\u8FD8\u9B42\u53CC\u751F\u7D22",
        description: "\u566C\u9B42\u8840\u7EBF \xD7 \u5410\u7EB3\uFF1A\u5438\u8840\u4F24\u5BB3\u63D0\u5347\u5E76\u989D\u5916\u8FDE\u63A5\u4E00\u4E2A\u76EE\u6807\u3002",
        requirements: [{
          kind: "weapon",
          id: "soul_drain",
          level: 5
        }, {
          kind: "passive",
          id: "recovery",
          count: 2
        }],
        outputs: [{
          weaponId: "soul_drain",
          damageMult: 1.32,
          rangeMult: 1.22,
          projectileBonus: 1
        }]
      }, {
        id: "yin_yang_wind_cut",
        name: "\u9634\u9633\u8E0F\u98CE\u65A9",
        description: "\u56DE\u98CE\u5203\u6298\u8FD4\u65F6\u5207\u6362\u4E3A\u8FD4\u7A0B\u65A9\uFF0C\u4F24\u5BB3\u589E\u52A0 25%\uFF0C\u53EF\u518D\u6B21\u547D\u4E2D\u53BB\u7A0B\u6253\u8FC7\u7684\u654C\u4EBA\uFF0C\u6BCF\u6BB5\u6BCF\u654C\u4E00\u6B21\uFF1B\u8FD4\u7A0B\u6301\u7EED\u671D\u4EBA\u7269\u98DE\u884C\uFF0C\u4E0D\u53CD\u590D\u6389\u5934\u3002",
        requirements: [{
          kind: "weapon",
          id: "boomerang",
          level: 5
        }, {
          kind: "passive",
          id: "movespeed",
          count: 2
        }],
        outputs: [{
          weaponId: "boomerang",
          damageMult: 1.24,
          rangeMult: 1.3,
          projectileBonus: 1
        }]
      }, {
        id: "star_shard_bloom",
        name: "\u788E\u661F\u5206\u5149\u8BC0",
        description: "\u6240\u6709\u89D2\u8272\u53EF\u7528\uFF1A\u661F\u5F39\u9996\u6B21\u547D\u4E2D\u540E\u6A2A\u5411\u88C2\u4E3A\u4E24\u679A\u77ED\u7A0B\u661F\u7247\uFF0C\u5404\u9020\u6210 45% \u4F24\u5BB3\uFF0C\u98DE\u884C 180\uFF1B\u661F\u7247\u4E0D\u518D\u5206\u88C2\u3002\u4E0E\u661F\u6E0A\u9057\u6C11\u7684\u843D\u661F\u533A\u53EF\u4EE5\u53E0\u5408\u3002",
        requirements: [{
          kind: "weapon",
          id: "retro_blaster",
          level: 5
        }, {
          kind: "passive",
          id: "area",
          count: 2
        }],
        outputs: [{
          weaponId: "retro_blaster",
          damageMult: 1.6,
          projectileBonus: 1
        }]
      }, {
        id: "three_wall_starfall",
        heroId: "star",
        name: "\u4E09\u57A3\u661F\u843D\u70AE",
        description: "\u661F\u6E0A\u9057\u6C11\u4E13\u5C5E\uFF1A\u661F\u5F39\u547D\u4E2D\u540E\u7559\u4E0B\u534A\u5F84 55 \u7684\u843D\u661F\u533A\uFF0C\u6301\u7EED 2 \u79D2\uFF0C\u6BCF 0.5 \u79D2\u9020\u6210\u661F\u5F39\u57FA\u7840\u4F24\u5BB3 20% \u7684\u96F7\u4F24\uFF1B\u540C\u4E00\u6B66\u5668\u6700\u591A\u4FDD\u7559\u516B\u5904\u3002",
        requirements: [{
          kind: "weapon",
          id: "retro_blaster",
          level: 5
        }, {
          kind: "passive",
          id: "growth",
          count: 2
        }],
        outputs: [{
          weaponId: "retro_blaster",
          damageMult: 1.24,
          cooldownMult: 0.76,
          projectileBonus: 1
        }]
      }]));
      var BASE_MODIFIERS = Object.freeze({
        damageMult: 1,
        areaMult: 1,
        cooldownMult: 1,
        speedMult: 1,
        expMult: 1,
        magnetMult: 1,
        incomingDamageMult: 1,
        maxHpMult: 1,
        armor: 0,
        critChance: 0,
        reviveCharges: 0,
        projectileBonus: 0,
        maxHpDamageRatio: 0,
        missingHpDamageRatio: 0,
        armorReflectRatio: 0,
        speedDamageRatio: 0,
        healingMult: 1
      });
      function freshRunModifiers() {
        return _extends({}, BASE_MODIFIERS);
      }
      var RunBuildSystem = exports('RunBuildSystem', /*#__PURE__*/function () {
        function RunBuildSystem(game) {
          this.game = game;
          this.reset(null);
        }
        var _proto12 = RunBuildSystem.prototype;
        _proto12.reset = function reset(player) {
          this.relics = /* @__PURE__ */new Set();
          this.curses = /* @__PURE__ */new Set();
          this.fusions = /* @__PURE__ */new Set();
          this.nextCurseAt = 180;
          if (player) {
            player.runModifiers = freshRunModifiers();
            player.recalculateStats == null || player.recalculateStats();
          }
          this._syncUi();
        };
        _proto12.update = function update(gameTime, rng) {
          var _this$game;
          if (rng === void 0) {
            rng = Math.random;
          }
          if (!((_this$game = this.game) != null && _this$game.player) || gameTime < this.nextCurseAt) return null;
          this.nextCurseAt += 180;
          return this.getCurseChoices(3, rng);
        };
        _proto12.grantRelic = function grantRelic(id) {
          var _this$game2, _this$game3, _this$game4;
          var def = RELICS[id];
          if (!def || this.relics.has(id) || this.relics.size >= CONFIG.MAX_RELICS || !((_this$game2 = this.game) != null && _this$game2.player)) return null;
          this.relics.add(id);
          (_this$game3 = this.game) == null || _this$game3._recordDiscovery == null || _this$game3._recordDiscovery("relics", id);
          this._applyEffects(def.effects);
          this.checkFusions();
          (_this$game4 = this.game) == null || _this$game4._announce == null || _this$game4._announce("\u83B7\u5F97\u9057\u7269\uFF1A" + def.name);
          this._syncUi();
          return def;
        };
        _proto12.grantCurse = function grantCurse(id) {
          var _this$game5, _this$game6, _this$game7;
          var def = CURSES[id];
          if (!def || this.curses.has(id) || !((_this$game5 = this.game) != null && _this$game5.player)) return null;
          this.curses.add(id);
          (_this$game6 = this.game) == null || _this$game6._recordDiscovery == null || _this$game6._recordDiscovery("curses", id);
          this._applyEffects(def.effects);
          (_this$game7 = this.game) == null || _this$game7._announce == null || _this$game7._announce("\u8BC5\u5492\u964D\u4E34\uFF1A" + def.name);
          this._syncUi();
          return def;
        };
        _proto12.grantRandomRelic = function grantRandomRelic(rng) {
          var _this4 = this;
          if (rng === void 0) {
            rng = Math.random;
          }
          return this._grantRandomFrom(RELICS, this.relics, function (id) {
            return _this4.grantRelic(id);
          }, rng);
        };
        _proto12.grantRandomCurse = function grantRandomCurse(rng) {
          var _this5 = this;
          if (rng === void 0) {
            rng = Math.random;
          }
          return this._grantRandomFrom(CURSES, this.curses, function (id) {
            return _this5.grantCurse(id);
          }, rng);
        };
        _proto12.getRelicChoices = function getRelicChoices(count, rng) {
          if (count === void 0) {
            count = 3;
          }
          if (rng === void 0) {
            rng = Math.random;
          }
          if (this.relics.size >= CONFIG.MAX_RELICS) return [];
          return this._getChoices(RELICS, this.relics, count, rng);
        };
        _proto12.getCurseChoices = function getCurseChoices(count, rng) {
          if (count === void 0) {
            count = 3;
          }
          if (rng === void 0) {
            rng = Math.random;
          }
          return this._getChoices(CURSES, this.curses, count, rng);
        };
        _proto12.checkFusions = function checkFusions() {
          var _this$game8,
            _this6 = this;
          var player = (_this$game8 = this.game) == null ? void 0 : _this$game8.player;
          if (!player) return [];
          var unlocked = [];
          for (var _iterator33 = _createForOfIteratorHelperLoose(FUSION_RECIPES), _step33; !(_step33 = _iterator33()).done;) {
            var _this$game9, _this$game10;
            var recipe = _step33.value;
            if (this.fusions.has(recipe.id) || recipe.heroId && recipe.heroId !== player.heroId || !recipe.requirements.every(function (r) {
              return _this6._meets(r);
            })) {
              continue;
            }
            var _loop = function _loop() {
              var output = _step34.value;
              var weapon = player.weapons.find(function (w) {
                return w.id === output.weaponId;
              });
              if (!weapon) return 1; // continue
              weapon.fusion = mergeFusion(weapon.fusion, recipe, output);
            };
            for (var _iterator34 = _createForOfIteratorHelperLoose(recipe.outputs), _step34; !(_step34 = _iterator34()).done;) {
              if (_loop()) continue;
            }
            this.fusions.add(recipe.id);
            (_this$game9 = this.game) == null || _this$game9._recordDiscovery == null || _this$game9._recordDiscovery("fusions", recipe.id);
            unlocked.push(recipe);
            (_this$game10 = this.game) == null || _this$game10._announce == null || _this$game10._announce("\u878D\u5408\u5B8C\u6210\uFF1A" + recipe.name);
            if (player) {
              var _this$game11, _this$game12;
              (_this$game11 = this.game) == null || (_this$game11 = _this$game11.combatVisuals) == null || _this$game11.fusionBurst == null || _this$game11.fusionBurst(player.x, player.y, 190);
              (_this$game12 = this.game) == null || _this$game12.shake == null || _this$game12.shake(0.45);
            }
          }
          if (unlocked.length) this._syncUi();
          return unlocked;
        };
        _proto12.snapshot = function snapshot() {
          return {
            relics: Array.from(this.relics).map(function (id) {
              return RELICS[id];
            }),
            curses: Array.from(this.curses).map(function (id) {
              return CURSES[id];
            }),
            fusions: Array.from(this.fusions).map(function (id) {
              return FUSION_RECIPES.find(function (r) {
                return r.id === id;
              });
            })
          };
        };
        _proto12._meets = function _meets(req) {
          var player = this.game.player;
          if (req.kind === "relic") return this.relics.has(req.id);
          if (req.kind === "weapon") {
            var weapon = player.weapons.find(function (w) {
              return w.id === req.id;
            });
            return !!weapon && weapon.level >= (req.level || 1);
          }
          if (req.kind === "passive") {
            var _player$passives2;
            return (((_player$passives2 = player.passives) == null || (_player$passives2 = _player$passives2[req.id]) == null ? void 0 : _player$passives2.count) || 0) >= (req.count || 1);
          }
          return false;
        };
        _proto12._applyEffects = function _applyEffects(effects) {
          var player = this.game.player;
          player.runModifiers || (player.runModifiers = freshRunModifiers());
          for (var _i11 = 0, _Object$entries2 = Object.entries(effects || {}); _i11 < _Object$entries2.length; _i11++) {
            var _Object$entries2$_i = _Object$entries2[_i11],
              key = _Object$entries2$_i[0],
              value = _Object$entries2$_i[1];
            if (key === "armor" || key === "critChance" || key === "reviveCharges") {
              player.runModifiers[key] = (player.runModifiers[key] || 0) + value;
            } else {
              var _player$runModifiers$;
              player.runModifiers[key] = ((_player$runModifiers$ = player.runModifiers[key]) != null ? _player$runModifiers$ : 1) * value;
            }
          }
          player.recalculateStats == null || player.recalculateStats();
        };
        _proto12._grantRandomFrom = function _grantRandomFrom(catalogue2, owned, grant, rng) {
          var available = Object.keys(catalogue2).filter(function (id) {
            return !owned.has(id);
          });
          if (!available.length) return null;
          var roll = Math.min(0.999999, Math.max(0, Number(rng == null ? void 0 : rng()) || 0));
          return grant(available[Math.floor(roll * available.length)]);
        };
        _proto12._getChoices = function _getChoices(catalogue2, owned, count, rng) {
          var available = Object.keys(catalogue2).filter(function (id) {
            return !owned.has(id);
          });
          var picks = [];
          var limit = Math.max(0, Math.min(available.length, Math.floor(Number(count) || 0)));
          while (picks.length < limit) {
            var roll = Math.min(0.999999, Math.max(0, Number(rng == null ? void 0 : rng()) || 0));
            var _available$splice = available.splice(Math.floor(roll * available.length), 1),
              id = _available$splice[0];
            picks.push(catalogue2[id]);
          }
          return picks;
        };
        _proto12._syncUi = function _syncUi() {
          var _this$game13;
          (_this$game13 = this.game) == null || (_this$game13 = _this$game13.ui) == null || _this$game13.updateBuildStatus == null || _this$game13.updateBuildStatus(this.snapshot());
        };
        return RunBuildSystem;
      }());

      // prototype-2d-pixel/src/talent-details.js
      var TALENT_COPY = Object.freeze({
        first_cut: "\u76F4\u63A5\u5F3A\u5316\u6240\u6709\u4F24\u5BB3\uFF0C\u521D\u59CB\u5251\u6C14\u548C\u540E\u7EED\u516C\u5171\u6B66\u5668\u5747\u53D7\u76CA\u3002",
        clear_sword_heart: "\u63D0\u9AD8\u66B4\u51FB\u673A\u4F1A\uFF0C\u8BA9\u81EA\u52A8\u6B66\u5668\u66F4\u5FEB\u51FA\u624B\u3002",
        blood_edge: "\u727A\u7272\u90E8\u5206\u6700\u5927\u751F\u547D\uFF1B\u751F\u547D\u8D8A\u4F4E\uFF0C\u4F24\u5BB3\u8D8A\u9AD8\uFF0C\u6062\u590D\u751F\u547D\u540E\u589E\u4F24\u4E5F\u4F1A\u56DE\u843D\u3002",
        borrowed_paper_soul: "\u7F29\u77ED\u6240\u6709\u81EA\u52A8\u6B66\u5668\u7684\u51FA\u624B\u95F4\u9694\uFF0C\u4E0D\u7F29\u77ED\u4E3B\u52A8\u6280\u80FD\u51B7\u5374\u3002",
        ten_thousand_talismans: "\u589E\u52A0\u6295\u5C04\u7269\u548C\u73AF\u7ED5\u788E\u5203\u6570\u91CF\uFF0C\u4F46\u964D\u4F4E\u6BCF\u6B21\u4F24\u5BB3\uFF1B\u4E0D\u589E\u52A0\u8FD1\u6218\u6325\u51FB\u6B21\u6570\u3002",
        paper_substitute: "\u51CF\u5C11\u6700\u5927\u751F\u547D\uFF0C\u6362\u53D6\u4E00\u6B21\u6FD2\u6B7B\u590D\u8D77\u3002\u6D88\u8017\u540E\u4FDD\u5B58\u6216\u6362\u623F\u4E0D\u4F1A\u8865\u56DE\u3002",
        hundred_banes_body: "\u63D0\u9AD8\u6700\u5927\u751F\u547D\uFF0C\u5E76\u5C06\u8D85\u51FA\u57FA\u7840\u751F\u547D\u7684\u90E8\u5206\u8F6C\u4E3A\u4F24\u5BB3\uFF1B\u7EE7\u7EED\u5806\u751F\u547D\u53EF\u4EE5\u5F3A\u5316\u8FD9\u6761\u8DEF\u7EBF\u3002",
        devouring_armor: "\u63D0\u9AD8\u62A4\u7532\uFF1B\u5B9E\u9645\u53D7\u51FB\u540E\u53CD\u566C\u9644\u8FD1\u6D3B\u654C\uFF0C\u62A4\u7532\u8D8A\u9AD8\u53CD\u4F24\u8D8A\u5F3A\u3002\u95EA\u907F\u4E0E\u65E0\u654C\u671F\u95F4\u4E0D\u89E6\u53D1\u3002",
        hungry_breath: "\u63D0\u9AD8\u6062\u590D\u4E0E\u5438\u53D6\u6548\u679C\uFF0C\u4F46\u627F\u53D7\u66F4\u591A\u4F24\u5BB3\u3002\u6EE1\u8840\u4E0D\u4F1A\u5B58\u50A8\u989D\u5916\u6CBB\u7597\u3002",
        retrograde_step: "\u63D0\u9AD8\u79FB\u52A8\u901F\u5EA6\uFF0C\u4FBF\u4E8E\u62C9\u5F00\u8DDD\u79BB\u548C\u62FE\u53D6\u8D44\u6E90\uFF1B\u81EA\u8EAB\u4E0D\u63D0\u4F9B\u79FB\u901F\u8F6C\u4F24\u3002",
        orbit_overload: "\u5C06\u989D\u5916\u79FB\u52A8\u901F\u5EA6\u8F6C\u4E3A\u4F24\u5BB3\uFF0C\u4F46\u627F\u53D7\u66F4\u591A\u4F24\u5BB3\uFF1B\u7EE7\u7EED\u5806\u8EAB\u6CD5\u53EF\u4EE5\u5F3A\u5316\u8FD9\u6761\u8DEF\u7EBF\u3002",
        stellar_domain: "\u6269\u5927\u81EA\u52A8\u6B66\u5668\u8303\u56F4\u5E76\u7F29\u77ED\u51FA\u624B\u95F4\u9694\uFF1B\u4E3B\u52A8\u6280\u80FD\u4ECD\u4F7F\u7528\u5404\u81EA\u56FA\u5B9A\u8303\u56F4\u4E0E\u51B7\u5374\u3002"
      });
      function selectedTalentCard(player) {
        var hero = getHero(player.heroId);
        var talent = getHeroTalent(hero, player.heroTalentId);
        return {
          category: "\u521D\u59CB\u5929\u8D4B",
          artId: hero.id,
          artKind: "hero",
          glyph: hero.glyph,
          name: hero.name + " \xB7 " + talent.name,
          level: "\u672C\u5C40\u5DF2\u9009",
          lore: hero.epithet,
          effect: TALENT_COPY[talent.id],
          attackMode: "\u672C\u5C40\u6301\u7EED\u751F\u6548\uFF1B\u8BE5\u89D2\u8272\u7684\u6240\u6709\u521D\u59CB\u5929\u8D4B\u5747\u53EF\u89E6\u53D1\u4E13\u5C5E\u878D\u5408\uFF0C\u516C\u5171\u6B66\u5668\u4E0E\u529F\u6CD5\u4E0D\u53D7\u9650\u5236\u3002",
          numbers: talent.description
        };
      }
      function conversionCards(player) {
        var m = player.runModifiers || {},
          lines = [],
          details = [];
        if (m.maxHpDamageRatio) {
          lines.push("\u989D\u5916\u6700\u5927\u751F\u547D\u6B63\u5728\u8F6C\u5316\u4E3A\u4F24\u5BB3\u3002");
          details.push("\u751F\u547D\u8F6C\u4F24 \xD7" + player.getHealthDamageMult().toFixed(3) + "\uFF1A\u6BCF\u589E\u52A0 100% \u57FA\u7840\u751F\u547D\uFF0C\u589E\u4F24 " + (m.maxHpDamageRatio * 100).toFixed(0) + "%");
        }
        if (m.missingHpDamageRatio) {
          lines.push("\u635F\u5931\u751F\u547D\u6B63\u5728\u8F6C\u5316\u4E3A\u4F24\u5BB3\uFF1B\u56DE\u8840\u4F1A\u964D\u4F4E\u8FD9\u4E00\u9879\u3002");
          details.push("\u5931\u8840\u8F6C\u4F24 \xD7" + player.getWoundedDamageMult().toFixed(3) + "\uFF1A\u5F53\u524D\u635F\u5931 " + ((1 - player.hp / player.maxHp) * 100).toFixed(1) + "% \u751F\u547D");
        }
        if (m.speedDamageRatio) {
          lines.push("\u989D\u5916\u8EAB\u6CD5\u6B63\u5728\u8F6C\u5316\u4E3A\u4F24\u5BB3\u3002");
          details.push("\u8EAB\u6CD5\u8F6C\u4F24 \xD7" + player.getSpeedDamageMult().toFixed(3) + "\uFF1A\u4F7F\u7528\u6784\u7B51\u79FB\u901F\u500D\u7387\uFF0C\u4E0D\u8BA1\u5730\u56FE\u53CA\u77ED\u6682\u51CF\u901F");
        }
        if (m.armorReflectRatio) {
          lines.push("\u62A4\u7532\u548C\u5B9E\u9645\u627F\u53D7\u7684\u4F24\u5BB3\u4F1A\u53CD\u566C\u9644\u8FD1\u654C\u4EBA\u3002");
          details.push("\u53CD\u4F24 = max(1, (\u62A4\u7532 " + player.getArmor() + " + \u672C\u6B21\u627F\u4F24 \xD70.25) \xD7" + m.armorReflectRatio.toFixed(2) + ")\uFF1B\u8303\u56F4 150\uFF0C\u4EC5\u53D7\u51FB\u89E6\u53D1");
        }
        if (!lines.length) return [];
        return [{
          category: "\u6784\u7B51\u8F6C\u5316",
          artId: player.heroId,
          artKind: "hero",
          glyph: "\u5316",
          name: "\u672C\u5C40\u5C5E\u6027\u8054\u52A8",
          level: "\u968F\u5F53\u524D\u72B6\u6001\u8BA1\u7B97",
          lore: "\u547D\u3001\u8EAB\u3001\u4F24\u90FD\u80FD\u5165\u9053\uFF0C\u4F46\u4EE3\u4EF7\u4ECE\u4E0D\u6D88\u5931\u3002",
          effect: lines.join(""),
          attackMode: "\u4F24\u5BB3\u8F6C\u5316\u6309\u5404\u9879\u500D\u7387\u76F8\u4E58\uFF1B\u53CD\u4F24\u5355\u72EC\u8BA1\u7B97\uFF0C\u4E0D\u4F1A\u4E3B\u52A8\u8FFD\u51FB\u6216\u8FDE\u9501\u53CD\u5F39\u3002",
          numbers: details.join("\uFF1B") + "\u3002\u5F53\u524D\u603B\u4F24\u5BB3\u500D\u7387 \xD7" + player.getDamageMult().toFixed(3) + "\uFF08\u542B\u529F\u6CD5\u548C\u9057\u7269\uFF0C\u4E0D\u542B\u6B66\u5668\u81EA\u8EAB\u7B49\u7EA7/\u878D\u5408\u500D\u7387\uFF09\u3002"
        }];
      }

      // prototype-2d-pixel/src/reactions.js
      var REACTIONS = Object.freeze([{
        id: "cold_fire_shatter",
        name: "\u5BD2\u7130\u5D29\u88C2",
        icon: "\uD83D\uDCA5",
        artId: "frost_nova",
        description: "\u5BD2\u6C14\u5C01\u4F4F\u7684\u88C2\u75D5\u88AB\u706B\u7130\u64AC\u5F00\uFF0C\u5BF9\u540C\u4E00\u90AA\u7269\u8FFD\u52A0\u4E00\u6B21\u5D29\u88C2\u4F24\u5BB3\u3002",
        pair: ["frost", "fire"],
        effect: {
          bonusDamageMult: 0.65
        }
      }, {
        id: "blood_thunder_chain",
        name: "\u8840\u96F7\u8D70\u8109",
        icon: "\uD83E\uDE78",
        artId: "lightning",
        description: "\u8840\u6C14\u6210\u4E3A\u96F7\u7684\u5F15\u7EBF\uFF0C\u628A\u4F24\u5BB3\u4F20\u7ED9\u5468\u56F4\u5176\u4ED6\u90AA\u7269\uFF1B\u4F20\u5BFC\u4E0D\u4F1A\u518D\u6B21\u9012\u5F52\u3002",
        pair: ["blood", "thunder"],
        effect: {
          chainDamageMult: 0.45,
          chainRadius: 160,
          chainTargets: 3
        }
      }, {
        id: "seal_ward_bind",
        name: "\u9547\u8EAB\u5C01\u7A8D",
        icon: "\uD83D\uDD12",
        artId: "seal",
        description: "\u7B26\u5370\u4E0E\u62A4\u8EAB\u6C14\u76F8\u5408\uFF0C\u5C01\u4F4F\u540C\u4E00\u90AA\u7269\u7684\u884C\u52A8\uFF1B\u8FD9\u662F\u51CF\u901F\uFF0C\u4E0D\u662F\u5B8C\u5168\u5B9A\u8EAB\u3002",
        pair: ["seal", "ward"],
        effect: {
          slowPct: 0.72,
          slowDuration: 1.8
        }
      }, {
        id: "blood_blade_return",
        name: "\u8840\u5203\u56DE\u751F",
        icon: "\uD83D\uDDE1\uFE0F",
        artId: "whip",
        description: "\u5251\u5203\u5FAA\u7740\u8840\u6C14\u8FFD\u52A0\u4F24\u5BB3\uFF0C\u5E76\u628A\u4E00\u90E8\u5206\u751F\u673A\u5E26\u56DE\u884C\u8005\u8EAB\u4E0A\u3002",
        pair: ["blood", "blade"],
        effect: {
          bonusDamageMult: 0.3,
          healMult: 0.18
        }
      }]);
      var ELEMENT_NAMES = Object.freeze({
        frost: "\u5BD2",
        fire: "\u706B",
        blood: "\u8840",
        thunder: "\u96F7",
        seal: "\u7B26",
        ward: "\u62A4",
        blade: "\u5203"
      });
      function reactionCondition(reaction) {
        return reaction.pair.map(function (element) {
          return ELEMENT_NAMES[element];
        }).join(" \uFF0B ") + "\uFF1A\u5148\u540E\u547D\u4E2D\u540C\u4E00\u4E2A\u4ECD\u5B58\u6D3B\u7684\u654C\u4EBA\uFF0C\u987A\u5E8F\u4E0D\u9650\uFF1B\u53CD\u5E94\u6D88\u8017\u4E24\u79CD\u5370\u8BB0\u3002";
      }
      function reactionNumbers(reaction) {
        var effect = reaction.effect;
        var parts = ["\u4E24\u6B21\u5143\u7D20\u547D\u4E2D\u95F4\u9694\u9700\u5C0F\u4E8E 4 \u79D2\uFF1B\u4EE5\u89E6\u53D1\u53CD\u5E94\u90A3\u6B21\u653B\u51FB\u7684\u57FA\u7840\u4F24\u5BB3\u8BA1\u7B97"];
        if (effect.bonusDamageMult) parts.push("\u8FFD\u52A0\u4F24\u5BB3 " + Math.round(effect.bonusDamageMult * 100) + "%");
        if (effect.chainDamageMult) parts.push("\u5411 " + effect.chainRadius + " \u50CF\u7D20\u5185\u6700\u591A " + effect.chainTargets + " \u540D\u5176\u4ED6\u654C\u4EBA\u4F20\u5BFC " + Math.round(effect.chainDamageMult * 100) + "% \u4F24\u5BB3");
        if (effect.slowDuration) parts.push("\u51CF\u901F " + Math.round(effect.slowPct * 100) + "%\uFF0C\u6301\u7EED " + effect.slowDuration + " \u79D2");
        if (effect.healMult) parts.push("\u6062\u590D " + Math.round(effect.healMult * 100) + "% \u57FA\u7840\u4F24\u5BB3\u5BF9\u5E94\u751F\u547D\uFF0C\u518D\u53D7\u6CBB\u7597\u500D\u7387\u5F71\u54CD\uFF0C\u4E0D\u8D85\u8FC7\u751F\u547D\u4E0A\u9650");
        return parts.join("\uFF1B");
      }
      var ReactionSystem = exports('ReactionSystem', /*#__PURE__*/function () {
        function ReactionSystem(game) {
          this.game = game;
          this.tagLifetime = 4;
        }
        var _proto13 = ReactionSystem.prototype;
        _proto13.applyHit = function applyHit(enemy, element, baseDamage) {
          var _this$game14, _this$game15;
          if (!enemy || enemy.hp <= 0 || !element) return null;
          var now = ((_this$game14 = this.game) == null ? void 0 : _this$game14.gameTime) || 0;
          enemy.reactionTags || (enemy.reactionTags = /* @__PURE__ */new Map());
          for (var _iterator35 = _createForOfIteratorHelperLoose(enemy.reactionTags), _step35; !(_step35 = _iterator35()).done;) {
            var _step35$value = _step35.value,
              tag = _step35$value[0],
              expiresAt = _step35$value[1];
            if (expiresAt <= now) enemy.reactionTags["delete"](tag);
          }
          var reaction = REACTIONS.find(function (r) {
            return r.pair.includes(element) && r.pair.some(function (tag) {
              return tag !== element && enemy.reactionTags.has(tag);
            });
          });
          if (!reaction) {
            enemy.reactionTags.set(element, now + this.tagLifetime);
            return null;
          }
          for (var _iterator36 = _createForOfIteratorHelperLoose(reaction.pair), _step36; !(_step36 = _iterator36()).done;) {
            var _tag = _step36.value;
            enemy.reactionTags["delete"](_tag);
          }
          this._resolve(reaction, enemy, baseDamage);
          (_this$game15 = this.game) == null || _this$game15._recordDiscovery == null || _this$game15._recordDiscovery("reactions", reaction.id);
          return reaction;
        };
        _proto13._resolve = function _resolve(reaction, enemy, baseDamage) {
          var _this$game18, _this$game19, _this$game20;
          var effect = reaction.effect;
          var bonus = Math.max(0, baseDamage * (effect.bonusDamageMult || 0));
          if (bonus) enemy.takeDamage(bonus);
          if (effect.slowDuration) {
            enemy.slowPct = Math.max(enemy.slowPct || 0, effect.slowPct || 0);
            enemy.slowTimer = Math.max(enemy.slowTimer || 0, effect.slowDuration);
          }
          if (effect.chainDamageMult) {
            var _this$game16, _this$game17;
            var radius = effect.chainRadius || 140;
            var candidates = (_this$game16 = this.game) != null && (_this$game16 = _this$game16.spatial) != null && _this$game16.queryRect ? this.game.spatial.queryRect(enemy.x, enemy.y, radius) : ((_this$game17 = this.game) == null ? void 0 : _this$game17.enemies) || [];
            var hits = 0;
            for (var _iterator37 = _createForOfIteratorHelperLoose(candidates), _step37; !(_step37 = _iterator37()).done;) {
              var other = _step37.value;
              if (other === enemy || other.hp <= 0) continue;
              if (Math.hypot(other.x - enemy.x, other.y - enemy.y) > radius) continue;
              other.takeDamage(baseDamage * effect.chainDamageMult);
              if (++hits >= (effect.chainTargets || 3)) break;
            }
          }
          if (effect.healMult) (_this$game18 = this.game) == null || (_this$game18 = _this$game18.player) == null || _this$game18.heal == null || _this$game18.heal(baseDamage * effect.healMult);
          (_this$game19 = this.game) == null || _this$game19.createFloatingText == null || _this$game19.createFloatingText(reaction.name, enemy.x, enemy.y - 34, "#d9a7ff");
          (_this$game20 = this.game) == null || (_this$game20 = _this$game20.effects) == null || (_this$game20 = _this$game20.pulses) == null || _this$game20.emit == null || _this$game20.emit(enemy.x, enemy.y, "205,145,255");
        };
        return ReactionSystem;
      }());

      // prototype-2d-pixel/src/environment.js
      var LANTERN_SECONDS = 120;
      var EnvironmentState = exports('EnvironmentState', /*#__PURE__*/function () {
        function EnvironmentState(snapshot) {
          this.restore(snapshot);
        }
        var _proto14 = EnvironmentState.prototype;
        _proto14.restore = function restore(snapshot) {
          var finite = function finite(value) {
            return Number.isFinite(Number(value)) ? Number(value) : 0;
          };
          this.warmthRemaining = Math.min(LANTERN_SECONDS, Math.max(0, finite(snapshot == null ? void 0 : snapshot.warmthRemaining)));
          this.coldTickAccum = Math.min(10, Math.max(0, finite(snapshot == null ? void 0 : snapshot.coldTickAccum)));
        };
        _proto14.snapshot = function snapshot() {
          return {
            warmthRemaining: this.warmthRemaining,
            coldTickAccum: this.coldTickAccum
          };
        };
        _proto14.lightLantern = function lightLantern() {
          this.warmthRemaining = LANTERN_SECONDS;
          this.coldTickAccum = 0;
        };
        _proto14.update = function update(dt, interval) {
          if (!Number.isFinite(dt) || dt <= 0 || !Number.isFinite(interval) || interval <= 0) return {
            ticks: 0,
            expired: false
          };
          var before = this.warmthRemaining;
          var protectedTime = Math.min(dt, before);
          this.warmthRemaining = Math.max(0, before - dt);
          this.coldTickAccum += dt - protectedTime;
          var ticks = Math.floor((this.coldTickAccum + 1e-9) / interval);
          this.coldTickAccum = Math.max(0, this.coldTickAccum - ticks * interval);
          return {
            ticks: ticks,
            expired: before > 0 && this.warmthRemaining === 0
          };
        };
        return EnvironmentState;
      }());
      function environmentCard(game) {
        var _game$environment;
        var mods = game.stageMods;
        if (!(mods != null && mods.coldTickInterval)) return [];
        var remaining = ((_game$environment = game.environment) == null ? void 0 : _game$environment.warmthRemaining) || 0;
        return [{
          category: "\u73AF\u5883\u72B6\u6001",
          artId: "ward_lantern",
          artKind: "relic",
          glyph: "\u706F",
          name: remaining > 0 ? "\u907F\u661F\u706F\u62A4\u6301" : "\u661F\u8680\u4FB5\u4F53",
          level: remaining > 0 ? "\u5269\u4F59 " + Math.ceil(remaining) + " \u79D2" : "\u5F53\u524D\u5730\u56FE\u751F\u6548",
          lore: "\u70FD\u71E7\u5B88\u706F\u4EBA\u8BF4\uFF0C\u661F\u661F\u770B\u4E0D\u89C1\u706F\u4E0B\u7684\u4EBA\u3002\u706F\u706D\u4EE5\u540E\uFF0C\u4ED6\u4E0D\u518D\u56DE\u7B54\u95EE\u9898\u3002",
          effect: remaining > 0 ? "\u6682\u65F6\u963B\u6B62\u73AF\u5883\u4FB5\u8680\uFF1B\u4E0D\u4F1A\u62B5\u6321\u602A\u7269\u653B\u51FB\u3001\u6295\u5C04\u7269\u6216\u5730\u9762\u5371\u9669\u3002" : "\u661F\u8680\u4F1A\u7F13\u6162\u6D88\u8017\u751F\u547D\uFF0C\u4F46\u4E0D\u4F1A\u76F4\u63A5\u81F4\u6B7B\u3002\u6062\u590D\u5EFA\u7B51\u4E2D\u53EF\u9009\u62E9\u70B9\u706F\uFF0C\u6362\u53D6\u9650\u65F6\u62A4\u6301\u3002",
          attackMode: "\u8BA1\u65F6\u53EA\u5728\u6218\u6597\u8FD0\u884C\u65F6\u63A8\u8FDB\uFF1B\u6682\u505C\u3001\u4EA4\u4E92\u548C\u79BB\u7EBF\u4E0D\u6263\u65F6\u3002\u70B9\u706F\u4E0E\u559D\u6C34\u3001\u70BC\u4F53\u5171\u4EAB\u5EFA\u7B51\u7684\u4E00\u6B21\u673A\u4F1A\u3002",
          numbers: "\u4FB5\u8680\uFF1A\u6BCF " + mods.coldTickInterval + " \u79D2 " + mods.coldTickDamage + " \u751F\u547D\uFF0C\u6700\u4F4E\u4FDD\u7559 1\uFF1B\u70B9\u706F\u6062\u590D 20% \u6700\u5927\u751F\u547D\uFF0C\u4FDD\u62A4 " + LANTERN_SECONDS + " \u79D2\u3002"
        }];
      }

      // prototype-2d-pixel/src/economy.js
      function calculateShopPrice(basePrice, _temp2) {
        var _ref6 = _temp2 === void 0 ? {} : _temp2,
          _ref6$purchases = _ref6.purchases,
          purchases = _ref6$purchases === void 0 ? 0 : _ref6$purchases,
          _ref6$gameTime = _ref6.gameTime,
          gameTime = _ref6$gameTime === void 0 ? 0 : _ref6$gameTime,
          _ref6$owned = _ref6.owned,
          owned = _ref6$owned === void 0 ? 0 : _ref6$owned;
        var base = Math.max(1, Number(basePrice) || 1);
        var purchasePressure = Math.max(0, purchases) * 0.24;
        var timePressure = Math.floor(Math.max(0, gameTime) / 120) * 0.1;
        var levelPressure = Math.max(0, owned) * 0.12;
        return Math.max(1, Math.ceil(base * (1 + purchasePressure + timePressure + levelPressure)));
      }
      var SHOP_PURCHASE_LIMIT = 3;
      function combatCoinLimit(gameTime) {
        if (gameTime === void 0) {
          gameTime = 0;
        }
        var seconds = Number.isFinite(gameTime) ? Math.max(0, gameTime) : 0;
        return 12 + Math.floor(seconds / 12);
      }
      function restoreCombatCoins(earned, gameTime, kills) {
        var legacy = Math.min(Math.floor(Math.max(0, kills || 0) / 3), combatCoinLimit(gameTime));
        return Number.isFinite(earned) ? Math.min(combatCoinLimit(gameTime), Math.max(0, Math.floor(earned))) : legacy;
      }
      function killCoinReward(_ref7) {
        var boss = _ref7.boss,
          kills = _ref7.kills,
          gameTime = _ref7.gameTime,
          _ref7$earned = _ref7.earned,
          earned = _ref7$earned === void 0 ? 0 : _ref7$earned,
          _ref7$endless = _ref7.endless,
          endless = _ref7$endless === void 0 ? false : _ref7$endless;
        if (boss) return 18;
        if (kills % 3 !== 0) return 0;
        return !endless || earned < combatCoinLimit(gameTime) ? 1 : 0;
      }

      // prototype-2d-pixel/src/codex.js
      function reactionCards(game) {
        var _game$player3;
        var elements = new Set((((_game$player3 = game.player) == null ? void 0 : _game$player3.weapons) || []).map(function (weapon) {
          return weapon.def.element;
        }));
        return REACTIONS.filter(function (reaction) {
          return reaction.pair.every(function (element) {
            return elements.has(element);
          });
        }).map(function (reaction) {
          var _game$save2;
          return {
            category: "\u5143\u7D20\u53CD\u5E94",
            artId: reaction.artId,
            artKind: "fusion",
            glyph: reaction.name.slice(0, 1),
            name: reaction.name,
            level: (_game$save2 = game.save) != null && (_game$save2 = _game$save2.collection) != null && (_game$save2 = _game$save2.reactions) != null && _game$save2.includes(reaction.id) ? "\u66FE\u89E6\u53D1 \xB7 \u672C\u6784\u7B51\u53EF\u7528" : "\u672C\u6784\u7B51\u53EF\u89E6\u53D1",
            lore: "\u4E0D\u540C\u672F\u5F0F\u5728\u90AA\u7269\u8EAB\u4E0A\u7559\u4E0B\u77ED\u6682\u5370\u8BB0\uFF0C\u76F8\u9047\u540E\u624D\u4F1A\u53D1\u751F\u53CD\u5E94\u3002",
            effect: reaction.description,
            attackMode: reactionCondition(reaction),
            numbers: reactionNumbers(reaction)
          };
        });
      }
      var WEAPON_LORE = Object.freeze({
        whip: ["\u5251\u80CE\u5148\u65A9\u8FD1\u8EAB\u56E0\u679C\uFF0C\u518D\u95EE\u6765\u7269\u59D3\u540D\u3002", "\u81EA\u52A8\u671D\u8FD1\u654C\u5B9A\u5411\uFF0C\u53CC\u5411\u5251\u6C14\u8986\u76D6\u53EF\u89C1\u957F\u6761\uFF1B\u5706\u6EE1\u540E\u6539\u4E3A\u73AF\u8EAB\u5468\u5929\u3002"],
        magic_wand: ["\u7EB8\u7B26\u8BB0\u5F97\u6B7B\u4EBA\u6700\u540E\u770B\u89C1\u7684\u65B9\u5411\u3002", "\u81EA\u52A8\u8FFD\u8E2A\u6700\u8FD1\u76EE\u6807\uFF1B\u7075\u7B26\u53EF\u7A7F\u8FC7\u5EFA\u7B51\uFF0C\u4EE5\u591A\u7B26\u9F50\u53D1\u538B\u5236\u3002"],
        knife: ["\u98DE\u5251\u4E0D\u8BA4\u5C71\u95E8\uFF0C\u53EA\u8BA4\u6301\u5251\u8005\u7684\u6740\u5FF5\u3002", "\u671D\u76EE\u6807\u65B9\u5411\u6295\u5C04\uFF0C\u53EF\u7A7F\u900F\u654C\u7FA4\uFF0C\u4F46\u4F1A\u88AB\u5EFA\u7B51\u5899\u4F53\u6321\u4E0B\u3002"],
        orbit: ["\u788E\u5203\u7ED5\u8EAB\uFF0C\u66FF\u4E3B\u4EBA\u5B88\u4F4F\u4E00\u53E3\u6D3B\u6C14\u3002", "\u73AF\u7ED5\u63A5\u89E6\u4F24\u5BB3\uFF0C\u6301\u7EED\u5C01\u9501\u8FD1\u8EAB\u533A\u57DF\u3002"],
        lightning: ["\u96F7\u7BC6\u501F\u4E5D\u9704\u4E4B\u540D\uFF0C\u843D\u4E0B\u7684\u5374\u672A\u5FC5\u662F\u5929\u96F7\u3002", "\u77AC\u65F6\u70B9\u6740\u5E76\u5728\u654C\u7FA4\u4E4B\u95F4\u8FDE\u9501\u3002"],
        mine: ["\u9547\u90AA\u7B26\u57CB\u5165\u571F\u4E2D\uFF0C\u7B49\u6076\u5FF5\u8E29\u4E0A\u6731\u7802\u3002", "\u5E03\u7F6E\u5EF6\u8FDF\u7206\u7B26\uFF0C\u8303\u56F4\u4F24\u5BB3\u53EF\u8D8A\u8FC7\u969C\u788D\u3002"],
        garlic: ["\u7384\u9EC4\u6C14\u4E0D\u95EE\u654C\u6211\uFF0C\u53EA\u62D2\u7EDD\u4E00\u5207\u8FD1\u8EAB\u4E4B\u7269\u3002", "\u6301\u7EED\u62A4\u4F53\u9886\u57DF\uFF0C\u5BF9\u5468\u56F4\u654C\u4EBA\u9AD8\u9891\u707C\u4F24\u3002"],
        frost_nova: ["\u5E7F\u5BD2\u65E7\u6708\u5760\u8FDB\u5C71\u6D77\uFF0C\u7559\u4E0B\u4E00\u5708\u4E0D\u5316\u7684\u971C\u3002", "\u4EE5\u81EA\u8EAB\u4E3A\u4E2D\u5FC3\u6269\u6563\u5BD2\u6F6E\u5E76\u51CF\u901F\u3002"],
        soul_drain: ["\u8840\u7EBF\u7275\u4F4F\u7684\u4E0D\u662F\u8089\u8EAB\uFF0C\u800C\u662F\u5C06\u6563\u672A\u6563\u7684\u9B42\u3002", "\u8FDE\u63A5\u6700\u8FD1\u76EE\u6807\u6301\u7EED\u6C72\u53D6\u751F\u547D\u3002"],
        boomerang: ["\u56DE\u98CE\u5203\u53BB\u65F6\u95EE\u7F6A\uFF0C\u5F52\u65F6\u7D22\u547D\u3002", "\u5F27\u7EBF\u98DE\u51FA\u5E76\u6298\u8FD4\uFF0C\u53EF\u7A7F\u8FC7\u5EFA\u7B51\u548C\u654C\u7FA4\u3002"],
        retro_blaster: ["\u661F\u5916\u6B8B\u9AB8\u4ECD\u5728\u91CD\u590D\u4E00\u573A\u65E0\u4EBA\u8BB0\u5F97\u7684\u6218\u4E89\u3002", "\u9AD8\u901F\u76F4\u7EBF\u8FDE\u5C04\uFF0C\u8D2F\u7A7F\u5E76\u5F62\u6210\u5F39\u5E55\u3002"]
      });
      var PASSIVE_COPY = Object.freeze({
        max_hp: ["\u53E4\u4FEE\u4EE5\u9AA8\u4F5C\u7089\uFF0C\u5148\u628A\u6D3B\u547D\u70BC\u6210\u5BB9\u5668\u3002", "\u63D0\u9AD8\u6700\u5927\u547D\u6570\uFF0C\u9002\u5408\u627F\u4F24\u4E0E\u590D\u8D77\u6D41\u3002"],
        recovery: ["\u4E00\u547C\u4E00\u5438\uFF0C\u501F\u5C71\u6D77\u6B8B\u6C14\u7F1D\u8865\u8089\u8EAB\u3002", "\u6301\u7EED\u6062\u590D\u547D\u6570\uFF0C\u589E\u5F3A\u957F\u7EBF\u5BB9\u9519\u3002"],
        armor: ["\u949F\u58F0\u4E0D\u54CD\uFF0C\u62A4\u4F53\u4E4B\u529B\u4ECD\u5728\u76AE\u9AA8\u95F4\u56DE\u8361\u3002", "\u524A\u51CF\u6BCF\u6B21\u53D7\u5230\u7684\u4F24\u5BB3\u3002"],
        movespeed: ["\u811A\u8E0F\u865A\u7F61\uFF0C\u4ECE\u5C1A\u672A\u53D1\u751F\u7684\u90A3\u4E00\u6B65\u79BB\u5F00\u3002", "\u63D0\u9AD8\u79FB\u52A8\u901F\u5EA6\u4E0E\u8D70\u4F4D\u4F59\u91CF\u3002"],
        might: ["\u6740\u610F\u51DD\u6210\u4E00\u7EBF\uFF0C\u6240\u6709\u672F\u6CD5\u90FD\u53D8\u5F97\u66F4\u6C89\u3002", "\u63D0\u9AD8\u5168\u90E8\u4F24\u5BB3\u3002"],
        area: ["\u6CD5\u57DF\u5C55\u5F00\uFF0C\u8FD1\u5904\u4E0E\u8FDC\u5904\u6682\u65F6\u5931\u53BB\u533A\u522B\u3002", "\u6269\u5927\u6B66\u5668\u4E0E\u6280\u80FD\u8986\u76D6\u8303\u56F4\u3002"],
        cooldown: ["\u6025\u5F8B\u50AC\u52A8\u5668\u9B42\uFF0C\u8BA9\u505C\u6B47\u53D8\u5F97\u66F4\u77ED\u3002", "\u7F29\u77ED\u81EA\u52A8\u6B66\u5668\u7684\u653B\u51FB\u95F4\u9694\u3002"],
        magnet: ["\u6563\u843D\u4E4B\u7269\u542C\u89C1\u65E0\u5F62\u53EC\u5524\uFF0C\u5411\u6301\u6709\u8005\u9760\u62E2\u3002", "\u6269\u5927\u7ECF\u9A8C\u4E0E\u6389\u843D\u7269\u7684\u62FE\u53D6\u8303\u56F4\u3002"],
        growth: ["\u6BCF\u4E00\u6B21\u9547\u715E\u90FD\u88AB\u5199\u8FDB\u540C\u4E00\u5377\u65E0\u5B57\u7ECF\u3002", "\u63D0\u9AD8\u7ECF\u9A8C\u83B7\u53D6\uFF0C\u4EE4\u6784\u7B51\u66F4\u5FEB\u6210\u5F62\u3002"],
        luck: ["\u547D\u6570\u7A0D\u7A0D\u504F\u5411\u6301\u6709\u8005\uFF0C\u4F46\u4ECE\u4E0D\u89E3\u91CA\u539F\u56E0\u3002", "\u63D0\u9AD8\u66B4\u51FB\u53D1\u751F\u7684\u673A\u4F1A\u3002"],
        dodge: ["\u8EAB\u5F71\u7F29\u5165\u5BF8\u5730\u4E4B\u5916\uFF0C\u8BA9\u653B\u51FB\u843D\u5728\u65E7\u4F4D\u7F6E\u3002", "\u83B7\u5F97\u95EA\u907F\u673A\u4F1A\uFF0C\u964D\u4F4E\u88AB\u8FDE\u7EED\u547D\u4E2D\u7684\u98CE\u9669\u3002"],
        magnet_plus: ["\u6444\u7269\u672F\u541E\u4E0B\u5468\u906D\u7075\u673A\uFF0C\u8FDE\u8FDC\u5904\u6B8B\u9B42\u4E5F\u4E0D\u653E\u8FC7\u3002", "\u5927\u5E45\u6269\u5927\u62FE\u53D6\u8303\u56F4\u3002"],
        damage_reduction: ["\u7384\u6B66\u4E4B\u5F71\u8986\u5728\u4F24\u53E3\u4E4B\u524D\uFF0C\u5148\u66FF\u4F60\u627F\u4E0B\u4E00\u5C42\u6076\u610F\u3002", "\u6309\u6BD4\u4F8B\u964D\u4F4E\u6700\u7EC8\u53D7\u5230\u7684\u4F24\u5BB3\u3002"],
        ink_body: ["\u4EE5\u58A8\u5165\u9AA8\uFF0C\u76AE\u8089\u6210\u4E3A\u4E00\u9875\u4E0D\u80AF\u88AB\u6495\u6BC1\u7684\u7ECF\u3002", "\u540C\u65F6\u63D0\u9AD8\u751F\u547D\u4E0A\u9650\u4E0E\u6700\u7EC8\u51CF\u4F24\u3002"],
        star_step: ["\u811A\u5370\u843D\u5728\u661F\u56FE\u7A7A\u767D\u5904\uFF0C\u654C\u4EBA\u7684\u6740\u62DB\u8FFD\u4E0D\u4E0A\u65E7\u5750\u6807\u3002", "\u63D0\u9AD8\u79FB\u52A8\u901F\u5EA6\u5E76\u83B7\u5F97\u5C11\u91CF\u95EA\u907F\u3002"],
        ritual_focus: ["\u658B\u91AE\u6536\u675F\u6742\u5FF5\uFF0C\u8BA9\u672F\u5F0F\u5728\u66F4\u5927\u7684\u6CD5\u57DF\u4E2D\u66F4\u5FEB\u8F6E\u8F6C\u3002", "\u540C\u65F6\u7F29\u77ED\u653B\u51FB\u95F4\u9694\u5E76\u6269\u5927\u8303\u56F4\u3002"],
        hungry_soul: ["\u9965\u9B42\u66FF\u4F60\u541E\u4E0B\u6B8B\u6C14\uFF0C\u518D\u4ECE\u5589\u95F4\u5410\u56DE\u751F\u673A\u3002", "\u6301\u7EED\u6062\u590D\u751F\u547D\u5E76\u6269\u5927\u62FE\u53D6\u8303\u56F4\u3002"]
      });
      function fmtSeconds(value) {
        return Number(value || 0).toFixed(2) + " \u79D2";
      }
      function weaponCards(game) {
        var _game$player4;
        return (((_game$player4 = game.player) == null ? void 0 : _game$player4.weapons) || []).map(function (weapon) {
          var copy = WEAPON_LORE[weapon.id] || ["\u6765\u5386\u88AB\u90AA\u6F6E\u62B9\u53BB\uFF0C\u53EA\u7559\u4E0B\u4ECD\u53EF\u4F7F\u7528\u7684\u672F\u5F0F\u3002", "\u81EA\u52A8\u7D22\u654C\u5E76\u6309\u5176\u672F\u5F0F\u53D1\u52A8\u3002"];
          return {
            category: "\u81EA\u52A8\u6B66\u5668",
            artId: weapon.id,
            artKind: "weapon",
            glyph: weapon.name.slice(0, 1),
            name: weapon.name,
            level: "Lv." + weapon.level + (weapon.fusion ? " \xB7 \u5DF2\u878D\u5408" : ""),
            lore: copy[0],
            effect: weapon.def.description,
            attackMode: copy[1],
            numbers: "\u4F24\u5BB3 " + weapon.getDamage(game.player).toFixed(1) + " \xB7 \u95F4\u9694 " + fmtSeconds(weapon.getCooldown(game.player)) + " \xB7 \u8303\u56F4 " + Math.round(weapon.getRange(game.player)) + (weapon.def.piercing ? " \xB7 \u53EF\u8D2F\u7A7F" : " \xB7 \u4E0D\u8D2F\u7A7F")
          };
        });
      }
      function passiveCards(game) {
        var _game$player5;
        return Object.values(((_game$player5 = game.player) == null ? void 0 : _game$player5.passives) || {}).map(function (entry) {
          var copy = PASSIVE_COPY[entry.def.id] || ["\u65E0\u540D\u529F\u6CD5\u5728\u6218\u6597\u4E2D\u81EA\u884C\u8865\u5168\u3002", "\u5F3A\u5316\u672C\u5C40\u57FA\u7840\u80FD\u529B\u3002"];
          return {
            category: "\u529F\u6CD5",
            artId: entry.def.id,
            artKind: "passive",
            glyph: entry.def.name.slice(0, 1),
            name: entry.def.name,
            level: "\u53E0\u5C42 " + entry.count + "/" + CONFIG.PASSIVE_MAX_STACK,
            lore: copy[0],
            effect: copy[1],
            attackMode: "\u88AB\u52A8\u751F\u6548\uFF1B\u6240\u6709\u82F1\u96C4\u5171\u4EAB\u6389\u843D\u6C60\u3002",
            numbers: entry.def.description
          };
        });
      }
      function fusionDetailNumbers(recipe, player) {
        return (recipe.outputs || []).map(function (output) {
          var _player$weapons, _Object$values$find, _fusion$damageMult, _fusion$rangeMult, _fusion$cooldownMult, _fusion$projectileBon, _fusion$projectileBon2;
          var weapon = player == null || (_player$weapons = player.weapons) == null ? void 0 : _player$weapons.find(function (item) {
            return item.id === output.weaponId;
          });
          var name = (weapon == null ? void 0 : weapon.name) || ((_Object$values$find = Object.values(WEAPONS).find(function (item) {
            return item.id === output.weaponId;
          })) == null ? void 0 : _Object$values$find.name) || "\u672A\u77E5\u6B66\u5668";
          if (!hasFusion(weapon, recipe.id)) return name + "\uFF1A\u5F53\u524D\u672A\u751F\u6548\uFF0C\u65E0\u6709\u6548\u878D\u5408\u6570\u503C\u3002";
          var fusion = weapon.fusion;
          var values = "\u4F24\u5BB3\xD7" + ((_fusion$damageMult = fusion.damageMult) != null ? _fusion$damageMult : 1) + " \xB7 \u8303\u56F4\xD7" + ((_fusion$rangeMult = fusion.rangeMult) != null ? _fusion$rangeMult : 1);
          var timing = weapon.def.type === "orbit" ? "\u73AF\u7ED5\u5E38\u9A7B\uFF0C\u4E0D\u6309\u653B\u51FB\u95F4\u9694\u53D1\u5C04" : "\u653B\u51FB\u95F4\u9694\xD7" + ((_fusion$cooldownMult = fusion.cooldownMult) != null ? _fusion$cooldownMult : 1);
          var count = weapon.def.type === "projectile" ? "\u878D\u5408\u5F39\u9053\u52A0\u6210 +" + ((_fusion$projectileBon = fusion.projectileBonus) != null ? _fusion$projectileBon : 0) + "\uFF08\u975E\u603B\u5F39\u6570\uFF09" : weapon.def.type === "orbit" ? "\u878D\u5408\u788E\u5203\u52A0\u6210 +" + ((_fusion$projectileBon2 = fusion.projectileBonus) != null ? _fusion$projectileBon2 : 0) + "\uFF08\u603B\u6570\u4ECD\u53D7\u4E0A\u9650\u7EA6\u675F\uFF09" : "\u6B64\u653B\u51FB\u65B9\u5F0F\u4E0D\u4F7F\u7528\u989D\u5916\u5F39\u9053";
          return name + " \xB7 \u5F53\u524D\u5408\u5E76\u6548\u679C\n" + values + " \xB7 " + timing + "\n" + count + "\n\u540C\u6B66\u5668\u5404\u878D\u5408\u9875\u5171\u7528\u6B64\u503C\uFF0C\u4E0D\u91CD\u590D\u76F8\u4E58\u3002";
        }).join("\n\n");
      }
      function buildCards(game) {
        var _game$buildSystem;
        var snapshot = ((_game$buildSystem = game.buildSystem) == null || _game$buildSystem.snapshot == null ? void 0 : _game$buildSystem.snapshot()) || {
          relics: [],
          curses: [],
          fusions: []
        };
        var relics = snapshot.relics.map(function (def) {
          return {
            category: "\u9057\u7269",
            artId: def.id,
            artKind: "relic",
            glyph: def.name.slice(0, 1),
            name: def.name,
            level: "\u5C40\u5185\u9057\u73CD",
            lore: "\u4ECE\u5931\u540D\u53E4\u7960\u4E0E\u9996\u9886\u9057\u9AB8\u4E2D\u7559\u4E0B\u7684\u5668\u7269\uFF0C\u6765\u5386\u6BD4\u4F5C\u7528\u66F4\u5371\u9669\u3002",
            effect: "\u6539\u53D8\u672C\u5C40\u5C5E\u6027\u6216\u63D0\u4F9B\u4E00\u6B21\u5173\u952E\u89C4\u5219\u80FD\u529B\u3002",
            attackMode: "\u88AB\u52A8\u5E38\u9A7B\uFF0C\u4E0D\u5360\u81EA\u52A8\u6B66\u5668\u4F4D\u3002",
            numbers: def.description
          };
        });
        var curses = snapshot.curses.map(function (def) {
          return {
            category: "\u5929\u8D4B / \u5F02\u53D8",
            artId: def.id,
            artKind: "curse",
            glyph: def.name.slice(0, 1),
            name: def.name,
            level: "\u6709\u4EE3\u4EF7\u7684\u547D\u5951",
            lore: "\u90AA\u6F6E\u7ED9\u51FA\u7684\u7B54\u6848\u4ECE\u4E0D\u514D\u8D39\uFF0C\u63A5\u53D7\u8005\u4F1A\u540C\u65F6\u5931\u53BB\u53E6\u4E00\u79CD\u53EF\u80FD\u3002",
            effect: "\u5F3A\u5316\u4E00\u4E2A\u6D41\u6D3E\uFF0C\u540C\u65F6\u9644\u5E26\u660E\u786E\u4EE3\u4EF7\u3002",
            attackMode: "\u88AB\u52A8\u5E38\u9A7B\uFF0C\u5F71\u54CD\u6574\u5957\u6784\u7B51\u3002",
            numbers: def.description
          };
        });
        var fusions = snapshot.fusions.map(function (def) {
          return {
            category: "\u88C5\u5907 / \u878D\u5408",
            artId: def.id,
            artKind: "fusion",
            glyph: def.name.slice(0, 1),
            name: def.name,
            level: "\u9AD8\u9636\u6784\u7B51",
            lore: "\u6B66\u5668\u3001\u529F\u6CD5\u4E0E\u9057\u7269\u5728\u5706\u6EE1\u5904\u5F7C\u6B64\u8BA4\u51FA\uFF0C\u6210\u4E3A\u65B0\u7684\u672F\u5F0F\u3002",
            effect: def.description || "\u6539\u53D8\u5173\u8054\u6B66\u5668\u7684\u4F24\u5BB3\u3001\u8303\u56F4\u6216\u5F39\u9053\u5F62\u6001\u3002",
            attackMode: "\u7EE7\u627F\u539F\u6B66\u5668\u653B\u51FB\u65B9\u5F0F\uFF0C\u5E76\u8FFD\u52A0\u878D\u5408\u7279\u6027\u3002",
            numbers: fusionDetailNumbers(def, game.player)
          };
        });
        return [].concat(relics, curses, fusions);
      }
      function activeCards(game) {
        var _game$heroSkills;
        var skill = ((_game$heroSkills = game.heroSkills) == null || _game$heroSkills.getSnapshot == null ? void 0 : _game$heroSkills.getSnapshot()) || {};
        var copy = {
          sword: [["\u8E0F\u7F61\u501F\u4F4D\uFF0C\u5251\u5149\u6CBF\u5C1A\u672A\u7AD9\u7A33\u7684\u56E0\u679C\u5212\u8FC7\u3002", "\u5411\u79FB\u52A8\u6216\u7D22\u654C\u65B9\u5411\u7A81\u8FDB\u5E76\u4F24\u5BB3\u8DEF\u5F84\u654C\u4EBA\u3002", "\u8DEF\u5F84\u65A9\u51FB\u53EF\u7A7F\u8FC7\u666E\u901A\u969C\u788D\u3002"], ["\u5251\u610F\u4E09\u5EA6\u56DE\u54CD\uFF0C\u628A\u89C6\u91CE\u4E4B\u5185\u6682\u501F\u4F5C\u5F52\u589F\u3002", "\u8FDE\u7EED\u53D1\u52A8\u4E09\u6B21\u6269\u5F20\u5251\u57DF\u3002", "\u8303\u56F4\u4F24\u5BB3\u65E0\u89C6\u4EA4\u4E92\u969C\u788D\u3002"]],
          paper: [["\u7EB8\u7B26\u8BB0\u4E0B\u6D3B\u7269\u6700\u540E\u4E00\u6B21\u547C\u5438\u3002", "\u9501\u5B9A\u9644\u8FD1\u6700\u591A\u516D\u4E2A\u76EE\u6807\u5E76\u540C\u6B65\u8FFD\u9B42\u3002", "\u8FFD\u8E2A\u8FDE\u7EBF\u53EF\u4EE5\u8D8A\u8FC7\u969C\u788D\u3002"], ["\u5343\u7EB8\u6210\u6CB3\uFF0C\u66FF\u4EA1\u8005\u6E21\u8FC7\u540C\u4E00\u573A\u52AB\u3002", "\u5927\u8303\u56F4\u6807\u8BB0\u5E76\u4F24\u5BB3\u6700\u591A\u5341\u516B\u4E2A\u654C\u4EBA\u3002", "\u5168\u5C4F\u8FFD\u8E2A\u672F\u5F0F\uFF0C\u4E0D\u53D7\u5730\u5F62\u963B\u6321\u3002"]],
          devourer: [["\u7AE5\u5B50\u541E\u715E\uFF0C\u4EE5\u6076\u517B\u547D\u3002", "\u4F24\u5BB3\u8FD1\u8EAB\u90AA\u7269\uFF0C\u5E76\u6309\u547D\u4E2D\u6570\u91CF\u6062\u590D\u751F\u547D\u3002", "\u8FD1\u8EAB\u5706\u5F62\u9886\u57DF\uFF0C\u672F\u5F0F\u53EF\u8D8A\u8FC7\u5EFA\u7B51\uFF1B\u89D2\u8272\u672C\u8EAB\u4ECD\u53D7\u963B\u6321\u3002"], ["\u767E\u9B3C\u9F50\u5165\u8179\uFF0C\u7B11\u58F0\u6682\u65F6\u76D6\u8FC7\u6B7B\u4EA1\u3002", "\u541E\u566C\u5927\u8303\u56F4\u654C\u4EBA\u3001\u56DE\u590D\u751F\u547D\u5E76\u77ED\u6682\u65E0\u654C\u3002", "\u5927\u8303\u56F4\u541E\u566C\u7A7F\u8FC7\u666E\u901A\u969C\u788D\u3002"]],
          star: [["\u661F\u8DEF\u6298\u53E0\uFF0C\u51FA\u53D1\u4E0E\u62B5\u8FBE\u6210\u4E3A\u540C\u4E00\u6B65\u3002", "\u5411\u79FB\u52A8\u65B9\u5411\u6298\u8DC3\uFF0C\u5E76\u5728\u843D\u70B9\u7206\u53D1\u661F\u5203\u3002", "\u4F4D\u79FB\u53EF\u4EE5\u8D8A\u8FC7\u666E\u901A\u969C\u788D\u3002"], ["\u4E09\u57A3\u5012\u60AC\uFF0C\u7FA4\u661F\u4F9D\u6B21\u5760\u5411\u6700\u8FD1\u7684\u654C\u4EBA\u3002", "\u5BF9\u5341\u4E8C\u4E2A\u6700\u8FD1\u76EE\u6807\u964D\u4E0B\u9AD8\u4F24\u661F\u96F7\u3002", "\u9501\u5B9A\u653B\u51FB\u4E0D\u53D7\u5730\u5F62\u963B\u6321\u3002"]]
        }[skill.heroId] || [[], []];
        return [{
          category: "\u4E3B\u52A8\u6280\u80FD",
          artId: skill.skillIcon || "slash",
          artKind: "skill",
          glyph: "\u65A9",
          name: skill.skillName || "\u8E0F\u7F61\u65A9",
          level: "E \xB7 " + ({
            sword: "\u4F4D\u79FB\u65A9",
            paper: "\u7B26\u7B93\u8FFD\u9B42",
            devourer: "\u541E\u715E\u56DE\u751F",
            star: "\u661F\u6B65\u6298\u8DC3"
          }[skill.heroId] || "\u4E3B\u52A8\u6280\u80FD"),
          lore: copy[0][0],
          effect: copy[0][1],
          attackMode: "\u4E3B\u52A8\u91CA\u653E\uFF1B" + copy[0][2],
          numbers: "\u89D2\u8272\u4E13\u5C5E\u4E3B\u52A8 \xB7 \u51B7\u5374 " + fmtSeconds(skill.skillCooldownMax)
        }, {
          category: "\u4E3B\u52A8\u6280\u80FD",
          artId: (skill.skillIcon || "slash") + "_ultimate",
          artKind: "fusion",
          glyph: "\u589F",
          name: skill.ultimateName || "\u4E07\u5251\u5F52\u589F",
          level: "Q \xB7 \u5145\u80FD\u7EC8\u5F0F",
          lore: copy[1][0],
          effect: copy[1][1],
          attackMode: "\u4E3B\u52A8\u91CA\u653E\uFF1B" + copy[1][2],
          numbers: "\u89D2\u8272\u4E13\u5C5E\u7EC8\u5F0F \xB7 \u80FD\u91CF " + Math.round(skill.ultimateEnergy || 0) + "/" + (skill.ultimateEnergyMax || 100)
        }];
      }
      function buildPauseCodex(game) {
        var _player$runModifiers3, _player$runModifiers$2, _player$runModifiers4, _game$run;
        var player = game.player;
        if (!player) return {
          attributes: [],
          cards: []
        };
        var attributes = [{
          name: "\u547D\u6570",
          summary: "\u5F53\u524D\u751F\u5B58\u72B6\u6001",
          numbers: Math.ceil(player.hp) + " / " + Math.ceil(player.maxHp)
        }, {
          name: "\u4F24\u52BF\u8F93\u51FA",
          summary: "\u5F71\u54CD\u5168\u90E8\u6B66\u5668",
          numbers: player.getDamageMult().toFixed(2) + "\xD7"
        }, {
          name: "\u672F\u5F0F\u95F4\u9694",
          summary: "\u8D8A\u4F4E\u8D8A\u5FEB",
          numbers: player.getCooldownMult().toFixed(2) + "\xD7"
        }, {
          name: "\u6CD5\u57DF",
          summary: "\u5F71\u54CD\u8303\u56F4",
          numbers: player.getAreaMult().toFixed(2) + "\xD7"
        }, {
          name: "\u8EAB\u6CD5",
          summary: "\u5F71\u54CD\u79FB\u52A8",
          numbers: player.getSpeedMult().toFixed(2) + "\xD7"
        }, {
          name: "\u590D\u8D77",
          summary: "\u672C\u5C40\u5269\u4F59\u673A\u4F1A",
          numbers: (((_player$runModifiers3 = player.runModifiers) == null ? void 0 : _player$runModifiers3.reviveCharges) || 0) + " \u6B21"
        }, {
          name: "\u8C03\u606F",
          summary: "\u6CBB\u7597 / \u5347\u7EA7\u6062\u590D / \u5438\u53D6",
          numbers: ((_player$runModifiers$2 = (_player$runModifiers4 = player.runModifiers) == null ? void 0 : _player$runModifiers4.healingMult) != null ? _player$runModifiers$2 : 1).toFixed(2) + "\xD7"
        }, {
          name: "\u62A4\u6301",
          summary: "\u62A4\u7532 / \u95EA\u907F / \u51CF\u4F24",
          numbers: player.getArmor().toFixed(0) + " / " + (player.getDodgeChance() * 100).toFixed(0) + "% / " + (player.getDamageReduction() * 100).toFixed(0) + "%"
        }, {
          name: "\u547D\u5951\u6B8B\u5377",
          summary: "\u547D\u5951" + (game.activeCovenantSlot || 1) + " \xB7 \u5DF2\u8BFB\u65E5\u5FD7",
          numbers: (((_game$run = game.run) == null ? void 0 : _game$run.logsRead) || 0) + " \u5377 \xB7 \u6BCF 15 \u79D2\u81EA\u52A8\u7EED\u5199"
        }];
        return {
          attributes: attributes,
          cards: [selectedTalentCard(player), damageHistoryCard(game)].concat(game.runMode === "endless" ? [{
            category: "\u5C40\u5185\u7ECF\u6D4E",
            artId: "coin_sword_tassel",
            artKind: "relic",
            glyph: "\u94B1",
            name: "\u5927\u8352\u94DC\u94B1",
            level: "\u666E\u901A\u602A\u4EA7\u51FA\u89C4\u5219",
            lore: "\u9B3C\u5E02\u8BA4\u94DC\u94B1\uFF0C\u5374\u4E0D\u4F1A\u4E3A\u65E0\u5C3D\u7684\u5C0F\u9B3C\u65E0\u9650\u94F8\u94B1\u3002",
            effect: "\u666E\u901A\u602A\u6389\u94B1\u53D7\u7D2F\u8BA1\u989D\u5EA6\u7EA6\u675F\uFF1BBoss\u3001\u5B9D\u7BB1\u3001\u4E8B\u4EF6\u548C\u5347\u7EA7\u8865\u7ED9\u53E6\u8BA1\u3002\u82B1\u94B1\u4E0D\u4F1A\u6062\u590D\u6389\u843D\u989D\u5EA6\u3002",
            attackMode: "\u989D\u5EA6\u53EA\u968F\u5C40\u5185\u65F6\u95F4\u589E\u957F\uFF1B\u6682\u505C\u4E0E\u79BB\u7EBF\u4E0D\u589E\u957F\uFF0C\u6062\u590D\u547D\u5951\u4E0D\u4F1A\u91CD\u9886\u5F00\u5C40\u989D\u5EA6\u3002",
            numbers: "\u666E\u901A\u602A\u5DF2\u4EA7 " + (game.combatCoinsEarned || 0) + " / \u5F53\u524D\u7D2F\u8BA1\u989D\u5EA6 " + combatCoinLimit(game.gameTime) + "\u3002\u5F00\u5C40\u989D\u5EA6 12\uFF0C\u6BCF 12 \u79D2\u589E\u52A0 1\uFF1B\u6BCF\u4E09\u6740\u4E00\u6B21\u6389\u94B1\u5224\u5B9A\uFF0C\u65F6\u95F4 Boss \u6BCF\u53EA 18\u3002"
          }] : [], conversionCards(player), environmentCard(game), activeCards(game), weaponCards(game), passiveCards(game), buildCards(game), reactionCards(game))
        };
      }

      // prototype-2d-pixel/src/hero-skills.js
      function pointSegmentDistance(px, py, ax, ay, bx, by) {
        var abx = bx - ax;
        var aby = by - ay;
        var lenSq = abx * abx + aby * aby;
        if (lenSq <= 1e-4) return Math.hypot(px - ax, py - ay);
        var t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq));
        return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
      }
      var QingfengSkillController = exports('QingfengSkillController', /*#__PURE__*/function () {
        function QingfengSkillController(game) {
          this.game = game;
          this.skillCooldownMax = 8;
          this.ultimateEnergyMax = 100;
          this.heroId = "sword";
          this.reset();
        }
        var _proto15 = QingfengSkillController.prototype;
        _proto15.setHero = function setHero(heroId) {
          this.heroId = getHero(heroId).id;
          var cooldowns = {
            sword: 8,
            paper: 7,
            devourer: 10,
            star: 6.5
          };
          this.skillCooldownMax = cooldowns[this.heroId] || 8;
          this._syncUi();
        };
        _proto15.reset = function reset() {
          this.skillCooldown = 0;
          this.ultimateEnergy = 0;
          this._syncUi();
        };
        _proto15.update = function update(dt) {
          if (this.skillCooldown > 0) this.skillCooldown = Math.max(0, this.skillCooldown - dt);
          this._syncUi();
        };
        _proto15.gainEnergy = function gainEnergy(amount2) {
          if (!Number.isFinite(amount2) || amount2 <= 0) return this.ultimateEnergy;
          this.ultimateEnergy = Math.min(this.ultimateEnergyMax, this.ultimateEnergy + amount2);
          this._syncUi();
          return this.ultimateEnergy;
        };
        _proto15.getSnapshot = function getSnapshot() {
          var hero = getHero(this.heroId);
          return {
            heroId: hero.id,
            heroName: hero.name,
            skillIcon: hero.skillIcon,
            skillName: hero.skillName,
            ultimateName: hero.ultimateName,
            skillCooldown: this.skillCooldown,
            skillCooldownMax: this.skillCooldownMax,
            ultimateEnergy: this.ultimateEnergy,
            ultimateEnergyMax: this.ultimateEnergyMax,
            skillReady: this.skillCooldown <= 0,
            ultimateReady: this.ultimateEnergy >= this.ultimateEnergyMax
          };
        };
        _proto15.useSkill = function useSkill() {
          var facing = this._resolveDirection().x;
          var success = this._performSkill();
          if (success) this._showAction(facing);
          return success;
        };
        _proto15.useUltimate = function useUltimate() {
          var facing = this._resolveDirection().x;
          var success = this._performUltimate();
          if (success) this._showAction(facing);
          return success;
        };
        _proto15._showAction = function _showAction(facing) {
          var _this$game$save;
          startHeroAction(this.game.player, facing, ((_this$game$save = this.game.save) == null || (_this$game$save = _this$game$save.settings) == null ? void 0 : _this$game$save.reducedMotion) || false);
        };
        _proto15._performSkill = function _performSkill() {
          var _CONFIG$ARENA_WIDTH, _CONFIG$ARENA_HEIGHT, _game$spatial5, _game$combatVisuals11;
          var game = this.game;
          var player = game == null ? void 0 : game.player;
          if (!player || player.dead || game.state !== GameState.PLAYING || this.skillCooldown > 0) {
            return false;
          }
          if (this.heroId === "paper") return this._usePaperSkill();
          if (this.heroId === "devourer") return this._useDevourerSkill();
          if (this.heroId === "star") return this._useStarSkill();
          var dir = this._resolveDirection();
          var startX = player.x;
          var startY = player.y;
          var dashDistance = 220;
          var arenaW = (_CONFIG$ARENA_WIDTH = CONFIG.ARENA_WIDTH) != null ? _CONFIG$ARENA_WIDTH : CONFIG.CANVAS_WIDTH;
          var arenaH = (_CONFIG$ARENA_HEIGHT = CONFIG.ARENA_HEIGHT) != null ? _CONFIG$ARENA_HEIGHT : CONFIG.CANVAS_HEIGHT;
          var rawEndX = startX + dir.x * dashDistance;
          var rawEndY = startY + dir.y * dashDistance;
          var endX = game.runMode === "endless" ? rawEndX : Math.max(player.size, Math.min(arenaW - player.size, rawEndX));
          var endY = game.runMode === "endless" ? rawEndY : Math.max(player.size, Math.min(arenaH - player.size, rawEndY));
          var centreX = (startX + endX) / 2;
          var centreY = (startY + endY) / 2;
          var searchRadius = Math.hypot(endX - startX, endY - startY) / 2 + 64;
          var candidates = (_game$spatial5 = game.spatial) != null && _game$spatial5.queryRect ? game.spatial.queryRect(centreX, centreY, searchRadius) : game.enemies || [];
          var damage = 80 * player.getDamageMult();
          var hits = 0;
          for (var _iterator38 = _createForOfIteratorHelperLoose(candidates), _step38; !(_step38 = _iterator38()).done;) {
            var _game$effects3;
            var enemy = _step38.value;
            if (!enemy || enemy.hp <= 0) continue;
            if (pointSegmentDistance(enemy.x, enemy.y, startX, startY, endX, endY) > 58 + enemyHitRadius(enemy)) {
              continue;
            }
            enemy.takeDamage(damage);
            (_game$effects3 = game.effects) == null || _game$effects3.hit == null || _game$effects3.hit(enemy.x, enemy.y, "125,230,255");
            hits++;
          }
          player.x = endX;
          player.y = endY;
          player.invincible = true;
          player.invincibleTimer = Math.max(player.invincibleTimer || 0, 0.35);
          this.skillCooldown = this.skillCooldownMax;
          game.createParticles == null || game.createParticles(startX, startY, "#78e6ff", 12);
          game.createParticles == null || game.createParticles(endX, endY, "#d7fbff", 18);
          (_game$combatVisuals11 = game.combatVisuals) == null || _game$combatVisuals11.slashCorridor == null || _game$combatVisuals11.slashCorridor(startX, startY, endX, endY, 58, {
            fused: false
          });
          game.shake == null || game.shake(0.18);
          game._announce == null || game._announce("\u8E0F\u7F61\u65A9\uFF0C\u547D\u4E2D " + hits + " \u4E2A\u654C\u4EBA");
          this._syncUi();
          return true;
        };
        _proto15._performUltimate = function _performUltimate() {
          var _game$effects4,
            _this7 = this,
            _game$effects5;
          var game = this.game;
          var player = game == null ? void 0 : game.player;
          if (!player || player.dead || game.state !== GameState.PLAYING || this.ultimateEnergy < this.ultimateEnergyMax) {
            return false;
          }
          if (this.heroId === "paper") return this._usePaperUltimate();
          if (this.heroId === "devourer") return this._useDevourerUltimate();
          if (this.heroId === "star") return this._useStarUltimate();
          this.ultimateEnergy = 0;
          this._ultimatePulse(0);
          (_game$effects4 = game.effects) == null || _game$effects4.schedule == null || _game$effects4.schedule(0.3, function () {
            return _this7._ultimatePulse(1);
          });
          (_game$effects5 = game.effects) == null || _game$effects5.schedule == null || _game$effects5.schedule(0.6, function () {
            return _this7._ultimatePulse(2);
          });
          game._announce == null || game._announce("\u4E07\u5251\u5F52\u589F");
          this._syncUi();
          return true;
        };
        _proto15._usePaperSkill = function _usePaperSkill() {
          var _game$spatial6, _game$combatVisuals12;
          var game = this.game;
          var player = game.player;
          var targets = (((_game$spatial6 = game.spatial) == null || _game$spatial6.queryRect == null ? void 0 : _game$spatial6.queryRect(player.x, player.y, 520)) || game.enemies || []).filter(function (enemy) {
            return enemy && enemy.hp > 0;
          }).sort(function (a, b) {
            return Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y);
          }).slice(0, 6);
          for (var _iterator39 = _createForOfIteratorHelperLoose(targets), _step39; !(_step39 = _iterator39()).done;) {
            var _game$combatVisuals13;
            var enemy = _step39.value;
            enemy.takeDamage(54 * player.getDamageMult());
            (_game$combatVisuals13 = game.combatVisuals) == null || _game$combatVisuals13.tether == null || _game$combatVisuals13.tether(player.x, player.y, enemy.x, enemy.y, {
              fused: true
            });
          }
          (_game$combatVisuals12 = game.combatVisuals) == null || _game$combatVisuals12.talismans == null || _game$combatVisuals12.talismans(player.x, player.y, targets.map(function (enemy) {
            return {
              x: enemy.x,
              y: enemy.y
            };
          }), {
            fused: true
          });
          this.skillCooldown = this.skillCooldownMax;
          game.createParticles == null || game.createParticles(player.x, player.y, "#f1e2b6", 14);
          game._announce == null || game._announce("\u6555\u7EB8\u8FFD\u9B42\uFF0C\u9501\u5B9A " + targets.length + " \u4E2A\u90AA\u7269");
          this._syncUi();
          return true;
        };
        _proto15._useDevourerSkill = function _useDevourerSkill() {
          var _game$spatial7, _game$combatVisuals14;
          var game = this.game;
          var player = game.player;
          var radius = 190;
          var targets = ((_game$spatial7 = game.spatial) == null || _game$spatial7.queryRect == null ? void 0 : _game$spatial7.queryRect(player.x, player.y, radius)) || game.enemies || [];
          var hits = 0;
          for (var _iterator40 = _createForOfIteratorHelperLoose(targets), _step40; !(_step40 = _iterator40()).done;) {
            var enemy = _step40.value;
            if (!enemy || enemy.hp <= 0 || Math.hypot(enemy.x - player.x, enemy.y - player.y) > radius + enemyHitRadius(enemy)) continue;
            enemy.takeDamage(64 * player.getDamageMult());
            hits++;
          }
          player.heal == null || player.heal(Math.min(22, hits * 3));
          (_game$combatVisuals14 = game.combatVisuals) == null || _game$combatVisuals14.field == null || _game$combatVisuals14.field(player.x, player.y, radius, "blood", {
            fused: true
          });
          this.skillCooldown = this.skillCooldownMax;
          game._announce == null || game._announce("\u541E\u715E\u56DE\u751F\uFF0C\u541E\u4E0B " + hits + " \u9053\u715E\u6C14");
          this._syncUi();
          return true;
        };
        _proto15._useStarSkill = function _useStarSkill() {
          var _game$combatVisuals15;
          var game = this.game;
          var player = game.player;
          var dir = this._resolveDirection();
          var startX = player.x;
          var startY = player.y;
          var distance = 260;
          player.x += dir.x * distance;
          player.y += dir.y * distance;
          if (game.runMode !== "endless") {
            player.x = Math.max(player.size, Math.min(CONFIG.ARENA_WIDTH - player.size, player.x));
            player.y = Math.max(player.size, Math.min(CONFIG.ARENA_HEIGHT - player.size, player.y));
          }
          for (var _iterator41 = _createForOfIteratorHelperLoose(((_game$spatial8 = game.spatial) == null || _game$spatial8.queryRect == null ? void 0 : _game$spatial8.queryRect(player.x, player.y, 130)) || []), _step41; !(_step41 = _iterator41()).done;) {
            var _game$spatial8;
            var enemy = _step41.value;
            if (Math.hypot(enemy.x - player.x, enemy.y - player.y) <= 130 + enemyHitRadius(enemy)) {
              enemy.takeDamage(72 * player.getDamageMult());
            }
          }
          (_game$combatVisuals15 = game.combatVisuals) == null || _game$combatVisuals15.wave == null || _game$combatVisuals15.wave(startX, startY, Math.atan2(dir.y, dir.x), distance, {
            fused: true,
            count: 3
          });
          player.invincible = true;
          player.invincibleTimer = Math.max(player.invincibleTimer || 0, 0.28);
          this.skillCooldown = this.skillCooldownMax;
          game._announce == null || game._announce("\u661F\u6B65\u6298\u8DC3");
          this._syncUi();
          return true;
        };
        _proto15._usePaperUltimate = function _usePaperUltimate() {
          var _game$combatVisuals16;
          var game = this.game;
          var player = game.player;
          this.ultimateEnergy = 0;
          var targets = (game.enemies || []).filter(function (enemy) {
            return enemy.hp > 0;
          }).slice(0, 18);
          for (var _iterator42 = _createForOfIteratorHelperLoose(targets), _step42; !(_step42 = _iterator42()).done;) {
            var _game$combatVisuals17;
            var enemy = _step42.value;
            enemy.takeDamage(118 * player.getDamageMult());
            (_game$combatVisuals17 = game.combatVisuals) == null || _game$combatVisuals17.tether == null || _game$combatVisuals17.tether(player.x, player.y, enemy.x, enemy.y, {
              fused: true
            });
          }
          (_game$combatVisuals16 = game.combatVisuals) == null || _game$combatVisuals16.field == null || _game$combatVisuals16.field(player.x, player.y, 520, "ward", {
            fused: true
          });
          game._announce == null || game._announce("\u5343\u7B26\u6E21\u5384");
          this._syncUi();
          return true;
        };
        _proto15._useDevourerUltimate = function _useDevourerUltimate() {
          var _game$combatVisuals18;
          var game = this.game;
          var player = game.player;
          this.ultimateEnergy = 0;
          var radius = 520;
          var hits = 0;
          for (var _iterator43 = _createForOfIteratorHelperLoose(((_game$spatial9 = game.spatial) == null || _game$spatial9.queryRect == null ? void 0 : _game$spatial9.queryRect(player.x, player.y, radius)) || game.enemies), _step43; !(_step43 = _iterator43()).done;) {
            var _game$spatial9;
            var enemy = _step43.value;
            if (!enemy || enemy.hp <= 0 || Math.hypot(enemy.x - player.x, enemy.y - player.y) > radius + enemyHitRadius(enemy)) continue;
            enemy.takeDamage(132 * player.getDamageMult());
            hits++;
          }
          player.heal == null || player.heal(Math.min(player.maxHp * 0.35, hits * 4));
          player.invincible = true;
          player.invincibleTimer = Math.max(player.invincibleTimer || 0, 1.2);
          (_game$combatVisuals18 = game.combatVisuals) == null || _game$combatVisuals18.field == null || _game$combatVisuals18.field(player.x, player.y, radius, "blood", {
            fused: true
          });
          game._announce == null || game._announce("\u767E\u9B3C\u5165\u8179");
          this._syncUi();
          return true;
        };
        _proto15._useStarUltimate = function _useStarUltimate() {
          var _game$combatVisuals19;
          var game = this.game;
          var player = game.player;
          this.ultimateEnergy = 0;
          var targets = (game.enemies || []).filter(function (enemy) {
            return enemy.hp > 0;
          }).sort(function (a, b) {
            return Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y);
          }).slice(0, 12);
          for (var _iterator44 = _createForOfIteratorHelperLoose(targets), _step44; !(_step44 = _iterator44()).done;) {
            var enemy = _step44.value;
            enemy.takeDamage(150 * player.getDamageMult());
          }
          (_game$combatVisuals19 = game.combatVisuals) == null || _game$combatVisuals19.lightning == null || _game$combatVisuals19.lightning([{
            x: player.x,
            y: player.y
          }].concat(targets.map(function (enemy) {
            return {
              x: enemy.x,
              y: enemy.y
            };
          })));
          game._announce == null || game._announce("\u4E09\u57A3\u5760\u843D");
          this._syncUi();
          return true;
        };
        _proto15._ultimatePulse = function _ultimatePulse(index) {
          var _game$spatial10, _game$effects6;
          var game = this.game;
          var player = game == null ? void 0 : game.player;
          if (!player || player.dead) return;
          var radius = 420 + index * 70;
          var candidates = (_game$spatial10 = game.spatial) != null && _game$spatial10.queryRect ? game.spatial.queryRect(player.x, player.y, radius) : game.enemies || [];
          var damage = 95 * player.getDamageMult();
          for (var _iterator45 = _createForOfIteratorHelperLoose(candidates), _step45; !(_step45 = _iterator45()).done;) {
            var _game$effects7;
            var enemy = _step45.value;
            if (!enemy || enemy.hp <= 0) continue;
            if (Math.hypot(enemy.x - player.x, enemy.y - player.y) > radius + enemyHitRadius(enemy)) continue;
            enemy.takeDamage(damage);
            (_game$effects7 = game.effects) == null || _game$effects7.hit == null || _game$effects7.hit(enemy.x, enemy.y, "205,145,255");
          }
          (_game$effects6 = game.effects) == null || (_game$effects6 = _game$effects6.pulses) == null || _game$effects6.emit == null || _game$effects6.emit(player.x, player.y, "190,120,255");
          game.createParticles == null || game.createParticles(player.x, player.y, "#c98cff", 24 + index * 6);
          game.shake == null || game.shake(0.28 + index * 0.08);
        };
        _proto15._resolveDirection = function _resolveDirection() {
          var _this$game21, _this$game22, _this$game23;
          var v = ((_this$game21 = this.game) == null ? void 0 : _this$game21._lastMoveVec) || {
            x: 0,
            y: 0
          };
          var mag = Math.hypot(v.x, v.y);
          if (mag > 0.1) return {
            x: v.x / mag,
            y: v.y / mag
          };
          var player = (_this$game22 = this.game) == null ? void 0 : _this$game22.player;
          var nearest = player ? (_this$game23 = this.game) == null || (_this$game23 = _this$game23.spatial) == null || _this$game23.findNearestEnemy == null ? void 0 : _this$game23.findNearestEnemy(player.x, player.y, 900) : null;
          if (nearest) {
            var dx = nearest.x - player.x;
            var dy = nearest.y - player.y;
            var d = Math.hypot(dx, dy) || 1;
            return {
              x: dx / d,
              y: dy / d
            };
          }
          return {
            x: 1,
            y: 0
          };
        };
        _proto15._syncUi = function _syncUi() {
          var _this$game24;
          (_this$game24 = this.game) == null || (_this$game24 = _this$game24.ui) == null || _this$game24.updateHeroAbilities == null || _this$game24.updateHeroAbilities(this.getSnapshot());
        };
        return QingfengSkillController;
      }());

      // prototype-2d-pixel/src/field-contours.js
      function exposedCircleArcs(circle, others) {
        var tau = Math.PI * 2,
          covered = [];
        for (var _iterator46 = _createForOfIteratorHelperLoose(others), _step46; !(_step46 = _iterator46()).done;) {
          var other = _step46.value;
          if (other === circle) continue;
          var dx = other.x - circle.x,
            dy = other.y - circle.y;
          var d = Math.hypot(dx, dy),
            r = circle.radius,
            R = other.radius;
          if (d < 1e-7 && Math.abs(r - R) < 1e-7) {
            if (others.indexOf(other) < others.indexOf(circle)) return [];
            continue;
          }
          if (d + r <= R) return [];
          if (d >= r + R || d + R <= r) continue;
          var a = (Math.atan2(dy, dx) + tau) % tau;
          var spread = Math.acos(Math.max(-1, Math.min(1, (r * r + d * d - R * R) / (2 * r * d))));
          var _lo = a - spread,
            _hi = a + spread;
          if (_lo < 0) covered.push([0, _hi], [_lo + tau, tau]);else if (_hi > tau) covered.push([_lo, tau], [0, _hi - tau]);else covered.push([_lo, _hi]);
        }
        covered.sort(function (a, b) {
          return a[0] - b[0];
        });
        var visible = [];
        var end = 0;
        for (var _i12 = 0, _covered = covered; _i12 < _covered.length; _i12++) {
          var _covered$_i = _covered[_i12],
            lo = _covered$_i[0],
            hi = _covered$_i[1];
          if (lo > end) visible.push([end, lo]);
          end = Math.max(end, hi);
        }
        if (end < tau) visible.push([end, tau]);
        return visible;
      }
      function fieldContours(items) {
        var groups = /* @__PURE__ */new Map(),
          result = /* @__PURE__ */new Map();
        for (var _iterator47 = _createForOfIteratorHelperLoose(items), _step47; !(_step47 = _iterator47()).done;) {
          var item = _step47.value;
          if (!["field", "fire"].includes(item.type)) continue;
          var key = (item.type === "fire" ? "fire" : item.element) + ":" + !!item.fused;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(item);
        }
        for (var _iterator48 = _createForOfIteratorHelperLoose(groups.values()), _step48; !(_step48 = _iterator48()).done;) {
          var group = _step48.value;
          for (var _iterator49 = _createForOfIteratorHelperLoose(group), _step49; !(_step49 = _iterator49()).done;) {
            var _item = _step49.value;
            result.set(_item.key || _item, exposedCircleArcs(_item, group));
          }
        }
        return result;
      }

      // prototype-2d-pixel/src/combat-visuals.js
      var isGroundVisual = function isGroundVisual(item) {
        return ["fire", "field", "frost"].includes(item.type) || item.type === "sword" && item.fullCircle;
      };
      function fieldFillOpacity(count, base) {
        if (count === void 0) {
          count = 1;
        }
        if (base === void 0) {
          base = 0.2;
        }
        return Math.min(base, 0.2 / Math.max(1, count));
      }
      var CombatVisualLayer = exports('CombatVisualLayer', /*#__PURE__*/function () {
        function CombatVisualLayer() {
          this.items = [];
          this.max = 80;
        }
        var _proto16 = CombatVisualLayer.prototype;
        _proto16.reset = function reset() {
          this.items = [];
        };
        _proto16.wave = function wave(x, y, angle, range, _temp3) {
          var _ref8 = _temp3 === void 0 ? {} : _temp3,
            _ref8$fused = _ref8.fused,
            fused = _ref8$fused === void 0 ? false : _ref8$fused,
            _ref8$count = _ref8.count,
            count = _ref8$count === void 0 ? 2 : _ref8$count;
          this._push({
            type: "wave",
            x: x,
            y: y,
            angle: angle,
            range: range,
            fused: fused,
            count: count,
            life: 0.34,
            maxLife: 0.34
          });
        };
        _proto16.swordSweep = function swordSweep(x, y, range, _temp4) {
          var _ref9 = _temp4 === void 0 ? {} : _temp4,
            _ref9$fused = _ref9.fused,
            fused = _ref9$fused === void 0 ? false : _ref9$fused,
            _ref9$fullCircle = _ref9.fullCircle,
            fullCircle = _ref9$fullCircle === void 0 ? false : _ref9$fullCircle,
            _ref9$angle = _ref9.angle,
            angle = _ref9$angle === void 0 ? 0 : _ref9$angle;
          this._push({
            type: "sword",
            x: x,
            y: y,
            range: range,
            fused: fused,
            fullCircle: fullCircle,
            angle: angle,
            life: 0.42,
            maxLife: 0.42
          });
        };
        _proto16.slashCorridor = function slashCorridor(x1, y1, x2, y2, width, _temp5) {
          if (width === void 0) {
            width = 58;
          }
          var _ref10 = _temp5 === void 0 ? {} : _temp5,
            _ref10$fused = _ref10.fused,
            fused = _ref10$fused === void 0 ? false : _ref10$fused;
          this._push({
            type: "slash-corridor",
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            width: width,
            fused: fused,
            life: 0.48,
            maxLife: 0.48
          });
        };
        _proto16.talismans = function talismans(x, y, targets, _temp6) {
          var _ref11 = _temp6 === void 0 ? {} : _temp6,
            _ref11$fire = _ref11.fire,
            fire = _ref11$fire === void 0 ? false : _ref11$fire,
            _ref11$fused = _ref11.fused,
            fused = _ref11$fused === void 0 ? false : _ref11$fused;
          if (!(targets != null && targets.length)) return;
          this._push({
            type: "talismans",
            x: x,
            y: y,
            targets: targets,
            fire: fire,
            fused: fused,
            life: 0.58,
            maxLife: 0.58
          });
        };
        _proto16.firePatch = function firePatch(x, y, radius, duration, _temp7) {
          if (duration === void 0) {
            duration = 1.6;
          }
          var _ref12 = _temp7 === void 0 ? {} : _temp7,
            _ref12$fused = _ref12.fused,
            fused = _ref12$fused === void 0 ? false : _ref12$fused;
          this._push({
            type: "fire",
            x: x,
            y: y,
            radius: radius,
            fused: fused,
            stable: true,
            life: duration,
            maxLife: duration
          });
        };
        _proto16.field = function field(x, y, radius, element, _temp8) {
          if (element === void 0) {
            element = "steam";
          }
          var _ref13 = _temp8 === void 0 ? {} : _temp8,
            _ref13$fused = _ref13.fused,
            fused = _ref13$fused === void 0 ? false : _ref13$fused,
            _ref13$sustained = _ref13.sustained,
            sustained = _ref13$sustained === void 0 ? false : _ref13$sustained,
            _ref13$key = _ref13.key,
            key = _ref13$key === void 0 ? null : _ref13$key,
            _ref13$duration = _ref13.duration,
            duration = _ref13$duration === void 0 ? 0.52 : _ref13$duration;
          var stableKey = sustained ? key || "field:" + element : null;
          if (stableKey) {
            var existing = this.items.find(function (item2) {
              return item2.type === "field" && item2.key === stableKey;
            });
            if (existing) {
              existing.x = x;
              existing.y = y;
              existing.radius = radius;
              existing.element = element;
              existing.fused = fused;
              existing.life = duration;
              existing.maxLife = duration;
              return existing;
            }
          }
          var item = {
            type: "field",
            x: x,
            y: y,
            radius: radius,
            element: element,
            fused: fused,
            stable: sustained,
            key: stableKey,
            life: sustained ? duration : 0.42,
            maxLife: sustained ? duration : 0.42
          };
          this._push(item);
          return item;
        };
        _proto16.frost = function frost(x, y, radius, _temp9) {
          var _ref14 = _temp9 === void 0 ? {} : _temp9,
            _ref14$fused = _ref14.fused,
            fused = _ref14$fused === void 0 ? false : _ref14$fused,
            _ref14$second = _ref14.second,
            second = _ref14$second === void 0 ? false : _ref14$second;
          this._push({
            type: "frost",
            x: x,
            y: y,
            radius: radius,
            fused: fused,
            second: second,
            life: 0.62,
            maxLife: 0.62
          });
        };
        _proto16.tether = function tether(x1, y1, x2, y2, _temp10) {
          var _ref15 = _temp10 === void 0 ? {} : _temp10,
            _ref15$fused = _ref15.fused,
            fused = _ref15$fused === void 0 ? false : _ref15$fused;
          this._push({
            type: "tether",
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            fused: fused,
            life: 0.24,
            maxLife: 0.24
          });
        };
        _proto16.lightning = function lightning(points, _temp11) {
          var _ref16 = _temp11 === void 0 ? {} : _temp11,
            _ref16$fused = _ref16.fused,
            fused = _ref16$fused === void 0 ? false : _ref16$fused;
          if (!Array.isArray(points) || points.length < 2) return;
          this._push({
            type: "lightning",
            points: points,
            fused: fused,
            life: 0.22,
            maxLife: 0.22
          });
        };
        _proto16.fusionBurst = function fusionBurst(x, y, radius) {
          if (radius === void 0) {
            radius = 140;
          }
          this._push({
            type: "fusion",
            x: x,
            y: y,
            radius: radius,
            life: 0.8,
            maxLife: 0.8
          });
        };
        _proto16.update = function update(dt) {
          for (var i = this.items.length - 1; i >= 0; i -= 1) {
            this.items[i].life -= dt;
            if (this.items[i].life <= 0) this.items.splice(i, 1);
          }
        };
        _proto16.render = function render(ctx, pass) {
          if (pass === void 0) {
            pass = "all";
          }
          this.groundCount = this.items.filter(isGroundVisual).length;
          if (pass !== "foreground") this.contours = fieldContours(this.items);
          for (var _iterator50 = _createForOfIteratorHelperLoose(this.items), _step50; !(_step50 = _iterator50()).done;) {
            var item = _step50.value;
            var ground = isGroundVisual(item);
            if (pass === "ground" && !ground || pass === "foreground" && ground) continue;
            var t = 1 - item.life / item.maxLife;
            var alpha = item.stable ? Math.min(1, Math.max(0, item.life / 0.16)) : Math.max(0, 1 - t);
            ctx.save();
            ctx.globalAlpha = alpha;
            if (item.type === "wave") this._drawWave(ctx, item, t);else if (item.type === "sword") this._drawSword(ctx, item, t);else if (item.type === "slash-corridor") this._drawSlashCorridor(ctx, item, t);else if (item.type === "talismans") this._drawTalismans(ctx, item, t);else if (item.type === "fire") this._drawFire(ctx, item, t);else if (item.type === "field") this._drawField(ctx, item, t);else if (item.type === "frost") this._drawFrost(ctx, item, t);else if (item.type === "tether") this._drawTether(ctx, item, t);else if (item.type === "lightning") this._drawLightning(ctx, item, t);else if (item.type === "fusion") this._drawFusion(ctx, item, t);
            ctx.restore();
          }
        };
        _proto16._push = function _push(item) {
          if (this.items.length >= this.max) this.items.shift();
          this.items.push(item);
        };
        _proto16._strokeFieldBoundary = function _strokeFieldBoundary(ctx, item, radius) {
          var _this$contours;
          var arcs = ((_this$contours = this.contours) == null ? void 0 : _this$contours.get(item.key || item)) || [[0, Math.PI * 2]];
          ctx.beginPath();
          for (var _iterator51 = _createForOfIteratorHelperLoose(arcs), _step51; !(_step51 = _iterator51()).done;) {
            var _step51$value = _step51.value,
              start = _step51$value[0],
              end = _step51$value[1];
            ctx.moveTo(item.x + Math.cos(start) * radius, item.y + Math.sin(start) * radius);
            ctx.arc(item.x, item.y, radius, start, end);
          }
          ctx.stroke();
        };
        _proto16._drawWave = function _drawWave(ctx, item, t) {
          ctx.translate(item.x, item.y);
          ctx.rotate(item.angle);
          var reach = item.range * (0.55 + t * 0.45);
          ctx.strokeStyle = item.fused ? "#ff6aa9" : "#f1d994";
          ctx.lineWidth = item.fused ? 9 : 5;
          ctx.shadowColor = item.fused ? "#b52e78" : "#d7bd70";
          ctx.shadowBlur = item.fused ? 18 : 8;
          for (var i = 0; i < item.count; i += 1) {
            var side = i % 2 === 0 ? -1 : 1;
            ctx.beginPath();
            ctx.arc(side * reach * 0.16, 0, reach * (0.64 + i * 0.08), -0.56, 0.56);
            ctx.stroke();
          }
        };
        _proto16._drawSword = function _drawSword(ctx, item, t) {
          ctx.translate(item.x, item.y);
          if (!item.fullCircle) {
            ctx.rotate(item.angle || 0);
            ctx.fillStyle = item.fused ? "rgba(235,82,160,0.14)" : "rgba(238,216,148,0.14)";
            ctx.fillRect(-item.range, -40, item.range * 2, 80);
            ctx.strokeStyle = item.fused ? "#d779a5" : "#cbb784";
            ctx.lineWidth = 2;
            ctx.strokeRect(-item.range, -40, item.range * 2, 80);
            for (var _i13 = 0, _arr6 = [-1, 1]; _i13 < _arr6.length; _i13++) {
              var direction = _arr6[_i13];
              ctx.save();
              ctx.scale(direction, direction);
              var tip = item.range * (0.85 + 0.15 * t);
              ctx.fillStyle = "#efe9c9";
              ctx.fillRect(10, -3, Math.max(1, tip - 18), 6);
              ctx.beginPath();
              ctx.moveTo(tip, 0);
              ctx.lineTo(tip - 12, -7);
              ctx.lineTo(tip - 12, 7);
              ctx.closePath();
              ctx.fill();
              ctx.fillStyle = "#9a7c48";
              ctx.fillRect(6, -10, 4, 20);
              ctx.strokeStyle = item.fused ? "#d779a5" : "#e3d298";
              ctx.beginPath();
              ctx.moveTo(14, -30);
              ctx.quadraticCurveTo(tip * 0.75, -18, tip, 0);
              ctx.quadraticCurveTo(tip * 0.75, 18, 14, 30);
              ctx.stroke();
              ctx.restore();
            }
            return;
          }
          var sweep = t * Math.PI * 0.9 - Math.PI * 0.45;
          ctx.rotate(sweep);
          var opacity = item.fullCircle ? fieldFillOpacity(this.groundCount, 0.18) : 0.18;
          ctx.fillStyle = item.fused ? "rgba(235,82,160," + opacity + ")" : "rgba(238,216,148," + opacity + ")";
          ctx.beginPath();
          if (item.fullCircle) ctx.arc(0, 0, item.range, 0, Math.PI * 2);else ctx.arc(0, 0, item.range, -0.48, 0.48);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = item.fused ? "#ff6aa9" : "#f5df9a";
          ctx.lineWidth = item.fused ? 8 : 5;
          ctx.beginPath();
          ctx.arc(0, 0, item.range * (0.9 + t * 0.1), item.fullCircle ? 0 : -0.48, item.fullCircle ? Math.PI * 2 : 0.48);
          ctx.stroke();
          ctx.fillStyle = "#f8f1d2";
          ctx.fillRect(8, -3, item.range * 0.72, 6);
          ctx.fillStyle = "#8d6b3e";
          ctx.fillRect(0, -6, 12, 12);
          ctx.beginPath();
          ctx.moveTo(item.range * 0.86, 0);
          ctx.lineTo(item.range * 0.72, -8);
          ctx.lineTo(item.range * 0.72, 8);
          ctx.closePath();
          ctx.fillStyle = "#fff8dc";
          ctx.fill();
        };
        _proto16._drawSlashCorridor = function _drawSlashCorridor(ctx, item, t) {
          var dx = item.x2 - item.x1;
          var dy = item.y2 - item.y1;
          var length = Math.hypot(dx, dy);
          var angle = Math.atan2(dy, dx);
          ctx.translate(item.x1, item.y1);
          ctx.rotate(angle);
          ctx.fillStyle = item.fused ? "rgba(225,76,154,0.2)" : "rgba(121,229,255,0.18)";
          ctx.fillRect(0, -item.width, length, item.width * 2);
          ctx.strokeStyle = item.fused ? "#ff78ba" : "#bdefff";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(0, -item.width);
          ctx.quadraticCurveTo(length * 0.55, -item.width * (1.3 - t), length, 0);
          ctx.quadraticCurveTo(length * 0.55, item.width * (1.3 - t), 0, item.width);
          ctx.stroke();
          ctx.fillStyle = "#effcff";
          ctx.fillRect(length * t - 24, -4, 46, 8);
          ctx.beginPath();
          ctx.moveTo(length * t + 32, 0);
          ctx.lineTo(length * t + 18, -9);
          ctx.lineTo(length * t + 18, 9);
          ctx.closePath();
          ctx.fill();
        };
        _proto16._drawTalismans = function _drawTalismans(ctx, item, t) {
          for (var _iterator52 = _createForOfIteratorHelperLoose(item.targets), _step52; !(_step52 = _iterator52()).done;) {
            var target = _step52.value;
            var x = item.x + (target.x - item.x) * Math.min(1, t * 1.5);
            var y = item.y + (target.y - item.y) * Math.min(1, t * 1.5);
            var angle = Math.atan2(target.y - item.y, target.x - item.x);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = "#ecdca8";
            ctx.fillRect(-13, -6, 26, 12);
            ctx.fillStyle = item.fire ? "#df4f2b" : "#9d2f43";
            ctx.fillRect(-6, -4, 3, 8);
            ctx.fillRect(0, -3, 8, 2);
            ctx.restore();
            if (t > 0.55) {
              ctx.strokeStyle = item.fire ? "#ff6b28" : "#d26d9c";
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(target.x, target.y, 12 + t * 18, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        };
        _proto16._drawFire = function _drawFire(ctx, item, _t) {
          ctx.fillStyle = "rgba(151,28,20," + fieldFillOpacity(this.groundCount, 0.16) + ")";
          ctx.strokeStyle = item.fused ? "#ffdc5d" : "#ff5a31";
          ctx.lineWidth = item.fused ? 3 : 2;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          ctx.fill();
          this._strokeFieldBoundary(ctx, item, item.radius);
          ctx.globalAlpha *= Math.min(1, 3 / Math.max(1, this.groundCount));
          for (var i = 0; i < 12; i += 1) {
            var a = i * 2.399;
            var r = item.radius * (0.18 + i % 4 * 0.2);
            var x = item.x + Math.cos(a) * r;
            var y = item.y + Math.sin(a) * r;
            ctx.fillStyle = i % 2 ? "#ff9a38" : "#e9412c";
            ctx.beginPath();
            ctx.moveTo(x, y - 16 - i % 3 * 5);
            ctx.lineTo(x - 8, y + 7);
            ctx.lineTo(x + 8, y + 7);
            ctx.closePath();
            ctx.fill();
          }
        };
        _proto16._drawField = function _drawField(ctx, item, t) {
          if (item.element === "frost") {
            this._drawFrost(ctx, _extends({}, item, {
              fused: false
            }), 1);
            return;
          }
          if (item.element === "fire") {
            this._drawFire(ctx, item, t);
            return;
          }
          var opacity = fieldFillOpacity(this.groundCount, 0.14);
          var palette = item.element === "ward" ? ["rgba(170,224,178," + opacity + ")", "#8fd8a4"] : item.element === "blood" ? ["rgba(148,24,45," + opacity + ")", "#d94961"] : ["rgba(224,232,218," + opacity + ")", "#d6ded0"];
          var radius = item.stable ? item.radius : item.radius * (0.97 + t * 0.03);
          ctx.fillStyle = palette[0];
          ctx.strokeStyle = item.fused ? "#e6d467" : palette[1];
          ctx.lineWidth = item.fused ? 3 : 2;
          ctx.beginPath();
          ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
          ctx.fill();
          this._strokeFieldBoundary(ctx, item, radius);
          ctx.globalAlpha *= Math.min(1, 3 / Math.max(1, this.groundCount));
          if (item.element === "blade" || item.element === "thunder") {
            ctx.save();
            ctx.translate(item.x, item.y);
            var scale = Math.min(1, radius / 44);
            ctx.scale(scale, scale);
            ctx.strokeStyle = item.element === "blade" ? "#dcebe2" : "#bcd7ff";
            ctx.fillStyle = ctx.strokeStyle;
            ctx.lineWidth = 3;
            if (item.element === "blade") {
              for (var _i14 = 0, _arr7 = [-0.55, 0.55]; _i14 < _arr7.length; _i14++) {
                var angle = _arr7[_i14];
                ctx.save();
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(0, -26);
                ctx.lineTo(-4, -16);
                ctx.lineTo(-2, 14);
                ctx.lineTo(2, 14);
                ctx.lineTo(4, -16);
                ctx.closePath();
                ctx.fill();
                ctx.fillRect(-9, 12, 18, 3);
                ctx.fillRect(-2, 15, 4, 10);
                ctx.restore();
              }
            } else {
              ctx.beginPath();
              for (var i = 0; i <= 8; i++) {
                var _angle = i * Math.PI / 4;
                var r = i % 2 ? 8 : 25;
                if (i === 0) ctx.moveTo(Math.cos(_angle) * r, Math.sin(_angle) * r);else ctx.lineTo(Math.cos(_angle) * r, Math.sin(_angle) * r);
              }
              ctx.closePath();
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(7, -17);
              ctx.lineTo(-4, 0);
              ctx.lineTo(5, 0);
              ctx.lineTo(-7, 17);
              ctx.stroke();
            }
            ctx.restore();
            return;
          }
          for (var _i15 = 0; _i15 < 10; _i15 += 1) {
            var a = _i15 * 2.399;
            var _r = radius * (_i15 % 4 / 4);
            ctx.fillStyle = item.element === "blood" ? _i15 % 2 ? "#ff9b9b" : "#8f183b" : _i15 % 2 ? "#e8efe6" : "#91b9a1";
            ctx.fillRect(item.x + Math.cos(a) * _r - 3, item.y + Math.sin(a) * _r - 3, 6, 6);
          }
        };
        _proto16._drawFrost = function _drawFrost(ctx, item, t) {
          var radius = item.radius * (0.35 + t * 0.65);
          ctx.strokeStyle = item.fused ? "#d8b7ff" : "#a9e7ff";
          ctx.lineWidth = item.fused ? 3 : item.second ? 2 : 3;
          this._strokeFieldBoundary(ctx, item, radius);
          ctx.globalAlpha *= Math.min(1, 3 / Math.max(1, this.groundCount));
          for (var i = 0; i < 16; i += 1) {
            var a = i / 16 * Math.PI * 2;
            var x = item.x + Math.cos(a) * radius;
            var y = item.y + Math.sin(a) * radius;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(a);
            ctx.fillStyle = item.fused ? "#eadcff" : "#d7f5ff";
            ctx.fillRect(-2, -8, 4, 16);
            ctx.fillRect(-7, -2, 14, 4);
            ctx.restore();
          }
        };
        _proto16._drawTether = function _drawTether(ctx, item, t) {
          ctx.strokeStyle = item.fused ? "#ff7fb7" : "#c84d83";
          ctx.lineWidth = item.fused ? 7 : 4;
          ctx.beginPath();
          ctx.moveTo(item.x1, item.y1);
          var mx = (item.x1 + item.x2) / 2;
          var my = (item.y1 + item.y2) / 2 - Math.sin(t * Math.PI) * 18;
          ctx.quadraticCurveTo(mx, my, item.x2, item.y2);
          ctx.stroke();
          ctx.fillStyle = "#ffd4e5";
          ctx.fillRect(item.x2 - 5, item.y2 - 5, 10, 10);
        };
        _proto16._drawLightning = function _drawLightning(ctx, item) {
          ctx.strokeStyle = item.fused ? "#f4c7ff" : "#fff176";
          ctx.lineWidth = item.fused ? 6 : 3;
          ctx.shadowColor = item.fused ? "#c56bf0" : "#e5cf4b";
          ctx.shadowBlur = item.fused ? 18 : 10;
          ctx.beginPath();
          ctx.moveTo(item.points[0].x, item.points[0].y);
          for (var i = 1; i < item.points.length; i += 1) {
            var from = item.points[i - 1];
            var to = item.points[i];
            var mx = (from.x + to.x) / 2 + (i % 2 ? 12 : -12);
            var my = (from.y + to.y) / 2 + (i % 2 ? -8 : 8);
            ctx.lineTo(mx, my);
            ctx.lineTo(to.x, to.y);
          }
          ctx.stroke();
        };
        _proto16._drawFusion = function _drawFusion(ctx, item, t) {
          var radius = item.radius * (0.25 + t * 0.75);
          ctx.strokeStyle = "#e7b5ff";
          ctx.lineWidth = 8;
          ctx.shadowColor = "#c23baf";
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.rotate(t * 1.5);
          ctx.strokeStyle = "#f0d170";
          ctx.lineWidth = 3;
          ctx.strokeRect(item.x - radius * 0.55, item.y - radius * 0.55, radius * 1.1, radius * 1.1);
        };
        return CombatVisualLayer;
      }());

      // prototype-2d-pixel/src/enemy-animation.js
      var ENEMY_WALK_ASSETS = Object.freeze({
        forest: "./assets/enemies/forest-walk-v1.png",
        crypt: "./assets/enemies/crypt-walk-v1.png",
        tundra: "./assets/enemies/tundra-walk-v1.png"
      });
      function updateEnemyAnimation(enemy, dt, reducedMotion) {
        var _enemy$prevX, _enemy$prevY, _enemy$walkPhase;
        if (reducedMotion === void 0) {
          reducedMotion = false;
        }
        var dx = enemy.x - ((_enemy$prevX = enemy.prevX) != null ? _enemy$prevX : enemy.x);
        var distance = Math.hypot(dx, enemy.y - ((_enemy$prevY = enemy.prevY) != null ? _enemy$prevY : enemy.y));
        if (Math.abs(dx) > 0.05) enemy.walkFacing = dx < 0 ? -1 : 1;
        enemy.walkFacing || (enemy.walkFacing = -1);
        if (reducedMotion || enemy.hp <= 0 || enemy.cast || !Number.isFinite(distance) || distance < 0.01 || !(dt > 0)) {
          enemy.walkFrame = 1;
          return;
        }
        (_enemy$walkPhase = enemy.walkPhase) != null ? _enemy$walkPhase : enemy.walkPhase = Math.abs(enemy.x * 13 + enemy.y * 7) % 97 / 97 * 4;
        enemy.walkPhase = (enemy.walkPhase + Math.min(distance / 24, Math.min(dt, 0.05) * 6)) % 4;
        enemy.walkFrame = Math.floor(enemy.walkPhase);
      }

      // prototype-2d-pixel/src/combat-steps.js
      function updateEnemies(dt, hpMult, dmgMult) {
        var currentEnemies = this.enemies;
        for (var i = currentEnemies.length - 1; i >= 0; i--) {
          var _this$interactions, _this$save;
          var e = currentEnemies[i];
          e.update(dt, this);
          this.worldMap.resolveEntity(e);
          (_this$interactions = this.interactions) == null || _this$interactions.resolveEntity(e);
          updateEnemyAnimation(e, dt, ((_this$save = this.save) == null || (_this$save = _this$save.settings) == null ? void 0 : _this$save.reducedMotion) || heroPrefersReducedMotion());
          var dx = e.x - this.player.x;
          var dy = e.y - this.player.y;
          var d = Math.hypot(dx, dy);
          if (e.hp > 0 && d < enemyHitRadius(e) + this.player.size && !this.player.invincible) {
            this.player.takeDamage(e.damage, this, enemyDamageSource(e));
            this.createFloatingText(Math.round(e.damage), this.player.x, this.player.y - 30, "#ff3333");
          }
          if (e.hp <= 0) {
            currentEnemies.splice(i, 1);
            this._onEnemyKilled(e, hpMult, dmgMult);
            if (this.enemies !== currentEnemies) return;
            continue;
          }
          if (d > CONFIG.DESPAWN_RADIUS && !e.boss) {
            this.enemies.splice(i, 1);
          }
        }
      }
      function updateProjectiles(dt) {
        for (var i = this.projectiles.length - 1; i >= 0; i--) {
          var p = this.projectiles[i];
          p.update(dt, this);
          if (p.shouldRemove) {
            this.projectiles.splice(i, 1);
            continue;
          }
          var range = p.size + 80;
          for (var _iterator53 = _createForOfIteratorHelperLoose(this.spatial.queryRect(p.x, p.y, range)), _step53; !(_step53 = _iterator53()).done;) {
            var enemy = _step53.value;
            if (enemy.hp <= 0 || p.hitEnemies.has(enemy)) continue;
            var d = Math.hypot(p.x - enemy.x, p.y - enemy.y);
            if (d < enemyHitRadius(enemy) + p.size) {
              var _p$def;
              var dmg = p.damage;
              var chance = this.player.getCritChance();
              var crit = chance > 0 && Math.random() < chance;
              if (crit) dmg *= 2;
              enemy.takeDamage(dmg);
              this.reactions.applyHit(enemy, (_p$def = p.def) == null ? void 0 : _p$def.element, dmg);
              p.hitEnemies.add(enemy);
              var retargeted = p.onFusionHit == null ? void 0 : p.onFusionHit(enemy, this);
              if (enemy.hp > 0) {
                this.createFloatingText(Math.round(dmg), enemy.x, enemy.y - 20, crit ? "#ffee44" : "#fff", {
                  crit: crit
                });
              }
              if (crit && this.save.settings.criticalFlash !== false && !this.save.settings.reducedMotion) {
                this.effects.criticalHit(enemy.x, enemy.y);
              } else {
                this.effects.hit(enemy.x, enemy.y);
              }
              if (retargeted) break;
              if (!p.piercing) {
                p._onEnd(this);
                p.shouldRemove = true;
                break;
              }
            }
          }
        }
      }
      function updateEnemyProjectiles(dt) {
        for (var i = this.enemyProjectiles.length - 1; i >= 0; i--) {
          var ep = this.enemyProjectiles[i];
          if (ep.shouldRemove) {
            this.enemyProjectiles.splice(i, 1);
            continue;
          }
          ep.update(dt, this);
          if (ep.shouldRemove) this.enemyProjectiles.splice(i, 1);
        }
      }
      function updateMines(dt) {
        for (var i = this.mines.length - 1; i >= 0; i--) {
          var m = this.mines[i];
          m.update(dt, this);
          if (m.shouldRemove) this.mines.splice(i, 1);
        }
      }
      function updateExpOrbs(dt) {
        var _this$run, _this$tutorial;
        var before = ((_this$run = this.run) == null ? void 0 : _this$run.orbsCollected) || 0;
        for (var i = this.expOrbs.length - 1; i >= 0; i--) {
          var o = this.expOrbs[i];
          o.update(dt, this);
          if (o.shouldRemove) this.expOrbs.splice(i, 1);
        }
        if ((_this$tutorial = this.tutorial) != null && _this$tutorial.active) {
          var _this$run2;
          var after = ((_this$run2 = this.run) == null ? void 0 : _this$run2.orbsCollected) || 0;
          for (var k = 0; k < after - before; k++) {
            this.tutorial.notifyOrbPickup();
          }
          if (after !== before) this._renderTutorialBanner();
        }
      }

      // prototype-2d-pixel/src/level-rewards.js
      var LEVEL_REWARDS = Object.freeze({
        recover: Object.freeze({
          id: "recover",
          name: "\u8C03\u606F\u517B\u5143",
          description: "\u6062\u590D\u6700\u5927\u751F\u547D\u7684 20%\uFF0C\u53D7\u6CBB\u7597\u6548\u679C\u52A0\u6210\uFF1B\u4E0D\u8D85\u8FC7\u751F\u547D\u4E0A\u9650\u3002"
        }),
        coins: Object.freeze({
          id: "coins",
          name: "\u7EB3\u4F59\u6210\u91D1",
          description: "\u83B7\u5F97 12 \u679A\u5C40\u5185\u94DC\u94B1\u3002\u672C\u6B21\u4E0D\u589E\u52A0\u5C5E\u6027\uFF0C\u4E5F\u4E0D\u53D1\u653E\u5C40\u5916\u8D27\u5E01\u3002"
        })
      });
      function liveUpgradePool(player) {
        var pool = [];
        var _loop3 = function _loop3() {
          var def = _Object$values2[_i17];
          var owned = player.weapons.find(function (w) {
            return w.id === def.id;
          });
          if (owned ? owned.level < CONFIG.WEAPON_MAX_LEVEL : player.weapons.length < CONFIG.MAX_WEAPONS) pool.push({
            type: "weapon",
            data: def
          });
        };
        for (var _i17 = 0, _Object$values2 = Object.values(WEAPONS); _i17 < _Object$values2.length; _i17++) {
          _loop3();
        }
        for (var _i18 = 0, _Object$values3 = Object.values(PASSIVES); _i18 < _Object$values3.length; _i18++) {
          var def = _Object$values3[_i18];
          var owned = player.passives[def.id];
          if (owned ? owned.count < CONFIG.PASSIVE_MAX_STACK : Object.keys(player.passives).length < CONFIG.MAX_PASSIVES) pool.push({
            type: "passive",
            data: def
          });
        }
        return pool;
      }
      function levelChoices(player, random) {
        if (random === void 0) {
          random = Math.random;
        }
        var pool = liveUpgradePool(player),
          picks = [];
        while (picks.length < 3 && pool.length) {
          picks.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
        }
        if (picks.length < 3 && player.hp < player.maxHp) picks.push({
          type: "reward",
          data: LEVEL_REWARDS.recover
        });
        if (picks.length < 3) picks.push({
          type: "reward",
          data: LEVEL_REWARDS.coins
        });
        return picks;
      }
      function applyLevelReward(game, id) {
        if (id === "recover") {
          var before = game.player.hp;
          game.player.heal(game.player.maxHp * 0.2);
          return {
            healed: game.player.hp - before,
            coins: 0
          };
        }
        if (id === "coins") {
          game.runCoins += 12;
          return {
            healed: 0,
            coins: 12
          };
        }
        return null;
      }

      // prototype-2d-pixel/src/endless-run.js
      var ENDLESS_MILESTONES = Object.freeze([1200, 1800, 2700]);
      var ENDLESS_CYCLE_INTERVAL = 900;
      var ENDLESS_AFFIXES = Object.freeze([{
        id: "iron",
        name: "\u7384\u7532",
        description: "\u751F\u547D\u589E\u52A0 25%",
        hp: 1.25,
        damage: 1,
        speed: 1,
        interval: 1
      }, {
        id: "frenzy",
        name: "\u75BE\u715E",
        description: "\u79FB\u52A8\u589E\u52A0 18%\uFF0C\u6280\u80FD\u95F4\u9694\u7F29\u77ED 20%",
        hp: 1,
        damage: 1,
        speed: 1.18,
        interval: 0.8
      }, {
        id: "blood",
        name: "\u8840\u795F",
        description: "\u4F24\u5BB3\u589E\u52A0 20%",
        hp: 1,
        damage: 1.2,
        speed: 1,
        interval: 1
      }]);
      function endlessBossAt(index) {
        var _ENDLESS_MILESTONES$i;
        return (_ENDLESS_MILESTONES$i = ENDLESS_MILESTONES[index]) != null ? _ENDLESS_MILESTONES$i : 3600 + Math.max(0, index - 3) * ENDLESS_CYCLE_INTERVAL;
      }
      function endlessBossDefinition(stageId, index) {
        var stages = {
          forest: [BOSSES.REAPER, BOSSES.VOID_LORD, BOSSES.CHRONO_LICH],
          crypt: [BOSSES.NECROMANCER, BOSSES.REAPER, BOSSES.CHRONO_LICH],
          tundra: [BOSSES.REAPER, BOSSES.ICE_QUEEN, BOSSES.CHRONO_LICH]
        };
        var roster = stages[stageId] || stages.forest;
        var base = roster[index % roster.length];
        var cycle = Math.max(0, index - 2);
        var affix = cycle ? ENDLESS_AFFIXES[(cycle - 1) % ENDLESS_AFFIXES.length] : null;
        var growth = Math.min(4, 1 + cycle * 0.12);
        return _extends({}, base, {
          name: "" + base.name + (affix ? " \xB7 " + affix.name : ""),
          spawnAt: endlessBossAt(index),
          endlessIndex: index,
          endlessKey: "endless:" + index,
          affix: affix,
          hp: Math.round(base.hp * growth * ((affix == null ? void 0 : affix.hp) || 1)),
          damage: base.damage * Math.min(2, 1 + cycle * 0.04) * ((affix == null ? void 0 : affix.damage) || 1),
          speed: base.speed * ((affix == null ? void 0 : affix.speed) || 1),
          abilityInterval: (base.ability === "summon" ? 6 : 4.5) * ((affix == null ? void 0 : affix.interval) || 1)
        });
      }
      function endlessDifficultyScales(gameTime) {
        if (gameTime === void 0) {
          gameTime = 0;
        }
        var seconds = Math.max(0, Number(gameTime) || 0);
        return {
          hp: Math.min(30, 1 + seconds / 600),
          damage: Math.min(8, 1 + seconds / 900)
        };
      }
      var EndlessRun = exports('EndlessRun', /*#__PURE__*/function () {
        function EndlessRun(snapshot) {
          if (snapshot === void 0) {
            snapshot = null;
          }
          this.restore(snapshot);
        }
        var _proto17 = EndlessRun.prototype;
        _proto17.restore = function restore(snapshot) {
          this.nextIndex = Math.max(0, Math.floor(Number(snapshot == null ? void 0 : snapshot.nextIndex) || 0));
          this.activeIndex = (snapshot == null ? void 0 : snapshot.activeIndex) === this.nextIndex ? this.nextIndex : null;
          this.pendingDecision = !!(snapshot != null && snapshot.pendingDecision) && this.nextIndex >= 3;
          this.lastCheckpoint = Math.max(0, Number(snapshot == null ? void 0 : snapshot.lastCheckpoint) || 0);
          this.warnedIndex = null;
          this.savedBoss = (snapshot == null ? void 0 : snapshot.boss) || null;
        };
        _proto17.nextDefinition = function nextDefinition(stageId) {
          return endlessBossDefinition(stageId, this.nextIndex);
        };
        _proto17.defeat = function defeat(definition) {
          if ((definition == null ? void 0 : definition.endlessIndex) !== this.activeIndex || this.activeIndex == null) return false;
          var index = this.activeIndex;
          this.activeIndex = null;
          this.savedBoss = null;
          this.nextIndex = index + 1;
          if (index >= 2) {
            this.pendingDecision = true;
            this.lastCheckpoint = endlessBossAt(index);
          }
          return true;
        };
        _proto17.continueRun = function continueRun() {
          this.pendingDecision = false;
        };
        _proto17.snapshot = function snapshot(enemies) {
          var _this8 = this;
          if (enemies === void 0) {
            enemies = [];
          }
          var boss = enemies.find(function (enemy) {
            var _enemy$type3;
            return ((_enemy$type3 = enemy.type) == null ? void 0 : _enemy$type3.endlessIndex) === _this8.activeIndex && enemy.hp > 0;
          });
          return {
            nextIndex: this.nextIndex,
            activeIndex: this.activeIndex,
            pendingDecision: this.pendingDecision,
            lastCheckpoint: this.lastCheckpoint,
            boss: boss ? {
              x: boss.x,
              y: boss.y,
              hp: boss.hp,
              maxHp: boss.maxHp,
              damage: boss.damage,
              abilityTimer: boss.abilityTimer,
              cast: boss.cast ? clonePlainState(boss.cast) : null
            } : this.savedBoss
          };
        };
        return EndlessRun;
      }());

      // prototype-2d-pixel/src/collision.js
      function resolveCircleObstacle(entity, obstacle) {
        if (!entity || !obstacle) return false;
        var radius = (entity.size || 14) + (obstacle.radius || 0);
        var dx = entity.x - obstacle.x;
        var dy = entity.y - obstacle.y;
        var distance = Math.hypot(dx, dy);
        if (distance >= radius) return false;
        var oldX = Number.isFinite(entity.prevX) ? entity.prevX : entity.x;
        var oldY = Number.isFinite(entity.prevY) ? entity.prevY : entity.y;
        var clears = function clears(x, y) {
          return Math.hypot(x - obstacle.x, y - obstacle.y) >= radius;
        };
        if (clears(entity.x, oldY)) {
          entity.y = oldY;
        } else if (clears(oldX, entity.y)) {
          entity.x = oldX;
        } else if (clears(oldX, oldY)) {
          entity.x = oldX;
          entity.y = oldY;
        } else {
          var safeDistance = distance || 1;
          var safeDx = distance ? dx : 1;
          var safeDy = distance ? dy : 0;
          entity.x = obstacle.x + safeDx / safeDistance * radius;
          entity.y = obstacle.y + safeDy / safeDistance * radius;
        }
        return true;
      }
      function resolveRectObstacle(entity, box) {
        if (!entity || !box) return false;
        var r = entity.size || 14;
        var clear = function clear(x, y) {
          return Math.hypot(x - Math.max(box.left, Math.min(box.right, x)), y - Math.max(box.top, Math.min(box.bottom, y))) >= r;
        };
        if (clear(entity.x, entity.y)) return false;
        var oldX = Number.isFinite(entity.prevX) ? entity.prevX : entity.x;
        var oldY = Number.isFinite(entity.prevY) ? entity.prevY : entity.y;
        if (clear(entity.x, oldY)) entity.y = oldY;else if (clear(oldX, entity.y)) entity.x = oldX;else if (clear(oldX, oldY)) {
          entity.x = oldX;
          entity.y = oldY;
        } else {
          var edges = [{
            x: box.left - r,
            y: entity.y
          }, {
            x: box.right + r,
            y: entity.y
          }, {
            x: entity.x,
            y: box.top - r
          }, {
            x: entity.x,
            y: box.bottom + r
          }].sort(function (a, b) {
            return Math.hypot(a.x - entity.x, a.y - entity.y) - Math.hypot(b.x - entity.x, b.y - entity.y);
          });
          entity.x = edges[0].x;
          entity.y = edges[0].y;
        }
        return true;
      }
      function segmentRectHit(ax, ay, bx, by, box, radius) {
        if (radius === void 0) {
          radius = 0;
        }
        var enter = 0,
          leave = 1;
        for (var _i19 = 0, _arr8 = [[ax, bx - ax, box.left - radius, box.right + radius], [ay, by - ay, box.top - radius, box.bottom + radius]]; _i19 < _arr8.length; _i19++) {
          var _arr8$_i = _arr8[_i19],
            a = _arr8$_i[0],
            delta = _arr8$_i[1],
            min = _arr8$_i[2],
            max = _arr8$_i[3];
          if (Math.abs(delta) < 1e-9) {
            if (a < min || a > max) return null;
          } else {
            var t0 = (min - a) / delta,
              t1 = (max - a) / delta;
            enter = Math.max(enter, Math.min(t0, t1));
            leave = Math.min(leave, Math.max(t0, t1));
            if (enter > leave) return null;
          }
        }
        return {
          t: enter,
          x: ax + (bx - ax) * enter,
          y: ay + (by - ay) * enter
        };
      }

      // prototype-2d-pixel/src/effects.js
      var ScreenFlash = /*#__PURE__*/function () {
        function ScreenFlash() {
          this.color = "rgba(255,255,255,0)";
          this.alpha = 0;
          this.decay = 3;
        }
        var _proto18 = ScreenFlash.prototype;
        _proto18.flash = function flash(color, intensity, decay) {
          if (color === void 0) {
            color = "255,255,255";
          }
          if (intensity === void 0) {
            intensity = 0.4;
          }
          if (decay === void 0) {
            decay = 3;
          }
          this.color = color;
          this.alpha = Math.max(this.alpha, intensity);
          this.decay = decay;
        };
        _proto18.update = function update(dt) {
          if (this.alpha > 0) {
            this.alpha -= this.decay * dt;
            if (this.alpha < 0) this.alpha = 0;
          }
        };
        _proto18.render = function render(ctx, w, h) {
          if (this.alpha <= 0) return;
          ctx.save();
          ctx.globalAlpha = this.alpha;
          ctx.fillStyle = "rgb(" + this.color + ")";
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        };
        return ScreenFlash;
      }();
      var RingPulse = /*#__PURE__*/function () {
        function RingPulse() {
          this.pulses = [];
        }
        var _proto19 = RingPulse.prototype;
        _proto19.emit = function emit(x, y, color) {
          if (color === void 0) {
            color = "255,210,77";
          }
          this.pulses.push({
            x: x,
            y: y,
            color: color,
            r: 10,
            life: 1
          });
        };
        _proto19.update = function update(dt) {
          for (var i = this.pulses.length - 1; i >= 0; i--) {
            var p = this.pulses[i];
            p.r += 220 * dt;
            p.life -= 1.5 * dt;
            if (p.life <= 0) this.pulses.splice(i, 1);
          }
        };
        _proto19.render = function render(ctx) {
          for (var _iterator54 = _createForOfIteratorHelperLoose(this.pulses), _step54; !(_step54 = _iterator54()).done;) {
            var p = _step54.value;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.strokeStyle = "rgb(" + p.color + ")";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        };
        return RingPulse;
      }();
      var HitBursts = /*#__PURE__*/function () {
        function HitBursts() {
          this.bursts = [];
          this.max = 40;
        }
        var _proto20 = HitBursts.prototype;
        _proto20.emit = function emit(x, y, color) {
          if (color === void 0) {
            color = "255,255,255";
          }
          if (this.bursts.length >= this.max) this.bursts.shift();
          this.bursts.push({
            x: x,
            y: y,
            color: color,
            r: 2,
            life: 0.25
          });
        };
        _proto20.update = function update(dt) {
          for (var i = this.bursts.length - 1; i >= 0; i--) {
            var b = this.bursts[i];
            b.r += 160 * dt;
            b.life -= 5 * dt;
            if (b.life <= 0) this.bursts.splice(i, 1);
          }
        };
        _proto20.render = function render(ctx) {
          for (var _iterator55 = _createForOfIteratorHelperLoose(this.bursts), _step55; !(_step55 = _iterator55()).done;) {
            var b = _step55.value;
            ctx.save();
            ctx.globalAlpha = Math.max(0, b.life);
            ctx.strokeStyle = "rgb(" + b.color + ")";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        };
        return HitBursts;
      }();
      var EmojiRain = /*#__PURE__*/function () {
        function EmojiRain() {
          this.drops = [];
          this.max = 60;
          this.glyphs = ["\uD83C\uDF89", "\uD83C\uDF8A", "\u2728", "\u2B50", "\uD83C\uDFC6", "\uD83E\uDD73"];
        }
        /** Spit a fresh batch of `count` emoji from the top of the screen. */
        var _proto21 = EmojiRain.prototype;
        _proto21.burst = function burst(width, height, count) {
          if (count === void 0) {
            count = 24;
          }
          var w = Number.isFinite(width) && width > 0 ? width : 1200;
          var h = Number.isFinite(height) && height > 0 ? height : 800;
          for (var i = 0; i < count; i++) {
            if (this.drops.length >= this.max) break;
            this.drops.push({
              x: Math.random() * w,
              y: -20 - Math.random() * h * 0.5,
              vx: (Math.random() - 0.5) * 60,
              vy: 80 + Math.random() * 120,
              rot: Math.random() * Math.PI * 2,
              vrot: (Math.random() - 0.5) * 2,
              size: 22 + Math.random() * 14,
              glyph: this.glyphs[Math.floor(Math.random() * this.glyphs.length)],
              life: 5 + Math.random() * 3
            });
          }
        };
        _proto21.update = function update(dt, height) {
          var h = Number.isFinite(height) && height > 0 ? height : 800;
          for (var i = this.drops.length - 1; i >= 0; i--) {
            var d = this.drops[i];
            d.x += d.vx * dt;
            d.y += d.vy * dt;
            d.vy += 80 * dt;
            d.rot += d.vrot * dt;
            d.life -= dt;
            if (d.life <= 0 || d.y > h + 40) this.drops.splice(i, 1);
          }
        };
        _proto21.render = function render(ctx) {
          if (!this.drops.length || !ctx) return;
          ctx.save();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          for (var _iterator56 = _createForOfIteratorHelperLoose(this.drops), _step56; !(_step56 = _iterator56()).done;) {
            var d = _step56.value;
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.rot);
            ctx.font = d.size + "px serif";
            ctx.fillText(d.glyph, 0, 0);
            ctx.restore();
          }
          ctx.restore();
        };
        _proto21.clear = function clear() {
          this.drops.length = 0;
        };
        _proto21.isActive = function isActive() {
          return this.drops.length > 0;
        };
        return EmojiRain;
      }();
      var EffectLayer = exports('EffectLayer', /*#__PURE__*/function () {
        function EffectLayer() {
          this.flash = new ScreenFlash();
          this.pulses = new RingPulse();
          this.hits = new HitBursts();
          this.emojiRain = new EmojiRain();
          this.delays = [];
        }
        /**
         * iter-20: trigger the harmless emoji rain. Caller passes the canvas
         * dimensions so the spread covers the visible area. No-op cap is
         * enforced inside `EmojiRain.burst`.
         */
        var _proto22 = EffectLayer.prototype;
        _proto22.celebrate = function celebrate(width, height) {
          this.emojiRain.burst(width, height);
        };
        _proto22.levelUp = function levelUp(x, y) {
          this.pulses.emit(x, y, "255,220,80");
        };
        _proto22.hit = function hit(x, y, color) {
          if (color === void 0) {
            color = "255,255,255";
          }
          this.hits.emit(x, y, color);
        };
        _proto22.bossSpawn = function bossSpawn() {};
        _proto22.achievement = function achievement() {}
        /**
         * iter-15 polish: short red flash on a critical hit. Kept very brief
         * (high decay) so the player still sees the action under it. Drives
         * the optional `criticalFlash` setting in main.js.
         */;
        _proto22.criticalHit = function criticalHit(x, y) {
          if (Number.isFinite(x) && Number.isFinite(y)) this.hits.emit(x, y, "255,96,96");
        }
        /**
         * Schedule a callback to fire after `seconds` of simulation time. The queue
         * is drained inside `update(dt)`, so it implicitly pauses with the game.
         * Returns a token whose `.cancelled = true` stops the callback.
         */;
        _proto22.schedule = function schedule(seconds, fn) {
          var entry = {
            t: seconds,
            fn: fn,
            cancelled: false
          };
          this.delays.push(entry);
          return entry;
        };
        _proto22.update = function update(dt, viewport) {
          this.flash.update(dt);
          this.pulses.update(dt);
          this.hits.update(dt);
          this.emojiRain.update(dt, viewport && viewport.h);
          if (this.delays.length) {
            for (var i = this.delays.length - 1; i >= 0; i--) {
              var d = this.delays[i];
              d.t -= dt;
              if (d.t <= 0) {
                this.delays.splice(i, 1);
                if (!d.cancelled) {
                  try {
                    d.fn();
                  } catch (err) {
                    console.warn("[effects] scheduled fn threw", err);
                  }
                }
              }
            }
          }
        };
        _proto22.render = function render(ctx, w, h) {
          this.pulses.render(ctx);
          this.hits.render(ctx);
          this.flash.render(ctx, w, h);
          this.emojiRain.render(ctx);
        };
        return EffectLayer;
      }());

      // prototype-2d-pixel/src/stages.js
      var STAGES = exports('STAGES', Object.freeze({
        FOREST: Object.freeze({
          id: "forest",
          name: "\u96FE\u9690\u9752\u51A5\u5C71",
          icon: "\uD83C\uDF32",
          description: "\u7EB8\u4EBA\u9A7F\u9053\u4E0E\u9ED1\u6C34\u7AF9\u6D77\u4EA4\u9519\uFF0C\u654C\u7FA4\u5747\u8861\uFF0C\u9002\u5408\u4F5C\u4E3A\u9996\u8F6E\u6218\u6597\u6807\u5C3A\u3002",
          background: {
            fill: "#1a1a2e",
            gridAlpha: 0.04
          },
          musicStyle: "forest",
          poolOverrides: {},
          extraEnemies: [],
          bossOffsets: {}
        }),
        CRYPT: Object.freeze({
          id: "crypt",
          name: "\u4E5D\u5E7D\u620F\u795E\u57CE",
          icon: "\uD83E\uDEA6",
          description: "\u90AA\u6559\u8FDC\u7A0B\u5355\u4F4D\u66F4\u591A\uFF0C\u7EB8\u5AC1\u8863\u65E0\u5E38\u4F1A\u63D0\u524D\u767B\u573A\u3002",
          background: {
            fill: "#0c0816",
            gridAlpha: 0.025
          },
          musicStyle: "crypt",
          // Bias spawns: more mages and illusionists, fewer melee chasers.
          poolOverrides: {
            mage: 1.8,
            illusionist: 1.6,
            ghost: 1.4,
            skeleton: 1.2,
            bat: 0.6,
            zombie: 0.5,
            wolf: 0.7
          },
          // Add mage to every wave so the ranged-heavy promise holds in the
          // first 90 seconds where vanilla pools have no caster.
          extraEnemies: ["mage"],
          bossOffsets: {
            // Reaper arrives 60s earlier (5:00 -> 4:00).
            reaper: -60,
            // Necromancer also pulled in slightly so the 4:00→7:30 gap is healthier.
            necromancer: -30
          }
        }),
        // ----------------------------------------------------------------------
        // iter-14 — Tundra
        //
        // The third map. Bosses keep the same schedule as forest, but the entire
        // map applies three soft pressure modifiers:
        //   - playerSpeedMult 0.9   (ice underfoot, -10% movement)
        //   - enemyHpMult     1.2   (thicker furred enemies, +20% HP)
        //   - cold tick       1 HP / 10 s (slow attrition)
        // The cold tick is implemented in main.js (`_applyColdTick`) and reads
        // its config from `getStageModifiers(id)` so the modifier surface stays
        // declarative. Recovery buildings offer a one-use ward lantern as an
        // alternative to their healing/tempering choices (120 seconds of shelter).
        //
        // Visual: cold blue palette (#2a3a4f) with a slightly more visible grid
        // so the snow lines read on the canvas. The 10-minute boss is replaced
        // with IceQueen (see data.js BOSSES.ICE_QUEEN) via `bossOverrides`.
        // ----------------------------------------------------------------------
        TUNDRA: Object.freeze({
          id: "tundra",
          name: "\u661F\u9668\u5929\u95E8\u5173",
          icon: "\u2744\uFE0F",
          description: "\u661F\u8680\u4FB5\u4F53\uFF1A\u79FB\u901F -10%\uFF0C\u654C\u4EBA\u751F\u547D +20%\uFF1B\u6062\u590D\u5EFA\u7B51\u53EF\u70B9\u907F\u661F\u706F\uFF0C\u6682\u7F13\u5468\u671F\u4FB5\u8680\u3002",
          background: {
            fill: "#2a3a4f",
            gridAlpha: 0.05
          },
          musicStyle: "forest",
          poolOverrides: {
            // Wolves and golems thrive in snow, mages and bats less so.
            wolf: 1.5,
            golem: 1.4,
            zombie: 1.1,
            skeleton: 1.1,
            bat: 0.5,
            mage: 0.7
          },
          extraEnemies: [],
          // Bosses keep their forest-default timings — the difficulty comes
          // from the always-on modifiers, not from rushing the schedule.
          bossOffsets: {},
          // 10-minute boss reskin: replace VoidLord with IceQueen on tundra.
          bossOverrides: {
            void_lord: "ice_queen"
          },
          modifiers: Object.freeze({
            playerSpeedMult: 0.9,
            enemyHpMult: 1.2,
            coldTickInterval: 10,
            // seconds
            coldTickDamage: 1,
            // HP per tick
            warmthSourceEnabled: true
          })
        })
      }));
      function getStage(id) {
        if (!id) return STAGES.FOREST;
        for (var _i20 = 0, _Object$values4 = Object.values(STAGES); _i20 < _Object$values4.length; _i20++) {
          var s = _Object$values4[_i20];
          if (s.id === id) return s;
        }
        return STAGES.FOREST;
      }
      var DEFAULT_MODIFIERS = Object.freeze({
        playerSpeedMult: 1,
        enemyHpMult: 1,
        coldTickInterval: 0,
        coldTickDamage: 0,
        warmthSourceEnabled: false
      });
      function getStageModifiers(id) {
        var stage = getStage(id);
        return _extends({}, DEFAULT_MODIFIERS, stage.modifiers || {});
      }
      function getWavesFor(id) {
        var stage = getStage(id);
        var extra = stage.extraEnemies || [];
        return WAVES.map(function (w) {
          var pool = extra.length ? Array.from(new Set(w.pool.concat(extra))) : w.pool.slice();
          return _extends({}, w, {
            pool: pool
          });
        });
      }
      function getBossesFor(id) {
        var stage = getStage(id);
        var offsets = stage.bossOffsets || {};
        var overrides = stage.bossOverrides || {};
        var replacementTargets = new Set(Object.values(overrides));
        var bossesById = {};
        for (var _i21 = 0, _Object$values5 = Object.values(BOSSES); _i21 < _Object$values5.length; _i21++) {
          var b = _Object$values5[_i21];
          bossesById[b.id] = b;
        }
        var overrideOnlyIds = /* @__PURE__ */new Set(["ice_queen"]);
        var out = [];
        for (var _i22 = 0, _Object$values6 = Object.values(BOSSES); _i22 < _Object$values6.length; _i22++) {
          var _b2 = _Object$values6[_i22];
          if (overrideOnlyIds.has(_b2.id) && !replacementTargets.has(_b2.id)) {
            continue;
          }
          if (replacementTargets.has(_b2.id) && !overrides[_b2.id]) {
            continue;
          }
          var def = _b2;
          if (overrides[_b2.id]) {
            var replacement = bossesById[overrides[_b2.id]];
            if (replacement) def = replacement;
          }
          var off = offsets[_b2.id] || 0;
          var spawnAt = Math.max(30, _b2.spawnAt + off);
          out.push(_extends({}, def, {
            spawnAt: spawnAt,
            sourceId: _b2.id
          }));
        }
        return out;
      }
      function pickWeighted(pool, stageId, rnd) {
        if (rnd === void 0) {
          rnd = Math.random;
        }
        if (!pool.length) return null;
        var stage = getStage(stageId);
        var weights = stage.poolOverrides || {};
        var total = 0;
        var cum = pool.map(function (id) {
          var _weights$id;
          var w = (_weights$id = weights[id]) != null ? _weights$id : 1;
          total += Math.max(0, w);
          return total;
        });
        if (total <= 0) return pool[Math.floor(rnd() * pool.length)];
        var r = rnd() * total;
        for (var i = 0; i < pool.length; i++) {
          if (r < cum[i]) return pool[i];
        }
        return pool[pool.length - 1];
      }

      // prototype-2d-pixel/src/difficulty.js
      function progressiveDifficultyScales(gameTime, roomBonus) {
        if (gameTime === void 0) {
          gameTime = 0;
        }
        if (roomBonus === void 0) {
          roomBonus = 0;
        }
        var seconds = Math.max(0, Number(gameTime) || 0);
        var room = Math.max(0, Math.min(0.5, Number(roomBonus) || 0));
        return {
          hp: (1 + seconds / 600) * (1 + room),
          damage: (1 + seconds / 900) * (1 + room * 0.7)
        };
      }

      // prototype-2d-pixel/src/encounter-steps.js
      function _computeDifficultyMults() {
        var _this$stageMods$enemy, _this$stageMods;
        var diff = Difficulty[(this.save.settings.difficulty || "normal").toUpperCase()] || Difficulty.NORMAL;
        var routeThreat = this.runMode === "chapter" ? this.chapterRoute.current().threatBonus || 0 : 0;
        var scales = this._usesEndlessTimeline() ? endlessDifficultyScales(this.gameTime) : progressiveDifficultyScales(this.gameTime, routeThreat);
        var stageHpMult = (_this$stageMods$enemy = (_this$stageMods = this.stageMods) == null ? void 0 : _this$stageMods.enemyHpMult) != null ? _this$stageMods$enemy : 1;
        return {
          diff: diff,
          hpMult: diff.hpMult * scales.hp * stageHpMult,
          dmgMult: diff.dmgMult * scales.damage
        };
      }
      function _selectWave() {
        var t = this.gameTime;
        var list = this.stageWaves && this.stageWaves.length ? this.stageWaves : WAVES;
        var match = list[list.length - 1];
        for (var _iterator57 = _createForOfIteratorHelperLoose(list), _step57; !(_step57 = _iterator57()).done;) {
          var w = _step57.value;
          if (t >= w.from && t < w.to) {
            match = w;
            break;
          }
        }
        if (this._lastAnnouncedWave !== match.label) {
          this._lastAnnouncedWave = match.label;
        }
        return match;
      }
      function _spawnLogic(dt, hpMult, dmgMult, diffSpawnMult) {
        var wave = this.currentWave;
        if (this.runMode === "chapter") {
          var room = this.chapterRoute.current();
          if (this.chapterRoute.roomReady || room.killTarget <= 0 || room.type === "boss") return;
          var roomCap = Math.min(48, Math.max(12, room.killTarget - this.chapterRoute.roomKills));
          var interval2 = Math.max(0.34, 0.9 - (room.threatBonus || 0) * 0.75) / diffSpawnMult;
          this._spawnAccumulator += dt;
          while (this._spawnAccumulator >= interval2 && this.enemies.length < roomCap) {
            var _room$pool;
            this._spawnAccumulator -= interval2;
            this._spawnOne((_room$pool = room.pool) != null && _room$pool.length ? room.pool : wave.pool, hpMult, dmgMult);
          }
          return;
        }
        var waveMult = wave.spawnMult || 1;
        var maxEnemies = Math.min(CONFIG.MAX_ENEMIES, 20 + Math.floor(this.gameTime / 10));
        var interval = Math.max(0.2, 1.2 - this.gameTime / 200) / (diffSpawnMult * waveMult);
        this._spawnAccumulator += dt;
        while (this._spawnAccumulator >= interval && this.enemies.length < maxEnemies) {
          this._spawnAccumulator -= interval;
          this._spawnOne(wave.pool, hpMult, dmgMult);
        }
        if (this._usesEndlessTimeline()) {
          this._tickEndlessBoss(hpMult, dmgMult);
          return;
        }
        var bossList = this.stageBosses && this.stageBosses.length ? this.stageBosses : Object.values(BOSSES);
        for (var _iterator58 = _createForOfIteratorHelperLoose(bossList), _step58; !(_step58 = _iterator58()).done;) {
          var boss = _step58.value;
          var warnAt = boss.spawnAt - 5;
          if (this.gameTime >= warnAt && !this._bossWarnedAt.has(boss.id)) {
            this._bossWarnedAt.add(boss.id);
            this.audio.bossWarn();
          }
          if (this.gameTime >= boss.spawnAt && !this._bossesSpawned.has(boss.id)) {
            this._bossesSpawned.add(boss.id);
            this._spawnBoss(boss, hpMult, dmgMult);
          }
        }
      }
      function _spawnOne(pool, hpMult, dmgMult) {
        var _this9 = this;
        var rng = (this.speedrunMode || this.dailyMode) && this.speedrunRng ? this.speedrunRng : null;
        var frnd = rng ? function () {
          return rng.nextFloat();
        } : Math.random;
        var pick = pickWeighted(pool, this.stageId, frnd) || pool[Math.floor(frnd() * pool.length)];
        var type = findEnemyDef(pick) || ENEMIES.BAT;
        if (type.control && this.enemies.filter(function (enemy2) {
          return enemy2.type.control;
        }).length >= 3) return;
        var angle = frnd() * Math.PI * 2;
        var dist = CONFIG.SPAWN_RADIUS + frnd() * 120;
        var x = this.player.x + Math.cos(angle) * dist;
        var y = this.player.y + Math.sin(angle) * dist;
        if (this.runMode === "chapter") {
          var _this$canvas, _this$canvas2;
          var inset = Math.max(42, type.size + 4);
          var left = Math.max(inset, this.camera.worldX + inset);
          var right = Math.min(this.arenaWidth - inset, this.camera.worldX + (((_this$canvas = this.canvas) == null ? void 0 : _this$canvas.width) || CONFIG.CANVAS_WIDTH) - inset);
          var top = Math.max(inset, this.camera.worldY + inset);
          var bottom = Math.min(this.arenaHeight - inset, this.camera.worldY + (((_this$canvas2 = this.canvas) == null ? void 0 : _this$canvas2.height) || CONFIG.CANVAS_HEIGHT) - inset);
          var gap = Math.max(260, this.player.size + type.size + type.speed * 1.25);
          var candidate = function candidate(edge, t) {
            return edge < 2 ? {
              x: edge === 0 ? left : right,
              y: top + (bottom - top) * t
            } : {
              x: left + (right - left) * t,
              y: edge === 2 ? top : bottom
            };
          };
          var clear = function clear(point2) {
            var _this9$worldMap, _this9$interactions;
            if (Math.hypot(point2.x - _this9.player.x, point2.y - _this9.player.y) < gap) return false;
            var probe = _extends({}, point2, {
              prevX: point2.x,
              prevY: point2.y,
              size: type.size
            });
            (_this9$worldMap = _this9.worldMap) == null || _this9$worldMap.resolveEntity(probe);
            (_this9$interactions = _this9.interactions) == null || _this9$interactions.resolveEntity(probe);
            return probe.x === point2.x && probe.y === point2.y;
          };
          var point = null;
          for (var attempt = 0; attempt < 12 && !point; attempt++) {
            var next = candidate(Math.floor(frnd() * 4), 0.05 + frnd() * 0.9);
            if (clear(next)) point = next;
          }
          for (var edge = 0; edge < 4 && !point; edge++) {
            for (var step = 1; step < 8 && !point; step++) {
              var _next = candidate(edge, step / 8);
              if (clear(_next)) point = _next;
            }
          }
          if (!point) return;
          var _point = point;
          x = _point.x;
          y = _point.y;
        }
        var enemy = new Enemy(x, y, type, hpMult, dmgMult);
        enemy.skin = enemySkinFor(this.stageId, type);
        this._recordDiscovery("monsters", enemy.skin.id);
        if (type.control) this._recordDiscovery("monsters", type.id);
        this.enemies.push(enemy);
      }
      function _spawnBoss(bossDef, hpMult, dmgMult) {
        var _this$haptics;
        var angle = Math.random() * Math.PI * 2;
        var d = CONFIG.SPAWN_RADIUS * 0.8;
        var x = this.runMode === "chapter" ? this.player.x : this.player.x + Math.cos(angle) * d;
        var y = this.runMode === "chapter" ? Math.max(96, this.player.y - 300) : this.player.y + Math.sin(angle) * d;
        var endlessBossMult = this.runMode === "endless" ? 1.35 : 1;
        var enemy = new Enemy(x, y, bossDef, hpMult * endlessBossMult, dmgMult * endlessBossMult);
        this._recordDiscovery("monsters", bossDef.id);
        this.enemies.push(enemy);
        this.ui.showBossBanner();
        this.audio.bossSpawn();
        this.effects.bossSpawn();
        this.shake(1.2);
        (_this$haptics = this.haptics) == null || _this$haptics.bossSpawn();
        this._announce("Boss incoming: " + (bossDef.name || bossDef.id));
        return enemy;
      }
      function _tickEndlessBoss(hpMult, dmgMult) {
        var director = this.endlessRun;
        if (director.pendingDecision) return;
        var def = director.nextDefinition(this.stageId);
        if (this.enemies.some(function (enemy2) {
          var _enemy2$type;
          return ((_enemy2$type = enemy2.type) == null ? void 0 : _enemy2$type.endlessKey) === def.endlessKey;
        })) return;
        if (this.gameTime >= def.spawnAt - 10 && director.warnedIndex !== director.nextIndex) {
          director.warnedIndex = director.nextIndex;
          this.audio.bossWarn();
          this._announce("\u65F6\u95F4\u9996\u9886\u5C06\u81F3\uFF1A" + def.name + "\u3002\u5C0F\u5730\u56FE\u5C06\u6807\u51FA\u9996\u9886\u65B9\u4F4D\u3002");
        }
        if (this.gameTime < def.spawnAt && director.activeIndex == null) return;
        director.activeIndex = director.nextIndex;
        var enemy = this._spawnBoss(def, hpMult, dmgMult);
        var saved = director.savedBoss;
        if (saved) {
          restoreBossCombat(enemy, saved);
          director.savedBoss = null;
        }
        this.saveCurrentCovenant({
          announce: false
        });
      }
      function onBossAbility(boss) {
        beginEnemyCast(boss, this);
      }
      function spawnBossMinions(boss, count) {
        var _this$_computeDifficu = this._computeDifficultyMults(),
          hpMult = _this$_computeDifficu.hpMult,
          dmgMult = _this$_computeDifficu.dmgMult;
        var def = findEnemyDef(boss.id === "reaper" ? "bat" : "skeleton");
        for (var i = 0; i < count && this.enemies.length < CONFIG.MAX_ENEMIES; i++) {
          var angle = i / count * Math.PI * 2;
          this.enemies.push(new Enemy(boss.x + Math.cos(angle) * 100, boss.y + Math.sin(angle) * 100, def, hpMult, dmgMult));
        }
      }
      function fireBossFan(boss, cast) {
        var angle = Math.atan2(cast.targetY - cast.y, cast.targetX - cast.x);
        var count = cast.phase === 2 ? 7 : 5;
        for (var i = 0; i < count && this.enemyProjectiles.length < 240; i++) {
          this.enemyProjectiles.push(new EnemyProjectile(boss.x, boss.y, angle + (i - (count - 1) / 2) * 0.24, 160, boss.damage * 0.45, {
            projectileStyle: "skull",
            projectileColor: "#df867a"
          }, enemyDamageSource(boss, "projectile")));
        }
      }

      // prototype-2d-pixel/src/chapter-content.js
      var CHAPTER_CONTENT = Object.freeze({
        forest: {
          title: "\u96FE\u9690\u9752\u51A5\u5C71",
          bossId: "reaper",
          names: ["\u7EB8\u9A6C\u6E21\u53E3", "\u542C\u96E8\u836F\u5F84", "\u6CFC\u58A8\u7AF9\u6D77", "\u50A9\u5203\u5C71\u9698", "\u85CF\u950B\u652F\u8C37", "\u767E\u9B3C\u5C71\u9053", "\u6C89\u94B1\u77F3\u7A9F", "\u7EB8\u5AC1\u8863\u53E4\u7960"],
          pools: {
            "1-1": ["bat", "zombie"],
            "1-2B": ["bat", "skeleton", "wolf"],
            "1-3": ["wolf", "mage", "golem", "bramble_seer"],
            "1-4B": ["skeleton", "wolf", "slime", "bomber", "bramble_seer"],
            "1-4C": ["zombie", "slime", "bomber"]
          },
          specialNames: {
            shrine: "\u542C\u96E8\u836F\u4EAD",
            shop: "\u7AF9\u6D77\u884C\u5546",
            reward: "\u85CF\u950B\u77F3\u7A9F",
            event: "\u7EB8\u4EBA\u8336\u5C40"
          }
        },
        crypt: {
          title: "\u4E5D\u5E7D\u620F\u795E\u57CE",
          bossId: "necromancer",
          names: ["\u843D\u5E55\u57CE\u95E8", "\u65E0\u706F\u504F\u8857", "\u60AC\u68FA\u957F\u8857", "\u767D\u9AA8\u796D\u573A", "\u65E7\u620F\u540E\u53F0", "\u65E0\u9762\u620F\u5ECA", "\u51A5\u94B1\u5E93\u623F", "\u620F\u795E\u4E3B\u53F0"],
          edges: [["1-1", "1-2B"], ["1-2B", "1-3"], ["1-3", "1-4C"], ["1-3", "1-2A"], ["1-3", "1-4B"], ["1-2A", "1-4A"], ["1-4A", "1-4B"], ["1-4B", "1-5"], ["1-4C", "1-5"]],
          pools: {
            "1-1": ["skeleton", "zombie"],
            "1-2B": ["skeleton", "ghost", "mage"],
            "1-3": ["skeleton", "mage", "golem", "thread_chanter"],
            "1-4B": ["ghost", "mage", "illusionist", "bomber", "thread_chanter"],
            "1-4C": ["skeleton", "wolf", "bomber"]
          },
          specialNames: {
            shrine: "\u8FD8\u9B42\u9999\u5802",
            shop: "\u65E0\u706F\u9B3C\u5E02",
            reward: "\u5C01\u68FA\u5B9D\u5E93",
            event: "\u66FF\u8EAB\u70B9\u620F\u53F0"
          }
        },
        tundra: {
          title: "\u661F\u9668\u5929\u95E8\u5173",
          bossId: "ice_queen",
          names: ["\u51BB\u661F\u524D\u54E8", "\u5931\u6E29\u5C94\u9053", "\u6676\u810A\u96EA\u5F84", "\u5F57\u7532\u89C2\u661F\u53F0", "\u6708\u955C\u4FA7\u6BBF", "\u9668\u94C1\u5929\u9636", "\u5760\u661F\u77FF\u7A9F", "\u6708\u8680\u9F99\u7960"],
          edges: [["1-1", "1-2A"], ["1-1", "1-2B"], ["1-2A", "1-4A"], ["1-2B", "1-3"], ["1-4A", "1-4B"], ["1-4B", "1-3"], ["1-4B", "1-5"], ["1-3", "1-4C"], ["1-4C", "1-5"]],
          pools: {
            "1-1": ["zombie", "skeleton"],
            "1-2B": ["zombie", "wolf", "skeleton"],
            "1-3": ["wolf", "golem", "mage", "frost_eye"],
            "1-4B": ["wolf", "golem", "mage", "bomber", "frost_eye"],
            "1-4C": ["zombie", "golem", "bomber"]
          },
          specialNames: {
            shrine: "\u5931\u6E29\u70FD\u71E7",
            shop: "\u9668\u94C1\u884C\u6808",
            reward: "\u6708\u955C\u79D8\u5E93",
            event: "\u89C2\u661F\u8005\u6B8B\u8425"
          }
        }
      });
      function chapterContentFor(stageId) {
        return CHAPTER_CONTENT[stageId] || CHAPTER_CONTENT.forest;
      }
      function buildChapterNodes(baseNodes, stageId, layoutVersion) {
        if (layoutVersion === void 0) {
          layoutVersion = 1;
        }
        var content = chapterContentFor(stageId);
        var nodes = Object.fromEntries(Object.values(baseNodes).map(function (node, index) {
          return [node.id, _extends({}, node, {
            name: content.names[index],
            bossId: node.type === "boss" ? content.bossId : node.bossId,
            pool: content.pools[node.id] ? [].concat(content.pools[node.id]) : [],
            links: content.edges && layoutVersion >= 1 ? {} : _extends({}, node.links)
          })];
        }));
        if (content.edges && layoutVersion >= 1) {
          for (var _iterator59 = _createForOfIteratorHelperLoose(content.edges), _step59; !(_step59 = _iterator59()).done;) {
            var _step59$value = _step59.value,
              from = _step59$value[0],
              to = _step59$value[1];
            var a = nodes[from],
              b = nodes[to];
            var dx = b.gridX - a.gridX,
              dy = b.gridY - a.gridY;
            if (Math.abs(dx) + Math.abs(dy) !== 1) throw new Error("Non-adjacent chapter edge: " + from + "/" + to);
            var direction = dx === 1 ? "right" : dx === -1 ? "left" : dy === 1 ? "down" : "up";
            var opposite = {
              right: "left",
              left: "right",
              up: "down",
              down: "up"
            };
            a.links[direction] = to;
            b.links[opposite[direction]] = from;
          }
        }
        return nodes;
      }

      // prototype-2d-pixel/src/chapter-route.js
      var CHAPTER_NODES = Object.freeze({
        "1-1": Object.freeze({
          id: "1-1",
          name: "\u7EB8\u9A6C\u6E21\u53E3",
          type: "combat",
          label: "\u6218\u6597\u623F",
          killTarget: 60,
          threatBonus: 0,
          gridX: 0,
          gridY: 2,
          links: Object.freeze({
            up: "1-2A",
            right: "1-2B"
          })
        }),
        "1-2A": Object.freeze({
          id: "1-2A",
          name: "\u672A\u5B9A\u5F02\u5BA4",
          type: "special",
          label: "\u968F\u673A\u623F",
          killTarget: 0,
          threatBonus: 0.04,
          specialSlot: "early",
          gridX: 0,
          gridY: 1,
          links: Object.freeze({
            down: "1-1",
            up: "1-4A",
            right: "1-3"
          })
        }),
        "1-2B": Object.freeze({
          id: "1-2B",
          name: "\u9B3C\u5E02\u5916\u8857",
          type: "combat",
          label: "\u6218\u6597\u623F",
          killTarget: 80,
          threatBonus: 0.06,
          gridX: 1,
          gridY: 2,
          links: Object.freeze({
            left: "1-1",
            up: "1-3"
          })
        }),
        "1-3": Object.freeze({
          id: "1-3",
          name: "\u65AD\u5251\u9057\u5E9C",
          type: "elite",
          label: "\u7CBE\u82F1\u623F",
          killTarget: 100,
          threatBonus: 0.12,
          gridX: 1,
          gridY: 1,
          links: Object.freeze({
            left: "1-2A",
            down: "1-2B",
            up: "1-4B",
            right: "1-4C"
          })
        }),
        "1-4A": Object.freeze({
          id: "1-4A",
          name: "\u672A\u5B9A\u5F02\u5BA4",
          type: "special",
          label: "\u968F\u673A\u623F",
          killTarget: 0,
          threatBonus: 0.16,
          specialSlot: "late",
          gridX: 0,
          gridY: 0,
          links: Object.freeze({
            down: "1-2A",
            right: "1-4B"
          })
        }),
        "1-4B": Object.freeze({
          id: "1-4B",
          name: "\u50A9\u5F71\u56DE\u5ECA",
          type: "combat",
          label: "\u6218\u6597\u623F",
          killTarget: 110,
          threatBonus: 0.18,
          gridX: 1,
          gridY: 0,
          links: Object.freeze({
            left: "1-4A",
            down: "1-3",
            right: "1-5"
          })
        }),
        "1-4C": Object.freeze({
          id: "1-4C",
          name: "\u94DC\u94B1\u5996\u7A9F",
          type: "gold",
          label: "\u91D1\u5E01\u623F",
          killTarget: 90,
          threatBonus: 0.2,
          gridX: 2,
          gridY: 1,
          links: Object.freeze({
            left: "1-3",
            up: "1-5"
          })
        }),
        "1-5": Object.freeze({
          id: "1-5",
          name: "\u5929\u95E8\u846C\u661F\u53F0",
          type: "boss",
          label: "Boss \u623F",
          killTarget: 1,
          threatBonus: 0.28,
          bossId: "reaper",
          gridX: 2,
          gridY: 0,
          links: Object.freeze({
            left: "1-4B",
            down: "1-4C"
          })
        })
      });
      var SPECIAL_ROOM_VARIANTS = Object.freeze([Object.freeze({
        key: "shrine",
        type: "shrine",
        label: "\u6062\u590D\u623F",
        name: "\u9752\u5C71\u836F\u4EAD"
      }), Object.freeze({
        key: "shop",
        type: "shop",
        label: "\u5546\u5E97\u623F",
        name: "\u65E0\u706F\u9B3C\u5E02"
      }), Object.freeze({
        key: "reward",
        type: "reward",
        label: "\u5956\u52B1\u623F",
        name: "\u85CF\u950B\u77F3\u7A9F"
      }), Object.freeze({
        key: "event",
        type: "event",
        label: "\u5947\u9047\u623F",
        name: "\u7EB8\u4EBA\u8336\u5C40"
      })]);
      var DIRECTION_LABELS = Object.freeze({
        up: "\u5317",
        right: "\u4E1C",
        down: "\u5357",
        left: "\u897F"
      });
      var OPPOSITE_DIRECTION = Object.freeze({
        up: "down",
        right: "left",
        down: "up",
        left: "right"
      });
      var ChapterRouteSystem = exports('ChapterRouteSystem', /*#__PURE__*/function () {
        function ChapterRouteSystem(random) {
          if (random === void 0) {
            random = Math.random;
          }
          this.random = typeof random === "function" ? random : Math.random;
          this.reset();
        }
        var _proto23 = ChapterRouteSystem.prototype;
        _proto23.reset = function reset(snapshot, stageId) {
          var _snapshot2, _snapshot3, _snapshot4, _snapshot5, _snapshot6, _snapshot7, _snapshot8, _saved$kills, _snapshot9, _ref17, _saved$ready, _snapshot10;
          if (snapshot === void 0) {
            snapshot = null;
          }
          if (stageId === void 0) {
            var _snapshot;
            stageId = ((_snapshot = snapshot) == null ? void 0 : _snapshot.stageId) || "forest";
          }
          this.stageId = stageId;
          this.layoutVersion = snapshot ? snapshot.layoutVersion || 0 : 1;
          this.nodes = buildChapterNodes(CHAPTER_NODES, stageId, this.layoutVersion);
          this.roomStates = clonePlainState(((_snapshot2 = snapshot) == null ? void 0 : _snapshot2.roomStates) || {});
          this.currentId = (_snapshot3 = snapshot) != null && _snapshot3.currentId && CHAPTER_NODES[snapshot.currentId] ? snapshot.currentId : "1-1";
          this.cleared = new Set(((_snapshot4 = snapshot) == null ? void 0 : _snapshot4.cleared) || []);
          this.visited = new Set(((_snapshot5 = snapshot) == null ? void 0 : _snapshot5.visited) || [this.currentId]);
          this.progress = _extends({}, ((_snapshot6 = snapshot) == null ? void 0 : _snapshot6.progress) || {});
          this.specialRooms = (_snapshot7 = snapshot) != null && _snapshot7.specialRooms ? _extends({}, snapshot.specialRooms) : {
            "1-2A": this._pickSpecialVariant(),
            "1-4A": this._pickSpecialVariant()
          };
          this.entryDirection = ((_snapshot8 = snapshot) == null ? void 0 : _snapshot8.entryDirection) || null;
          var saved = this.progress[this.currentId];
          this.roomKills = Math.max(0, Number((_saved$kills = saved == null ? void 0 : saved.kills) != null ? _saved$kills : (_snapshot9 = snapshot) == null ? void 0 : _snapshot9.roomKills) || 0);
          this.roomReady = !!((_ref17 = (_saved$ready = saved == null ? void 0 : saved.ready) != null ? _saved$ready : (_snapshot10 = snapshot) == null ? void 0 : _snapshot10.roomReady) != null ? _ref17 : this.cleared.has(this.currentId));
          this._storeCurrent();
        };
        _proto23.current = function current() {
          return this.roomFor(this.currentId);
        };
        _proto23.roomFor = function roomFor(id) {
          var _this$specialRooms;
          var node = this.nodes[id];
          if (!(node != null && node.specialSlot)) return node;
          var key = (_this$specialRooms = this.specialRooms) == null ? void 0 : _this$specialRooms[id];
          var variant = SPECIAL_ROOM_VARIANTS.find(function (entry) {
            return entry.key === key;
          });
          return variant ? _extends({}, node, variant, {
            name: chapterContentFor(this.stageId).specialNames[variant.key],
            id: node.id,
            links: node.links
          }) : node;
        };
        _proto23.saveRoomState = function saveRoomState(state) {
          this.roomStates[this.currentId] = clonePlainState(state);
        };
        _proto23.currentRoomState = function currentRoomState() {
          var state = this.roomStates[this.currentId];
          return state ? clonePlainState(state) : null;
        };
        _proto23._pickSpecialVariant = function _pickSpecialVariant() {
          var roll = Math.max(0, Math.min(0.999999, Number(this.random()) || 0));
          return SPECIAL_ROOM_VARIANTS[Math.floor(roll * SPECIAL_ROOM_VARIANTS.length)].key;
        };
        _proto23._storeCurrent = function _storeCurrent() {
          this.progress[this.currentId] = {
            kills: this.roomKills,
            ready: this.roomReady
          };
        };
        _proto23.registerKill = function registerKill(enemy) {
          var node = this.current();
          if (this.roomReady) return false;
          if (node.type === "boss" && !(enemy != null && enemy.boss)) return false;
          this.roomKills += 1;
          if (this.roomKills < node.killTarget) {
            this._storeCurrent();
            return false;
          }
          this.roomKills = node.killTarget;
          this.roomReady = true;
          this.cleared.add(node.id);
          this._storeCurrent();
          return true;
        };
        _proto23.markSpecialReady = function markSpecialReady() {
          var node = this.current();
          if (node.killTarget > 0) return false;
          this.roomReady = true;
          this.cleared.add(node.id);
          this._storeCurrent();
          return true;
        };
        _proto23.choices = function choices() {
          var _this10 = this;
          var node = this.current();
          return Object.entries(node.links).filter(function (_ref18) {
            var id = _ref18[1];
            return _this10.roomReady || _this10.cleared.has(id);
          }).map(function (_ref19) {
            var direction = _ref19[0],
              id = _ref19[1];
            return _extends({}, _this10.roomFor(id), {
              direction: direction
            });
          });
        };
        _proto23.advance = function advance(targetId) {
          var choice = this.choices().find(function (entry) {
            return entry.id === targetId;
          });
          if (!choice) return false;
          this._storeCurrent();
          this.currentId = targetId;
          this.entryDirection = OPPOSITE_DIRECTION[choice.direction] || null;
          this.visited.add(targetId);
          var saved = this.progress[targetId];
          this.roomKills = Math.max(0, Number(saved == null ? void 0 : saved.kills) || 0);
          this.roomReady = !!(saved != null && saved.ready || this.cleared.has(targetId));
          this._storeCurrent();
          return true;
        };
        _proto23.snapshot = function snapshot() {
          this._storeCurrent();
          return {
            stageId: this.stageId,
            layoutVersion: this.layoutVersion,
            roomStates: clonePlainState(this.roomStates),
            currentId: this.currentId,
            cleared: Array.from(this.cleared),
            visited: Array.from(this.visited),
            progress: _extends({}, this.progress),
            specialRooms: _extends({}, this.specialRooms),
            entryDirection: this.entryDirection,
            roomKills: this.roomKills,
            roomReady: this.roomReady
          };
        };
        _proto23.mapModel = function mapModel() {
          var grid = Array.from({
            length: 3
          }, function () {
            return Array(3).fill(null);
          });
          for (var _i23 = 0, _Object$values7 = Object.values(this.nodes); _i23 < _Object$values7.length; _i23++) {
            var baseNode = _Object$values7[_i23];
            var node = this.roomFor(baseNode.id);
            grid[node.gridY][node.gridX] = _extends({}, node, {
              state: node.id === this.currentId ? "current" : this.cleared.has(node.id) ? "cleared" : this.visited.has(node.id) ? "visited" : "locked"
            });
          }
          return {
            currentId: this.currentId,
            grid: grid
          };
        };
        return ChapterRouteSystem;
      }());

      // prototype-2d-pixel/src/ritual-animation.js
      var RITUAL_ACTION_ASSETS = Object.freeze({
        boss: "./assets/enemies/boss-action-v1.png",
        ritual: "./assets/enemies/ritual-action-v1.png"
      });
      var RITUAL_ACTION_ROWS = Object.freeze({
        reaper: ["boss", 0],
        necromancer: ["boss", 1],
        ice_queen: ["boss", 2],
        void_lord: ["boss", 3],
        chrono_lich: ["ritual", 0],
        bramble_seer: ["ritual", 1],
        thread_chanter: ["ritual", 2],
        frost_eye: ["ritual", 3]
      });
      function ritualActionFrame(enemy, reducedMotion) {
        if (reducedMotion === void 0) {
          reducedMotion = false;
        }
        var cast = enemy.cast;
        if (reducedMotion || enemy.hp <= 0 || !cast || !Number.isFinite(cast.age)) return 0;
        if (cast.age < cast.warning) return 1;
        var release = cast.kind === "charge" ? cast.travel || 0 : Math.min(0.24, (cast.recovery || 0) / 2);
        return cast.age < cast.warning + release ? 2 : 3;
      }

      // prototype-2d-pixel/src/ground-loot.js
      function snapshotGroundLoot(orbs, gameTime) {
        if (orbs === void 0) {
          orbs = [];
        }
        if (gameTime === void 0) {
          gameTime = 0;
        }
        return {
          savedAt: gameTime,
          orbs: orbs.filter(function (o) {
            return !o.shouldRemove && o.life > 0;
          }).map(function (o) {
            return {
              x: o.x,
              y: o.y,
              value: o.value,
              life: o.life,
              magnetSpeed: o.magnetSpeed
            };
          })
        };
      }
      function restoreGroundLoot(snapshot, gameTime) {
        if (gameTime === void 0) {
          gameTime = 0;
        }
        if (!snapshot || !Array.isArray(snapshot.orbs)) return [];
        var elapsed = Number.isFinite(snapshot.savedAt) ? Math.max(0, gameTime - snapshot.savedAt) : 0;
        return snapshot.orbs.flatMap(function (o) {
          if (!o || ![o.x, o.y, o.value, o.life].every(Number.isFinite) || o.value <= 0) return [];
          var life = Math.min(CONFIG.EXP_ORB_LIFETIME, o.life) - elapsed;
          if (life <= 0) return [];
          var orb = new ExpOrb(o.x, o.y, o.value);
          orb.life = life;
          orb.magnetSpeed = Math.min(560, Math.max(0, Number(o.magnetSpeed) || 0));
          return [orb];
        });
      }

      // prototype-2d-pixel/src/scene-offers.js
      function sceneOffers(scene, candidates) {
        if (Array.isArray(scene.offers)) return scene.offers;
        var key = scene.id + "|" + scene.kind + "|" + scene.x + "|" + scene.y + "|" + scene.spawnedAt;
        var seed = 2166136261;
        for (var _iterator60 = _createForOfIteratorHelperLoose(key), _step60; !(_step60 = _iterator60()).done;) {
          var _char = _step60.value;
          seed = Math.imul(seed ^ _char.charCodeAt(0), 16777619) >>> 0;
        }
        var random = function random() {
          seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
          return seed / 4294967296;
        };
        var pool = Array.from(new Map(candidates.map(function (c) {
          return [c.kind + ":" + c.id, c];
        })).values());
        var picked = [];
        var _loop5 = function _loop5() {
          var kind = _arr9[_i25];
          var group = pool.filter(function (c) {
            return c.kind === kind;
          });
          if (group.length) {
            var chosen = group[Math.floor(random() * group.length)];
            picked.push(chosen);
            pool.splice(pool.indexOf(chosen), 1);
          }
        };
        for (var _i25 = 0, _arr9 = ["weapon", "passive", "relic"]; _i25 < _arr9.length; _i25++) {
          _loop5();
        }
        while (picked.length < 3 && pool.length) picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
        if (!picked.length) picked.push({
          kind: "supply",
          id: scene.kind === "shop" ? "recover" : "coins"
        });
        scene.offers = picked.map(function (_ref20) {
          var kind = _ref20.kind,
            id = _ref20.id;
          return {
            kind: kind,
            id: id,
            purchased: false
          };
        });
        return scene.offers;
      }
      function consumeSceneOffer(scene, choiceId) {
        var _scene$offers;
        var offer = (_scene$offers = scene.offers) == null ? void 0 : _scene$offers.find(function (o) {
          return o.kind + ":" + o.id === choiceId && !o.purchased;
        });
        if (!offer) return false;
        offer.purchased = true;
        return true;
      }

      // prototype-2d-pixel/src/building-art.js
      var BUILDING_COLUMNS = Object.freeze({
        shop: 0,
        pavilion: 0,
        relic: 1,
        ruin: 1,
        shrine: 1,
        event: 2,
        heal: 2,
        gate: 3
      });
      var ROWS = Object.freeze({
        forest: 0,
        crypt: 1,
        tundra: 2
      });
      var NAMES = Object.freeze({
        forest: {
          shop: "\u7AF9\u6D77\u884C\u5546",
          relic: "\u85CF\u950B\u9057\u5E9C",
          heal: "\u542C\u96E8\u836F\u4EAD",
          event: "\u7EB8\u4EBA\u8336\u5C40"
        },
        crypt: {
          shop: "\u65E0\u706F\u9B3C\u5E02",
          relic: "\u5C01\u68FA\u5B9D\u5E93",
          heal: "\u8FD8\u9B42\u9999\u5802",
          event: "\u66FF\u8EAB\u8336\u53F0"
        },
        tundra: {
          shop: "\u9668\u94C1\u884C\u5546",
          relic: "\u5760\u661F\u89C2\u6D4B\u53F0",
          heal: "\u6708\u955C\u51B0\u6CC9",
          event: "\u5931\u6E29\u8336\u68DA"
        }
      });
      function buildingName(stageId, kind) {
        return (NAMES[stageId] || NAMES.forest)[kind];
      }
      function buildingCell(stageId, kind) {
        var _ROWS$stageId;
        var column = BUILDING_COLUMNS[kind];
        return column === void 0 ? null : {
          column: column,
          row: (_ROWS$stageId = ROWS[stageId]) != null ? _ROWS$stageId : 0
        };
      }
      function isRetainedBuilding(object) {
        return !!(object != null && object.used && object.closedBuilding && buildingCell("forest", object.kind));
      }
      function closedBuildingLabel(object) {
        if (!isRetainedBuilding(object)) return null;
        return {
          shop: "\u6B47\u4E1A \xB7 \u8D27\u54C1\u5DF2\u552E\u7F44",
          relic: "\u5DF2\u63A2\u7D22 \xB7 \u9547\u7269\u5DF2\u53D6\u8D70",
          heal: "\u5DF2\u7948\u996E \xB7 \u673A\u7F18\u5DF2\u7528",
          event: "\u8336\u5C40\u5DF2\u6563"
        }[object.kind] || "\u5DF2\u63A2\u7D22";
      }
      function buildingBounds(object) {
        if (!buildingCell("forest", object == null ? void 0 : object.kind)) return null;
        var radius = Number(object.radius) || 62;
        var halfWidth = Math.round(radius * 1.25);
        var halfHeight = Math.round(radius * 1.2);
        return {
          left: object.x - halfWidth,
          right: object.x + halfWidth,
          top: object.y - halfHeight,
          bottom: object.y + halfHeight
        };
      }
      function spriteFor(stageId, kind) {
        var cell = buildingCell(stageId, kind);
        return null;
      }
      function drawBuilding(ctx, object, stageId, nearby, decorative) {
        if (stageId === void 0) {
          stageId = "forest";
        }
        if (nearby === void 0) {
          nearby = false;
        }
        if (decorative === void 0) {
          decorative = false;
        }
        var sprite = spriteFor(stageId, object.kind);
        if (!sprite) return false;
        var box = buildingBounds(object),
          width = box.right - box.left,
          height = box.bottom - box.top;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "rgba(10,12,13,0.25)";
        ctx.fillRect(Math.round(box.left + 4), Math.round(box.bottom - 8), width, 12);
        var closed = closedBuildingLabel(object);
        if (closed) ctx.globalAlpha *= 0.68;
        var side = Math.min(width, height);
        ctx.drawImage(sprite, Math.round(object.x - side / 2), Math.round(box.bottom - side), side, side);
        if (closed) ctx.globalAlpha /= 0.68;
        if (nearby) {
          ctx.strokeStyle = "#eed493";
          ctx.lineWidth = 2;
          ctx.strokeRect(box.left - 3, box.top - 3, width + 6, height + 6);
        }
        if (!decorative || nearby) {
          var text = decorative ? "\u5C01\u5B58\u9057\u8FF9 \xB7 \u4E0D\u53EF\u8FDB\u5165" : closed ? object.name + " \xB7 " + closed : object.name;
          ctx.font = "700 12px sans-serif";
          var labelWidth = Math.max(width, ctx.measureText(text).width + 16);
          ctx.fillStyle = "rgba(8,10,11,0.92)";
          ctx.fillRect(object.x - labelWidth / 2, box.top - 28, labelWidth, 22);
          ctx.fillStyle = "#f0ddb0";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, object.x, box.top - 17);
        }
        ctx.restore();
        return true;
      }

      // prototype-2d-pixel/src/world-map.js
      var CHAPTER_REGIONS = Object.freeze([Object.freeze({
        id: "ferry",
        name: "\u7EB8\u7075\u6E21\u53E3",
        subtitle: "\u6D3B\u4EBA\u6B62\u6B65\uFF0C\u7EB8\u9A6C\u5148\u884C",
        guardian: "\u7EB8\u5AC1\u8863\u65E0\u5E38",
        unlockBoss: "reaper",
        bossAt: 300
      }), Object.freeze({
        id: "green-ruins",
        name: "\u9752\u5C71\u9057\u5E9C",
        subtitle: "\u5C71\u8179\u85CF\u7740\u524D\u671D\u9053\u85CF\u4E0E\u65AD\u5251",
        guardian: "\u65E0\u76F8\u661F\u541B",
        unlockBoss: "void_lord",
        bossAt: 600
      }), Object.freeze({
        id: "star-gate",
        name: "\u5929\u95E8\u846C\u661F\u53F0",
        subtitle: "\u7FA4\u661F\u5728\u95E8\u540E\u5012\u7740\u5347\u8D77",
        guardian: "\u592A\u5C81\u65F6\u8839",
        unlockBoss: "chrono_lich",
        bossAt: 720,
        "final": true
      })]);
      var ARCHITECTURE_THEMES = Object.freeze({
        forest: Object.freeze({
          ground: "#9aa193",
          ink: "#162923",
          roof: "#24483c",
          wall: "#c6bfa9",
          accent: "#8b3f32",
          water: "#54756d",
          mapText: "#162923",
          names: Object.freeze([["gate", "\u9752\u7BC6\u5C71\u95E8", "\u5B88\u4F4F\u901A\u5F80\u4E0B\u4E00\u754C\u7684\u5C71\u9053"], ["pavilion", "\u542C\u96E8\u836F\u4EAD", "\u53EF\u80FD\u9057\u7559\u529F\u6CD5\u6B8B\u9875\u4E0E\u7597\u4F24\u9053\u5177"], ["shrine", "\u65E0\u9762\u5C71\u7960", "\u4F9B\u684C\u540E\u85CF\u6709\u9057\u7269\u6216\u5E26\u4EE3\u4EF7\u547D\u5951"], ["ruin", "\u65AD\u5251\u9057\u5E9C", "\u53EF\u641C\u5BFB\u53E4\u88C5\u5907\u3001\u65E5\u5FD7\u4E0E\u878D\u5408\u7EBF\u7D22"]])
        }),
        crypt: Object.freeze({
          ground: "#211a20",
          ink: "#09080b",
          roof: "#4b1f2d",
          wall: "#76666c",
          accent: "#b55245",
          water: "#3d2434",
          mapText: "#e8d8c4",
          names: Object.freeze([["gate", "\u50A9\u620F\u57CE\u697C", "\u620F\u795E\u767B\u573A\u65F6\u57CE\u95E8\u624D\u4F1A\u5F20\u53E3"], ["pavilion", "\u65E0\u706F\u9B3C\u5E02\u68DA", "\u53EA\u6536\u672C\u5C40\u94DC\u94B1\u7684\u4E34\u65F6\u5546\u94FA"], ["shrine", "\u767E\u773C\u90AA\u7960", "\u53EF\u80FD\u57CB\u7740\u8BC5\u5492\u4E0E\u9AD8\u9636\u9057\u7269"], ["ruin", "\u7EB8\u68FA\u6863\u6848\u5E93", "\u8BB0\u5F55\u5931\u8E2A\u547D\u5951\u4E0E\u65E7\u65E5\u8DEF\u7EBF"]])
        }),
        tundra: Object.freeze({
          ground: "#7b9299",
          ink: "#162631",
          roof: "#31546a",
          wall: "#bac9c8",
          accent: "#78506f",
          water: "#426878",
          mapText: "#162631",
          names: Object.freeze([["gate", "\u661F\u9668\u5929\u5173", "\u51B0\u5C01\u95E8\u6D1E\u901A\u5411\u4E0B\u4E00\u5904\u65F6\u95F4\u88C2\u9699"], ["pavilion", "\u5931\u6E29\u70FD\u71E7", "\u53EF\u83B7\u5F97\u77ED\u6682\u5E87\u62A4\u6216\u5BD2\u7CFB\u529F\u6CD5"], ["shrine", "\u6708\u955C\u9F99\u7960", "\u9057\u7559\u9F99\u5973\u9057\u7269\u4E0E\u51BB\u7ED3\u547D\u5951"], ["ruin", "\u5760\u661F\u89C2\u6D4B\u53F0", "\u6563\u843D\u661F\u5916\u88C5\u5907\u4E0E\u89C2\u6D4B\u65E5\u5FD7"]])
        })
      });
      var MAP_MARKER_STYLES = Object.freeze({
        player: Object.freeze({
          label: "\u4F60",
          color: "#f6e7aa"
        }),
        boss: Object.freeze({
          label: "\u65F6",
          color: "#e65d52"
        }),
        bossChest: Object.freeze({
          label: "\u5323",
          color: "#e2b957"
        }),
        shop: Object.freeze({
          label: "\u5E02",
          color: "#b66682"
        }),
        relic: Object.freeze({
          label: "\u9057",
          color: "#79b999"
        }),
        log: Object.freeze({
          label: "\u5FD7",
          color: "#a5b9c9"
        }),
        loot: Object.freeze({
          label: "\u7269",
          color: "#d29762"
        }),
        event: Object.freeze({
          label: "\u5F02",
          color: "#9b75bb"
        }),
        portal: Object.freeze({
          label: "\u95E8",
          color: "#69c6c0"
        })
      });
      function estimateTravelSeconds(distance, speed, combatFactor) {
        if (speed === void 0) {
          speed = CONFIG.PLAYER_SPEED;
        }
        if (combatFactor === void 0) {
          combatFactor = 0.72;
        }
        var safeSpeed = Math.max(1, Number(speed) || CONFIG.PLAYER_SPEED);
        var factor = Math.max(0.25, Math.min(1, Number(combatFactor) || 0.72));
        return Math.max(0, Number(distance) || 0) / (safeSpeed * factor);
      }
      function endlessEventDistance(random, speed) {
        if (random === void 0) {
          random = Math.random;
        }
        if (speed === void 0) {
          speed = CONFIG.PLAYER_SPEED;
        }
        var roll = Math.max(0, Math.min(1, Number(random == null ? void 0 : random()) || 0));
        var targetTravelSeconds = 30 + roll * 45;
        return Math.round(Math.max(1, speed) * 0.72 * targetTravelSeconds);
      }
      function eventLifetimeForDistance(distance, speed, baseLifetime) {
        if (speed === void 0) {
          speed = CONFIG.PLAYER_SPEED;
        }
        if (baseLifetime === void 0) {
          baseLifetime = 360;
        }
        return Math.ceil(Math.max(baseLifetime, estimateTravelSeconds(distance, speed) + 240));
      }
      function projectMarker(marker, player, radius, worldRadius) {
        var dx = (marker.x || 0) - ((player == null ? void 0 : player.x) || 0);
        var dy = (marker.y || 0) - ((player == null ? void 0 : player.y) || 0);
        var distance = Math.hypot(dx, dy);
        var scale = radius / Math.max(1, worldRadius);
        var clamped = Math.min(radius - 8, distance * scale);
        var angle = Math.atan2(dy, dx);
        return _extends({}, marker, {
          mapX: Math.cos(angle) * clamped,
          mapY: Math.sin(angle) * clamped,
          distance: distance,
          offMap: distance > worldRadius
        });
      }
      function hash2(x, y, salt) {
        if (salt === void 0) {
          salt = 0;
        }
        var n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + salt * 69069;
        n = Math.imul(n ^ n >>> 13, 1274126177);
        return ((n ^ n >>> 16) >>> 0) / 4294967296;
      }
      function themeFor(stageId) {
        return ARCHITECTURE_THEMES[stageId] || ARCHITECTURE_THEMES.forest;
      }
      function structureRadius(kind) {
        return kind === "gate" ? 82 : kind === "ruin" ? 72 : 62;
      }
      var WorldMapSystem = exports('WorldMapSystem', /*#__PURE__*/function () {
        function WorldMapSystem(game) {
          this.game = game;
          this.mode = "chapter";
          this.stageId = "forest";
          this.regionIndex = 0;
          this.portal = null;
          this.generatedCells = /* @__PURE__ */new Map();
          this.visibleStructures = [];
          this.chapterStructures = [];
        }
        var _proto24 = WorldMapSystem.prototype;
        _proto24.reset = function reset(_temp12) {
          var _ref21 = _temp12 === void 0 ? {} : _temp12,
            _ref21$mode = _ref21.mode,
            mode = _ref21$mode === void 0 ? "chapter" : _ref21$mode,
            _ref21$stageId = _ref21.stageId,
            stageId = _ref21$stageId === void 0 ? "forest" : _ref21$stageId,
            player = _ref21.player;
          this.mode = mode === "endless" ? "endless" : "chapter";
          this.stageId = stageId;
          this.regionIndex = 0;
          this.portal = null;
          this.generatedCells.clear();
          this.visibleStructures = [];
          this.chapterStructures = this._makeChapterStructures(0);
          this.update(player);
        };
        _proto24.snapshot = function snapshot() {
          return {
            mode: this.mode,
            stageId: this.stageId,
            regionIndex: this.regionIndex,
            portal: this.portal ? _extends({}, this.portal) : null
          };
        };
        _proto24.restore = function restore(snapshot, player) {
          if (!snapshot) return;
          this.mode = snapshot.mode === "endless" ? "endless" : "chapter";
          this.stageId = snapshot.stageId || this.stageId;
          this.regionIndex = Math.max(0, Math.min(CHAPTER_REGIONS.length - 1, Number(snapshot.regionIndex) || 0));
          this.portal = snapshot.portal ? _extends({}, snapshot.portal) : null;
          this.chapterStructures = this._makeChapterStructures(this.regionIndex);
          this.update(player);
        };
        _proto24.currentRegion = function currentRegion() {
          return CHAPTER_REGIONS[this.regionIndex] || CHAPTER_REGIONS[0];
        };
        _proto24.update = function update(player) {
          if (!player) return;
          this.visibleStructures = this.mode === "endless" ? this._collectEndlessStructures(player) : [].concat(this.chapterStructures);
          this._resolvePlayerBuildings(player);
        };
        _proto24.resolveEntity = function resolveEntity(entity) {
          if (!entity) return;
          for (var _iterator61 = _createForOfIteratorHelperLoose(this.visibleStructures), _step61; !(_step61 = _iterator61()).done;) {
            var structure = _step61.value;
            resolveRectObstacle(entity, buildingBounds(structure));
          }
        };
        _proto24.projectileHit = function projectileHit(ax, ay, bx, by, radius) {
          if (radius === void 0) {
            radius = 0;
          }
          var nearest = null;
          for (var _i26 = 0, _arr10 = [].concat(this.visibleStructures, ((_this$game25 = this.game) == null || (_this$game25 = _this$game25.interactions) == null ? void 0 : _this$game25.objects) || []); _i26 < _arr10.length; _i26++) {
            var _this$game25;
            var object = _arr10[_i26];
            if (object.used && !isRetainedBuilding(object) || object.solid === false) continue;
            var box = buildingBounds(object);
            if (!box) continue;
            var hit = segmentRectHit(ax, ay, bx, by, box, radius);
            if (hit && (!nearest || hit.t < nearest.t)) nearest = hit;
          }
          return nearest;
        };
        _proto24.onBossDefeated = function onBossDefeated(boss, player, gameTime) {
          var _boss$type;
          if (gameTime === void 0) {
            gameTime = 0;
          }
          if (this.mode === "endless") return {
            victory: false,
            portal: null
          };
          var region = this.currentRegion();
          if (!boss || boss.id !== region.unlockBoss && ((_boss$type = boss.type) == null ? void 0 : _boss$type.sourceId) !== region.unlockBoss) return {
            victory: false,
            portal: null
          };
          if (region["final"]) return {
            victory: true,
            portal: null
          };
          if (this.portal) return {
            victory: false,
            portal: this.portal
          };
          var x = Math.min(CONFIG.ARENA_WIDTH - 130, Math.max(130, ((player == null ? void 0 : player.x) || 1200) + 520));
          var y = Math.min(CONFIG.ARENA_HEIGHT - 130, Math.max(130, (player == null ? void 0 : player.y) || 800));
          this.portal = {
            id: "chapter_portal_" + this.regionIndex,
            sourceId: "chapter_portal",
            kind: "portal",
            name: "\u901A\u5F80" + CHAPTER_REGIONS[this.regionIndex + 1].name,
            glyph: "\u95E8",
            x: x,
            y: y,
            radius: 54,
            solid: true,
            oneShot: true,
            persistent: true,
            directorManaged: false,
            used: false,
            spawnedAt: gameTime,
            expiresAt: Infinity,
            description: "\u5B88\u5173\u8005\u5DF2\u706D\u3002\u9760\u8FD1\u540E\u786E\u8BA4\uFF0C\u7A7F\u8FC7\u5C71\u95E8\u8FDB\u5165\u4E0B\u4E00\u7247\u72EC\u7ACB\u533A\u57DF\u3002"
          };
          return {
            victory: false,
            portal: this.portal
          };
        };
        _proto24.advanceRegion = function advanceRegion(player) {
          if (this.mode !== "chapter" || !this.portal || this.regionIndex >= CHAPTER_REGIONS.length - 1) return false;
          this.regionIndex += 1;
          this.portal = null;
          this.chapterStructures = this._makeChapterStructures(this.regionIndex);
          if (player) {
            player.x = CONFIG.CANVAS_WIDTH / 2;
            player.y = CONFIG.CANVAS_HEIGHT / 2;
          }
          this.update(player);
          return true;
        };
        _proto24.getMarkers = function getMarkers(game) {
          var _game;
          if (game === void 0) {
            game = this.game;
          }
          var markers = [];
          if ((_game = game) != null && _game.player) {
            markers.push({
              id: "player",
              kind: "player",
              x: game.player.x,
              y: game.player.y
            });
          }
          for (var _iterator62 = _createForOfIteratorHelperLoose(((_game2 = game) == null || (_game2 = _game2.interactions) == null ? void 0 : _game2.objects) || []), _step62; !(_step62 = _iterator62()).done;) {
            var _game2;
            var object = _step62.value;
            if (object.used) continue;
            var kind = object.bossChest ? "bossChest" : object.kind === "shop" ? "shop" : object.kind === "relic" ? "relic" : object.kind === "log" ? "log" : object.kind === "portal" ? "portal" : object.kind === "event" ? "event" : "loot";
            markers.push({
              id: object.id,
              kind: kind,
              name: object.name,
              x: object.x,
              y: object.y,
              expiresAt: object.expiresAt
            });
          }
          for (var _iterator63 = _createForOfIteratorHelperLoose(((_game3 = game) == null ? void 0 : _game3.enemies) || []), _step63; !(_step63 = _iterator63()).done;) {
            var _game3, _boss$type2;
            var boss = _step63.value;
            if (!boss.boss || boss.hp <= 0) continue;
            markers.push({
              id: "boss_" + boss.id,
              kind: "boss",
              name: (_boss$type2 = boss.type) == null ? void 0 : _boss$type2.name,
              x: boss.x,
              y: boss.y
            });
          }
          return markers;
        };
        _proto24.mapModel = function mapModel(game) {
          var _this11 = this,
            _game4;
          if (game === void 0) {
            game = this.game;
          }
          var current = this.currentRegion();
          return {
            mode: this.mode,
            stageId: this.stageId,
            regionIndex: this.regionIndex,
            current: current,
            regions: CHAPTER_REGIONS.map(function (region, index) {
              return _extends({}, region, {
                state: index < _this11.regionIndex ? "cleared" : index === _this11.regionIndex ? "current" : "locked"
              });
            }),
            markers: this.getMarkers(game),
            structures: [].concat(this.visibleStructures),
            route: ((_game4 = game) == null || (_game4 = _game4.chapterRoute) == null || _game4.mapModel == null ? void 0 : _game4.mapModel()) || null
          };
        };
        _proto24.drawMiniMap = function drawMiniMap(canvas, game) {
          var _game5;
          if (game === void 0) {
            game = this.game;
          }
          if (!canvas || !((_game5 = game) != null && _game5.player)) return;
          var ctx = canvas.getContext == null ? void 0 : canvas.getContext("2d");
          if (!ctx) return;
          var width = canvas.width;
          var height = canvas.height;
          var radius = Math.min(width, height) / 2 - 8;
          var cx = width / 2;
          var cy = height / 2;
          var worldRadius = this.mode === "endless" ? 9e3 : Math.max(CONFIG.ARENA_WIDTH, CONFIG.ARENA_HEIGHT) * 0.58;
          var theme = themeFor(this.stageId);
          ctx.clearRect(0, 0, width, height);
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = theme.ground;
          ctx.fillRect(0, 0, width, height);
          ctx.strokeStyle = theme.ink + "55";
          ctx.lineWidth = 1;
          for (var i = -4; i <= 4; i += 1) {
            ctx.beginPath();
            ctx.moveTo(cx + i * 24, cy - radius);
            ctx.lineTo(cx + i * 24, cy + radius);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - radius, cy + i * 24);
            ctx.lineTo(cx + radius, cy + i * 24);
            ctx.stroke();
          }
          for (var _iterator64 = _createForOfIteratorHelperLoose(this.getMarkers(game)), _step64; !(_step64 = _iterator64()).done;) {
            var marker = _step64.value;
            var p = projectMarker(marker, game.player, radius, worldRadius);
            var style = MAP_MARKER_STYLES[marker.kind] || MAP_MARKER_STYLES.loot;
            ctx.fillStyle = style.color;
            ctx.beginPath();
            ctx.arc(cx + p.mapX, cy + p.mapY, marker.kind === "player" ? 5 : 4, 0, Math.PI * 2);
            ctx.fill();
            if (p.offMap && marker.kind !== "player") {
              ctx.strokeStyle = "#f7e6a7";
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
          ctx.restore();
          ctx.strokeStyle = "#d3b879";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();
        };
        _proto24.drawFullMap = function drawFullMap(canvas, game, view) {
          var _game6, _game$chapterRoute;
          if (game === void 0) {
            game = this.game;
          }
          if (view === void 0) {
            view = {};
          }
          if (!canvas || !((_game6 = game) != null && _game6.player)) return;
          var ctx = canvas.getContext == null ? void 0 : canvas.getContext("2d");
          if (!ctx) return;
          var width = canvas.width;
          var height = canvas.height;
          var theme = themeFor(this.stageId);
          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = theme.ground;
          ctx.fillRect(0, 0, width, height);
          ctx.strokeStyle = theme.ink + "44";
          for (var x = 0; x < width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
          for (var y = 0; y < height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }
          var baseWorldRadius = this.mode === "endless" ? 12e3 : Math.max(CONFIG.ARENA_WIDTH, CONFIG.ARENA_HEIGHT) * 0.7;
          var zoom = Math.max(0.65, Math.min(3, Number(view.zoom) || 1));
          var worldRadius = baseWorldRadius / zoom;
          var cx = width / 2;
          var cy = height / 2;
          var radius = Math.min(width, height) * 0.44;
          var focus = {
            x: game.player.x + (Number(view.panX) || 0),
            y: game.player.y + (Number(view.panY) || 0)
          };
          for (var _iterator65 = _createForOfIteratorHelperLoose(this.getMarkers(game)), _step65; !(_step65 = _iterator65()).done;) {
            var marker = _step65.value;
            var p = projectMarker(marker, focus, radius, worldRadius);
            var style = MAP_MARKER_STYLES[marker.kind] || MAP_MARKER_STYLES.loot;
            var _x2 = cx + p.mapX;
            var _y = cy + p.mapY;
            ctx.fillStyle = style.color;
            ctx.fillRect(_x2 - 8, _y - 8, 16, 16);
            ctx.fillStyle = "#0e1112";
            ctx.font = "700 10px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(style.label, _x2, _y + 1);
            if (marker.name && marker.kind !== "player") {
              ctx.fillStyle = theme.mapText;
              ctx.font = "11px sans-serif";
              ctx.fillText(marker.name, _x2, _y - 15);
            }
          }
          ctx.fillStyle = theme.mapText;
          ctx.font = "700 13px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(this.mode === "endless" ? "\u5730\u56FE\u968F\u4EBA\u7269\u79FB\u52A8 \xB7 " + Math.round(zoom * 100) + "% \xB7 \u62D6\u52A8\u67E5\u770B\u8FDC\u65B9" : "\u5F53\u524D\u533A\u57DF\uFF1A" + (((_game$chapterRoute = game.chapterRoute) == null || _game$chapterRoute.current == null ? void 0 : _game$chapterRoute.current().name) || this.currentRegion().name), 16, 24);
        };
        _proto24.render = function render(ctx) {
          for (var _iterator66 = _createForOfIteratorHelperLoose(this.visibleStructures), _step66; !(_step66 = _iterator66()).done;) {
            var structure = _step66.value;
            this._drawStructure(ctx, structure);
          }
        };
        _proto24._makeChapterStructures = function _makeChapterStructures(regionIndex) {
          var _this$game26;
          var node = (_this$game26 = this.game) == null || (_this$game26 = _this$game26.chapterRoute) == null || _this$game26.current == null ? void 0 : _this$game26.current();
          if ((node == null ? void 0 : node.type) !== "boss") return [];
          var kindByRoom = {
            shop: "pavilion",
            shrine: "shrine",
            reward: "ruin",
            event: "ruin",
            gold: "pavilion",
            boss: "gate"
          };
          var kind = kindByRoom[node == null ? void 0 : node.type];
          if (!kind) return [];
          var structure = this._structureFromSeed(CONFIG.ARENA_WIDTH / 2, 300, regionIndex * 17 + Math.round(((node == null ? void 0 : node.threatBonus) || 0) * 100));
          structure.kind = kind;
          structure.radius = structureRadius(kind);
          structure.name = (node == null ? void 0 : node.name) || structure.name;
          structure.rewardHint = (node == null ? void 0 : node.label) || structure.rewardHint;
          return [structure];
        };
        _proto24.configureChapterRoom = function configureChapterRoom(node, player) {
          if (this.mode !== "chapter") return;
          this.chapterStructures = this._makeChapterStructures(Math.round(((node == null ? void 0 : node.threatBonus) || 0) * 100));
          this.visibleStructures = [].concat(this.chapterStructures);
          this.portal = null;
          this.update(player);
        };
        _proto24._collectEndlessStructures = function _collectEndlessStructures(player) {
          var cellSize = 1800;
          var cellX = Math.floor(player.x / cellSize);
          var cellY = Math.floor(player.y / cellSize);
          var result = [];
          for (var yy = cellY - 1; yy <= cellY + 1; yy += 1) {
            for (var xx = cellX - 1; xx <= cellX + 1; xx += 1) {
              var key = xx + ":" + yy + ":" + this.stageId;
              if (!this.generatedCells.has(key)) {
                var list = [];
                for (var i = 0; i < 1; i += 1) {
                  var x = xx * cellSize + 260 + hash2(xx, yy, i * 5 + 1) * (cellSize - 520);
                  var y = yy * cellSize + 260 + hash2(xx, yy, i * 5 + 2) * (cellSize - 520);
                  var structure = this._structureFromSeed(x, y, xx * 31 + yy * 17 + i);
                  structure.kind = "gate";
                  list.push(structure);
                }
                this.generatedCells.set(key, list);
              }
              result.push.apply(result, this.generatedCells.get(key));
            }
          }
          return result;
        };
        _proto24._structureFromSeed = function _structureFromSeed(x, y, seed) {
          var theme = themeFor(this.stageId);
          var index = Math.abs(Math.floor(seed)) % theme.names.length;
          var _theme$names$index = theme.names[index],
            kind = _theme$names$index[0],
            name = _theme$names$index[1],
            rewardHint = _theme$names$index[2];
          return {
            id: "building_" + Math.round(x) + "_" + Math.round(y),
            kind: kind,
            name: name,
            rewardHint: rewardHint,
            x: x,
            y: y,
            radius: structureRadius(kind)
          };
        };
        _proto24._resolvePlayerBuildings = function _resolvePlayerBuildings(player) {
          this.resolveEntity(player);
        };
        _proto24._drawStructure = function _drawStructure(ctx, structure) {
          var _this$game27;
          var player = (_this$game27 = this.game) == null ? void 0 : _this$game27.player;
          var near = player && Math.hypot(player.x - structure.x, player.y - structure.y) < 230;
          if (drawBuilding(ctx, structure, this.stageId, near, true)) return;
          var theme = themeFor(this.stageId);
          var x = Math.round(structure.x);
          var y = Math.round(structure.y);
          var r = structure.radius;
          ctx.save();
          ctx.translate(x, y);
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.fillRect(-r + 8, r - 4, r * 2, 18);
          if (structure.kind === "gate") {
            ctx.fillStyle = theme.wall;
            ctx.fillRect(-r, -18, 24, 70);
            ctx.fillRect(r - 24, -18, 24, 70);
            ctx.fillStyle = theme.roof;
            ctx.fillRect(-r - 12, -44, r * 2 + 24, 26);
            ctx.fillRect(-r + 4, -58, r * 2 - 8, 14);
            ctx.fillStyle = theme.accent;
            ctx.fillRect(-12, -40, 24, 22);
          } else if (structure.kind === "pavilion") {
            ctx.fillStyle = theme.wall;
            ctx.fillRect(-r + 12, -10, r * 2 - 24, 58);
            ctx.fillStyle = theme.roof;
            ctx.fillRect(-r, -40, r * 2, 22);
            ctx.fillRect(-r + 12, -54, r * 2 - 24, 14);
            ctx.fillStyle = theme.accent;
            ctx.fillRect(-6, 8, 12, 40);
          } else if (structure.kind === "shrine") {
            ctx.fillStyle = theme.wall;
            ctx.fillRect(-r + 10, -22, r * 2 - 20, 68);
            ctx.fillStyle = theme.roof;
            ctx.fillRect(-r, -46, r * 2, 24);
            ctx.fillStyle = theme.accent;
            ctx.fillRect(-18, -8, 36, 34);
            ctx.fillStyle = "#171518";
            ctx.fillRect(-7, 0, 14, 18);
          } else {
            ctx.fillStyle = theme.wall;
            ctx.fillRect(-r, -12, 34, 58);
            ctx.fillRect(-8, -36, 30, 82);
            ctx.fillRect(38, 2, 24, 44);
            ctx.fillStyle = theme.ink;
            ctx.fillRect(-r - 8, 44, r * 2 + 16, 8);
            ctx.fillStyle = theme.accent;
            ctx.fillRect(-1, -28, 8, 18);
          }
          ctx.fillStyle = "rgba(8,10,11,0.84)";
          ctx.fillRect(-r, r + 17, r * 2, 20);
          ctx.fillStyle = "#ead8a8";
          ctx.font = "700 12px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(structure.name, 0, r + 27);
          ctx.restore();
        };
        return WorldMapSystem;
      }());

      // prototype-2d-pixel/src/interactions.js
      var INTERACTION_DISTANCE = 92;
      var EVENT_RULES = Object.freeze({
        chapter: Object.freeze({
          firstMin: 35,
          firstMax: 75,
          gapMin: 120,
          gapMax: 190,
          maxScenes: 5
        }),
        endless: Object.freeze({
          firstMin: 35,
          firstMax: 75,
          gapMin: 130,
          gapMax: 210,
          maxScenes: Infinity
        })
      });
      var WORLD_INTERACTIONS = Object.freeze([Object.freeze({
        id: "ghost_market",
        kind: "shop",
        name: "\u65E0\u706F\u9B3C\u5E02",
        glyph: "\u5E02",
        radius: 62,
        solid: true,
        oneShot: false,
        lifetime: 480,
        description: "\u4F7F\u7528\u672C\u5C40\u94DC\u94B1\u4EA4\u6613\uFF0C\u6BCF\u5EA7\u6700\u591A\u6210\u4EA4\u4E09\u6B21\uFF1B\u6BCF\u4EF6\u9650\u8D2D\u4E00\u6B21\u3002\u8D27\u54C1\u56FA\u5B9A\uFF0C\u5173\u95ED\u6216\u8BFB\u6863\u4E0D\u4F1A\u6362\u8D27\u3002"
      }), Object.freeze({
        id: "relic_ruin",
        kind: "relic",
        name: "\u9752\u5C71\u9057\u5E9C",
        glyph: "\u9057",
        radius: 68,
        solid: true,
        oneShot: true,
        lifetime: 540,
        description: "\u5C71\u8179\u6B8B\u5B58\u7684\u524D\u671D\u9053\u5E9C\u3002\u8FDB\u5165\u540E\u53EF\u4ECE\u5F53\u524D\u63D0\u4F9B\u7684\u9057\u7269\u4E2D\u62E9\u4E00\u3002"
      }), Object.freeze({
        id: "lost_log",
        kind: "log",
        name: "\u7EB8\u68FA\u884C\u65E5\u5FD7",
        glyph: "\u5FD7",
        radius: 24,
        solid: false,
        oneShot: true,
        lifetime: Infinity,
        description: "\u6563\u843D\u5728\u9053\u8DEF\u4E0E\u6B8B\u57A3\u65C1\u7684\u884C\u65C5\u8BB0\u5F55\u3002\u53EA\u8865\u5168\u4E16\u754C\u7EBF\u7D22\uFF0C\u4E0D\u5360\u636E\u7279\u6B8A\u623F\u95F4\u3002"
      }), Object.freeze({
        id: "scattered_cache",
        kind: "loot",
        name: "\u5931\u4E3B\u884C\u56CA",
        glyph: "\u7269",
        radius: 34,
        solid: true,
        oneShot: true,
        lifetime: 420,
        description: "\u524D\u4EBA\u9057\u843D\u7684\u9053\u5177\u4E0E\u88C5\u5907\u7BB1\uFF0C\u4E0D\u4E0E Boss \u6218\u5229\u54C1\u5171\u7528\u6389\u843D\u89C4\u5219\u3002"
      }), Object.freeze({
        id: "paper_tea",
        kind: "event",
        name: "\u7EB8\u4EBA\u8336\u644A",
        glyph: "\u5F02",
        radius: 52,
        solid: true,
        oneShot: true,
        lifetime: 480,
        description: "\u7EB8\u4EBA\u66FF\u4F60\u659F\u4E0B\u4E00\u76CF\u65E7\u8336\u3002\u4E24\u79CD\u9009\u62E9\u90FD\u6709\u4EE3\u4EF7\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u786E\u8BA4\u3002"
      })]);
      var DIRECTOR_INTERACTIONS = WORLD_INTERACTIONS.filter(function (item) {
        return item.id !== "lost_log";
      });
      function eventDelay(mode, random, first) {
        if (mode === void 0) {
          mode = "chapter";
        }
        if (random === void 0) {
          random = Math.random;
        }
        if (first === void 0) {
          first = false;
        }
        var rules = EVENT_RULES[mode] || EVENT_RULES.chapter;
        var min = first ? rules.firstMin : rules.gapMin;
        var max = first ? rules.firstMax : rules.gapMax;
        return min + (max - min) * Math.max(0, Math.min(1, Number(random()) || 0));
      }
      function directionLabel(dx, dy) {
        var index = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
        return ["\u4E1C", "\u4E1C\u5357", "\u5357", "\u897F\u5357", "\u897F", "\u897F\u5317", "\u5317", "\u4E1C\u5317"][(index + 8) % 8];
      }
      var InteractionSystem = exports('InteractionSystem', /*#__PURE__*/function () {
        function InteractionSystem(game) {
          this.game = game;
          this.objects = [];
          this.nearby = null;
          this.mode = "chapter";
          this.random = Math.random;
          this.spawned = 0;
          this.nextSpawnAt = Infinity;
          this.qa = false;
          this.lastSourceId = null;
        }
        var _proto25 = InteractionSystem.prototype;
        _proto25.reset = function reset(player, _temp13) {
          var _this$game28, _this$game29;
          var _ref22 = _temp13 === void 0 ? {} : _temp13,
            _ref22$mode = _ref22.mode,
            mode = _ref22$mode === void 0 ? "chapter" : _ref22$mode,
            _ref22$random = _ref22.random,
            random = _ref22$random === void 0 ? Math.random : _ref22$random,
            _ref22$qa = _ref22.qa,
            qa = _ref22$qa === void 0 ? false : _ref22$qa;
          this.nearby = null;
          this.objects = [];
          this.mode = mode === "endless" ? "endless" : "chapter";
          this.random = typeof random === "function" ? random : Math.random;
          this.spawned = 0;
          this.qa = !!qa;
          this.lastSourceId = null;
          this.nextSpawnAt = qa ? 2 : eventDelay(this.mode, this.random, true);
          (_this$game28 = this.game) == null || (_this$game28 = _this$game28.ui) == null || _this$game28.hideInteractionPrompt == null || _this$game28.hideInteractionPrompt();
          (_this$game29 = this.game) == null || (_this$game29 = _this$game29.ui) == null || _this$game29.updateWorldEventTracker == null || _this$game29.updateWorldEventTracker(null);
        };
        _proto25.update = function update(player, gameTime) {
          var _nearest, _this$nearby, _this$game33;
          if (gameTime === void 0) {
            var _this$game30;
            gameTime = ((_this$game30 = this.game) == null ? void 0 : _this$game30.gameTime) || 0;
          }
          if (!player) return null;
          this.objects = this.objects.filter(function (obj) {
            if (!obj.used) return true;
            return isRetainedBuilding(obj) && (obj.persistent || !Number.isFinite(obj.expiresAt) || obj.expiresAt > gameTime);
          });
          var expired = this.objects.find(function (obj) {
            return !obj.used && Number.isFinite(obj.expiresAt) && obj.expiresAt <= gameTime;
          });
          if (expired) this.complete(expired.id, gameTime, "\u6D88\u6563");
          if (!this.activeObject() && this._canSpawn(gameTime)) this._spawn(player, gameTime);
          this._resolvePlayerObstacles(player);
          var nearest = null;
          var best = Infinity;
          for (var _iterator67 = _createForOfIteratorHelperLoose(this.objects), _step67; !(_step67 = _iterator67()).done;) {
            var obj = _step67.value;
            if (obj.used) continue;
            var d = Math.hypot(player.x - obj.x, player.y - obj.y);
            if (d <= INTERACTION_DISTANCE + obj.radius && d < best) {
              nearest = obj;
              best = d;
            }
          }
          if (((_nearest = nearest) == null ? void 0 : _nearest.id) !== ((_this$nearby = this.nearby) == null ? void 0 : _this$nearby.id)) {
            var _this$game31, _this$game32;
            this.nearby = nearest;
            if (nearest) (_this$game31 = this.game) == null || (_this$game31 = _this$game31.ui) == null || _this$game31.showInteractionPrompt == null || _this$game31.showInteractionPrompt(nearest);else (_this$game32 = this.game) == null || (_this$game32 = _this$game32.ui) == null || _this$game32.hideInteractionPrompt == null || _this$game32.hideInteractionPrompt();
          }
          (_this$game33 = this.game) == null || (_this$game33 = _this$game33.ui) == null || _this$game33.updateWorldEventTracker == null || _this$game33.updateWorldEventTracker(this.getTracker(player, gameTime));
          return nearest;
        };
        _proto25._canSpawn = function _canSpawn(gameTime) {
          var limit = (EVENT_RULES[this.mode] || EVENT_RULES.chapter).maxScenes;
          return this.spawned < limit && gameTime >= this.nextSpawnAt;
        };
        _proto25._spawn = function _spawn(player, gameTime, forcedSourceId) {
          var _this$game34, _this$game35;
          if (forcedSourceId === void 0) {
            forcedSourceId = null;
          }
          var roll = Math.min(0.999999, Math.max(0, Number(this.random()) || 0));
          var def = forcedSourceId ? WORLD_INTERACTIONS.find(function (item) {
            return item.id === forcedSourceId;
          }) : DIRECTOR_INTERACTIONS[Math.floor(roll * DIRECTOR_INTERACTIONS.length)];
          def || (def = DIRECTOR_INTERACTIONS[0]);
          if (!forcedSourceId && def.id === this.lastSourceId) {
            def = DIRECTOR_INTERACTIONS[(DIRECTOR_INTERACTIONS.indexOf(def) + 1) % DIRECTOR_INTERACTIONS.length];
          }
          this.lastSourceId = def.id;
          var angle = this.random() * Math.PI * 2;
          var distance = this.qa ? 420 : this.mode === "endless" ? endlessEventDistance(this.random, CONFIG.PLAYER_SPEED) : 520 + this.random() * 520;
          var x = player.x + Math.cos(angle) * distance;
          var y = player.y + Math.sin(angle) * distance;
          if (this.mode === "chapter") {
            x = Math.max(70, Math.min((CONFIG.ARENA_WIDTH || 2400) - 70, x));
            y = Math.max(70, Math.min((CONFIG.ARENA_HEIGHT || 1600) - 70, y));
          }
          var obj = _extends({}, def, {
            name: buildingName((_this$game34 = this.game) == null ? void 0 : _this$game34.stageId, def.kind) || def.name,
            id: def.id + "_" + (this.spawned + 1),
            sourceId: def.id,
            x: x,
            y: y,
            used: false,
            purchaseCount: 0,
            directorManaged: true,
            persistent: false,
            travelSeconds: Math.ceil(distance / Math.max(1, CONFIG.PLAYER_SPEED * 0.72)),
            spawnedAt: gameTime,
            expiresAt: gameTime + (this.qa ? 90 : eventLifetimeForDistance(distance, CONFIG.PLAYER_SPEED, def.lifetime))
          });
          this.objects.push(obj);
          this.spawned += 1;
          this.nextSpawnAt = Infinity;
          (_this$game35 = this.game) == null || _this$game35._announce == null || _this$game35._announce("\u5173\u952E\u5730\u70B9\u51FA\u73B0\uFF1A" + obj.name + "\u3002\u5C0F\u5730\u56FE\u5DF2\u6807\u51FA\u4F4D\u7F6E\uFF0C\u9884\u8BA1 " + obj.travelSeconds + " \u79D2\u5185\u53EF\u5230\u8FBE\u3002");
          return obj;
        };
        _proto25.activeObject = function activeObject() {
          return this.objects.find(function (obj) {
            return !obj.used && obj.directorManaged !== false;
          }) || null;
        };
        _proto25.getTracker = function getTracker(player, gameTime) {
          if (gameTime === void 0) {
            var _this$game36;
            gameTime = ((_this$game36 = this.game) == null ? void 0 : _this$game36.gameTime) || 0;
          }
          var obj = this.activeObject();
          if (!obj || !player) return null;
          var dx = obj.x - player.x;
          var dy = obj.y - player.y;
          return {
            name: obj.name,
            glyph: obj.glyph,
            direction: directionLabel(dx, dy),
            distance: Math.max(0, Math.round(Math.hypot(dx, dy) / 10)),
            remaining: Math.max(0, Math.ceil(obj.expiresAt - gameTime))
          };
        };
        _proto25.useNearby = function useNearby() {
          var _this$game37;
          if (!this.nearby) return false;
          return !!((_this$game37 = this.game) != null && _this$game37.openWorldInteraction != null && _this$game37.openWorldInteraction(this.nearby));
        };
        _proto25.complete = function complete(id, gameTime, reason) {
          var _this$nearby2, _this$game40, _this$game41;
          if (gameTime === void 0) {
            var _this$game38;
            gameTime = ((_this$game38 = this.game) == null ? void 0 : _this$game38.gameTime) || 0;
          }
          if (reason === void 0) {
            reason = "\u5B8C\u6210";
          }
          var obj = this.objects.find(function (item) {
            return item.id === id;
          });
          if (!obj || obj.used) return false;
          obj.used = true;
          obj.closedBuilding = reason !== "\u6D88\u6563" && !!buildingBounds(obj);
          if (((_this$nearby2 = this.nearby) == null ? void 0 : _this$nearby2.id) === id) {
            var _this$game39;
            this.nearby = null;
            (_this$game39 = this.game) == null || (_this$game39 = _this$game39.ui) == null || _this$game39.hideInteractionPrompt == null || _this$game39.hideInteractionPrompt();
          }
          var rules = EVENT_RULES[this.mode] || EVENT_RULES.chapter;
          if (obj.directorManaged !== false) {
            this.nextSpawnAt = this.spawned >= rules.maxScenes ? Infinity : gameTime + (this.qa ? 4 : eventDelay(this.mode, this.random, false));
          }
          (_this$game40 = this.game) == null || (_this$game40 = _this$game40.ui) == null || _this$game40.updateWorldEventTracker == null || _this$game40.updateWorldEventTracker(null);
          if (reason === "\u6D88\u6563") (_this$game41 = this.game) == null || _this$game41._announce == null || _this$game41._announce(obj.name + "\u672A\u88AB\u89E6\u53CA\uFF0C\u5DF2\u4ECE\u5C71\u6D77\u95F4\u6D88\u6563\u3002");
          return true;
        };
        _proto25.markUsed = function markUsed(id) {
          return this.complete(id);
        };
        _proto25.spawnBossChest = function spawnBossChest(x, y, bossName, gameTime) {
          var _this$game43;
          if (bossName === void 0) {
            bossName = "\u65F6\u95F4 Boss";
          }
          if (gameTime === void 0) {
            var _this$game42;
            gameTime = ((_this$game42 = this.game) == null ? void 0 : _this$game42.gameTime) || 0;
          }
          var chest = {
            id: "boss_chest_" + Math.round(gameTime * 1e3) + "_" + this.objects.length,
            sourceId: "boss_chest",
            kind: "chest",
            name: bossName + " \xB7 \u9547\u7269\u5B9D\u5323",
            glyph: "\u5323",
            radius: 42,
            solid: true,
            oneShot: true,
            bossChest: true,
            directorManaged: false,
            persistent: true,
            used: false,
            purchaseCount: 0,
            spawnedAt: gameTime,
            expiresAt: Infinity,
            description: "\u65F6\u95F4 Boss \u9057\u7559\u7684\u5B9D\u5323\u3002\u53EF\u83B7\u5F97\u6B66\u5668/\u529F\u6CD5\u5347\u7EA7\u3001\u5929\u8D4B\u5F3A\u5316\u6216\u9057\u7269\u4E09\u9009\u4E00\u3002",
            x: x,
            y: y
          };
          this.objects.push(chest);
          (_this$game43 = this.game) == null || _this$game43._announce == null || _this$game43._announce(bossName + "\u6389\u843D\u9547\u7269\u5B9D\u5323\uFF1B\u5B9D\u5323\u4E0D\u4F1A\u968F\u65F6\u95F4\u6D88\u5931\u3002");
          return chest;
        };
        _proto25.spawnFixture = function spawnFixture(sourceId, x, y, overrides) {
          var _this$game44, _this$game45;
          if (overrides === void 0) {
            overrides = {};
          }
          var def = WORLD_INTERACTIONS.find(function (item) {
            return item.id === sourceId;
          }) || WORLD_INTERACTIONS[0];
          var fixture = _extends({}, def, {
            name: buildingName((_this$game44 = this.game) == null ? void 0 : _this$game44.stageId, overrides.kind || def.kind) || def.name
          }, overrides, {
            id: overrides.id || "fixture_" + sourceId + "_" + this.objects.length,
            sourceId: sourceId,
            x: x,
            y: y,
            directorManaged: false,
            persistent: true,
            used: false,
            purchaseCount: 0,
            spawnedAt: ((_this$game45 = this.game) == null ? void 0 : _this$game45.gameTime) || 0,
            expiresAt: Infinity
          });
          this.objects.push(fixture);
          return fixture;
        };
        _proto25.spawnAmbientLog = function spawnAmbientLog(player, roomId) {
          if (roomId === void 0) {
            roomId = "room";
          }
          if (!player) return null;
          var angle = this.random() * Math.PI * 2;
          var distance = 320 + this.random() * 520;
          var x = Math.max(90, Math.min((CONFIG.ARENA_WIDTH || 3600) - 90, player.x + Math.cos(angle) * distance));
          var y = Math.max(90, Math.min((CONFIG.ARENA_HEIGHT || 2400) - 90, player.y + Math.sin(angle) * distance));
          return this.spawnFixture("lost_log", x, y, {
            id: "ambient_log_" + roomId + "_" + this.objects.length,
            name: "\u6563\u843D\u7684\u547D\u5951\u6B8B\u9875",
            solid: false,
            persistent: false,
            description: "\u4E00\u9875\u88AB\u98CE\u5439\u5230\u6B64\u5904\u7684\u65E7\u8BB0\u5F55\u3002\u9605\u8BFB\u53EA\u8865\u5168\u56FE\u9274\u4E0E\u4E16\u754C\u7EBF\u7D22\u3002"
          });
        };
        _proto25.spawnPortal = function spawnPortal(portal) {
          if (!portal || this.objects.some(function (obj) {
            return obj.id === portal.id && !obj.used;
          })) return null;
          var copy = _extends({}, portal);
          this.objects.push(copy);
          return copy;
        };
        _proto25.enterChapterRegion = function enterChapterRegion(player, gameTime) {
          var _this$game47, _this$game48;
          if (gameTime === void 0) {
            var _this$game46;
            gameTime = ((_this$game46 = this.game) == null ? void 0 : _this$game46.gameTime) || 0;
          }
          for (var _iterator68 = _createForOfIteratorHelperLoose(this.objects), _step68; !(_step68 = _iterator68()).done;) {
            var object = _step68.value;
            object.used = true;
            object.closedBuilding = false;
          }
          this.nearby = null;
          (_this$game47 = this.game) == null || (_this$game47 = _this$game47.ui) == null || _this$game47.hideInteractionPrompt == null || _this$game47.hideInteractionPrompt();
          this.nextSpawnAt = gameTime + eventDelay("chapter", this.random, false);
          (_this$game48 = this.game) == null || (_this$game48 = _this$game48.ui) == null || _this$game48.updateWorldEventTracker == null || _this$game48.updateWorldEventTracker(null);
          this.update(player, gameTime);
        };
        _proto25.snapshot = function snapshot() {
          return {
            mode: this.mode,
            spawned: this.spawned,
            nextSpawnAt: this.nextSpawnAt,
            lastSourceId: this.lastSourceId,
            objects: this.objects.filter(function (obj) {
              return !obj.used || isRetainedBuilding(obj);
            }).map(function (obj) {
              return _extends({}, obj, obj.offers ? {
                offers: obj.offers.map(function (offer) {
                  return _extends({}, offer);
                })
              } : {}, {
                expiresAt: Number.isFinite(obj.expiresAt) ? obj.expiresAt : null
              });
            })
          };
        };
        _proto25.restore = function restore(snapshot, player) {
          var _this$game49;
          if (!snapshot) return false;
          this.mode = snapshot.mode === "endless" ? "endless" : "chapter";
          this.spawned = Math.max(0, Number(snapshot.spawned) || 0);
          this.nextSpawnAt = snapshot.nextSpawnAt === null || snapshot.nextSpawnAt === Infinity ? Infinity : Number.isFinite(snapshot.nextSpawnAt) ? snapshot.nextSpawnAt : eventDelay(this.mode, this.random, false);
          this.lastSourceId = snapshot.lastSourceId || null;
          this.objects = Array.isArray(snapshot.objects) ? snapshot.objects.map(function (obj) {
            return _extends({}, obj, Array.isArray(obj.offers) ? {
              offers: obj.offers.slice(0, 3).filter(function (offer) {
                return offer && ["weapon", "passive", "relic", "supply"].includes(offer.kind) && typeof offer.id === "string";
              }).map(function (offer) {
                return {
                  kind: offer.kind,
                  id: offer.id,
                  purchased: !!offer.purchased
                };
              })
            } : {
              offers: void 0
            }, {
              used: !!obj.used,
              closedBuilding: !!obj.closedBuilding && !!obj.used && !!buildingBounds(obj),
              expiresAt: obj.expiresAt == null && obj.persistent ? Infinity : obj.expiresAt
            });
          }) : [];
          this.nearby = null;
          this.update(player, ((_this$game49 = this.game) == null ? void 0 : _this$game49.gameTime) || 0);
          return true;
        };
        _proto25._resolvePlayerObstacles = function _resolvePlayerObstacles(player) {
          this.resolveEntity(player);
        };
        _proto25.resolveEntity = function resolveEntity(player) {
          for (var _iterator69 = _createForOfIteratorHelperLoose(this.objects), _step69; !(_step69 = _iterator69()).done;) {
            var obj = _step69.value;
            if (!obj.solid || obj.used && !isRetainedBuilding(obj)) continue;
            var box = buildingBounds(obj);
            if (box) resolveRectObstacle(player, box);else resolveCircleObstacle(player, obj);
          }
        };
        _proto25.render = function render(ctx) {
          for (var _iterator70 = _createForOfIteratorHelperLoose(this.objects), _step70; !(_step70 = _iterator70()).done;) {
            var _this$game50, _this$nearby3, _this$nearby4;
            var obj = _step70.value;
            if (obj.used && !isRetainedBuilding(obj)) continue;
            if (drawBuilding(ctx, obj, (_this$game50 = this.game) == null ? void 0 : _this$game50.stageId, ((_this$nearby3 = this.nearby) == null ? void 0 : _this$nearby3.id) === obj.id)) continue;
            var s = Math.round(obj.radius);
            ctx.save();
            ctx.translate(Math.round(obj.x), Math.round(obj.y));
            this._renderObject(ctx, obj, s);
            if (((_this$nearby4 = this.nearby) == null ? void 0 : _this$nearby4.id) === obj.id) {
              ctx.strokeStyle = "#f1d58b";
              ctx.lineWidth = 3;
              ctx.strokeRect(-s - 5, -s - 5, s * 2 + 10, s * 2 + 10);
            }
            ctx.restore();
          }
        };
        _proto25._renderObject = function _renderObject(ctx, obj, s) {
          ctx.fillStyle = "rgba(0,0,0,0.34)";
          ctx.fillRect(-s - 8, s - 6, (s + 8) * 2, 16);
          if (obj.kind === "shop") {
            ctx.fillStyle = "#4a2231";
            ctx.fillRect(-s, -22, s * 2, s + 28);
            ctx.fillStyle = "#8e3f55";
            ctx.fillRect(-s - 12, -42, s * 2 + 24, 20);
            ctx.fillStyle = "#d2a859";
            for (var x = -s + 8; x < s; x += 20) ctx.fillRect(x, -36, 10, 10);
          } else if (obj.kind === "relic") {
            ctx.fillStyle = "#5d665d";
            ctx.fillRect(-s, -20, 34, s + 24);
            ctx.fillRect(-8, -56, 38, s + 60);
            ctx.fillRect(s - 26, 4, 24, s);
            ctx.fillStyle = "#74a78d";
            ctx.fillRect(-2, -48, 10, 24);
          } else if (obj.kind === "event") {
            ctx.fillStyle = "#3f2b49";
            ctx.fillRect(-s, -18, s * 2, s + 24);
            ctx.fillStyle = "#75518a";
            ctx.fillRect(-s - 10, -38, s * 2 + 20, 20);
            ctx.fillStyle = "#d7c4a1";
            ctx.fillRect(-24, 8, 48, 14);
          } else if (obj.kind === "portal") {
            ctx.fillStyle = "#263f45";
            ctx.fillRect(-s, -s, 18, s * 2);
            ctx.fillRect(s - 18, -s, 18, s * 2);
            ctx.fillRect(-s, -s, s * 2, 20);
            ctx.strokeStyle = "#63c8c0";
            ctx.lineWidth = 5;
            ctx.strokeRect(-s + 22, -s + 24, s * 2 - 44, s * 2 - 28);
          } else if (obj.bossChest || obj.kind === "chest") {
            ctx.fillStyle = "#503421";
            ctx.fillRect(-s, -18, s * 2, s + 22);
            ctx.fillStyle = "#c49a45";
            ctx.fillRect(-s, -30, s * 2, 16);
            ctx.fillRect(-6, -12, 12, s + 16);
          } else {
            ctx.fillStyle = "#4f4841";
            ctx.fillRect(-s, -s / 2, s * 2, s);
            ctx.fillStyle = "#b89458";
            ctx.fillRect(-s + 6, -s / 2 + 6, s * 2 - 12, 8);
          }
          ctx.fillStyle = "#151318";
          ctx.fillRect(-18, -4, 36, 30);
          ctx.fillStyle = "#ead59a";
          ctx.font = "700 18px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(obj.glyph, 0, 12);
          ctx.font = "700 11px sans-serif";
          var closed = closedBuildingLabel(obj),
            text = closed ? obj.name + " \xB7 " + closed : obj.name;
          var labelWidth = Math.max(s * 2, ctx.measureText(text).width + 12);
          var y = buildingBounds(obj) ? -s * 1.2 - 27 : s + 12;
          ctx.fillStyle = "rgba(8,8,10,0.88)";
          ctx.fillRect(-labelWidth / 2, y, labelWidth, 20);
          ctx.fillStyle = "#e5d19e";
          ctx.fillText(text, 0, y + 10);
        };
        return InteractionSystem;
      }());

      // prototype-2d-pixel/src/collection.js
      var EVENT_CATALOGUE = exports('EVENT_CATALOGUE', Object.freeze([].concat(WORLD_INTERACTIONS.map(function (def) {
        return {
          id: def.id,
          name: def.name,
          description: def.description,
          artId: {
            shop: "retro_blaster",
            relic: "star",
            log: "paper",
            loot: "orbit",
            event: "seal"
          }[def.kind],
          condition: {
            shop: "\u4F7F\u7528\u672C\u5C40\u94DC\u94B1\u5B8C\u6210\u4E00\u7B14\u4EA4\u6613\u540E\u8BB0\u5F55\uFF1B\u4EF7\u683C\u968F\u65F6\u95F4\u3001\u8D2D\u4E70\u6B21\u6570\u4E0E\u5DF2\u6709\u7B49\u7EA7\u589E\u957F\uFF0C\u6BCF\u5EA7\u6700\u591A\u6210\u4EA4\u4E09\u6B21\u3002",
            relic: "\u4ECE\u5F53\u524D\u63D0\u4F9B\u7684\u9057\u7269\u4E2D\u786E\u8BA4\u9886\u53D6\u540E\u8BB0\u5F55\uFF1B\u9057\u7269\u4F4D\u6EE1\u65F6\u53EF\u6539\u53D6\u94DC\u94B1\u3002",
            log: "\u786E\u8BA4\u8BFB\u5B8C\u540E\u8BB0\u5F55\uFF1B\u53EA\u8865\u5168\u4E16\u754C\u7EBF\u7D22\uFF0C\u4E0D\u589E\u52A0\u6218\u529B\uFF0C\u4E5F\u4E0D\u5360\u88C5\u5907\u4F4D\u3002",
            loot: "\u786E\u8BA4\u9886\u53D6\u4E00\u4EF6\u9053\u5177\u6216\u5347\u7EA7\u540E\u8BB0\u5F55\uFF1B\u5956\u52B1\u53EA\u53EF\u9886\u53D6\u4E00\u6B21\u3002",
            event: "\u786E\u8BA4\u559D\u8336\u6216\u5356\u540D\u540E\u8BB0\u5F55\uFF1B\u9009\u62E9\u6539\u53D8\u672C\u5C40\u6536\u76CA\uFF0C\u4E5F\u6709\u751F\u547D\u6216\u627F\u4F24\u4EE3\u4EF7\u3002"
          }[def.kind]
        };
      }), [{
        id: "boss_chest",
        name: "\u9547\u7269\u5B9D\u5323",
        artId: "orbit",
        description: "\u9996\u9886\u9057\u9AB8\u4E0E\u5DF2\u6E05\u7406\u7684\u623F\u95F4\u7559\u4E0B\u7684\u9547\u7269\uFF0C\u65E7\u4E3B\u8FD8\u6B20\u7740\u5C71\u6D77\u4E00\u4EFD\u62A5\u916C\u3002",
        condition: "\u786E\u8BA4\u9886\u53D6\u5956\u52B1\u540E\u8BB0\u5F55\uFF1B\u5B9D\u5323\u4E0D\u968F\u65F6\u95F4\u6D88\u5931\uFF0C\u6BCF\u4E2A\u53EA\u53EF\u9886\u53D6\u4E00\u6B21\u3002"
      }, {
        id: "shrine",
        name: "\u9752\u5C71\u5723\u6C34",
        artId: "garlic",
        description: "\u4F9B\u5728\u6062\u590D\u623F\u4E2D\u7684\u65E7\u6CC9\uFF0C\u53EF\u996E\u4E0B\u7597\u4F24\uFF0C\u4E5F\u53EF\u501F\u5B83\u6DEC\u70BC\u8089\u8EAB\u3002",
        condition: "\u786E\u8BA4\u996E\u6C34\u6216\u6DEC\u4F53\u540E\u8BB0\u5F55\uFF1B\u6BCF\u5EA7\u6062\u590D\u623F\u53EA\u80FD\u9009\u4E00\u6B21\uFF0C\u672C\u5C40\u6709\u6548\u3002"
      }])));
      function eventDiscoveryId(interaction) {
        if ((interaction == null ? void 0 : interaction.kind) === "heal") return "shrine";
        if ((interaction == null ? void 0 : interaction.kind) === "portal" || (interaction == null ? void 0 : interaction.kind) === "map") return null;
        return EVENT_CATALOGUE.some(function (entry) {
          return entry.id === (interaction == null ? void 0 : interaction.sourceId);
        }) ? interaction.sourceId : null;
      }
      var COLLECTION_KINDS = exports('COLLECTION_KINDS', Object.freeze(["heroes", "monsters", "weapons", "passives", "relics", "curses", "fusions", "reactions", "events"]));
      function emptyCollection() {
        return Object.fromEntries(COLLECTION_KINDS.map(function (kind) {
          return [kind, []];
        }));
      }
      function ensureCollection(save) {
        save.collection || (save.collection = emptyCollection());
        for (var _iterator71 = _createForOfIteratorHelperLoose(COLLECTION_KINDS), _step71; !(_step71 = _iterator71()).done;) {
          var kind = _step71.value;
          if (!Array.isArray(save.collection[kind])) save.collection[kind] = [];
        }
        return save.collection;
      }
      function recordDiscovery(save, kind, id) {
        if (!save || !COLLECTION_KINDS.includes(kind) || !id) return false;
        var collection = ensureCollection(save);
        if (collection[kind].includes(id)) return false;
        collection[kind].push(id);
        return true;
      }
      function catalogue() {
        var mechanismDescriptions = ["\u8FFD\u9010\u56F4\u730E", "\u9AD8\u901F\u51B2\u649E", "\u8FDC\u7A0B\u5F02\u672F", "\u91CD\u7532\u538B\u8FEB"];
        var monsters = Object.values(ENEMY_THEME_SKINS).flatMap(function (set) {
          return set.map(function (skin, index) {
            return _extends({}, skin, {
              description: mechanismDescriptions[index] + "\u578B\u90AA\u7269\uFF1B\u5728\u5BF9\u5E94\u4E3B\u9898\u5730\u56FE\u62E5\u6709\u72EC\u7ACB\u7ACB\u7ED8\u3001\u914D\u8272\u548C\u5F39\u9053\u3002"
            });
          });
        });
        var controlStages = {
          bramble_seer: "forest",
          thread_chanter: "crypt",
          frost_eye: "tundra"
        };
        for (var _i27 = 0, _Object$values8 = Object.values(BOSSES); _i27 < _Object$values8.length; _i27++) {
          var boss = _Object$values8[_i27];
          monsters.push({
            id: boss.id,
            name: boss.name,
            atlasColumn: 3,
            atlasRow: 1,
            description: "\u9547\u5B88\u90AA\u7269\uFF1B\u72EC\u7ACB\u50CF\u7D20\u7ACB\u7ED8\u3002\u62DB\u5F0F\u5148\u663E\u793A\u56FA\u5B9A\u843D\u70B9\u6216\u51B2\u649E\u8DEF\u5F84\uFF0C\u518D\u53D1\u52A8\u653B\u51FB\u3002\u8BE6\u7EC6\u673A\u5236\u4EE5\u5B9E\u6218\u9884\u8B66\u4E3A\u51C6\u3002"
          });
        }
        for (var _iterator72 = _createForOfIteratorHelperLoose(Object.values(ENEMIES).filter(function (entry) {
            return entry.control;
          })), _step72; !(_step72 = _iterator72()).done;) {
          var enemy = _step72.value;
          monsters.push(_extends({}, ENEMY_THEME_SKINS[controlStages[enemy.id]][2], {
            id: enemy.id,
            name: enemy.name,
            description: "\u63A7\u5236\u578B\u90AA\u7269\uFF1A\u9501\u5B9A\u843D\u70B9\u540E\u9884\u8B66 1.1 \u79D2\uFF0C\u7559\u4E0B 2.8 \u79D2" + enemy.control.label + "\u8303\u56F4\uFF1B\u8303\u56F4\u5185\u6BCF 0.6 \u79D2\u5C1D\u8BD5\u9020\u6210\u4F24\u5BB3\uFF0C\u547D\u4E2D\u9644\u5E26 " + Math.round(enemy.control.slow * 100) + "% \u77ED\u6682\u51CF\u901F\u3002\u9884\u8B66\u4E0D\u8FFD\u8E2A\u79FB\u52A8\uFF0C\u79BB\u5F00\u5706\u5708\u5373\u53EF\u8EB2\u907F\u3002\u72EC\u7ACB\u50CF\u7D20\u7ACB\u7ED8\u3002"
          }));
        }
        return {
          heroes: Object.values(HEROES),
          monsters: monsters,
          weapons: Object.values(WEAPONS),
          passives: Object.values(PASSIVES),
          relics: Object.values(RELICS),
          curses: Object.values(CURSES),
          fusions: FUSION_RECIPES,
          reactions: REACTIONS.map(function (reaction) {
            return _extends({}, reaction, {
              condition: reactionCondition(reaction),
              numbers: reactionNumbers(reaction),
              sources: reaction.pair.map(function (element) {
                return Object.values(WEAPONS).filter(function (weapon) {
                  return weapon.element === element;
                }).map(function (weapon) {
                  return weapon.name;
                }).join("\uFF0F");
              }).join(" \uFF0B ")
            });
          }),
          events: EVENT_CATALOGUE
        };
      }
      function itemName(kind, id) {
        var _catalogue;
        return ((_catalogue = catalogue()[kind + "s"]) == null || (_catalogue = _catalogue.find(function (item) {
          return item.id === id;
        })) == null ? void 0 : _catalogue.name) || id;
      }
      function requirementText(requirement) {
        var name = itemName(requirement.kind, requirement.id);
        if (requirement.kind === "weapon") return name + " Lv." + (requirement.level || 1);
        if (requirement.kind === "passive") return name + " \xD7" + (requirement.count || 1);
        return name;
      }
      function collectionView(save) {
        var discovered = ensureCollection(save || {});
        var defs = catalogue();
        return COLLECTION_KINDS.map(function (kind) {
          return {
            kind: kind,
            entries: defs[kind].map(function (def) {
              return _extends({}, def, {
                obtained: discovered[kind].includes(def.id),
                recipe: kind === "fusions" ? def.requirements.map(requirementText).join(" \uFF0B ") + " \u2192 " + def.name : FUSION_RECIPES.filter(function (recipe) {
                  return recipe.requirements.some(function (requirement) {
                    return requirement.kind + "s" === kind && requirement.id === def.id;
                  });
                }).map(function (recipe) {
                  return recipe.name;
                }).join("\uFF0F")
              });
            })
          };
        });
      }
      function collectionProgress(save) {
        var groups = collectionView(save);
        var total = groups.reduce(function (sum, group) {
          return sum + group.entries.length;
        }, 0);
        var obtained = groups.reduce(function (sum, group) {
          return sum + group.entries.filter(function (entry) {
            return entry.obtained;
          }).length;
        }, 0);
        return {
          obtained: obtained,
          total: total
        };
      }

      // prototype-2d-pixel/src/room-intel.js
      var enemiesById = new Map(Object.values(ENEMIES).map(function (enemy) {
        return [enemy.id, enemy];
      }));
      var mechanics = [["ranged", "\u8FDC\u7A0B\u5F39\u9053"], ["dasher", "\u51B2\u523A\u8FD1\u8EAB"], ["shielded", "\u62A4\u76FE\u51CF\u4F24"], ["control", "\u51CF\u901F\u9886\u57DF"], ["bomber", "\u8FD1\u8EAB\u81EA\u7206"], ["splitter", "\u6B7B\u4EA1\u5206\u88C2"], ["illusionist", "\u53EC\u5524\u5206\u8EAB"]];
      function roomBriefing(node, cleared) {
        if (cleared === void 0) {
          cleared = false;
        }
        if (!node) return {
          description: "\u9053\u8DEF\u672A\u5F00\u653E",
          meta: "\u8BF7\u5148\u5B8C\u6210\u5F53\u524D\u623F\u95F4\u76EE\u6807"
        };
        if (cleared && node.killTarget > 0) {
          return {
            description: "\u5DF2\u6E05\u623F \xB7 \u53EF\u539F\u8DEF\u8FD4\u56DE",
            meta: "\u5DF2\u9886\u5956\u52B1\u4E0D\u91CD\u53D1 \xB7 \u8FC7\u95E8\u4E0D\u8DF3\u65F6\u95F4"
          };
        }
        if (node.type === "boss") {
          return {
            description: "\u6700\u7EC8\u9996\u9886\u6218 \xB7 \u7559\u610F\u5730\u9762\u9884\u8B66",
            meta: "\u51FB\u8D25\u9996\u9886\u540E\u7ED3\u7B97\u672C\u5C40"
          };
        }
        if (!node.killTarget) {
          var service = {
            shop: "\u5C40\u5185\u94DC\u94B1\u4EA4\u6613",
            shrine: "\u6062\u590D\u751F\u547D\u7684\u673A\u7F18",
            reward: "\u4E00\u6B21\u6027\u63A2\u7D22\u5956\u52B1",
            event: "\u673A\u7F18\u9009\u62E9\u4E0E\u53D6\u820D"
          }[node.type] || "\u63A2\u7D22\u623F\u5185\u673A\u7F18";
          return {
            description: (node.label || "\u7279\u6B8A\u623F") + " \xB7 " + service,
            meta: (cleared ? "\u5DF2\u63A2\u7D22\uFF0C\u67E5\u770B\u5269\u4F59\u673A\u7F18" : "\u65E0\u9700\u6E05\u602A\uFF0C\u53EF\u7EE7\u7EED\u63A2\u7D22") + " \xB7 \u8FC7\u95E8\u4E0D\u8DF3\u65F6\u95F4"
          };
        }
        var pool = (node.pool || []).map(function (id) {
          return enemiesById.get(id);
        });
        var tags = mechanics.filter(function (_ref23) {
          var flag = _ref23[0];
          return pool.some(function (enemy) {
            return enemy == null ? void 0 : enemy[flag];
          });
        }).map(function (_ref24) {
          var label = _ref24[1];
          return label;
        });
        if (!pool.length || pool.some(function (enemy) {
          return !enemy;
        })) tags.push("\u90E8\u5206\u60C5\u62A5\u672A\u660E");
        if (!tags.length) tags.push("\u8FD1\u8EAB\u8FFD\u51FB");
        return {
          description: (node.label || "\u6218\u6597\u623F") + " \xB7 " + tags.join(" / "),
          meta: "\u6E05\u9664 " + node.killTarget + " \u53EA\u540E\u5F00\u95E8 \xB7 \u8FC7\u95E8\u4E0D\u8DF3\u65F6\u95F4"
        };
      }

      // prototype-2d-pixel/src/world-flow.js
      function _setupChapterRoom() {
        this.hostileFields.reset();
        for (var _iterator73 = _createForOfIteratorHelperLoose(((_this$player = this.player) == null ? void 0 : _this$player.weapons) || []), _step73; !(_step73 = _iterator73()).done;) {
          var _this$player, _weapon$fusionFields;
          var weapon = _step73.value;
          (_weapon$fusionFields = weapon.fusionFields) == null || _weapon$fusionFields.restore([]);
        }
        var node = this.chapterRoute.current();
        var savedRoom = this.chapterRoute.currentRoomState();
        this.expOrbs = restoreGroundLoot(savedRoom == null ? void 0 : savedRoom.groundLoot, this.gameTime);
        var entryPositions = {
          up: {
            x: this.arenaWidth / 2,
            y: 170
          },
          right: {
            x: this.arenaWidth - 170,
            y: this.arenaHeight / 2
          },
          down: {
            x: this.arenaWidth / 2,
            y: this.arenaHeight - 170
          },
          left: {
            x: 170,
            y: this.arenaHeight / 2
          }
        };
        var entry = entryPositions[this.chapterRoute.entryDirection] || {
          x: this.arenaWidth / 2,
          y: this.arenaHeight / 2
        };
        this.player.x = entry.x;
        this.player.y = entry.y;
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.mines = [];
        this.interactions.objects = [];
        this.interactions.nearby = null;
        this.interactions.nextSpawnAt = Infinity;
        this.worldMap.configureChapterRoom(node, this.player);
        var fixtureByType = {
          shop: ["ghost_market", "shop"],
          shrine: ["paper_tea", "heal"],
          reward: ["relic_ruin", "relic"],
          event: ["paper_tea", "event"],
          gold: ["scattered_cache", "loot"]
        };
        var fixture = fixtureByType[node.type];
        if (fixture && !savedRoom) {
          this.interactions.spawnFixture(fixture[0], this.arenaWidth / 2, this.arenaHeight / 2, {
            id: "room_fixture_" + node.id,
            kind: fixture[1],
            name: node.name,
            description: node.label + "\u7684\u552F\u4E00\u4E3B\u4F53\u5EFA\u7B51\uFF1B\u53EF\u78B0\u649E\u3001\u53EF\u4EA4\u4E92\uFF0C\u4E0D\u518D\u6446\u653E\u65E0\u7528\u9014\u88C5\u9970\u3002"
          });
        }
        if (node.type === "boss" && !this.chapterRoute.roomReady) {
          var chapterBossId = node.bossId;
          var boss = this.stageBosses.find(function (entry2) {
            return entry2.id === chapterBossId || entry2.sourceId === chapterBossId;
          }) || Object.values(BOSSES).find(function (entry2) {
            return entry2.id === chapterBossId;
          }) || Object.values(BOSSES)[0];
          var _this$_computeDifficu2 = this._computeDifficultyMults(),
            hpMult = _this$_computeDifficu2.hpMult,
            dmgMult = _this$_computeDifficu2.dmgMult;
          var enemy = this._spawnBoss(boss, hpMult, dmgMult);
          restoreBossCombat(enemy, savedRoom == null ? void 0 : savedRoom.boss);
        } else if (node.killTarget === 0 && !this.chapterRoute.roomReady) {
          this.chapterRoute.markSpecialReady();
        }
        if (!savedRoom && node.type !== "boss" && Math.random() < 0.45) {
          this.interactions.spawnAmbientLog(this.player, node.id);
        }
        if (savedRoom) {
          this.interactions.restore(savedRoom.interactions, this.player);
          this.hostileFields.restore(savedRoom.hostileFields);
          this.interactions.objects = this.interactions.objects.filter(function (item) {
            return item.kind !== "portal";
          });
          this.interactions.nextSpawnAt = Infinity;
        }
        this._spawnChapterExits();
        this._lastAnnouncedWave = null;
        this._spawnAccumulator = 0;
        this._announce(node.id + " " + node.name + " \xB7 " + node.label + (node.killTarget ? " \xB7 \u6E05\u9664 " + node.killTarget + " \u53EA\u90AA\u7269" : " \xB7 \u63A2\u7D22\u540E\u9009\u62E9\u51FA\u53E3"));
      }
      function _handleChapterRoomClear(enemy) {
        this.hostileFields.reset();
        var node = this.chapterRoute.current();
        this.enemies = this.enemies.filter(function (item) {
          return item === enemy || item.boss;
        });
        if (node.type === "boss") {
          this.chapterCompleted = true;
          this._pendingChapterVictory = true;
          this._announce(node.id + " \u6700\u7EC8\u5B88\u5173\u8005\u5DF2\u706D\uFF0C\u7AE0\u8282\u5B8C\u6210\u3002");
          return;
        }
        this.interactions.spawnBossChest(Math.min(this.arenaWidth - 120, this.player.x + 100), Math.max(120, this.player.y - 80), node.id + " \u623F\u95F4\u7ED3\u7B97", this.gameTime);
        var exits = this._spawnChapterExits();
        this._announce(node.id + " \u5DF2\u6E05\u9664\uFF1A\u5956\u52B1\u5B9D\u5323\u4E0E " + exits.length + " \u5EA7\u65B9\u5411\u95E8\u5DF2\u51FA\u73B0\u3002");
      }
      function _spawnChapterExits() {
        var _this12 = this;
        var choices = this.chapterRoute.choices();
        var positions = {
          up: {
            x: this.arenaWidth / 2,
            y: 90,
            label: "\u5317\u95E8"
          },
          right: {
            x: this.arenaWidth - 90,
            y: this.arenaHeight / 2,
            label: "\u4E1C\u95E8"
          },
          down: {
            x: this.arenaWidth / 2,
            y: this.arenaHeight - 90,
            label: "\u5357\u95E8"
          },
          left: {
            x: 90,
            y: this.arenaHeight / 2,
            label: "\u897F\u95E8"
          }
        };
        var spawned = [];
        var _loop6 = function _loop6() {
            var choice = _step74.value;
            var position = positions[choice.direction];
            if (!position) return 0; // continue
            var id = "chapter_exit_" + _this12.chapterRoute.currentId + "_" + choice.id;
            if (_this12.interactions.objects.some(function (object) {
              return object.id === id && !object.used;
            })) return 0; // continue
            spawned.push(_this12.interactions.spawnFixture("paper_tea", position.x, position.y, {
              id: id,
              kind: "portal",
              glyph: "\u95E8",
              radius: 48,
              name: position.label + " \xB7 " + choice.id + " " + choice.name,
              oneShot: true,
              routeTargets: [choice.id],
              direction: choice.direction,
              description: position.label + "\u901A\u5F80" + choice.label + "\uFF1B\u5DF2\u6E05\u7406\u623F\u95F4\u53EF\u968F\u65F6\u539F\u8DEF\u8FD4\u56DE\u3002"
            }));
          },
          _ret;
        for (var _iterator74 = _createForOfIteratorHelperLoose(choices), _step74; !(_step74 = _iterator74()).done;) {
          _ret = _loop6();
          if (_ret === 0) continue;
        }
        return spawned;
      }
      function _applyColdTick(dt) {
        var mods = this.stageMods;
        if (!mods || !mods.coldTickInterval) return;
        if (!this.player || this.player.dead) return;
        var result = this.environment.update(dt, mods.coldTickInterval);
        if (result.expired) {
          this.createFloatingText("\u907F\u661F\u706F\u7184\u706D", this.player.x, this.player.y - 36, "#cbbd91");
          this._announce("\u907F\u661F\u706F\u62A4\u6301\u7ED3\u675F\uFF0C\u73AF\u5883\u4FB5\u8680\u6062\u590D\u3002");
        }
        for (var i = 0; i < result.ticks; i++) {
          var dmg = mods.coldTickDamage || 1;
          var next = Math.max(1, this.player.hp - dmg);
          if (next < this.player.hp) {
            recordHealthLoss(this, {
              kind: "environment",
              label: "\u661F\u8680\u4FB5\u4F53"
            }, this.player.hp - next);
            this.player.hp = next;
            this.createFloatingText("-" + dmg + "\u2744", this.player.x, this.player.y - 36, "#88ccff");
          }
        }
      }
      function _worldInteractionOptions(interaction) {
        var _this13 = this;
        if (interaction.kind === "portal") {
          var _interaction$routeTar;
          if ((_interaction$routeTar = interaction.routeTargets) != null && _interaction$routeTar.length) {
            return interaction.routeTargets.map(function (targetId, index) {
              var node = _this13.chapterRoute.choices().find(function (item) {
                return item.id === targetId;
              });
              return _extends({
                id: "route:" + targetId,
                kindLabel: "\u51FA\u53E3 " + (index + 1) + " / " + interaction.routeTargets.length,
                glyph: (node == null ? void 0 : node.type) === "shop" ? "\u5E02" : (node == null ? void 0 : node.type) === "boss" ? "\u9996" : (node == null ? void 0 : node.type) === "reward" ? "\u5323" : "\u95E8",
                name: ((node == null ? void 0 : node.id) || targetId) + " \xB7 " + ((node == null ? void 0 : node.name) || "\u672A\u77E5\u9053\u8DEF")
              }, roomBriefing(node, _this13.chapterRoute.cleared.has(targetId)), {
                disabled: !node
              });
            });
          }
          var next = this.worldMap.mapModel(this).regions[this.worldMap.regionIndex + 1];
          return [{
            id: "portal:advance",
            kindLabel: "\u7AE0\u8282\u901A\u9053",
            glyph: "\u95E8",
            name: next ? "\u8FDB\u5165" + next.name : "\u5C71\u95E8\u5DF2\u5C3D",
            description: next ? "\u79BB\u5F00\u5F53\u524D\u533A\u57DF\uFF0C\u8FDB\u5165\u300C" + next.subtitle + "\u300D\u3002\u6784\u7B51\u3001\u751F\u547D\u4E0E\u5C40\u5185\u94DC\u94B1\u4FDD\u7559\u3002" : "\u5DF2\u7ECF\u62B5\u8FBE\u7AE0\u8282\u7EC8\u70B9\u3002",
            meta: "\u786E\u8BA4\u540E\u6E05\u7406\u666E\u901A\u602A\u6F6E\u5E76\u5728\u4E0B\u4E00\u7247\u72EC\u7ACB\u533A\u57DF\u91CD\u7EC4\uFF1B\u65F6\u95F4 Boss \u4ECD\u6309\u5168\u5C40\u65F6\u95F4\u51FA\u73B0\u3002",
            disabled: !next
          }];
        }
        if (interaction.kind === "log") {
          return [{
            id: "log:read",
            kindLabel: "\u547D\u5951\u6B8B\u5377",
            glyph: "\u5FD7",
            name: "\u8BFB\u5B8C\u7EB8\u68FA\u884C\u65E5\u5FD7",
            description: "\u8BB0\u5F55\u4E00\u540D\u65E7\u8BD5\u70BC\u8005\u5982\u4F55\u4ECE\u9752\u5C71\u9057\u5E9C\u5E26\u8D70\u661F\u5916\u9057\u7269\uFF0C\u53C8\u600E\u6837\u5931\u53BB\u4E86\u81EA\u5DF1\u7684\u540D\u5B57\u3002",
            meta: "\u8865\u5168\u4E00\u6761\u547D\u5951\u8BB0\u5F55\uFF1B\u4E0D\u5360\u88C5\u5907\u3001\u9057\u7269\u6216\u6B63\u5F0F\u623F\u95F4\u3002",
            disabled: false
          }];
        }
        if (interaction.kind === "relic") {
          if (this.buildSystem.relics.size >= CONFIG.MAX_RELICS) {
            return [{
              id: "relic-full:coins",
              kindLabel: "\u9057\u7269\u4F4D\u5DF2\u6EE1",
              glyph: "\u94B1",
              name: "\u6536\u53D6\u6563\u843D\u94DC\u94B1",
              description: "\u5DF2\u6709 3 \u4EF6\u9057\u7269\uFF0C\u672C\u6B21\u6539\u4E3A\u9886\u53D6 12 \u679A\u5C40\u5185\u94DC\u94B1\u3002",
              meta: "\u4E0D\u66FF\u6362\u5DF2\u6709\u9057\u7269\uFF1B\u53EA\u53EF\u9886\u53D6\u4E00\u6B21\u3002",
              disabled: false
            }];
          }
          return this._sceneItemOptions(interaction, ["relic"]);
        }
        if (interaction.kind === "heal") {
          var _this$stageMods2;
          var options = [{
            id: "heal:drink",
            kindLabel: "\u6062\u590D\u623F \xB7 \u5723\u6C34",
            glyph: "\u6CC9",
            name: "\u996E\u4E0B\u9752\u5C71\u5723\u6C34",
            description: "\u6062\u590D 55% \u6700\u5927\u751F\u547D\uFF1B\u6BCF\u5EA7\u6062\u590D\u623F\u53EA\u80FD\u4F7F\u7528\u4E00\u6B21\u3002",
            meta: "\u5F53\u524D\u751F\u547D " + Math.ceil(this.player.hp) + " / " + Math.ceil(this.player.maxHp),
            disabled: this.player.hp >= this.player.maxHp
          }, {
            id: "heal:temper",
            kindLabel: "\u6062\u590D\u623F \xB7 \u70BC\u4F53",
            glyph: "\u4F53",
            name: "\u4EE5\u5723\u6C34\u6DEC\u4F53",
            description: "\u672C\u5C40\u6700\u5927\u751F\u547D\u63D0\u9AD8 8%\uFF0C\u5E76\u6309\u65B0\u4E0A\u9650\u6062\u590D 20% \u751F\u547D\u3002",
            meta: "\u672C\u5C40\u6709\u6548\uFF1B\u4F1A\u53C2\u4E0E\u751F\u547D\u8F6C\u4F24\u6D41\u6D3E\u3002",
            disabled: false
          }];
          if ((_this$stageMods2 = this.stageMods) != null && _this$stageMods2.warmthSourceEnabled) options.push({
            id: "heal:lantern",
            kindLabel: "\u6062\u590D\u623F \xB7 \u907F\u661F\u706F",
            artId: "ward_lantern",
            artKind: "relic",
            name: "\u70B9\u71C3\u907F\u661F\u706F",
            description: "\u6062\u590D 20% \u6700\u5927\u751F\u547D\uFF0C\u5E76\u5728 " + LANTERN_SECONDS + " \u79D2\u5185\u514D\u53D7\u73AF\u5883\u4FB5\u8680\u3002",
            meta: "\u4E0D\u9632\u602A\u7269\u653B\u51FB\uFF1B\u4E0E\u559D\u6C34/\u70BC\u4F53\u5171\u7528\u4E00\u6B21\u673A\u4F1A\uFF0C\u91CD\u590D\u70B9\u706F\u53EA\u5237\u65B0\u65F6\u957F\u3002",
            disabled: false
          });
          return options;
        }
        if (interaction.kind === "map") {
          var _this$currentWave;
          var bosses = (this.stageBosses || []).slice(0, 3).map(function (entry) {
            return Math.floor(entry.spawnAt / 60) + ":" + String(entry.spawnAt % 60).padStart(2, "0") + " " + (entry.name || entry.id);
          });
          return [{
            id: "map_route",
            kindLabel: "\u5F53\u524D\u8DEF\u7EBF",
            glyph: "\u56FE",
            name: ((_this$currentWave = this.currentWave) == null ? void 0 : _this$currentWave.label) || "\u7EB8\u7075\u6E21",
            description: "\u533A\u57DF\u8FDE\u7EED\u5EF6\u4F38\uFF1B\u5173\u952E Boss \u8282\u70B9\uFF1A" + (bosses.join(" \xB7 ") || "\u672A\u63A2\u660E") + "\u3002",
            meta: "\u754C\u7891\u53EA\u5C55\u793A\u60C5\u62A5\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u4F20\u9001\u6216\u6D88\u8017\u8D44\u6E90\u3002",
            disabled: true
          }, {
            id: "map_rules",
            kindLabel: "\u7A7F\u900F\u89C4\u5219",
            glyph: "\u969C",
            name: "\u5B9E\u4F53\u969C\u788D",
            description: "\u4EBA\u7269\u4E0D\u80FD\u7A7F\u8FC7\u5B9D\u5323\u3001\u9B3C\u5E02\u4E0E\u754C\u7891\uFF1B\u6295\u5C04\u7269\u4E0E\u8303\u56F4\u6280\u80FD\u53EF\u7A7F\u900F\u8FD9\u4E9B\u4EA4\u4E92\u7269\u3002",
            meta: "\u9760\u8FD1\u63D0\u793A \u2192 F/\u70B9\u51FB \u2192 \u660E\u786E\u786E\u8BA4\u3002",
            disabled: true
          }];
        }
        if (interaction.kind === "shop") {
          if ((interaction.purchaseCount || 0) >= SHOP_PURCHASE_LIMIT) {
            return [{
              id: "sold_out",
              kindLabel: "\u9B3C\u5E02\u89C4\u77E9",
              glyph: "\u5C01",
              name: "\u4ECA\u591C\u5DF2\u552E\u7F44",
              description: "\u6BCF\u5EA7\u9B3C\u5E02\u6700\u591A\u6210\u4EA4\u4E09\u6B21\uFF0C\u9632\u6B62\u540C\u4E00\u4E8B\u4EF6\u65E0\u9650\u8F6C\u5316\u8D44\u6E90\u3002",
              meta: "\u79BB\u5F00\u540E\u7B49\u5F85\u4E0B\u4E00\u6B21\u5F02\u5146\u3002",
              disabled: true
            }];
          }
          return this._sceneItemOptions(interaction, ["weapon", "passive", "relic"], true);
        }
        if (interaction.kind === "event") {
          return [{
            id: "event_choice:drink",
            kindLabel: "\u7EB8\u4EBA\u8336\u644A \xB7 \u547D\u5951",
            glyph: "\u996E",
            name: "\u996E\u4E0B\u82E6\u8336",
            description: "\u4EE5\u547D\u6570\u6362\u53D6\u66F4\u5FEB\u7684\u609F\u9053\u901F\u5EA6\u3002",
            meta: "\u7ACB\u5373\u635F\u5931\u547D\u6570\uFF1B\u672C\u5C40\u7ECF\u9A8C\u83B7\u53D6\u63D0\u9AD8\u3002",
            disabled: false
          }, {
            id: "event_choice:sell",
            kindLabel: "\u7EB8\u4EBA\u8336\u644A \xB7 \u547D\u5951",
            glyph: "\u540D",
            name: "\u5356\u51FA\u5047\u540D",
            description: "\u6362\u5F97\u4E00\u888B\u94DC\u94B1\uFF0C\u4F46\u5F80\u540E\u7684\u4F24\u52BF\u4F1A\u66F4\u91CD\u3002",
            meta: "\u7ACB\u5373\u83B7\u5F97\u94DC\u94B1\uFF1B\u672C\u5C40\u53D7\u5230\u7684\u4F24\u5BB3\u63D0\u9AD8\u3002",
            disabled: false
          }];
        }
        return this._sceneItemOptions(interaction, ["weapon", "passive", "relic"]);
      }
      function _sceneItemOptions(interaction, kinds, shop) {
        var _this14 = this;
        if (shop === void 0) {
          shop = false;
        }
        var catalogues = {
          weapon: WEAPONS,
          passive: PASSIVES,
          relic: RELICS
        };
        var candidates = kinds.flatMap(function (kind) {
          return Object.values(catalogues[kind]).filter(function (def) {
            return !_this14._itemOption(kind, def.id, null).disabled;
          }).map(function (def) {
            return {
              kind: kind,
              id: def.id
            };
          });
        });
        var offers = sceneOffers(interaction, candidates);
        var options = offers.map(function (offer) {
          var option = offer.kind === "supply" ? _this14._supplyOption(offer.id, shop) : _this14._itemOption(offer.kind, offer.id, shop ? offer.kind === "relic" ? 14 : 8 : null);
          if (offer.purchased) return _extends({}, option, {
            disabled: true,
            meta: "\u672C\u4EF6\u5DF2\u552E\u51FA \xB7 \u4E0D\u8865\u8D27"
          });
          return option;
        });
        if (!shop && options.every(function (o) {
          return o.disabled;
        })) return [this._supplyOption("coins", false)];
        return options;
      }
      function _supplyOption(id, shop) {
        var recovery = id === "recover";
        var price = shop ? calculateShopPrice(12, {
          purchases: this.shopPurchases,
          gameTime: this.gameTime
        }) : null;
        return {
          id: "supply:" + id,
          kindLabel: "\u6784\u7B51\u5DF2\u6EE1 \xB7 \u8865\u7ED9",
          artId: recovery ? "recovery" : "coin_sword_tassel",
          artKind: recovery ? "passive" : "relic",
          name: recovery ? "\u8C03\u606F\u836F\u5305" : "\u7EB3\u4F59\u6210\u91D1",
          description: recovery ? "\u6062\u590D\u6700\u5927\u751F\u547D\u7684 20%\uFF0C\u53D7\u6CBB\u7597\u500D\u7387\u5F71\u54CD\u3002" : "\u65E0\u6CD5\u518D\u9886\u53D6\u672C\u7BB1\u7269\u54C1\uFF0C\u6539\u4E3A 12 \u679A\u5C40\u5185\u94DC\u94B1\u3002",
          meta: recovery ? "\u53EA\u6062\u590D\u751F\u547D\uFF0C\u4E0D\u589E\u52A0\u6C38\u4E45\u5C5E\u6027\uFF1B\u672C\u5EA7\u9650\u8D2D\u4E00\u6B21\u3002" : "\u53EA\u9886\u53D6\u4E00\u6B21\uFF0C\u4E0D\u53D1\u653E\u5C40\u5916\u8D27\u5E01\u3002",
          price: price,
          disabled: recovery && this.player.hp >= this.player.maxHp || price != null && this.runCoins < price
        };
      }
      function _itemOption(kind, id, basePrice) {
        var _catalogues$kind,
          _this$player$weapons$,
          _this$player$passives,
          _this15 = this,
          _def$name;
        var catalogues = {
          weapon: Object.fromEntries(Object.values(WEAPONS).map(function (def2) {
            return [def2.id, def2];
          })),
          passive: Object.fromEntries(Object.values(PASSIVES).map(function (def2) {
            return [def2.id, def2];
          })),
          relic: RELICS
        };
        var def = (_catalogues$kind = catalogues[kind]) == null ? void 0 : _catalogues$kind[id];
        var label = kind === "weapon" ? "\u81EA\u52A8\u6B66\u5668" : kind === "passive" ? "\u529F\u6CD5" : "\u9057\u7269";
        var owned = kind === "weapon" ? ((_this$player$weapons$ = this.player.weapons.find(function (weapon) {
          return weapon.id === id;
        })) == null ? void 0 : _this$player$weapons$.level) || 0 : kind === "passive" ? ((_this$player$passives = this.player.passives[id]) == null ? void 0 : _this$player$passives.count) || 0 : this.buildSystem.relics.has(id) ? 1 : 0;
        var recipe = FUSION_RECIPES.find(function (entry) {
          return (!entry.heroId || entry.heroId === _this15.player.heroId) && entry.requirements.some(function (requirement) {
            return requirement.kind === kind && requirement.id === id;
          });
        });
        var slotFull = kind === "weapon" && !owned && this.player.weapons.length >= CONFIG.MAX_WEAPONS || kind === "passive" && !owned && Object.keys(this.player.passives).length >= CONFIG.MAX_PASSIVES || kind === "relic" && !owned && this.buildSystem.relics.size >= CONFIG.MAX_RELICS;
        var maxed = kind === "weapon" ? owned >= CONFIG.WEAPON_MAX_LEVEL : kind === "passive" ? owned >= CONFIG.PASSIVE_MAX_STACK : !!owned;
        var price = basePrice == null ? null : calculateShopPrice(basePrice, {
          purchases: this.shopPurchases,
          gameTime: this.gameTime,
          owned: owned
        });
        return {
          id: kind + ":" + id,
          artId: id,
          artKind: kind,
          kindLabel: label,
          glyph: (def == null || (_def$name = def.name) == null ? void 0 : _def$name.slice(0, 1)) || "\u7269",
          name: (def == null ? void 0 : def.name) || id,
          description: (def == null ? void 0 : def.description) || "",
          meta: "" + (slotFull ? "\u643A\u5E26\u4F4D\u5DF2\u6EE1" : maxed ? "\u5DF2\u6EE1\u7EA7\u6216\u5DF2\u62E5\u6709" : owned ? "\u5F53\u524D " + (kind === "weapon" ? "Lv." + owned : "x" + owned) : "\u5C1A\u672A\u6301\u6709") + (recipe ? " \xB7 \u53EF\u878D\u5408\u300C" + recipe.name + "\u300D" : "") + (price != null && this.runCoins < price ? " \xB7 \u94DC\u94B1\u4E0D\u8DB3" : ""),
          price: price,
          disabled: !def || slotFull || maxed || price != null && this.runCoins < price
        };
      }
      function _resolveWorldInteraction(choiceId) {
        var interaction = this.activeInteraction;
        if (!interaction || interaction.used || !choiceId) return;
        var option = (this._interactionOptions || this._worldInteractionOptions(interaction)).find(function (item) {
          return item.id === choiceId;
        });
        if (!option || option.disabled) return;
        var discoveryId = eventDiscoveryId(interaction);
        if (discoveryId) this._recordDiscovery("events", discoveryId);
        if (choiceId === "relic-full:coins") {
          this.runCoins += 12;
          this.interactions.complete(interaction.id, this.gameTime);
          this.ui.updateHud(this);
          this._announce("\u9057\u7269\u4F4D\u5DF2\u6EE1\uFF0C\u6539\u4E3A\u83B7\u5F97 12 \u679A\u94DC\u94B1\u3002");
          this.closeWorldInteraction();
          return;
        }
        if (interaction.kind === "portal" && choiceId.startsWith("route:")) {
          var targetId = choiceId.slice("route:".length);
          this.chapterRoute.saveRoomState({
            groundLoot: snapshotGroundLoot(this.expOrbs, this.gameTime),
            interactions: this.interactions.snapshot(),
            hostileFields: this.hostileFields.snapshot(),
            boss: bossCombatSnapshot(this.enemies.find(function (enemy) {
              return enemy.boss && enemy.hp > 0;
            }))
          });
          if (!this.chapterRoute.advance(targetId)) return;
          interaction.used = true;
          this._setupChapterRoom();
          this._updateCamera();
          this.closeWorldInteraction();
          return;
        }
        if (interaction.kind === "portal" && choiceId === "portal:advance") {
          var advanced = this.worldMap.advanceRegion(this.player);
          if (!advanced) return;
          interaction.used = true;
          this.interactions.enterChapterRegion(this.player, this.gameTime);
          this.enemies = this.enemies.filter(function (enemy) {
            return enemy.boss;
          });
          this.projectiles = [];
          this.enemyProjectiles = [];
          this.mines = [];
          this._updateCamera();
          this._announce("\u5DF2\u8FDB\u5165" + this.worldMap.currentRegion().name + "\u3002");
          this.closeWorldInteraction();
          return;
        }
        if (interaction.kind === "log" && choiceId === "log:read") {
          this.run.logsRead = (this.run.logsRead || 0) + 1;
          this._announce("\u547D\u5951\u7EED\u5199\uFF1A\u7EB8\u68FA\u884C\u65E5\u5FD7\u5DF2\u6536\u5165\u5C71\u6D77\u884C\u7B93\u3002");
          this.interactions.complete(interaction.id, this.gameTime);
          this.ui.updateHud(this);
          this.closeWorldInteraction();
          return;
        }
        if (interaction.kind === "heal") {
          if (choiceId === "heal:drink") this.player.heal(this.player.maxHp * 0.55);
          if (choiceId === "heal:lantern") {
            this.player.heal(this.player.maxHp * 0.2);
            this.environment.lightLantern();
            this.createFloatingText("\u907F\u661F\u706F \xB7 120\u79D2", this.player.x, this.player.y - 36, "#ddc98f");
            this._announce("\u907F\u661F\u706F\u5DF2\u70B9\u71C3\uFF1A\u4E24\u5206\u949F\u5185\u514D\u53D7\u73AF\u5883\u4FB5\u8680\uFF0C\u602A\u7269\u653B\u51FB\u4ECD\u6709\u4F24\u5BB3\u3002");
          }
          if (choiceId === "heal:temper") {
            this.player.runModifiers.maxHpMult *= 1.08;
            this.player.recalculateStats();
            this.player.heal(this.player.maxHp * 0.2);
          }
          this.interactions.complete(interaction.id, this.gameTime);
          this.ui.updateHud(this, {
            force: true
          });
          this.closeWorldInteraction();
          return;
        }
        if (interaction.kind === "event") {
          var eventChoice = choiceId.split(":")[1];
          if (eventChoice === "drink") {
            recordHealthLoss(this, {
              kind: "event",
              label: "\u82E6\u8336\u6362\u609F\u9053"
            }, Math.min(12, Math.max(0, this.player.hp - 1)));
            this.player.hp = Math.max(1, this.player.hp - 12);
            this.player.runModifiers.expMult *= 1.24;
            this._announce("\u996E\u4E0B\u82E6\u8336\uFF1A\u609F\u9053\u52A0\u5FEB\uFF0C\u547D\u6570\u53D7\u635F\u3002");
          } else if (eventChoice === "sell") {
            this.runCoins += 14;
            this.player.runModifiers.incomingDamageMult *= 1.12;
            this._announce("\u5356\u51FA\u5047\u540D\uFF1A\u83B7\u5F97 14 \u94DC\u94B1\uFF0C\u90AA\u7269\u7684\u4F24\u5BB3\u66F4\u6DF1\u3002");
          }
          this.interactions.complete(interaction.id, this.gameTime);
          this.ui.updateHud(this);
          this.closeWorldInteraction();
          return;
        }
        var _choiceId$split = choiceId.split(":"),
          kind = _choiceId$split[0],
          id = _choiceId$split[1];
        if (option.price != null) {
          this.runCoins -= option.price;
          this.shopPurchases += 1;
          interaction.purchaseCount = (interaction.purchaseCount || 0) + 1;
        }
        consumeSceneOffer(interaction, choiceId);
        if (kind === "supply") {
          if (id === "recover") this.player.heal(this.player.maxHp * 0.2);else if (id === "coins") this.runCoins += 12;
        } else this._grantWorldItem(kind, id);
        this._announce("\u83B7\u5F97" + option.kindLabel + "\uFF1A" + option.name);
        this.ui.updateHud(this);
        if (interaction.oneShot) {
          this.interactions.markUsed(interaction.id);
          this.closeWorldInteraction();
          return;
        }
        if (interaction.kind === "shop" && interaction.purchaseCount >= SHOP_PURCHASE_LIMIT) {
          this.interactions.complete(interaction.id, this.gameTime);
          this.closeWorldInteraction();
          return;
        }
        this._renderWorldInteraction();
      }
      function _grantWorldItem(kind, id) {
        if (kind === "weapon") {
          var def = Object.values(WEAPONS).find(function (weapon) {
            return weapon.id === id;
          });
          var existing = this.player.weapons.find(function (weapon) {
            return weapon.id === id;
          });
          if (existing) existing.levelUp();else if (def) this.player.weapons.push(new Weapon(def));
          if (def) this._recordDiscovery("weapons", id);
        } else if (kind === "passive") {
          var _def = Object.values(PASSIVES).find(function (passive) {
            return passive.id === id;
          });
          if (_def) this.player.addPassive(_def);
          if (_def) this._recordDiscovery("passives", id);
        } else if (kind === "relic") {
          this.buildSystem.grantRelic(id);
        }
        this.buildSystem.checkFusions();
      }
      function requireStorage(storage) {
        if (!storage || !["getItem", "setItem", "removeItem"].every(function (key) {
          return typeof storage[key] === "function";
        })) throw new TypeError("Storage must implement getItem, setItem and removeItem");
        return storage;
      }
      function getPersistentStorage() {
        try {
          var _globalThis$window;
          var storage = ((_globalThis$window = globalThis.window) == null ? void 0 : _globalThis$window.localStorage) || globalThis.localStorage;
          return storage ? requireStorage(storage) : null;
        } catch (_unused) {
          return null;
        }
      }

      // prototype-2d-pixel/src/save-journal.js
      var health = /* @__PURE__ */new Map();
      var listeners = /* @__PURE__ */new Set();
      function setSaveHealth(kind, code) {
        var prior = health.get(kind);
        var recovered = code === "recovered" || (prior == null ? void 0 : prior.recovered) || false;
        if ((prior == null ? void 0 : prior.code) === code && prior.recovered === recovered) return;
        health.set(kind, {
          code: code,
          recovered: recovered
        });
        for (var _iterator75 = _createForOfIteratorHelperLoose(listeners), _step75; !(_step75 = _iterator75()).done;) {
          var listener = _step75.value;
          listener();
        }
      }
      function getSaveHealth(kind) {
        return kind ? health.get(kind) || {
          code: "unknown",
          recovered: false
        } : Object.fromEntries(health);
      }
      function parseRecord(raw, validate) {
        if (!raw) return null;
        try {
          var value = JSON.parse(raw, function (key, entry) {
            if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("Unsafe key");
            return entry;
          });
          return validate(value) ? value : null;
        } catch (_unused2) {
          return null;
        }
      }
      function readJournal(storage, key, validate) {
        if (!storage) return {
          value: null,
          code: "memory"
        };
        try {
          var raw = storage.getItem(key);
          var value = parseRecord(raw, validate);
          if (value !== null) return {
            value: value,
            code: "ok"
          };
          var backup = parseRecord(storage.getItem(key + ":backup"), validate);
          if (backup !== null) return {
            value: backup,
            code: "recovered"
          };
          return {
            value: null,
            code: raw ? "corrupt" : "ok"
          };
        } catch (_unused3) {
          return {
            value: null,
            code: "unavailable"
          };
        }
      }
      function writeJournal(storage, key, value, validate) {
        var raw;
        try {
          raw = JSON.stringify(value);
        } catch (_unused4) {
          return {
            ok: false,
            code: "invalid"
          };
        }
        if (parseRecord(raw, validate) === null) return {
          ok: false,
          code: "invalid"
        };
        if (!storage) return {
          ok: false,
          code: "memory",
          raw: raw
        };
        try {
          var previous = storage.getItem(key);
          if (previous && previous !== raw) {
            if (parseRecord(previous, validate) !== null) storage.setItem(key + ":backup", previous);else storage.setItem(key + ":damaged", previous);
          }
          storage.setItem(key, raw);
          return {
            ok: true,
            code: "ok",
            raw: raw
          };
        } catch (_unused5) {
          return {
            ok: false,
            code: "write-failed",
            raw: raw
          };
        }
      }
      function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
      }

      // prototype-2d-pixel/src/covenants.js
      var COVENANT_STORAGE_KEY = exports('COVENANT_STORAGE_KEY', "wuxiang_shanhai_pixel_covenants_v1");
      var COVENANT_SLOT_COUNT = exports('COVENANT_SLOT_COUNT', 3);
      var memorySlots = [null, null, null];
      var pendingSlots = /* @__PURE__ */new WeakMap();
      function validCovenants(value) {
        return Array.isArray(value) && value.length <= COVENANT_SLOT_COUNT && value.every(function (slot) {
          var _slot$player, _slot$player2, _slot$player3, _slot$groundLoot, _slot$interactions;
          if (slot === null) return true;
          if (!isRecord(slot)) return false;
          if (Object.hasOwn(slot, "cocosDifficulty") && !["easy", "normal", "hard", "nightmare"].includes(slot.cocosDifficulty)) return false;
          if (slot.cocosBuildChoice != null && (!isRecord(slot.cocosBuildChoice) || !["curse", "relic"].includes(slot.cocosBuildChoice.kind) || !Array.isArray(slot.cocosBuildChoice.ids) || slot.cocosBuildChoice.ids.length > 3 || slot.cocosBuildChoice.ids.some(function (id) {
            return typeof id !== "string";
          }))) return false;
          if (slot.cocosMetaTalents != null && (!Array.isArray(slot.cocosMetaTalents) || slot.cocosMetaTalents.length > 3 || slot.cocosMetaTalents.some(function (id) {
            return typeof id !== "string";
          }))) return false;
          if (slot.cocosDiscoveries != null && (!isRecord(slot.cocosDiscoveries) || Object.values(slot.cocosDiscoveries).some(function (ids) {
            return !Array.isArray(ids) || ids.some(function (id) {
              return typeof id !== "string";
            });
          }))) return false;
          if (slot.cocosRunSerial != null && (!Number.isSafeInteger(slot.cocosRunSerial) || slot.cocosRunSerial < 1)) return false;
          if (slot.cocosCompletion != null) {
            var completion = slot.cocosCompletion;
            if (!isRecord(completion) || !isRecord(completion.run) || typeof completion.dateKey !== "string") return false;
            if (["kills", "gameTime", "bossKills"].some(function (key) {
              return !Number.isFinite(completion.run[key]) || completion.run[key] < 0;
            })) return false;
          }
          if (slot.player !== void 0 && !isRecord(slot.player)) return false;
          if (((_slot$player = slot.player) == null ? void 0 : _slot$player.weapons) !== void 0 && !Array.isArray(slot.player.weapons)) return false;
          if (((_slot$player2 = slot.player) == null ? void 0 : _slot$player2.passives) !== void 0 && !isRecord(slot.player.passives)) return false;
          if ((_slot$player3 = slot.player) != null && (_slot$player3 = _slot$player3.weapons) != null && _slot$player3.some(function (weapon) {
            return !isRecord(weapon) || typeof weapon.id !== "string";
          })) return false;
          for (var _i28 = 0, _arr11 = ["build", "chapterRoute", "interactions", "worldMap", "run", "heroSkills", "groundLoot", "environment"]; _i28 < _arr11.length; _i28++) {
            var key = _arr11[_i28];
            if (slot[key] != null && !isRecord(slot[key])) return false;
          }
          for (var _i29 = 0, _arr12 = [slot.bossesSpawned, (_slot$build = slot.build) == null ? void 0 : _slot$build.relics, (_slot$build2 = slot.build) == null ? void 0 : _slot$build2.curses, (_slot$build3 = slot.build) == null ? void 0 : _slot$build3.fusions, (_slot$chapterRoute = slot.chapterRoute) == null ? void 0 : _slot$chapterRoute.visited, (_slot$chapterRoute2 = slot.chapterRoute) == null ? void 0 : _slot$chapterRoute2.cleared]; _i29 < _arr12.length; _i29++) {
            var _slot$build, _slot$build2, _slot$build3, _slot$chapterRoute, _slot$chapterRoute2;
            var list = _arr12[_i29];
            if (list != null && (!Array.isArray(list) || list.some(function (id) {
              return typeof id !== "string";
            }))) return false;
          }
          if (((_slot$groundLoot = slot.groundLoot) == null ? void 0 : _slot$groundLoot.orbs) != null && (!Array.isArray(slot.groundLoot.orbs) || slot.groundLoot.orbs.some(function (orb) {
            return !isRecord(orb);
          }))) return false;
          if (((_slot$interactions = slot.interactions) == null ? void 0 : _slot$interactions.objects) != null && (!Array.isArray(slot.interactions.objects) || slot.interactions.objects.some(function (object) {
            return !isRecord(object) || !Number.isFinite(object.x) || !Number.isFinite(object.y);
          }))) return false;
          for (var _i30 = 0, _arr13 = ["x", "y", "hp", "maxHp", "level", "exp", "expToNext"]; _i30 < _arr13.length; _i30++) {
            var _slot$player4;
            var _key2 = _arr13[_i30];
            if (((_slot$player4 = slot.player) == null ? void 0 : _slot$player4[_key2]) !== void 0 && !Number.isFinite(slot.player[_key2])) return false;
          }
          return slot.gameTime === void 0 || Number.isFinite(slot.gameTime) && slot.gameTime >= 0;
        });
      }
      function storageOrNull(storage) {
        if (storage) return storage;
        return getPersistentStorage();
      }
      function normaliseSlots(value) {
        var slots = Array.isArray(value) ? value.slice(0, COVENANT_SLOT_COUNT) : [];
        while (slots.length < COVENANT_SLOT_COUNT) slots.push(null);
        return slots.map(function (slot) {
          return slot && typeof slot === "object" ? slot : null;
        });
      }
      function loadCovenants(storage) {
        var target = storageOrNull(storage);
        if (!target) {
          setSaveHealth("covenants", "memory");
          return normaliseSlots(memorySlots);
        }
        if (pendingSlots.has(target)) return normaliseSlots(pendingSlots.get(target));
        var result = readJournal(target, COVENANT_STORAGE_KEY, validCovenants);
        setSaveHealth("covenants", result.code);
        memorySlots = normaliseSlots(result.value);
        return normaliseSlots(memorySlots);
      }
      function writeCovenants(slots, storage) {
        var candidate = normaliseSlots(slots);
        var target = storageOrNull(storage);
        var result = writeJournal(target, COVENANT_STORAGE_KEY, candidate, validCovenants);
        if (result.raw) memorySlots = JSON.parse(result.raw);
        setSaveHealth("covenants", result.code);
        if (target) {
          if (result.ok) pendingSlots["delete"](target);else if (result.raw) pendingSlots.set(target, memorySlots);
        }
        return normaliseSlots(memorySlots);
      }
      function getCovenant(slot, storage) {
        var index = Math.max(1, Math.min(COVENANT_SLOT_COUNT, Number(slot) || 1)) - 1;
        return loadCovenants(storage)[index];
      }
      function saveCovenant(slot, snapshot, storage) {
        var index = Math.max(1, Math.min(COVENANT_SLOT_COUNT, Number(slot) || 1)) - 1;
        var slots = loadCovenants(storage);
        slots[index] = snapshot ? _extends({}, snapshot, {
          slot: index + 1,
          savedAt: Date.now()
        }) : null;
        writeCovenants(slots, storage);
        return slots[index];
      }
      function deleteCovenant(slot, storage) {
        return saveCovenant(slot, null, storage);
      }
      function covenantSummary(snapshot) {
        var _snapshot$chapterRout, _snapshot$player;
        if (!snapshot) return {
          empty: true,
          title: "\u7A7A\u767D\u547D\u5951",
          detail: "\u9009\u62E9\u540E\u5F00\u59CB\u65B0\u7684\u8BD5\u70BC"
        };
        var seconds = Math.max(0, Math.floor(snapshot.gameTime || 0));
        var mm = String(Math.floor(seconds / 60)).padStart(2, "0");
        var ss = String(seconds % 60).padStart(2, "0");
        return {
          empty: false,
          title: snapshot.heroName || snapshot.selectedHeroId || "\u672A\u540D\u884C\u8005",
          detail: (snapshot.runMode === "endless" ? "\u65E0\u5C3D\u5927\u8352" : "\u7AE0\u8282 " + (((_snapshot$chapterRout = snapshot.chapterRoute) == null ? void 0 : _snapshot$chapterRout.currentId) || "1-1")) + " \xB7 " + mm + ":" + ss + " \xB7 Lv." + (((_snapshot$player = snapshot.player) == null ? void 0 : _snapshot$player.level) || 1)
        };
      }
      function buildCovenantSnapshot(game) {
        var _game$selectedHero, _game$endlessRun, _game$hostileFields2, _game$enemies2, _game$buildSystem2, _game$buildSystem3, _game$buildSystem4, _game$buildSystem5, _game$heroSkills2, _game$interactions, _game$worldMap3, _game$chapterRoute2, _game$environment2, _game$run2, _game$run3;
        if (!(game != null && game.player)) return null;
        var player = game.player;
        return {
          version: 1,
          selectedHeroId: game.selectedHeroId,
          selectedHeroTalentId: game.selectedHeroTalentId,
          heroName: ((_game$selectedHero = game.selectedHero) == null ? void 0 : _game$selectedHero.name) || game.selectedHeroId,
          runMode: game.runMode,
          stageId: game.stageId,
          gameTime: game.gameTime,
          damageHistory: restoreDamageHistory(game.damageHistory, game.gameTime),
          kills: game.kills,
          runCoins: game.runCoins,
          combatCoinsEarned: game.combatCoinsEarned || 0,
          shopPurchases: game.shopPurchases,
          bossesSpawned: Array.from(game._bossesSpawned || []),
          endlessRun: ((_game$endlessRun = game.endlessRun) == null || _game$endlessRun.snapshot == null ? void 0 : _game$endlessRun.snapshot(game.enemies)) || null,
          hostileFields: ((_game$hostileFields2 = game.hostileFields) == null || _game$hostileFields2.snapshot == null ? void 0 : _game$hostileFields2.snapshot()) || [],
          chapterBoss: game.runMode === "chapter" ? bossCombatSnapshot((_game$enemies2 = game.enemies) == null ? void 0 : _game$enemies2.find(function (enemy) {
            return enemy.boss && enemy.hp > 0;
          })) : null,
          mines: (game.mines || []).filter(function (mine) {
            return !mine.shouldRemove;
          }).slice(-24).map(function (mine) {
            return mine.snapshot();
          }),
          player: {
            hindrance: {
              power: player.hindrancePower || 0,
              remaining: player.hindranceRemaining || 0,
              label: player.hindranceLabel || ""
            },
            x: player.x,
            y: player.y,
            hp: player.hp,
            maxHp: player.maxHp,
            level: player.level,
            exp: player.exp,
            expToNext: player.expToNext,
            weapons: player.weapons.map(function (weapon) {
              var _weapon$fusionFields2;
              return {
                id: weapon.id,
                level: weapon.level,
                cooldown: weapon.cooldown,
                guardCooldown: weapon.guardCooldown || 0,
                fusion: weapon.fusion ? JSON.parse(JSON.stringify(weapon.fusion)) : null,
                fusionFields: ((_weapon$fusionFields2 = weapon.fusionFields) == null || _weapon$fusionFields2.snapshot == null ? void 0 : _weapon$fusionFields2.snapshot()) || []
              };
            }),
            passives: Object.fromEntries(Object.entries(player.passives || {}).map(function (_ref25) {
              var id = _ref25[0],
                value = _ref25[1];
              return [id, value.count || 0];
            })),
            runModifiers: _extends({}, player.runModifiers || {})
          },
          build: {
            relics: Array.from(((_game$buildSystem2 = game.buildSystem) == null ? void 0 : _game$buildSystem2.relics) || []),
            curses: Array.from(((_game$buildSystem3 = game.buildSystem) == null ? void 0 : _game$buildSystem3.curses) || []),
            fusions: Array.from(((_game$buildSystem4 = game.buildSystem) == null ? void 0 : _game$buildSystem4.fusions) || []),
            nextCurseAt: ((_game$buildSystem5 = game.buildSystem) == null ? void 0 : _game$buildSystem5.nextCurseAt) || 180
          },
          heroSkills: ((_game$heroSkills2 = game.heroSkills) == null || _game$heroSkills2.getSnapshot == null ? void 0 : _game$heroSkills2.getSnapshot()) || null,
          interactions: ((_game$interactions = game.interactions) == null || _game$interactions.snapshot == null ? void 0 : _game$interactions.snapshot()) || null,
          worldMap: ((_game$worldMap3 = game.worldMap) == null || _game$worldMap3.snapshot == null ? void 0 : _game$worldMap3.snapshot()) || null,
          chapterRoute: ((_game$chapterRoute2 = game.chapterRoute) == null || _game$chapterRoute2.snapshot == null ? void 0 : _game$chapterRoute2.snapshot()) || null,
          groundLoot: snapshotGroundLoot(game.expOrbs, game.gameTime),
          environment: ((_game$environment2 = game.environment) == null || _game$environment2.snapshot == null ? void 0 : _game$environment2.snapshot()) || null,
          run: {
            logsRead: ((_game$run2 = game.run) == null ? void 0 : _game$run2.logsRead) || 0,
            bossesDefeated: _extends({}, ((_game$run3 = game.run) == null ? void 0 : _game$run3.bossesDefeated) || {})
          }
        };
      }

      // prototype-2d-pixel/src/covenant-restore.js
      function restoreCovenantState(snapshot) {
        var _this16 = this,
          _snapshot$run,
          _snapshot$run2,
          _snapshot$player2;
        this.mines = (Array.isArray(snapshot.mines) ? snapshot.mines : []).slice(-24).map(Mine.restore).filter(Boolean);
        var p = snapshot.player || {};
        this.gameTime = Math.max(0, Number(snapshot.gameTime) || 0);
        this.damageHistory = restoreDamageHistory(snapshot.damageHistory, this.gameTime);
        this.kills = Math.max(0, Number(snapshot.kills) || 0);
        this.runCoins = Math.max(0, Number(snapshot.runCoins) || 0);
        this.combatCoinsEarned = restoreCombatCoins(snapshot.combatCoinsEarned, this.gameTime, this.kills);
        this.shopPurchases = Math.max(0, Number(snapshot.shopPurchases) || 0);
        this._bossesSpawned = new Set(snapshot.bossesSpawned || []);
        this.player.x = Number.isFinite(p.x) ? p.x : this.player.x;
        this.player.y = Number.isFinite(p.y) ? p.y : this.player.y;
        this.player.level = Math.max(1, Number(p.level) || 1);
        this.player.exp = Math.max(0, Number(p.exp) || 0);
        this.player.expToNext = Math.max(1, Number(p.expToNext) || 50);
        this.player.weapons = (p.weapons || []).map(function (saved) {
          var def = Object.values(WEAPONS).find(function (weapon2) {
            return weapon2.id === saved.id;
          });
          if (!def) return null;
          var weapon = new Weapon(def);
          weapon.level = Math.max(1, Number(saved.level) || 1);
          weapon.cooldown = Math.max(0, Number(saved.cooldown) || 0);
          weapon.fusion = saved.fusion ? _extends({}, saved.fusion) : null;
          weapon.fusionFields.restore(saved.fusionFields);
          weapon.guardCooldown = Math.min(0.35, Math.max(0, Number(saved.guardCooldown) || 0));
          return weapon;
        }).filter(Boolean);
        this.player.passives = /* @__PURE__ */Object.create(null);
        var _loop7 = function _loop7() {
          var _Object$entries5$_i = _Object$entries5[_i31],
            id = _Object$entries5$_i[0],
            count = _Object$entries5$_i[1];
          var def = Object.values(PASSIVES).find(function (passive) {
            return passive.id === id;
          });
          if (def) _this16.player.passives[id] = {
            def: def,
            count: Math.max(0, Number(count) || 0)
          };
        };
        for (var _i31 = 0, _Object$entries5 = Object.entries(p.passives || {}); _i31 < _Object$entries5.length; _i31++) {
          _loop7();
        }
        this.player.runModifiers = _extends({}, this.player.runModifiers, p.runModifiers || {});
        this.player.recalculateStats();
        if (Number.isFinite(p.maxHp)) this.player.maxHp = Math.max(1, p.maxHp);
        this.player.hp = Math.max(1, Math.min(this.player.maxHp, Number(p.hp) || this.player.maxHp));
        var build = snapshot.build || {};
        this.buildSystem.relics = new Set(build.relics || []);
        this.buildSystem.curses = new Set(build.curses || []);
        this.buildSystem.fusions = new Set(build.fusions || []);
        for (var _iterator76 = _createForOfIteratorHelperLoose(FUSION_RECIPES), _step76; !(_step76 = _iterator76()).done;) {
          var recipe = _step76.value;
          if (!this.buildSystem.fusions.has(recipe.id) || recipe.heroId && recipe.heroId !== this.player.heroId) continue;
          var _loop8 = function _loop8() {
            var output = _step81.value;
            var weapon = _this16.player.weapons.find(function (w) {
              return w.id === output.weaponId;
            });
            if (weapon) weapon.fusion = mergeFusion(weapon.fusion, recipe, output);
          };
          for (var _iterator81 = _createForOfIteratorHelperLoose(recipe.outputs), _step81; !(_step81 = _iterator81()).done;) {
            _loop8();
          }
        }
        this.buildSystem.nextCurseAt = Math.max(this.gameTime + 1, Number(build.nextCurseAt) || 180);
        this.buildSystem._syncUi();
        this._recordDiscovery("heroes", this.player.heroId || this.selectedHeroId);
        for (var _iterator77 = _createForOfIteratorHelperLoose(this.player.weapons), _step77; !(_step77 = _iterator77()).done;) {
          var weapon = _step77.value;
          this._recordDiscovery("weapons", weapon.id);
        }
        for (var _i32 = 0, _Object$keys2 = Object.keys(this.player.passives); _i32 < _Object$keys2.length; _i32++) {
          var id = _Object$keys2[_i32];
          this._recordDiscovery("passives", id);
        }
        for (var _iterator78 = _createForOfIteratorHelperLoose(this.buildSystem.relics), _step78; !(_step78 = _iterator78()).done;) {
          var _id = _step78.value;
          this._recordDiscovery("relics", _id);
        }
        for (var _iterator79 = _createForOfIteratorHelperLoose(this.buildSystem.curses), _step79; !(_step79 = _iterator79()).done;) {
          var _id2 = _step79.value;
          this._recordDiscovery("curses", _id2);
        }
        for (var _iterator80 = _createForOfIteratorHelperLoose(this.buildSystem.fusions), _step80; !(_step80 = _iterator80()).done;) {
          var _id3 = _step80.value;
          this._recordDiscovery("fusions", _id3);
        }
        if (snapshot.heroSkills) {
          this.heroSkills.skillCooldown = Math.max(0, Number(snapshot.heroSkills.skillCooldown) || 0);
          this.heroSkills.ultimateEnergy = Math.max(0, Number(snapshot.heroSkills.ultimateEnergy) || 0);
          this.heroSkills._syncUi();
        }
        this.run.logsRead = Math.max(0, Number((_snapshot$run = snapshot.run) == null ? void 0 : _snapshot$run.logsRead) || 0);
        this.run.bossesDefeated = _extends({}, ((_snapshot$run2 = snapshot.run) == null ? void 0 : _snapshot$run2.bossesDefeated) || {});
        this.worldMap.restore(snapshot.worldMap, this.player);
        this.interactions.restore(snapshot.interactions, this.player);
        this.hostileFields.restore(snapshot.hostileFields);
        this.expOrbs = restoreGroundLoot(snapshot.groundLoot, this.gameTime);
        this.environment.restore(snapshot.environment);
        if (this.runMode === "chapter") restoreBossCombat(this.enemies.find(function (enemy) {
          return enemy.boss;
        }), snapshot.chapterBoss);
        if ((_snapshot$player2 = snapshot.player) != null && _snapshot$player2.hindrance) {
          var effect = snapshot.player.hindrance;
          this.player.applyHindrance(effect.power, effect.remaining, effect.label);
        }
        if (this.runMode === "chapter") this.interactions.nextSpawnAt = Infinity;
        this._updateCamera();
        this.ui.updateHud(this);
        this._announce("\u547D\u5951" + this.activeCovenantSlot + "\u7EED\u5199\uFF1A" + Math.floor(this.gameTime / 60) + " \u5206\u949F\u3002");
      }

      // prototype-2d-pixel/src/meta-progression.js
      var META_LEVEL_CAP = exports('META_LEVEL_CAP', 30);
      var META_TALENT_SLOT_CAP = exports('META_TALENT_SLOT_CAP', 3);
      var META_CURRENCY_NAME = exports('META_CURRENCY_NAME', "\u547D\u7802");
      var META_TALENTS = exports('META_TALENTS', Object.freeze({
        tempered_body: Object.freeze({
          id: "tempered_body",
          branch: "\u751F\u5B58",
          name: "\u767E\u70BC\u6B8B\u8EAF",
          unlockLevel: 2,
          cost: 6,
          description: "\u6700\u5927\u751F\u547D +8%\u3002\u7A33\u5B9A\u4F46\u4E0D\u63D0\u9AD8\u7206\u53D1\u3002",
          effects: Object.freeze({
            maxHpMult: 1.08
          })
        }),
        spirit_purse: Object.freeze({
          id: "spirit_purse",
          branch: "\u7ECF\u8425",
          name: "\u8896\u91CC\u9B3C\u5E02",
          unlockLevel: 3,
          cost: 8,
          description: "\u6BCF\u5C40\u643A\u5E26 6 \u679A\u94DC\u94B1\u5165\u573A\uFF0C\u66F4\u65E9\u5F62\u6210\u5546\u5E97\u9009\u62E9\u3002",
          effects: Object.freeze({
            startCoins: 6
          })
        }),
        paper_rebirth: Object.freeze({
          id: "paper_rebirth",
          branch: "\u751F\u5B58",
          name: "\u7EB8\u4EBA\u66FF\u547D",
          unlockLevel: 4,
          cost: 12,
          description: "\u6BCF\u5C40\u83B7\u5F97 1 \u6B21\u6FD2\u6B7B\u590D\u8D77\uFF1B\u4E0D\u4E0E\u547D\u7802\u6536\u76CA\u6302\u94A9\u3002",
          effects: Object.freeze({
            reviveCharges: 1
          })
        }),
        warding_bone: Object.freeze({
          id: "warding_bone",
          branch: "\u7384\u7532",
          name: "\u9547\u9AA8\u7384\u7532",
          unlockLevel: 5,
          cost: 12,
          description: "\u62A4\u7532 +2\uFF0C\u4F46\u81EA\u52A8\u6B66\u5668\u4F24\u5BB3 -5%\u3002",
          effects: Object.freeze({
            armor: 2,
            damageMult: 0.95
          })
        }),
        blood_contract: Object.freeze({
          id: "blood_contract",
          branch: "\u8840\u70BC",
          name: "\u8840\u5951\u517B\u5668",
          unlockLevel: 6,
          cost: 14,
          description: "\u6700\u5927\u751F\u547D +12%\uFF0C\u4F46\u6CBB\u7597\u4E0E\u5438\u8840\u6548\u679C -25%\u3002",
          effects: Object.freeze({
            maxHpMult: 1.12,
            healingMult: 0.75
          })
        }),
        echo_weapon: Object.freeze({
          id: "echo_weapon",
          branch: "\u6784\u7B51",
          name: "\u524D\u5C18\u5175\u5F71",
          unlockLevel: 8,
          cost: 18,
          description: "\u5F00\u5C40\u989D\u5916\u643A\u5E26 1 \u4EF6\u7B26\u5408\u89D2\u8272\u5B9A\u4F4D\u7684\u516C\u5171\u6B66\u5668\uFF0C\u4F46\u6700\u5927\u751F\u547D -8%\u3002",
          effects: Object.freeze({
            extraStartingWeapon: 1,
            maxHpMult: 0.92
          })
        }),
        mirror_thorns: Object.freeze({
          id: "mirror_thorns",
          branch: "\u7384\u7532",
          name: "\u7167\u9AA8\u53CD\u715E",
          unlockLevel: 10,
          cost: 18,
          description: "\u62A4\u7532\u53EF\u8F6C\u5316\u4E3A\u53CD\u4F24\uFF0C\u4EE3\u4EF7\u662F\u81EA\u52A8\u6B66\u5668\u51B7\u5374 +6%\u3002",
          effects: Object.freeze({
            armorReflectRatio: 0.35,
            cooldownMult: 1.06
          })
        }),
        swift_star: Object.freeze({
          id: "swift_star",
          branch: "\u661F\u884C",
          name: "\u8E0F\u661F\u9006\u884C",
          unlockLevel: 12,
          cost: 20,
          description: "\u79FB\u52A8\u901F\u5EA6 +12%\uFF0C\u989D\u5916\u79FB\u901F\u53EF\u8F6C\u4F24\uFF0C\u4F46\u53D7\u5230\u4F24\u5BB3 +8%\u3002",
          effects: Object.freeze({
            speedMult: 1.12,
            speedDamageRatio: 0.55,
            incomingDamageMult: 1.08
          })
        }),
        void_focus: Object.freeze({
          id: "void_focus",
          branch: "\u90AA\u6CD5",
          name: "\u65E0\u76F8\u51DD\u795E",
          unlockLevel: 15,
          cost: 24,
          description: "\u81EA\u52A8\u6B66\u5668\u4F24\u5BB3 +18%\uFF0C\u4F46\u6700\u5927\u751F\u547D -12%\u3002",
          effects: Object.freeze({
            damageMult: 1.18,
            maxHpMult: 0.88
          })
        })
      }));
      function freshMetaProgression() {
        return {
          level: 1,
          xp: 0,
          currency: 0,
          lifetimeCurrency: 0,
          purchasedTalents: [],
          equippedTalents: [],
          dailyMapRuns: {
            date: "",
            counts: {}
          }
        };
      }
      function normalizeMetaProgression(input) {
        var base = freshMetaProgression();
        var source = input && typeof input === "object" ? input : {};
        base.level = Math.max(1, Math.min(META_LEVEL_CAP, Math.floor(Number(source.level) || 1)));
        base.xp = Math.max(0, Math.floor(Number(source.xp) || 0));
        base.currency = Math.max(0, Math.floor(Number(source.currency) || 0));
        base.lifetimeCurrency = Math.max(0, Math.floor(Number(source.lifetimeCurrency) || 0));
        base.purchasedTalents = Array.from(new Set(Array.isArray(source.purchasedTalents) ? source.purchasedTalents : [])).filter(function (id) {
          return META_TALENTS[id];
        });
        base.equippedTalents = Array.from(new Set(Array.isArray(source.equippedTalents) ? source.equippedTalents : [])).filter(function (id) {
          return base.purchasedTalents.includes(id);
        }).slice(0, META_TALENT_SLOT_CAP);
        var daily = source.dailyMapRuns || {};
        base.dailyMapRuns = {
          date: typeof daily.date === "string" ? daily.date : "",
          counts: daily.counts && typeof daily.counts === "object" ? _extends({}, daily.counts) : {}
        };
        return base;
      }
      function metaXpForNext(level) {
        if (level >= META_LEVEL_CAP) return 0;
        return 80 + Math.max(0, level - 1) * 40;
      }
      function addMetaXp(meta, amount2) {
        var state = meta;
        var startLevel = state.level;
        state.xp += Math.max(0, Math.floor(Number(amount2) || 0));
        while (state.level < META_LEVEL_CAP) {
          var needed = metaXpForNext(state.level);
          if (state.xp < needed) break;
          state.xp -= needed;
          state.level += 1;
        }
        if (state.level >= META_LEVEL_CAP) state.xp = 0;
        return state.level - startLevel;
      }
      function localDateKey(date) {
        if (date === void 0) {
          date = /* @__PURE__ */new Date();
        }
        var d = date instanceof Date ? date : new Date(date);
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, "0");
        var day = String(d.getDate()).padStart(2, "0");
        return y + "-" + m + "-" + day;
      }
      function performanceScore(run) {
        var kills = Math.max(0, Number(run == null ? void 0 : run.kills) || 0);
        var seconds = Math.max(0, Number(run == null ? void 0 : run.gameTime) || 0);
        var bosses = Math.max(0, Number(run == null ? void 0 : run.bossKills) || 0);
        if ((run == null ? void 0 : run.runMode) === "endless") {
          var combat = Math.min(80, Math.sqrt(kills) * 2);
          var endurance = Math.min(90, seconds / 30) * Math.min(1, kills / 80);
          return Math.floor(combat + endurance + bosses * 100 + (run.victory ? 100 : 0));
        }
        return Math.floor(kills + seconds / 6 + bosses * 80 + (run != null && run.victory ? 180 : 0));
      }
      function grantRunProgress(metaInput, run, _temp14) {
        var _ref26 = _temp14 === void 0 ? {} : _temp14,
          _ref26$dateKey = _ref26.dateKey,
          dateKey = _ref26$dateKey === void 0 ? localDateKey() : _ref26$dateKey;
        var meta = metaInput;
        var score = performanceScore(run);
        var qualified = score >= 80;
        var stageId = String((run == null ? void 0 : run.stageId) || "unknown");
        if (meta.dailyMapRuns.date !== dateKey) {
          meta.dailyMapRuns = {
            date: dateKey,
            counts: {}
          };
        }
        var priorRuns = Math.max(0, Number(meta.dailyMapRuns.counts[stageId]) || 0);
        var repeatMultipliers = [1, 0.65, 0.35, 0.15, 0];
        var repeatMultiplier = repeatMultipliers[Math.min(priorRuns, repeatMultipliers.length - 1)];
        var uncappedCurrency = qualified ? Math.floor((score - 50) / 15) : 0;
        var baseCurrency = Math.max(0, Math.min(30, uncappedCurrency));
        var currency = Math.floor(baseCurrency * repeatMultiplier);
        var xp = (run == null ? void 0 : run.runMode) === "endless" ? Math.min(140, Math.floor(score / 4)) : Math.min(140, Math.floor(Math.max(0, Number(run == null ? void 0 : run.kills) || 0) / 4 + Math.max(0, Number(run == null ? void 0 : run.gameTime) || 0) / 20 + Math.max(0, Number(run == null ? void 0 : run.bossKills) || 0) * 20 + (run != null && run.victory ? 40 : 0)));
        var levelsGained = addMetaXp(meta, xp);
        if (qualified) meta.dailyMapRuns.counts[stageId] = priorRuns + 1;
        meta.currency += currency;
        meta.lifetimeCurrency += currency;
        return {
          score: score,
          mode: (run == null ? void 0 : run.runMode) || "chapter",
          qualified: qualified,
          threshold: 80,
          currency: currency,
          baseCurrency: baseCurrency,
          repeatMultiplier: repeatMultiplier,
          repeatIndex: priorRuns + 1,
          xp: xp,
          levelsGained: levelsGained,
          level: meta.level
        };
      }
      function purchaseMetaTalent(meta, id) {
        var talent = META_TALENTS[id];
        if (!talent) return {
          ok: false,
          reason: "missing"
        };
        if (meta.purchasedTalents.includes(id)) return {
          ok: false,
          reason: "owned"
        };
        if (meta.level < talent.unlockLevel) return {
          ok: false,
          reason: "locked"
        };
        if (meta.currency < talent.cost) return {
          ok: false,
          reason: "currency"
        };
        meta.currency -= talent.cost;
        meta.purchasedTalents.push(id);
        return {
          ok: true,
          talent: talent
        };
      }
      function toggleMetaTalent(meta, id) {
        if (!meta.purchasedTalents.includes(id)) return {
          ok: false,
          reason: "unowned"
        };
        var index = meta.equippedTalents.indexOf(id);
        if (index >= 0) {
          meta.equippedTalents.splice(index, 1);
          return {
            ok: true,
            equipped: false,
            talent: META_TALENTS[id]
          };
        }
        if (meta.equippedTalents.length >= META_TALENT_SLOT_CAP) {
          return {
            ok: false,
            reason: "slots"
          };
        }
        meta.equippedTalents.push(id);
        return {
          ok: true,
          equipped: true,
          talent: META_TALENTS[id]
        };
      }
      function applyMetaTalents(player, meta) {
        var bonuses = {
          startCoins: 0,
          extraStartingWeapon: 0
        };
        if (!(player != null && player.runModifiers)) return bonuses;
        var additive = /* @__PURE__ */new Set(["armor", "critChance", "reviveCharges", "projectileBonus", "armorReflectRatio", "speedDamageRatio"]);
        for (var _iterator82 = _createForOfIteratorHelperLoose((meta == null ? void 0 : meta.equippedTalents) || []), _step82; !(_step82 = _iterator82()).done;) {
          var _meta$purchasedTalent;
          var id = _step82.value;
          var talent = META_TALENTS[id];
          if (!talent || !((_meta$purchasedTalent = meta.purchasedTalents) != null && _meta$purchasedTalent.includes(id))) continue;
          for (var _i33 = 0, _Object$entries6 = Object.entries(talent.effects || {}); _i33 < _Object$entries6.length; _i33++) {
            var _Object$entries6$_i = _Object$entries6[_i33],
              key = _Object$entries6$_i[0],
              value = _Object$entries6$_i[1];
            if (key === "startCoins" || key === "extraStartingWeapon") {
              bonuses[key] += value;
            } else if (additive.has(key)) {
              player.runModifiers[key] = (player.runModifiers[key] || 0) + value;
            } else {
              var _player$runModifiers$3;
              player.runModifiers[key] = ((_player$runModifiers$3 = player.runModifiers[key]) != null ? _player$runModifiers$3 : 1) * value;
            }
          }
        }
        player.recalculateStats == null || player.recalculateStats();
        player.hp = player.maxHp;
        return bonuses;
      }

      // prototype-2d-pixel/src/keymap.js
      var KEYMAP_ACTIONS = Object.freeze(["up", "down", "left", "right", "skill", "ultimate", "pause", "help", "mute"]);
      var DEFAULT_KEYMAP = Object.freeze({
        up: Object.freeze(["w", "arrowup"]),
        down: Object.freeze(["s", "arrowdown"]),
        left: Object.freeze(["a", "arrowleft"]),
        right: Object.freeze(["d", "arrowright"]),
        skill: Object.freeze(["e"]),
        ultimate: Object.freeze(["q"]),
        pause: Object.freeze(["escape", "p"]),
        help: Object.freeze(["h", "?"]),
        mute: Object.freeze(["m"])
      });

      // prototype-2d-pixel/src/input.js
      var JOYSTICK_DEADZONE = 0.15;
      var GAMEPAD_AXIS_DEADZONE = 0.18;
      var GAMEPAD_BUTTON = Object.freeze({
        A: 0,
        B: 1,
        X: 2,
        Y: 3,
        LB: 4,
        RB: 5,
        LT: 6,
        RT: 7,
        BACK: 8,
        START: 9
      });
      function applyGamepadDeadzone(v, dz) {
        if (dz === void 0) {
          dz = GAMEPAD_AXIS_DEADZONE;
        }
        if (!Number.isFinite(v)) return 0;
        var a = Math.abs(v);
        if (a < dz) return 0;
        var sign = v < 0 ? -1 : 1;
        return sign * ((a - dz) / (1 - dz));
      }
      function sampleJoystick(dx, dy, maxR) {
        if (maxR === void 0) {
          maxR = 60;
        }
        if (![dx, dy, maxR].every(Number.isFinite) || maxR <= 0) return {
          x: 0,
          y: 0,
          knobX: 0,
          knobY: 0
        };
        var d = Math.hypot(dx, dy);
        var clamp = Math.min(d, maxR);
        var dirx = d === 0 ? 0 : dx / d;
        var diry = d === 0 ? 0 : dy / d;
        var mag = clamp / maxR;
        var scaled = mag < JOYSTICK_DEADZONE ? 0 : Math.pow((mag - JOYSTICK_DEADZONE) / (1 - JOYSTICK_DEADZONE), 1.3);
        return {
          x: dirx * scaled,
          y: diry * scaled,
          knobX: dirx * clamp,
          knobY: diry * clamp
        };
      }

      // prototype-2d-pixel/src/terrain-art.js
      var TERRAIN_TILE_SIZE = exports('TERRAIN_TILE_SIZE', 256);
      var COLUMNS = Object.freeze({
        forest: 0,
        crypt: 1,
        tundra: 2
      });
      function terrainRoads(view, mode) {
        if (mode === void 0) {
          mode = "chapter";
        }
        var step = mode === "endless" ? 1600 : 1200,
          breadth = 72,
          roads = [];
        for (var y = Math.floor((view.y - breadth) / step) * step; y <= view.y + view.height; y += step) roads.push({
          x: view.x - 2,
          y: y,
          width: view.width + 4,
          height: breadth
        });
        for (var x = Math.floor((view.x - breadth) / step) * step; x <= view.x + view.width; x += step) roads.push({
          x: x,
          y: view.y - 2,
          width: breadth,
          height: view.height + 4
        });
        return roads;
      }
      function terrainCourtyard(object) {
        if (!object || object.used && !isRetainedBuilding(object)) return null;
        var box = buildingBounds(object);
        if (!box) return null;
        return {
          x: Math.floor(box.left - 32),
          y: Math.floor(box.top - 24),
          width: Math.ceil(box.right - box.left + 64),
          height: Math.ceil(box.bottom - box.top + 64)
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TerrainPlan.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './shared-core.js'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, TERRAIN_TILE_SIZE, terrainRoads, terrainCourtyard;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      TERRAIN_TILE_SIZE = module.TERRAIN_TILE_SIZE;
      terrainRoads = module.terrainRoads;
      terrainCourtyard = module.terrainCourtyard;
    }],
    execute: function () {
      exports({
        planTerrain: planTerrain,
        terrainFragments: terrainFragments
      });
      cclegacy._RF.push({}, "e4becCPQa9FqYw0XFCEIPoG", "TerrainPlan", undefined);
      var TERRAIN_PERIOD = exports('TERRAIN_PERIOD', TERRAIN_TILE_SIZE * 2);

      /** Source UV origin is always world origin, including negative endless coordinates. */
      function terrainFragments(rect, view, paved) {
        if (paved === void 0) {
          paved = false;
        }
        if (![view.x, view.y, view.width, view.height].every(Number.isFinite) || Math.abs(view.x) > Number.MAX_SAFE_INTEGER - 8192 || Math.abs(view.y) > Number.MAX_SAFE_INTEGER - 8192 || ![rect.x, rect.y, rect.width, rect.height, view.x, view.y, view.width, view.height].every(Number.isFinite)) return [];
        var left = Math.max(rect.x, view.x),
          top = Math.max(rect.y, view.y),
          right = Math.min(rect.x + rect.width, view.x + view.width),
          bottom = Math.min(rect.y + rect.height, view.y + view.height),
          out = [];
        if (right <= left || bottom <= top || [left, top, right, bottom].some(function (n) {
          return Math.abs(n) > Number.MAX_SAFE_INTEGER - 8192;
        })) return out;
        for (var y = Math.floor(top / TERRAIN_PERIOD) * TERRAIN_PERIOD; y < bottom; y += TERRAIN_PERIOD) for (var x = Math.floor(left / TERRAIN_PERIOD) * TERRAIN_PERIOD; x < right; x += TERRAIN_PERIOD) {
          var a = Math.max(x, left),
            b = Math.max(y, top);
          out.push({
            x: a,
            y: b,
            width: Math.min(x + TERRAIN_PERIOD, right) - a,
            height: Math.min(y + TERRAIN_PERIOD, bottom) - b,
            u: a - x,
            v: b - y,
            paved: paved
          });
        }
        return out;
      }
      function planTerrain(view, mode, structures) {
        if (![view.x, view.y, view.width, view.height].every(Number.isFinite) || Math.abs(view.x) > Number.MAX_SAFE_INTEGER - 8192 || Math.abs(view.y) > Number.MAX_SAFE_INTEGER - 8192 || view.width <= 0 || view.height <= 0 || view.width > 4096 || view.height > 4096) return [];
        // Render whole world cells. Camera-edge UV clipping causes nearest-neighbour shimmer.
        var left = Math.floor(view.x / TERRAIN_PERIOD) * TERRAIN_PERIOD,
          top = Math.floor(view.y / TERRAIN_PERIOD) * TERRAIN_PERIOD,
          bounds = {
            x: left,
            y: top,
            width: Math.ceil((view.x + view.width) / TERRAIN_PERIOD) * TERRAIN_PERIOD - left,
            height: Math.ceil((view.y + view.height) / TERRAIN_PERIOD) * TERRAIN_PERIOD - top
          };
        var patches = terrainFragments(bounds, bounds);
        for (var _iterator = _createForOfIteratorHelperLoose(terrainRoads(bounds, mode)), _step; !(_step = _iterator()).done;) {
          var road = _step.value;
          patches.push.apply(patches, terrainFragments(road, bounds, true));
        }
        for (var _iterator2 = _createForOfIteratorHelperLoose(structures), _step2; !(_step2 = _iterator2()).done;) {
          var structure = _step2.value;
          var yard = terrainCourtyard(structure);
          if (yard) patches.push.apply(patches, terrainFragments(yard, bounds, true));
        }
        return patches;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TouchState.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "5719cLul9BG6K7V1AblKJ4E", "TouchState", undefined);
      /** Pointer ownership only; no gameplay, time or damage calculations. */
      var TouchState = exports('TouchState', /*#__PURE__*/function () {
        function TouchState() {
          this.moves = new Map();
          this.presses = new Map();
        }
        var _proto = TouchState.prototype;
        _proto.valid = function valid(id) {
          return typeof id === "number" && Number.isInteger(id) && id >= 0;
        };
        _proto.beginMove = function beginMove(id, x, y) {
          if (!this.valid(id) || this.moves.has(id)) return;
          this.moves.set(id, {
            x: Math.sign(x) || 0,
            y: Math.sign(y) || 0
          });
        };
        _proto.move = function move(id, x, y) {
          if (!this.valid(id) || !this.moves.has(id)) return;
          this.moves.set(id, {
            x: Math.sign(x) || 0,
            y: Math.sign(y) || 0
          });
        };
        _proto.endMove = function endMove(id) {
          if (this.valid(id)) this.moves["delete"](id);
        };
        _proto.moving = function moving(x, y) {
          return Array.from(this.moves.values()).some(function (d) {
            return d.x === x && d.y === y;
          });
        };
        _proto.beginPress = function beginPress(id, button) {
          if (!this.valid(id) || this.presses.has(id) || this.pressed(button)) return false;
          this.presses.set(id, button);
          return true;
        };
        _proto.pressed = function pressed(button) {
          return Array.from(this.presses.values()).includes(button);
        };
        _proto.endPress = function endPress(id, button, inside) {
          if (!this.valid(id) || this.presses.get(id) !== button) return false;
          this.presses["delete"](id);
          return inside;
        };
        _proto.cancelPress = function cancelPress(id, button) {
          this.endPress(id, button, false);
        };
        _proto.clear = function clear() {
          this.moves.clear();
          this.presses.clear();
        };
        _createClass(TouchState, [{
          key: "vector",
          get: function get() {
            var x = 0,
              y = 0;
            for (var _i = 0, _Array$from = Array.from(this.moves.values()); _i < _Array$from.length; _i++) {
              var d = _Array$from[_i];
              x += d.x;
              y += d.y;
            }
            return {
              x: Math.sign(x),
              y: Math.sign(y)
            };
          }
        }]);
        return TouchState;
      }());
      cclegacy._RF.pop();
    }
  };
});

(function(r) {
  r('virtual:///prerequisite-imports/main', 'chunks:///_virtual/main'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});