(async () => {
	(function(){var w=window,C='___grecaptcha_cfg',cfg=w[C]=w[C]||{},N='grecaptcha';var gr=w[N]=w[N]||{};gr.ready=gr.ready||function(f){(cfg['fns']=cfg['fns']||[]).push(f);};w['__recaptcha_api']='https://www.google.com/recaptcha/api2/';(cfg['render']=cfg['render']||[]).push('onload');w['__google_recaptcha_client']=true;var d=document,po=d.createElement('script');po.type='text/javascript';po.async=true;po.src='https://www.gstatic.com/recaptcha/releases/CHIHFAf1bjFPOjwwi5Xa4cWR/recaptcha__ko.js';po.crossOrigin='anonymous';po.integrity='sha384-3ixG05K3/O+UzfsLo88Ri1RQG5M4r7McMuhCB2e0QHP2rfu2zlqugMd4PrILOX5Z';var e=d.querySelector('script[nonce]'),n=e&&(e['nonce']||e.getAttribute('nonce'));if(n){po.setAttribute('nonce',n);}var s=d.getElementsByTagName('script')[0];s.parentNode.insertBefore(po, s);})();

	function getDefaultVariable(name) {
		const iframe = document.createElement("iframe");
		document.head.append(iframe);
		return iframe.contentWindow[name];
	}

	let gotInstance = true;

	if (!window.OPM) {
		gotInstance = false;
		alert("OPM not loaded! Attempting to load... (install manually if not working)");

		WebSocket.prototype.send = function() {
			this.close();
			gotInstance = true;
		};

		await new Promise(resolve => {
			const checkInterval = setInterval(() => {
				if (gotInstance) {
					clearInterval(checkInterval);
					resolve();
				}
			}, 100);
		});

		document.write(await (await fetch("https://opm.dimden.dev/client/")).text());
		document.close();
		await sleep(1e4);
	}

	let wsb;

	(() => {
		const OJS = (() => {
			window = this;
			const error = m => console.error("%c " + m, "color: #ff0000");
			const renderCaptcha = () => new Promise(resolve => {
				OWOP.windowSys.addWindow(new OWOP.windowSys.class.window(`Verification needed`, {
					closeable: true
				}, function (win) {
					grecaptcha.render(win.addObj(OWOP.util.mkHTML("div", {})), {
						theme: "dark",
						sitekey: "6LcgvScUAAAAAARUXtwrM8MP0A0N70z4DHNJh-KI",
						callback: function callback(token) {
							win.close();
							resolve(token);
						}
					});
				}));
			});
			/*
				Events:
				name - description [arguments].
				open - Opened WebSocket connection.
				close - Closed WebSocket connection.
				join - Joined to world [world name].
				id - Got id [id].
				rawMessage - Any message from WebSocket server. (It can be object or string) [data].
				update - Player in world updates [player object].
				pixel - New pixel in world [x, y, [r, g, b]].
				disconnect - Someone in world disconnected [player object].
				teleport - got 'teleport' opcode. Very rare. [x, y].
				rank - Got new rank. [rank].
				captcha - Captcha state. [gcaptcha id].
				chunkProtect - Chunk (un)protected. [x, y, newState].
				pquota - New PQuota. [rate, per].
				destroy - Socket was destroyed and won't reconnect anymore.
				chunk - New chunk. [x, y, chunk, protected].
				message - New message in chat. [msg].
			*/
			class ChunkSystem {
				constructor() {
					this.chunks = [];
					this.chunkProtected = [];
				};
				setChunk(x, y, data) {
					if (!data || typeof x !== "number" || typeof y !== "number") return error("ChunkSystem.setChunk: failed to set chunk (no data or invalid coords).");
					if (data.constructor.name !== "Array") data = Array.from(data);
					if (!this.chunks[x]) this.chunks[x] = [];
					return this.chunks[x][y] = data;
				};
				getChunk(x, y, raw) {
					if (!raw) {
						x = Math.floor(x / Client.options.chunkSize);
						y = Math.floor(y / Client.options.chunkSize);
					};
					if (!this.chunks[x]) return;
					return this.chunks[x][y];
				};
				removeChunk(x, y) {
					if (!this.chunks[x]) return;
					if (!this.chunks[x][y]) return;
					return this.chunks[x].splice(y, 1);
				};
				setPixel(x, y, rgb) {
					if (!rgb || typeof rgb !== "object" || typeof x !== "number" || typeof y !== "number") return error("ChunkSystem.setPixel: failed to set pixel (no/wrong rgb or invalid coords).");
					const chunkX = Math.floor(x / Client.options.chunkSize);
					const chunkY = Math.floor(y / Client.options.chunkSize);
					if (!this.chunks[chunkX]) return;
					const chunk = this.chunks[chunkX][chunkY];
					if (!chunk) return false;
					const getIbyXY = (x, y, w) => (y * w + x) * 3;
					const i = getIbyXY(x & Client.options.chunkSize - 1, y & Client.options.chunkSize - 1, Client.options.chunkSize);
					chunk[i] = rgb[0];
					chunk[i + 1] = rgb[1];
					chunk[i + 2] = rgb[2];
					return true;
				};
				getPixel(x, y) {
					if (typeof x !== "number" || typeof y !== "number") return error("ChunkSystem.getPixel: failed to get pixel (invalid coords).");
					const chunkX = Math.floor(x / Client.options.chunkSize);
					const chunkY = Math.floor(y / Client.options.chunkSize);
					if (!this.chunks[chunkX]) return;
					const chunk = this.chunks[chunkX][chunkY];
					const getIbyXY = (x, y, w) => (y * w + x) * 3;
					const i = getIbyXY(x & Client.options.chunkSize - 1, y & Client.options.chunkSize - 1, Client.options.chunkSize);
					return [chunk[i], chunk[i + 1], chunk[i + 2]];
				};
				protectChunk(x, y) {
					if (typeof x !== "number" || typeof y !== "number") return error("ChunkSystem.protectChunk: failed to protect chunk (invalid coords).");
					if (!this.chunkProtected[x]) this.chunkProtected[x] = [];
					return this.chunkProtected[x][y] = true;
				}
				unProtectChunk(x, y) {
					if (typeof x !== "number" || typeof y !== "number") return error("ChunkSystem.unprotectChunk: failed to unprotect chunk (invalid coords).");
					if (!this.chunkProtected[x]) return false;
					this.chunkProtected[x][y] = false;
					return true;
				}
				isProtected(x, y) {
					if (typeof x !== "number" || typeof y !== "number") return error("ChunkSystem.isProtected: failed to check (invalid coords).");
					if (!this.chunkProtected[x]) return false;
					return Boolean(this.chunkProtected[x][y]);
				}
			};
			const Chunks = new ChunkSystem();
			class Client {
				/**
				 * @param {Object} options Options for connection
				 * @param {string} [options.ws=wss://ourworldofpixels.com] Websocket server address. ✔️
				 * @param {?number} options.id ID for logging. If not set, OWOP ID will be used. ✔️
				 * @param {string} [options.world=main] World name. ✔️
				 * @param {?boolean} options.noLog No logging. ✔️
				 * @param {?boolean} options.reconnect Reconnect if disconnected. ✔️
				 * @param {?string} options.adminlogin Admin login. ✔️
				 * @param {?string} options.modlogin Mod login. ✔️
				 * @param {?string} options.pass Pass for world. ✔️
				 * @param {?string} options.captchapass Captcha pass. ✔️
				 * @param {?string} options.teleport Teleport on 'teleport' opcode. ✔️
				 * @param {number} [options.reconnectTime=5000] Reconnect time (ms) after disconnect. ✔️
				 * @param {?boolean} options.unsafe Use methods that are supposed to be only for admin or moderator. ✔️
				 * @param {?boolean} options.simpleChunks Use original OWOP chunks instead of OJS. ✔️
				 */
				constructor(options = {}) {
					if (!options.ws) options.ws = "wss://ourworldofpixels.com";
					if (!options.world) options.world = "main";
					if (!options.reconnectTime) options.reconnectTime = 5000;
					const OJS = this;
					this.clientOptions = options;
					this.RANK = {
						ADMIN: 3,
						MODERATOR: 2,
						USER: 1,
						NONE: 0
					};
					this.options = {
						chunkSize: 16,
						maxChatBuffer: 256,
						maxMessageLength: {
							0: 128,
							1: 128,
							2: 512,
							3: 16384
						},
						maxWorldNameLength: 24,
						worldBorder: 0xFFFFFF,
						opcode: {
							setId: 0,
							worldUpdate: 1,
							chunkLoad: 2,
							teleport: 3,
							setRank: 4,
							captcha: 5,
							setPQuota: 6,
							chunkProtected: 7
						},
						captchaState: {
							CA_WAITING: 0,
							CA_VERIFYING: 1,
							CA_VERIFIED: 2,
							CA_OK: 3,
							CA_INVALID: 4
						},
						captchaStateNames: {
							0: "WAITING",
							1: "VERIFYING",
							2: "VERIFIED",
							3: "OK",
							4: "INVALID"
						}
					};
					if (window.document === undefined) {
						this.options.misc = {
							chatVerification: String.fromCharCode(10),
							tokenVerification: "CaptchA",
							worldVerification: 25565
						};
					} else this.options.misc = {
						chatVerification: OWOP.options.serverAddress[0].proto.misc.chatVerification,
						tokenVerification: OWOP.options.serverAddress[0].proto.misc.tokenVerification,
						worldVerification: OWOP.options.serverAddress[0].proto.misc.worldVerification
					};
					OJS.chat = {
						send(msg) {
							if (typeof OJS.player.rank !== "number") return false;
							msg = OJS.chat.sendModifier(msg);
							OJS.net.ws.send(msg.substr(0, OJS.options.maxMessageLength[OJS.player.rank]) + OJS.options.misc.chatVerification);
							return true;
						},
						local(msg) {
							OJS.util.log(msg)
						},
						sendModifier(msg) {
							return msg
						},
						recvModifier(msg) {
							return msg
						},
						messages: []
					};
					OJS.world = {
						join(world = "main") {
							if (OJS.net.ws.readyState !== 1 || !OJS.net.isWebsocketConnected) return false;
							let ints = [];
							world = world.toLowerCase();
							for (let i = 0; i < world.length && i < 24; i++) {
								let charCode = world.charCodeAt(i);
								if ((charCode < 123 && charCode > 96) || (charCode < 58 && charCode > 47) || charCode === 95 || charCode === 46)
									ints.push(charCode);
							}
							let array = new ArrayBuffer(ints.length + 2);
							let dv = new DataView(array);
							for (let i = ints.length; i--;) dv.setUint8(i, ints[i]);
							dv.setUint16(ints.length, OJS.options.misc.worldVerification, true);
							OJS.net.ws.send(array);
							OJS.util.log(`Joining world: ${world}`);
							OJS.world.name = world;
							return true;
						},
						leave() {
							OJS.net.isWorldConnected = false;
							OJS.net.isWebsocketConnected = false;
							OJS.net.ws.close();
						},
						destroy() {
							OJS.net.isWorldConnected = false;
							OJS.net.isWebsocketConnected = false;
							OJS.net.destroyed = true;
							OJS.net.ws.close();
							OJS.emit("destroy");
						},
						move(x = 0, y = 0) {
							if (OJS.net.ws.readyState !== 1 || !OJS.net.isWebsocketConnected) return false;
							OJS.player.x = x;
							OJS.player.y = y;
							x *= 16;
							y *= 16;
							const dv = new DataView(new ArrayBuffer(12));
							OJS.player.worldX = x;
							OJS.player.worldY = y;
							dv.setInt32(0, x, true);
							dv.setInt32(4, y, true);
							dv.setUint8(8, OJS.player.color[0]);
							dv.setUint8(9, OJS.player.color[1]);
							dv.setUint8(10, OJS.player.color[2]);
							dv.setUint8(11, OJS.player.tool);
							OJS.net.ws.send(dv.buffer);
							return true;
						},
						setPixel(x = OJS.player.x, y = OJS.player.y, color = OJS.player.color, sneaky, move = true) {
							if (OJS.net.ws.readyState !== 1 || !OJS.net.isWebsocketConnected || OJS.player.rank === OJS.RANK.NONE) return false;
							if (!OJS.net.bucket.canSpend(1)) return false;
							const lX = OJS.player.x,
								lY = OJS.player.y;
							if (move) OJS.world.move(x, y);
							const dv = new DataView(new ArrayBuffer(11));
							dv.setInt32(0, x, true);
							dv.setInt32(4, y, true);
							dv.setUint8(8, color[0]);
							dv.setUint8(9, color[1]);
							dv.setUint8(10, color[2]);
							OJS.player.color = color;
							OJS.net.ws.send(dv.buffer);
							if (sneaky) OJS.world.move(lX, lY);
							return true;
						},
						setTool(id = 0) {
							if (OJS.net.ws.readyState !== 1 || !OJS.net.isWebsocketConnected) return false;
							OJS.player.tool = id;
							const dv = new DataView(new ArrayBuffer(12));
							dv.setInt32(0, OJS.player.worldX, true);
							dv.setInt32(4, OJS.player.worldY, true);
							dv.setUint8(8, OJS.player.color[0]);
							dv.setUint8(9, OJS.player.color[1]);
							dv.setUint8(10, OJS.player.color[2]);
							dv.setUint8(11, id);
							OJS.net.ws.send(dv.buffer);
							return true;
						},
						setColor(color = [0, 0, 0]) {
							if (OJS.net.ws.readyState !== 1 || !OJS.net.isWebsocketConnected) return false;
							OJS.player.color = color;
							const dv = new DataView(new ArrayBuffer(12));
							dv.setInt32(0, OJS.player.worldX, true);
							dv.setInt32(4, OJS.player.worldY, true);
							dv.setUint8(8, OJS.player.color[0]);
							dv.setUint8(9, OJS.player.color[1]);
							dv.setUint8(10, OJS.player.color[2]);
							dv.setUint8(11, OJS.player.tool);
							OJS.net.ws.send(dv.buffer);
							return true;
						},
						protectChunk(x = OJS.player.x, y = OJS.player.y, newState = 1) {
							if (OJS.net.ws.readyState !== 1 || !OJS.net.isWebsocketConnected) return false;
							if (OJS.player.rank < OJS.RANK.ADMIN && !options.unsafe) return false;
							const dv = new DataView(new ArrayBuffer(10));
							dv.setInt32(0, x, true);
							dv.setInt32(4, y, true);
							dv.setUint8(8, newState);
							OJS.net.ws.send(dv.buffer);
							return true;
						},
						clearChunk(x = OJS.player.x, y = OJS.player.y, rgb = OJS.player.color) {
							if (OJS.player.rank === OJS.RANK.ADMIN || options.unsafe) {
								const dv = new DataView(new ArrayBuffer(13));
								dv.setInt32(0, x, true);
								dv.setInt32(4, y, true);
								dv.setUint8(8, rgb[0]);
								dv.setUint8(9, rgb[1]);
								dv.setUint8(10, rgb[2]);
								OJS.net.ws.send(dv.buffer);
								return true;
							}
							return false;
						},
						requestChunk(x, y, inaccurate) {
							if (options.simpleChunks) return true;
							if (OJS.net.ws.readyState !== 1 || !OJS.net.isWebsocketConnected) return false;
							if (typeof x !== "number" && typeof y !== "number") {
								x = OJS.player.x;
								y = OJS.player.y;
								inaccurate = true;
							};
							if (inaccurate) {
								x = Math.floor(x / OJS.options.chunkSize);
								y = Math.floor(y / OJS.options.chunkSize);
							};
							let wb = OJS.options.worldBorder;
							if (x > wb || y > wb || x < ~wb || y < ~wb) return;
							let dv = new DataView(new ArrayBuffer(8));
							dv.setInt32(0, x, true);
							dv.setInt32(4, y, true);
							OJS.net.ws.send(dv.buffer);
							return true;
						},
						getPixel(x = OJS.player.x, y = OJS.player.y) {
							if (options.simpleChunks) return OWOP.world.getPixel(x, y);
							// It'll return undefined on unknown chunk but it'll request it, so you'll need to getPixel(x, y) again. I suggest you requesting chunks manually and getting them from ChunkSystem.
							if (!Chunks.getChunk(x, y)) OJS.world.requestChunk(x, y, true);
							return Chunks.getPixel(x, y);
						}
					};
					OJS.player = {
						x: 0,
						y: 0,
						worldX: 0,
						worldY: 0,
						tool: 0,
						rank: null,
						id: null,
						color: [0, 0, 0]
					};
					OJS.players = {};
					OJS.net = {
						isWebsocketConnected: false,
						isWorldConnected: false,
						destroyed: false,
						bucket: new Bucket(32, 4),
						async dataHandler(data) {
							if (typeof data !== "object") return error("Client.net.dataHandler: data is not object.");
							const realData = data;
							data = new DataView(data);
							const opcode = data.getUint8(0);
							switch (opcode) {
								case OJS.options.opcode.setId:
									{
										OJS.emit("id", data.getUint32(1, true));
										OJS.player.id = data.getUint32(1, true);
										OJS.net.isWorldConnected = true;
										if (typeof OJS.player.rank !== "number") OJS.player.rank = OJS.RANK.NONE;
										OJS.util.log(`Joined world '${OJS.world.name}' and got id '${data.getUint32(1, true)}'`, "color: #00ff00");
										if (options.adminlogin) OJS.chat.send("/adminlogin " + options.adminlogin);
										if (options.modlogin) OJS.chat.send("/modlogin " + options.modlogin); // Not working at the moment
										if (options.pass) OJS.chat.send("/pass " + options.pass);
										OJS.emit("join", OJS.world.name);
										break;
									}
								case OJS.options.opcode.worldUpdate:
									{
										// Players
										let updated = false;
										let updates = {};
										for (let i = data.getUint8(1); i--;) {
											updated = true;
											let pid = data.getUint32(2 + i * 16, true);
											if (pid === OJS.player.id) continue;
											let pmx = data.getUint32(2 + i * 16 + 4, true);
											let pmy = data.getUint32(2 + i * 16 + 8, true);
											let pr = data.getUint8(2 + i * 16 + 12);
											let pg = data.getUint8(2 + i * 16 + 13);
											let pb = data.getUint8(2 + i * 16 + 14);
											let ptool = data.getUint8(2 + i * 16 + 15);
											updates[pid] = {
												x: pmx,
												y: pmy,
												rgb: [pr, pg, pb],
												tool: ptool
											};
										}
										if (updated) {
											for (let i in updates) {
												if (!OJS.players[i]) OJS.emit("connect", i);
												OJS.players[i] = {
													id: i,
													x: updates[i].x >> 4,
													y: updates[i].y >> 4,
													rgb: updates[i].rgb,
													tool: updates[i].tool
												};
												OJS.emit("update", OJS.players[i]);
											}
										};
										// Pixels
										let off = 2 + data.getUint8(1) * 16;
										for (let i = data.getUint16(off, true), j = 0; j < i; j++) {
											let
												x = data.getInt32(2 + off + j * 15 + 4, true),
												y = data.getInt32(2 + off + j * 15 + 8, true);
											let r = data.getUint8(2 + off + j * 15 + 12),
												g = data.getUint8(2 + off + j * 15 + 13),
												b = data.getUint8(2 + off + j * 15 + 14);
											OJS.emit('pixel', x, y, [r, g, b]);
											Chunks.setPixel(x, y, [r, g, b]);
										}
										// Disconnects
										off += data.getUint16(off, true) * 15 + 2;
										for (let k = data.getUint8(off); k--;) {
											let dpid = data.getUint32(1 + off + k * 4, true);
											if (OJS.players[dpid]) {
												OJS.emit("disconnect", OJS.players[dpid]);
												delete OJS.players[dpid];
											}
										}
										break;
									}
								case OJS.options.opcode.chunkLoad:
									{
										let chunkX = data.getInt32(1, true);
										let chunkY = data.getInt32(5, true);
										let locked = !!data.getUint8(9);
										let u8data = new Uint8Array(realData, 10, realData.byteLength - 10);
										let decompressed = OJS.util.decompress(u8data)
										Chunks.setChunk(chunkX, chunkY, decompressed);
										if (locked) Chunks.protectChunk(chunkX, chunkY);
										OJS.emit('chunk', chunkX, chunkY, decompressed, locked);
										break;
									}
								case OJS.options.opcode.teleport:
									{
										if (!options.teleport) break;
										const x = data.getInt32(1, true);
										const y = data.getInt32(5, true);
										OJS.world.move(x, y);
										OJS.emit("teleport", x, y);
										break;
									}
								case OJS.options.opcode.setRank:
									{
										OJS.player.rank = data.getUint8(1);
										OJS.emit("rank", data.getUint8(1));
										break;
									}
								case OJS.options.opcode.captcha:
									{
										switch (data.getUint8(1)) {
											case OJS.options.captchaState.CA_WAITING:
												OJS.util.log("CaptchaState: WAITING (0)", "color: #ffff00");
												if (options.captchapass) {
													OJS.net.ws.send(OJS.options.misc.tokenVerification + "LETMEINPLZ" + options.captchapass);
													OJS.util.log("Used captchapass.", "color: #00ff00");
												} else if (options.renderCaptcha) OJS.net.ws.send(OWOP.options.serverAddress[0].proto.misc.tokenVerification + (await renderCaptcha()));
												break;
											case OJS.options.captchaState.CA_VERIFYING:
												OJS.util.log("CaptchaState: VERIFYING (1)", "color: #ffff00");
												break;
											case OJS.options.captchaState.CA_VERIFIED:
												OJS.util.log("CaptchaState: VERIFIED (2)", "color: #00ff00");
												break;
											case OJS.options.captchaState.CA_OK:
												OJS.util.log("CaptchaState: OK (3)", "color: #00ff00");
												OJS.world.join(options.world);
												break;
											case OJS.options.captchaState.CA_INVALID:
												OJS.util.log("CaptchaState: INVALID (4)", "color: #ff0000");
												OJS.util.log("Captcha failed. Websocket is invalid now.", "color: #ff0000");
												OJS.net.destroyed = true;
												OJS.net.isWorldConnected = false;
												OJS.net.isWebsocketConnected = false;
												OJS.emit("destroy");
												break;
										}
										OJS.emit("captcha", data.getUint8(1));
										break;
									}
								case OJS.options.opcode.setPQuota:
									{
										let rate = data.getUint16(1, true);
										let per = data.getUint16(3, true);
										OJS.net.bucket = new Bucket(rate, per);
										OJS.emit("pquota", rate, per);
										OJS.util.log(`New PQuota: ${rate}x${per}`);
										break;
									}
								case OJS.options.opcode.chunkProtected:
									{
										let cx = data.getInt32(1, true);
										let cy = data.getInt32(5, true);
										let newState = data.getUint8(9);
										if (newState) Chunks.protectChunk(cx, cy);
										else Chunks.unProtectChunk(cx, cy);
										OJS.emit("chunkProtect", cx, cy, newState);
										break;
									}
							}
						},
						messageHandler(data) {
							if (typeof data !== "string") return error("Client.net.messageHandler: data is not string.");
							if (data.startsWith("You are banned")) {
								OJS.util.log("Got ban message.", "color: #ff0000");
								OJS.emit("destroy");
								OJS.net.isWorldConnected = false;
								OJS.net.isWebsocketConnected = false;
								return OJS.net.destroyed = true;
							};
							if (data.startsWith("DEV")) OJS.util.log("[DEV] " + data.slice(3));
							if (data.startsWith("<")) return;
							data = OJS.chat.recvModifier(data);
							const nick = data.split(":")[0];
							OJS.emit("message", data);
							OJS.chat.messages.push(data);
							if (OJS.chat.messages.length > OJS.options.maxChatBuffer) OJS.chat.messages.shift();
						}
					};
					void
						function makeSocket() {
							let ws = new wsb(options.ws);
							ws.binaryType = "arraybuffer";
							ws.onopen = () => {
								OJS.util.log("WebSocket connected!", "color: #00ff00");
								OJS.net.isWebsocketConnected = true;
								OJS.emit("open");
							};
							ws.onmessage = msg => {
								OJS.emit("rawMessage", msg.data);
								if (typeof msg.data === "string") OJS.net.messageHandler(msg.data);
								else if (typeof msg.data === "object") OJS.net.dataHandler(msg.data);
							};
							ws.onclose = () => {
								OJS.emit("close");
								OJS.util.log("WebSocket disconnected!", "color: #ff0000");
								OJS.net.isWorldConnected = false;
								OJS.net.isWebsocketConnected = false;
								if (options.reconnect && !OJS.net.destroyed) setTimeout(makeSocket, options.reconnectTime);
							};
							ws.onerror = () => {
								OJS.util.log("WebSocket error!", "color: #ff0000");
								OJS.net.isWorldConnected = false;
								OJS.net.isWebsocketConnected = false;
							};
							OJS.net.ws = ws;
						}();
					OJS.util = {
						log(...msg) {
							if (options.noLog) return;
							if (options.id) console.log(`[${options.id}] ${msg}`);
							else if (OJS.player.id) console.log(`%c [${OJS.player.id}] ` + msg[0], msg[1]);
							else console.log(`%c [?] ` + msg[0], msg[1]);
						},
						decompress(u8arr) {
							// I'm not touching this shit anymore.
							var originalLength = u8arr[1] << 8 | u8arr[0];
							var u8decompressedarr = new Uint8Array(originalLength);
							var numOfRepeats = u8arr[3] << 8 | u8arr[2];
							var offset = numOfRepeats * 2 + 4;
							var uptr = 0;
							var cptr = offset;
							for (var i = 0; i < numOfRepeats; i++) {
								var currentRepeatLoc = (u8arr[4 + i * 2 + 1] << 8 | u8arr[4 + i * 2]) + offset;
								while (cptr < currentRepeatLoc) {
									u8decompressedarr[uptr++] = u8arr[cptr++];
								}
								var repeatedNum = u8arr[cptr + 1] << 8 | u8arr[cptr];
								var repeatedColorR = u8arr[cptr + 2];
								var repeatedColorG = u8arr[cptr + 3];
								var repeatedColorB = u8arr[cptr + 4];
								cptr += 5;
								while (repeatedNum--) {
									u8decompressedarr[uptr] = repeatedColorR;
									u8decompressedarr[uptr + 1] = repeatedColorG;
									u8decompressedarr[uptr + 2] = repeatedColorB;
									uptr += 3;
								}
							}
							while (cptr < u8arr.length) {
								u8decompressedarr[uptr++] = u8arr[cptr++];
							}
							return u8decompressedarr;
						}
					};
					if (options.unsafe) OJS.util.log("Using 'unsafe' option.", "color: #ffff00");
					this._events = {};
				};
				on(event, fn) {
					if (!this._events[event]) this._events[event] = [];
					this._events[event].push(fn);
				};
				once(event, fn) {
					if (!this._events[event]) this._events[event] = [];
					this._events[event].push([fn]);
				};
				emit(event, ...args) {
					if (!this._events[event]) return;
					for (let i in this._events[event])
						if (typeof this._events[event][i] === "function") this._events[event][i](...args);
						else {
							this._events[event][i][0](...args);
							this._events[event].splice(i, 1);
						}
				};
				off(event, fn) {
					if (!this._events[event]) return;
					for (let i in this._events[event])
						if (String(this._events[event][i]) === String(fn)) this._events[event].splice(i, 1);
				}
			};
			Client.RANK = {
				ADMIN: 3,
				MODERATOR: 2,
				USER: 1,
				NONE: 0
			};
			Client.options = {
				chunkSize: 16,
				maxChatBuffer: 256,
				maxMessageLength: {
					0: 128,
					1: 128,
					2: 512,
					3: 16384
				},
				maxWorldNameLength: 24,
				worldBorder: 0xFFFFFF,
				opcode: {
					setId: 0,
					worldUpdate: 1,
					chunkLoad: 2,
					teleport: 3,
					setRank: 4,
					captcha: 5,
					setPQuota: 6,
					chunkProtected: 7
				},
				captchaState: {
					CA_WAITING: 0,
					CA_VERIFYING: 1,
					CA_VERIFIED: 2,
					CA_OK: 3,
					CA_INVALID: 4
				},
				captchaStateNames: {
					0: "WAITING",
					1: "VERIFYING",
					2: "VERIFIED",
					3: "OK",
					4: "INVALID"
				}
			};
			if (window.document === undefined) {
				Client.options.misc = {
					chatVerification: String.fromCharCode(10),
					tokenVerification: "CaptchA",
					worldVerification: 25565
				};
			} else Client.options.misc = {
				chatVerification: OWOP.options.serverAddress[0].proto.misc.chatVerification,
				tokenVerification: OWOP.options.serverAddress[0].proto.misc.tokenVerification,
				worldVerification: OWOP.options.serverAddress[0].proto.misc.worldVerification
			};
			class Bucket {
				constructor(rate, time, infinite) {
					this.lastCheck = Date.now();
					this.allowance = rate;
					this.rate = rate;
					this.time = time;
					this.infinite = infinite;
				};
				update() {
					this.allowance += (Date.now() - this.lastCheck) / 1000 * (this.rate / this.time);
					this.lastCheck = Date.now();
					if (this.allowance > this.rate) {
						this.allowance = this.rate;
					}
				};
				canSpend(count) {
					if (this.infinite) {
						return true;
					}
					this.update();
					if (this.allowance < count) {
						return false;
					}
					this.allowance -= count;
					return true;
				};
			};
			console.log("OJS loaded");
			return {
				install: () => { },
				uninstall: () => {
					alert("Refresh page to uninstall.")
				},
				Client: Client,
				ChunkSystem: ChunkSystem,
				Chunks: Chunks,
				Bucket: Bucket
			}
		})();

		wsb = getDefaultVariable("WebSocket");

		const addTool = OWOP.tool.addToolObject;
		const Tool = OWOP.tool.class;
		const cursors = OWOP.cursors;
		const tools = OWOP.tool.allTools;
		const PLAYERFX = OWOP.fx.player;
		const RANK = OWOP.RANK;
		const updateToolbar = OWOP.tool.updateToolbar;
		const misc = OWOP.misc;
		const windowSys = OWOP.windowSys;
		const player = OWOP.player;
		const protocol = OWOP.require("conf").protocol;
		const Window = OWOP.windowSys.class.window;

		let queueInterval;
		let chunkTool;
		let pasteTool;
		let textTool;
		let ws;
		let permanent = false;
		let sneaky = false;

		const clients = [];
		const queue = [];
		const permanentQueue = [];
		const mainWindow = new Window("SOBv2", {}, window => {
			const wsLabel = document.createElement("span");
			wsLabel.innerText = "WS";

			const wsInput = document.createElement("input");
			wsInput.type = "text";
			wsInput.placeholder = "Default (local)";
			wsInput.oninput = () => {
				ws = wsInput.value;
				if (!ws) ws = undefined;
			};

			const connectButton = document.createElement("button");
			connectButton.innerText = "Connect";
			connectButton.onclick = () => {
				clients.push(new OJS.Client({
					simpleChunks: true,
					renderCaptcha: true,
					world: misc.world.name,
					ws,
					reconnect: true
				}));
			};

			const disconnectButton = document.createElement("button");
			disconnectButton.innerText = "Disconnect";
			disconnectButton.onclick = () => {
				while (clients.length) clients.pop().world.destroy();
			};

			const clearQueueButton = document.createElement("button");
			clearQueueButton.innerText = "Clear queue";
			clearQueueButton.onclick = () => {
				while (queue.length) queue.pop();
				while (permanentQueue.length) permanentQueue.pop();
			};

			const queueIntervalLabel = document.createElement("span");
			queueIntervalLabel.innerText = "QI";

			const queueIntervalInput = document.createElement("input");
			queueIntervalInput.type = "number";
			queueIntervalInput.value = 100;
			queueIntervalInput.oninput = () => {
				clearInterval(queueInterval);
				queueInterval = setInterval(queueFunction, parseInt(queueIntervalInput.value));
			};

			const permanentLabel = document.createElement("span");
			permanentLabel.innerText = "Permanent";

			const permanentInput = document.createElement("input");
			permanentInput.type = "checkbox";
			permanentInput.onchange = () => {
				permanent = permanentInput.checked;
			};

			const sneakyLabel = document.createElement("span");
			sneakyLabel.innerText = "Sneaky";

			const sneakyInput = document.createElement("input");
			sneakyInput.type = "checkbox";
			sneakyInput.onchange = () => {
				sneaky = sneakyInput.checked;
			};

			const connections = document.createElement("span");
			connections.innerHTML = "Connected: <span class=\"sobv2_connected_bots\"></span> | Total: <span class=\"sobv2_bots\"></span>";

			window.addObj(wsLabel);
			window.addObj(wsInput);
			window.addObj(document.createElement("br"));
			window.addObj(connectButton);
			window.addObj(disconnectButton);
			window.addObj(clearQueueButton);
			window.addObj(document.createElement("br"));
			window.addObj(queueIntervalLabel);
			window.addObj(queueIntervalInput);
			window.addObj(document.createElement("br"));
			window.addObj(permanentLabel);
			window.addObj(permanentInput);
			window.addObj(document.createElement("br"));
			window.addObj(sneakyLabel);
			window.addObj(sneakyInput);
			window.addObj(document.createElement("br"));
			window.addObj(connections);
		});

		const queueFunction = () => {
			for (const client of clients.filter(client => client.net.isWorldConnected && client.net.isWebsocketConnected)) {
				let success = false;

				let i = 0;
				while (!success && queue.length) {
					if (i > 256) break;

					const queueElement = queue.shift();
					let oldPixel = client.world.getPixel(queueElement.position[0], queueElement.position[1]);

					if (!oldPixel) {
						queue.push(queueElement);
						success = true;
					} else if (oldPixel[0] !== queueElement.color[0] || oldPixel[1] !== queueElement.color[1] || oldPixel[2] !== queueElement.color[2]) {
						client.world.setPixel(queueElement.position[0], queueElement.position[1], queueElement.color, sneaky);
						success = true;
					}

					i++;
				}
			}
			if (!queue.length) {
				for (const pixel of permanentQueue) {
					queue.push(pixel);
				}
			}
			if (document.querySelector("#reconnect-btn").offsetParent) document.querySelector("#reconnect-btn").click();
			document.querySelector(".sobv2_connected_bots").innerText = clients.filter(client => client.net.isWorldConnected && client.net.isWebsocketConnected).length;
			document.querySelector(".sobv2_bots").innerText = clients.length;
		};

		function install() {
			windowSys.addWindow(mainWindow.move(window.innerWidth - 500, 100));

			chunkTool = new Tool("SOBv2 Chunk", cursors.erase, PLAYERFX.RECT_SELECT_ALIGNED(16), RANK.USER, tool => {
				let color;
				tool.setEvent("mousedown mousemove", mouse => {
					if (mouse.buttons & 0b1) {
						color = player.selectedColor;
					} else if (mouse.buttons & 0b10) {
						color = [255, 255, 255];
					} else {
						return;
					}

					let x = Math.floor(mouse.tileX / protocol.chunkSize);
					let y = Math.floor(mouse.tileY / protocol.chunkSize);

					const preQueue = [];

					for (let i = 0; i < 16; i++) {
						for (let j = 0; j < 16; j++) {
							let qx = x * 16 + j;
							let qy = y * 16 + i;

							preQueue.push({ position: [qx, qy], color });
						}
					}

					preQueue.sort(() => Math.random() - 0.5);
					for (const pixel of preQueue) {
						if (permanent) permanentQueue.push(pixel);
						else queue.push(pixel);
					}
				});
			});

			addTool(chunkTool);

			pasteTool = new Tool("SOBv2 Paste", cursors.paste, PLAYERFX.NONE, RANK.USER, tool => {
				const imageData = [];

				tool.setEvent("select", () => {
					const imageSelectionWindow = new Window("SOBv2 Paste", {}, window => {
						const imageInput = document.createElement("input");
						imageInput.type = "file";
						imageInput.onchange = () => {
							const file = imageInput.files[0];

							const reader = new FileReader();
							reader.readAsDataURL(file);
							reader.onload = () => {
								const image = new Image();
								image.src = reader.result;
								image.onload = () => {
									const canvas = document.createElement("canvas");
									canvas.width = image.width;
									canvas.height = image.height;
									canvas.getContext("2d").drawImage(image, 0, 0);

									const data = canvas.getContext("2d").getImageData(0, 0, image.width, image.height).data;
									for (let i = 0; i < image.height; i++) {
										for (let j = 0; j < image.width; j++) {
											const offset = (i * image.width * 4) + (j * 4);
											if (data[offset + 3]) imageData.push({ position: [j, i], color: [data[offset], data[offset + 1], data[offset + 2]] });
										}
									}

									file.value = null;
									imageSelectionWindow.close();
								};
							};
						};

						while (imageData.length) imageData.pop();
						window.addObj(imageInput);
					});
					windowSys.addWindow(imageSelectionWindow.move(window.innerWidth - 500, 100));
				});

				tool.setEvent("mousedown", mouse => {
					if (!(mouse.buttons & 0b1)) return;

					let x = mouse.tileX;
					let y = mouse.tileY;

					const preQueue = structuredClone(imageData);
					preQueue.forEach(queueElement => queueElement.position[0] += x);
					preQueue.forEach(queueElement => queueElement.position[1] += y);
					preQueue.sort(() => Math.random() - 0.5);
					for (const pixel of preQueue) {
						if (permanent) permanentQueue.push(pixel);
						else queue.push(pixel);
					}
				});
			});

			addTool(pasteTool);

			textTool = new Tool("SOBv2 Text", cursors.write, PLAYERFX.NONE, RANK.USER, tool => {
				const imageData = [];
				const textSelectionWindow = new Window("SOBv2 Text", {}, window => {
					const textInput = document.createElement("input");
					textInput.type = "text";
					textInput.placeholder = "Text";

					const fontInput = document.createElement("input");
					fontInput.type = "text";
					fontInput.placeholder = "Font";

					const sizeInput = document.createElement("input");
					sizeInput.type = "number";
					sizeInput.placeholder = "Size";

					const doneButton = document.createElement("button");
					doneButton.type = "button";
					doneButton.innerText = "Done";

					doneButton.onclick = () => {
						const canvas = document.createElement("canvas");
						const ctx = canvas.getContext("2d");
						ctx.font = `${sizeInput.value}px ${fontInput.value}`;
						const metrics = ctx.measureText(textInput.value);
						canvas.width = Math.ceil(metrics.width);
						canvas.height = sizeInput.value;
						ctx.fillStyle = "white";
						ctx.fillRect(0, 0, canvas.width, canvas.height);
						ctx.fillStyle = "black";
						ctx.textBaseline = "top";
						ctx.font = `${sizeInput.value}px ${fontInput.value}`;
						ctx.fillText(textInput.value, 0, 0);

						const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
						for (let i = 0; i < canvas.height; i++) {
							for (let j = 0; j < canvas.width; j++) {
								const offset = (i * canvas.width * 4) + (j * 4);
								imageData.push({ position: [j, i], color: [data[offset], data[offset + 1], data[offset + 2]] });
							}
						}

						textSelectionWindow.close();
					};

					window.addObj(textInput);
					window.addObj(document.createElement("br"));
					window.addObj(fontInput);
					window.addObj(document.createElement("br"));
					window.addObj(sizeInput);
					window.addObj(document.createElement("br"));
					window.addObj(doneButton);
				});

				tool.setEvent("select", () => {
					while (imageData.length) imageData.pop();
					windowSys.addWindow(textSelectionWindow.move(window.innerWidth - 500, 100));
				});

				tool.setEvent("mousedown", mouse => {
					if (!(mouse.buttons & 0b1)) return;

					let x = mouse.tileX;
					let y = mouse.tileY;

					const preQueue = structuredClone(imageData);
					preQueue.forEach(queueElement => queueElement.position[0] += x);
					preQueue.forEach(queueElement => queueElement.position[1] += y);
					preQueue.sort(() => Math.random() - 0.5);
					for (const pixel of preQueue) {
						if (permanent) permanentQueue.push(pixel);
						else queue.push(pixel);
					}
				});
			});

			addTool(textTool);

			queueInterval = setInterval(queueFunction, 100);
		}

		function uninstall() {
			clearInterval(queueInterval);
			delete tools[chunkTool.id];
			delete tools[pasteTool.id];
			updateToolbar();
			mainWindow.close();
		}

		return { install, uninstall };
	})().install();

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
})();