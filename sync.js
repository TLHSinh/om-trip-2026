/**
 * OM TRIP 2026 - Realtime Sync Engine (Hỗ trợ Google Sheet Database + Điểm 3 Vòng + Mật Khẩu Đội)
 * Hỗ trợ đồng bộ đa thiết bị (Điện thoại BTC <-> Điện thoại 4 Đội Chơi)
 */

// =========================================================================
// 🟢 ĐIỀN ĐƯỜNG DẪN GOOGLE APPS SCRIPT WEB APP VÀO ĐÂY (DÒNG 9):
// Sau khi Triển khai (Deploy) Web App từ Google Sheets, dán link vào giữa 2 dấu ngoặc kép:
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbzlo5ofx6g0NEX8IQ_ahV77r3vyRuALCKgetRFdl-1VmoK_O2qgmXJfXNTmmpNpsQgyTg/exec";
// Ví dụ: const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycb.../exec";
// =========================================================================

function getActiveGoogleSheetUrl() {
    if (typeof GOOGLE_SHEET_API_URL === "string" && GOOGLE_SHEET_API_URL.trim() !== "") {
        return GOOGLE_SHEET_API_URL.trim();
    }
    return localStorage.getItem("om_google_sheet_api_url") || "";
}

const OM_STORAGE_KEY = "om_trip_2026_prize_state_v5";
const OM_ROOM_KEY = "om_trip_2026_room_id";
const DEFAULT_PASSWORDS = ["1111", "2222", "3333", "4444"];

// Lấy Room ID từ URL (?room=...) hoặc mặc định là 'omtrip2026'
function getRoomId() {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get("room");
    if (urlRoom) {
        localStorage.setItem(OM_ROOM_KEY, urlRoom.trim());
        return urlRoom.trim();
    }
    return localStorage.getItem(OM_ROOM_KEY) || "omtrip2026";
}

const DEFAULT_STATE = {
    version: 5,
    updatedAt: 0,
    isPublished: false,
    hideRankOnCard: true, // Giấu thứ hạng ngoài thẻ chọn đội để tạo bất ngờ khi mở phong bì
    celebrationPulse: 0,  // Timestamp để kích hoạt pháo hoa đồng loạt trên máy người chơi
    teams: [
        {
            id: "team1",
            rankOrder: 1,
            rankLabel: "Giải Nhất - Quán Quân",
            name: "Đội 1: Hải Tặc Mặt Trời",
            prize: "Giải Nhất: Quán Quân OM Trip 2026",
            desc: "1.500.000 VNĐ",
            round1: 0,
            round2: 0,
            round3: 0,
            password: "1111",
            unlocked: true
        },
        {
            id: "team2",
            rankOrder: 2,
            rankLabel: "Giải Nhì - Á Quân",
            name: "Đội 2: Sóng Thần Biển Đông",
            prize: "Giải Nhì: Á Quân Bứt Phá",
            desc: "1.000.000 VNĐ",
            round1: 0,
            round2: 0,
            round3: 0,
            password: "2222",
            unlocked: true
        },
        {
            id: "team3",
            rankOrder: 3,
            rankLabel: "Giải Ba - Ấn Tượng",
            name: "Đội 3: Cá Mập Siêu Tốc",
            prize: "Giải Ba: Về Đích Ấn Tượng",
            desc: "500.000 VNĐ",
            round1: 0,
            round2: 0,
            round3: 0,
            password: "3333",
            unlocked: true
        },
        {
            id: "team4",
            rankOrder: 4,
            rankLabel: "Giải Khuyến Khích",
            name: "Đội 4: Biệt Đội Cười Xuyên Khung Trời",
            prize: "Giải Khuyến Khích: Siêu Lầy Lội",
            desc: "500.000 VNĐ",
            round1: 0,
            round2: 0,
            round3: 0,
            password: "4444",
            unlocked: true
        }
    ]
};

function cleanPrizeDesc(desc) {
    if (!desc) return "";
    let s = String(desc).split("||")[0].trim();
    if (s.includes("1.500.000")) return "1.500.000 VNĐ";
    if (s.includes("1.000.000")) return "1.000.000 VNĐ";
    if (s.includes("500.000")) return "500.000 VNĐ";
    return s;
}

/**
 * Tách thông tin Tiền thưởng + Điểm 3 vòng + Mật khẩu được lưu gộp trong cột desc của Google Sheet
 */
function parseDescAndMeta(rawDesc, idx) {
    const defaultPw = DEFAULT_PASSWORDS[idx] || `111${idx + 1}`;
    if (!rawDesc) {
        return { cleanDesc: "500.000 VNĐ", round1: 0, round2: 0, round3: 0, password: defaultPw, hasMeta: false };
    }
    const str = String(rawDesc);
    const parts = str.split("||");
    const baseDesc = cleanPrizeDesc(parts[0]);

    let round1 = 0, round2 = 0, round3 = 0, password = defaultPw;
    let hasMeta = false;

    if (parts[1]) {
        hasMeta = true;
        const metaStr = parts[1];
        const r1Match = metaStr.match(/R1:\s*(-?\d+(?:\.\d+)?)/i);
        const r2Match = metaStr.match(/R2:\s*(-?\d+(?:\.\d+)?)/i);
        const r3Match = metaStr.match(/R3:\s*(-?\d+(?:\.\d+)?)/i);
        const pwMatch = metaStr.match(/PW:\s*([^|]+)/i);

        if (r1Match) round1 = Number(r1Match[1]) || 0;
        if (r2Match) round2 = Number(r2Match[1]) || 0;
        if (r3Match) round3 = Number(r3Match[1]) || 0;
        if (pwMatch) password = pwMatch[1].trim();
    }

    return { cleanDesc: baseDesc, round1, round2, round3, password, hasMeta };
}

/**
 * Đóng gói Tiền thưởng + Điểm 3 vòng + Mật khẩu vào chuỗi desc để lưu lên Google Sheet
 * mà không cần sửa đổi cấu trúc cột trên Google Apps Script
 */
function packDescWithMeta(team, idx) {
    const baseDesc = cleanPrizeDesc(team.desc || "500.000 VNĐ");
    const r1 = Number(team.round1) || 0;
    const r2 = Number(team.round2) || 0;
    const r3 = Number(team.round3) || 0;
    const pw = String(team.password || DEFAULT_PASSWORDS[idx] || "1111").trim();
    return `${baseDesc} || R1:${r1} | R2:${r2} | R3:${r3} | PW:${pw}`;
}

function getTeamTotalScore(team) {
    return (Number(team.round1) || 0) + (Number(team.round2) || 0) + (Number(team.round3) || 0);
}

/**
 * Chuẩn hóa danh sách 4 đội:
 * Luôn cố định id của 4 đội theo vị trí dòng (team1, team2, team3, team4)
 */
function normalizeTeams(teams, fromSheet = false) {
    if (!Array.isArray(teams) || teams.length === 0) {
        return JSON.parse(JSON.stringify(DEFAULT_STATE.teams));
    }
    const firstTeamName = String(teams[0]?.name || "").trim();
    return teams.map((team, idx) => {
        const defaultTeam = DEFAULT_STATE.teams[idx] || DEFAULT_STATE.teams[0];
        let cleanName = String(team.name || "").trim() || defaultTeam.name;

        // Tự động khôi phục tên gốc nếu dữ liệu cũ trên Sheet bị lỗi ghi đè trùng tên với Đội 1
        if (idx > 0 && cleanName === firstTeamName) {
            cleanName = defaultTeam.name;
        }

        const parsedMeta = parseDescAndMeta(team.desc || defaultTeam.desc, idx);

        const round1 = (fromSheet && parsedMeta.hasMeta)
            ? parsedMeta.round1
            : (team.round1 !== undefined ? Number(team.round1) || 0 : parsedMeta.round1);
        const round2 = (fromSheet && parsedMeta.hasMeta)
            ? parsedMeta.round2
            : (team.round2 !== undefined ? Number(team.round2) || 0 : parsedMeta.round2);
        const round3 = (fromSheet && parsedMeta.hasMeta)
            ? parsedMeta.round3
            : (team.round3 !== undefined ? Number(team.round3) || 0 : parsedMeta.round3);
        const password = (fromSheet && parsedMeta.hasMeta)
            ? parsedMeta.password
            : (team.password !== undefined && String(team.password).trim() !== "" ? String(team.password).trim() : parsedMeta.password);

        return {
            ...defaultTeam,
            ...team,
            id: `team${idx + 1}`,
            name: cleanName,
            desc: parsedMeta.cleanDesc,
            round1,
            round2,
            round3,
            password,
            rankOrder: Number(team.rankOrder) || (idx + 1),
            unlocked: team.unlocked !== false
        };
    });
}

function getComparableTeamsSignature(teams) {
    return JSON.stringify(
        normalizeTeams(teams).map(t => ({
            id: t.id,
            rankOrder: Number(t.rankOrder),
            name: String(t.name || "").trim(),
            prize: String(t.prize || "").trim(),
            desc: String(t.desc || "").trim(),
            round1: Number(t.round1) || 0,
            round2: Number(t.round2) || 0,
            round3: Number(t.round3) || 0,
            password: String(t.password || "").trim(),
            unlocked: t.unlocked !== false
        }))
    );
}

class OMRealtimeSync {
    constructor(onStateChange, onStatusChange) {
        this.onStateChange = onStateChange;
        this.onStatusChange = onStatusChange || (() => { });
        this.roomId = getRoomId();
        this.topic = `omtrip2026/prize_reveal/${this.roomId}/state`;
        this.client = null;
        this.isConnected = false;
        this.channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("om_trip_2026_channel") : null;
        this.sheetPollInterval = null;
        this.lastSaveTimestamp = 0;

        this.initLocalListeners();
        this.initCloudSync();
        this.initGoogleSheetsSync();
    }

    getState() {
        const raw = localStorage.getItem(OM_STORAGE_KEY);
        if (!raw) {
            localStorage.setItem(OM_STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
            return JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
        try {
            const parsed = JSON.parse(raw);
            parsed.teams = normalizeTeams(parsed.teams, false);
            return { ...DEFAULT_STATE, ...parsed };
        } catch (e) {
            return JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    }

    saveAndBroadcast(newState) {
        newState.teams = normalizeTeams(newState.teams, false);
        newState.updatedAt = Date.now();
        this.lastSaveTimestamp = Date.now();
        localStorage.setItem(OM_STORAGE_KEY, JSON.stringify(newState));

        // 1. Broadcast tới các tab cùng trình duyệt
        if (this.channel) {
            this.channel.postMessage(newState);
        }

        // 2. Publish lên Cloud WebSocket (MQTT)
        if (this.client && this.isConnected) {
            try {
                this.client.publish(this.topic, JSON.stringify(newState), { qos: 1, retain: true });
            } catch (err) {
                console.warn("Cloud publish error:", err);
            }
        }

        // 3. Đồng bộ ngược lên Google Sheet (Đóng gói kèm Điểm 3 vòng & Mật khẩu vào cột desc)
        const sheetUrl = getActiveGoogleSheetUrl();
        if (sheetUrl) {
            try {
                const sheetPayload = {
                    ...newState,
                    teams: newState.teams.map((t, idx) => ({
                        ...t,
                        desc: packDescWithMeta(t, idx)
                    }))
                };
                fetch(sheetUrl, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify(sheetPayload)
                }).catch(err => console.warn("Google Sheet sync POST error:", err));
            } catch (e) {
                console.warn("Google Sheet sync error:", e);
            }
        }

        if (this.onStateChange) {
            this.onStateChange(newState);
        }
    }

    initLocalListeners() {
        window.addEventListener("storage", (e) => {
            if (e.key === OM_STORAGE_KEY && e.newValue) {
                try {
                    const state = JSON.parse(e.newValue);
                    state.teams = normalizeTeams(state.teams, false);
                    if (this.onStateChange) this.onStateChange(state);
                } catch (err) { }
            }
        });

        if (this.channel) {
            this.channel.onmessage = (event) => {
                if (event.data) {
                    const state = event.data;
                    state.teams = normalizeTeams(state.teams, false);
                    localStorage.setItem(OM_STORAGE_KEY, JSON.stringify(state));
                    if (this.onStateChange) this.onStateChange(state);
                }
            };
        }
    }

    initCloudSync() {
        if (typeof mqtt === "undefined") {
            this.onStatusChange("local", "Đồng bộ nội bộ (Offline)");
            return;
        }

        this.onStatusChange("connecting", "Đang kết nối Realtime...");

        const clientId = "omtrip_" + Math.random().toString(16).substring(2, 10);
        const brokers = [
            "wss://broker.emqx.io:8084/mqtt",
            "wss://broker.hivemq.com:8884/mqtt"
        ];

        this.client = mqtt.connect(brokers[0], {
            clientId,
            clean: true,
            connectTimeout: 5000,
            reconnectPeriod: 2000
        });

        this.client.on("connect", () => {
            this.isConnected = true;
            const sheetUrl = getActiveGoogleSheetUrl();
            const statusLabel = sheetUrl
                ? "Google Sheet + Realtime Live"
                : `Realtime Live (Mã phòng: ${this.roomId})`;
            this.onStatusChange("online", statusLabel);
            this.client.subscribe(this.topic, { qos: 1 });
        });

        this.client.on("message", (topic, message) => {
            if (topic === this.topic) {
                try {
                    const incomingState = JSON.parse(message.toString());
                    incomingState.teams = normalizeTeams(incomingState.teams, false);
                    const currentState = this.getState();

                    if (!currentState.updatedAt || incomingState.updatedAt >= currentState.updatedAt) {
                        localStorage.setItem(OM_STORAGE_KEY, JSON.stringify(incomingState));
                        if (this.onStateChange) {
                            this.onStateChange(incomingState);
                        }
                    }
                } catch (e) {
                    console.warn("Invalid sync payload:", e);
                }
            }
        });

        this.client.on("offline", () => {
            this.isConnected = false;
            this.onStatusChange("connecting", "Đang kết nối lại...");
        });

        this.client.on("error", () => {
            this.isConnected = false;
            this.onStatusChange("local", "Chế độ Local");
        });
    }

    // Tự động kiểm tra Google Sheets định kỳ (Polling) nếu có điền URL
    initGoogleSheetsSync() {
        const fetchFromGoogleSheet = async () => {
            if (Date.now() - this.lastSaveTimestamp < 4500) return;

            const sheetUrl = getActiveGoogleSheetUrl();
            if (!sheetUrl) return;

            try {
                const response = await fetch(sheetUrl);
                if (!response.ok) return;
                const sheetData = await response.json();

                if (Date.now() - this.lastSaveTimestamp < 4500) return;

                if (sheetData && Array.isArray(sheetData.teams) && sheetData.teams.length > 0) {
                    const currentState = this.getState();
                    // Giải mã điểm 3 vòng & mật khẩu từ dữ liệu Google Sheet
                    const normalizedSheetTeams = normalizeTeams(sheetData.teams, true);

                    // Nếu trên Sheet chưa có metadata điểm (lần đầu tiên), giữ nguyên điểm hiện tại ở local
                    normalizedSheetTeams.forEach((st, idx) => {
                        const rawDesc = String(sheetData.teams[idx]?.desc || "");
                        if (!rawDesc.includes("||") && currentState.teams[idx]) {
                            st.round1 = Number(currentState.teams[idx].round1) || 0;
                            st.round2 = Number(currentState.teams[idx].round2) || 0;
                            st.round3 = Number(currentState.teams[idx].round3) || 0;
                            st.password = currentState.teams[idx].password || DEFAULT_PASSWORDS[idx];
                        }
                    });

                    const isDifferent = (
                        Boolean(currentState.isPublished) !== Boolean(sheetData.isPublished) ||
                        getComparableTeamsSignature(currentState.teams) !== getComparableTeamsSignature(normalizedSheetTeams)
                    );

                    if (isDifferent) {
                        const updatedState = {
                            ...currentState,
                            isPublished: Boolean(sheetData.isPublished),
                            teams: normalizedSheetTeams,
                            updatedAt: Date.now()
                        };

                        if (!currentState.isPublished && sheetData.isPublished) {
                            updatedState.celebrationPulse = Date.now();
                        }

                        localStorage.setItem(OM_STORAGE_KEY, JSON.stringify(updatedState));
                        if (this.onStateChange) {
                            this.onStateChange(updatedState);
                        }
                    }
                }
            } catch (err) {
                console.warn("Fetch from Google Sheet warning:", err);
            }
        };

        fetchFromGoogleSheet();
        this.sheetPollInterval = setInterval(fetchFromGoogleSheet, 2500);
    }
}
