// 砂含水调整计算器 — 业务逻辑

// =====================
// 模块A：单次砂含水率计算
// =====================
export function calcSingleMoisture(wetWeight: number, dryWeight: number): number | null {
  if (!dryWeight || dryWeight === 0) return null;
  return (wetWeight - dryWeight) / dryWeight;
}

// =====================
// 模块B：8个含水仪含水率
// =====================
export const GAUGE_CONFIGS = [
  { id: "g1", label: "含水仪1", category: "机制砂", fixedWet: 500 },
  { id: "g2", label: "含水仪2", category: "机制砂", fixedWet: 500 },
  { id: "g3", label: "含水仪3", category: "河砂",   fixedWet: 500 },
  { id: "g4", label: "含水仪4", category: "河砂",   fixedWet: 500 },
  { id: "g5", label: "含水仪5", category: "石屑粉仓", fixedWet: 500 },
  { id: "g6", label: "含水仪6", category: "石屑粉仓", fixedWet: 500 },
  { id: "g7", label: "含水仪7", category: "水洗砂仓", fixedWet: 500 },
  { id: "g8", label: "含水仪8", category: "水洗砂仓", fixedWet: 500 },
];

export function calcGaugeMoisture(wetWeight: number, dryWeight: number): number | null {
  if (!dryWeight || dryWeight === 0) return null;
  return (wetWeight - dryWeight) / dryWeight;
}

// =====================
// 模块C：校准系数计算
// =====================
// G = F / (D / E)
//   F = 含水率实测（来自含水仪实测，已是百分比的小数形式，如 0.132 = 13.2%）
//   D = 系统界面显示含水（用户输入为%，如 27.55 表示 27.55%）
//   E = 系统设置含水校准系数（用户输入为%，如 0.5 表示 0.5%）
//   G = 修正系数
export function calcCalibrationFactor(
  systemMoisture: number,      // 用户输入的系统界面显示含水（%）
  calibrationCoef: number,     // 用户输入的系统设置含水校准系数（%）
  manualMoisture: number       // 含水率实测（小数形式，如 0.132）
): number | null {
  // 将百分比转换为小数
  const d = systemMoisture / 100;
  const e = calibrationCoef / 100;
  
  if (!d || !e || e === 0 || manualMoisture == null) {
    return null;
  }
  const calculated = d / e;
  if (calculated === 0) return null;
  return manualMoisture / calculated;
}

// =====================
// 模块D：配比用水量
// =====================
export const MATERIAL_CONFIGS = [
  { id: "stone1",  label: "石1", category: "stone" },
  { id: "stone2",  label: "石2", category: "stone" },
  { id: "stone3",  label: "石3", category: "stone" },
  { id: "stone4",  label: "石4", category: "stone" },
  { id: "sand1",   label: "砂1", category: "sand" },
  { id: "sand2",   label: "砂2", category: "sand" },
  { id: "sand3",   label: "砂3", category: "sand" },
  { id: "sand4",   label: "砂4", category: "sand" },
];

export const DEFAULT_CALIBRATION_COEF = 0.005;

// 标定含水量 = 配合比 × 标定含水率
export function calcStandardWater(mixRatio: number, standardRate: number): number | null {
  if (!mixRatio || !standardRate || mixRatio === 0 || standardRate === 0) return null;
  return mixRatio * standardRate;
}

// 实际含水量 = 配合比 × 实际含水率
export function calcActualWater(mixRatio: number, actualRate: number): number | null {
  if (!mixRatio || !actualRate || mixRatio === 0 || actualRate === 0) return null;
  return mixRatio * actualRate;
}

// 新配合比用水量 = 基准用水量 + (实际含水量 - 标定含水量)
export function calcNewWaterUse(
  baseWater: number,
  actualTotal: number | null,
  standardTotal: number | null
): number | null {
  if (actualTotal == null || standardTotal == null) return null;
  return baseWater + (actualTotal - standardTotal);
}

// =====================
// 颜色判定：修正系数
// =====================
export function calibrationColor(g: number | null): "green" | "orange" | "red" | "neutral" {
  if (g == null) return "neutral";
  const diff = Math.abs(g - 1.0);
  if (diff <= 0.05) return "green";   // 接近1.0，无需修正
  if (diff <= 0.2) return "orange";   // 偏差较大
  return "red";                        // 异常
}

// =====================
// localStorage 持久化
// =====================
export const STORAGE_KEY = "cc_moisture_data";

export interface MoistureData {
  // 模块A
  singleWet: number;
  singleDry: number;
  // 模块B
  gauges: { [id: string]: number }; // dry weight per gauge
  // 模块C
  calibration: { [id: string]: { system: number; coef: number } };
  // 模块D
  mixRatio: { [id: string]: number };
  standardRate: { [id: string]: number };
  actualRate: { [id: string]: number };
  baseWater: number;
}

export const DEFAULT_MOISTURE_DATA: MoistureData = {
  singleWet: 500,
  singleDry: 0,
  gauges: { g1: 0, g2: 0, g3: 0, g4: 0, g5: 0, g6: 0, g7: 0, g8: 0 },
  calibration: {
    g1: { system: 0, coef: 0 },
    g2: { system: 0, coef: 0 },
    g3: { system: 0, coef: 0 },
    g4: { system: 0, coef: 0 },
    g5: { system: 0, coef: 0 },
    g6: { system: 0, coef: 0 },
    g7: { system: 0, coef: 0 },
    g8: { system: 0, coef: 0 },
  },
  mixRatio: {
    stone1: 0, stone2: 0, stone3: 0, stone4: 0,
    sand1: 0, sand2: 0, sand3: 0, sand4: 0,
  },
  standardRate: {
    stone1: 0, stone2: 0, stone3: 0, stone4: 0,
    sand1: 0, sand2: 0, sand3: 0, sand4: 0,
  },
  actualRate: {
    stone1: 0, stone2: 0, stone3: 0, stone4: 0,
    sand1: 0, sand2: 0, sand3: 0, sand4: 0,
  },
  baseWater: 0,
};

export function loadMoistureData(): MoistureData {
  if (typeof window === "undefined") return DEFAULT_MOISTURE_DATA;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_MOISTURE_DATA;
  try {
    return { ...DEFAULT_MOISTURE_DATA, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_MOISTURE_DATA;
  }
}

export function saveMoistureData(data: MoistureData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// =====================
// 历史记录
// =====================
export const HISTORY_KEY = "cc_moisture_history";

export interface HistoryRecord {
  id: string;
  timestamp: string;
  stationName: string;
  summary: string;
  data: MoistureData;
}

export function loadHistory(): HistoryRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHistory(records: HistoryRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, 100))); // keep last 100
}

export function addHistoryRecord(data: MoistureData, stationName: string): void {
  const history = loadHistory();
  const g1m = calcGaugeMoisture(500, data.gauges.g1 || 0);
  const g3m = calcGaugeMoisture(500, data.gauges.g3 || 0);
  const summary = `砂1含水率: ${g1m != null ? (g1m * 100).toFixed(2) : "-"}% | 砂2含水率: ${g3m != null ? (g3m * 100).toFixed(2) : "-"}%`;
  const record: HistoryRecord = {
    id: `rec_${Date.now()}`,
    timestamp: new Date().toISOString(),
    stationName: stationName.trim() || "未命名",
    summary,
    data: JSON.parse(JSON.stringify(data)),
  };
  history.unshift(record);
  saveHistory(history);
}

// =====================
// PDF 生成与下载
// =====================
export async function downloadMoisturePDF(data: MoistureData, stationName: string): Promise<void> {
  const { jsPDF } = await import("jspdf");

  // ── Step 1: 加载中文字体（base64）───────────────────────────────
  const fontUrl = "/fonts/ZZGJFangHei.ttf";
  const fontResp = await fetch(fontUrl);
  if (!fontResp.ok) throw new Error("字体文件加载失败: " + fontResp.status);
  const fontBuf = await fontResp.arrayBuffer();
  const fontBase64 = _arrayBufferToBase64(fontBuf);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Step 2: 存入 VFS ───────────────────────────────────────────
  doc.addFileToVFS("ZZGJFangHei.ttf", fontBase64);

  // ── Step 3: 注册字体（postScriptName, id, style, weight, encoding）──
  // encoding 必须是 "Identity-H" 才支持中日韩文字
  doc.addFont("ZZGJFangHei.ttf", "ZZGJFangHei", "normal", undefined, "Identity-H");
  doc.addFont("ZZGJFangHei.ttf", "ZZGJFangHei", "bold",   undefined, "Identity-H");

  // ── Step 4: 设为当前字体 ────────────────────────────────────────
  doc.setFont("ZZGJFangHei", "normal");

  const W = 210;
  const margin = 15;
  let y = margin;

  const line = (text: string, x: number, size = 10, bold = false, color = "#222222") => {
    doc.setFontSize(size);
    doc.setFont("ZZGJFangHei", bold ? "bold" : "normal");
    doc.setTextColor(color);
    doc.text(text, x, y);
  };

  const kv = (label: string, value: string, x = margin) => {
    line(label + ":", x, 9, true);
    line(value, x + 55, 9, false);
    y += 7;
  };

  // ── Title ──
  line("砂含水调整计算报告", margin, 18, true, "#1e3a5f");
  y += 4;
  line("搅拌站: " + stationName, margin, 12, true);
  const now = new Date().toLocaleString("zh-CN");
  line(now, 155, 8, false, "#aaa");
  y += 7;
  doc.setDrawColor("#ccc");
  doc.line(margin, y, W - margin, y);
  y += 8;

  // ── Module A ──
  line("【单次砂含水率计算】", margin, 11, true, "#1e3a5f");
  y += 7;
  kv("湿砂重量", data.singleWet + " g");
  kv("干砂重量", data.singleDry + " g");
  const sM = data.singleDry > 0 ? ((data.singleWet - data.singleDry) / data.singleDry * 100).toFixed(2) + "%" : "—";
  kv("含水率", sM);
  y += 6;

  // ── Module B ──
  line("【含水仪实测记录】", margin, 11, true, "#1e3a5f");
  y += 7;
  for (const g of GAUGE_CONFIGS) {
    const dry = data.gauges[g.id] || 0;
    const m = calcGaugeMoisture(g.fixedWet, dry);
    kv(g.label + " 干砂重", dry + " g");
    y -= 3;
    line("含水率: " + (m != null ? (m * 100).toFixed(2) + "%" : "—"), margin + 78, 8.5, false, m != null ? "#1a6e1a" : "#999");
    y += 6;
  }
  y += 4;

  // ── Module C ──
  line("【校准系数】", margin, 11, true, "#1e3a5f");
  y += 7;
  for (const g of GAUGE_CONFIGS) {
    const cal = data.calibration[g.id] || { system: 0, coef: 0 };
    const f = calcGaugeMoisture(g.fixedWet, data.gauges[g.id] || 0);
    const gVal = calcCalibrationFactor(cal.system, cal.coef, f ?? 0);
    const color = gVal != null ? (Math.abs(gVal - 1) <= 0.05 ? "#1a6e1a" : Math.abs(gVal - 1) <= 0.2 ? "#b05000" : "#aa0000") : "#999";
    line(g.label + " 修正系数 G = " + (gVal != null ? (gVal * 100).toFixed(2) + "%" : "—"), margin, 9, false, color);
    y += 6;
  }
  y += 4;

  // ── Module D ──
  line("【配合比用水量调整】", margin, 11, true, "#1e3a5f");
  y += 7;
  kv("生产配合比用水量", data.baseWater + " kg/m\u00B3");
  y += 3;

  // Table
  const colX = [margin, margin + 26, margin + 58, margin + 94, margin + 128];
  const headers = ["材料","配合比","标定含水率","实际含水率","用水量差(kg)"];
  doc.setFillColor("#1e3a5f");
  doc.rect(margin, y - 4, W - 2 * margin, 7, "F");
  doc.setFontSize(8.5);
  doc.setFont("ZZGJFangHei", "bold");
  doc.setTextColor("#fff");
  headers.forEach((h, i) => doc.text(h, colX[i] ?? 0, y));
  y += 7;

  const matMap = [
    ["stone1","石1"],["stone2","石2"],["stone3","石3"],["stone4","石4"],
    ["sand1","砂1"],["sand2","砂2"],["sand3","砂3"],["sand4","砂4"],
  ];
  for (const [id, label] of matMap) {
    const ratio = data.mixRatio[id] || 0;
    const stdR = data.standardRate[id] || 0;
    const actR = data.actualRate[id] || 0;
    const stdW = ratio * stdR / 100;
    const actW = ratio * actR / 100;
    const diff = actW - stdW;
    const vals = [label, ratio.toFixed(1), stdR + "%", actR + "%", diff.toFixed(2)];
    doc.setFontSize(8.5);
    doc.setFont("ZZGJFangHei", "normal");
    doc.setTextColor("#222");
    vals.forEach((v, i) => doc.text(v, colX[i] ?? 0, y));
    y += 6;
  }
  y += 4;

  const totals = matMap.map(([id]) => ({
    stdWater: (data.mixRatio[id] || 0) * (data.standardRate[id] || 0) / 100,
    actWater: (data.mixRatio[id] || 0) * (data.actualRate[id] || 0) / 100,
  }));
  const totStd = totals.reduce((s, r) => s + r.stdWater, 0);
  const totAct = totals.reduce((s, r) => s + r.actWater, 0);
  const newW = calcNewWaterUse(data.baseWater, totAct, totStd);
  kv("合计实际用水", totAct.toFixed(2) + " kg");
  kv("合计标定用水", totStd.toFixed(2) + " kg");
  kv("新配合比用水量调整", newW != null ? newW.toFixed(2) + " kg/m\u00B3" : "—");
  y += 10;

  const date = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-");
  const safeName = stationName.trim().replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_");
  const filename = date + "_" + safeName + ".pdf";
  doc.save(filename);
}

// ── helper ─────────────────────────────────────────────────────────────────
function _arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
