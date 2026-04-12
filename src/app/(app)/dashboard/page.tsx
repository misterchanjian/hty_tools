"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Droplets,
  Calculator,
  Gauge,
  Settings2,
  History,
  Save,
  RotateCcw,
  Trash2,
  Download,
  FileText,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GAUGE_CONFIGS,
  calcGaugeMoisture,
  calcCalibrationFactor,
  calcNewWaterUse,
  loadMoistureData,
  saveMoistureData,
  loadHistory,
  addHistoryRecord,
  downloadMoisturePDF,
  type MoistureData,
} from "@/lib/moisture";

const TABS = [
  { id: "single",   label: "单次计算",      icon: Calculator },
  { id: "gauge",    label: "含水仪实测",    icon: Gauge },
  { id: "calibrate", label: "校准系数",    icon: Settings2 },
  { id: "mix",      label: "配合比用水量调整", icon: Droplets },
  { id: "history",  label: "历史记录",      icon: History },
] as const;
type TabId = typeof TABS[number]["id"];

const MATERIALS = [
  { id: "stone1", label: "石1", category: "粗骨料" },
  { id: "stone2", label: "石2", category: "粗骨料" },
  { id: "stone3", label: "石3", category: "粗骨料" },
  { id: "stone4", label: "石4", category: "粗骨料" },
  { id: "sand1",  label: "砂1", category: "细骨料" },
  { id: "sand2",  label: "砂2", category: "细骨料" },
  { id: "sand3",  label: "砂3", category: "细骨料" },
  { id: "sand4",  label: "砂4", category: "细骨料" },
] as const;

const INITIAL_DATA: MoistureData = {
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

// ── helpers ────────────────────────────────────────────────────────────────
function fmtPct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "—";
  return (n * 100).toFixed(2) + "%";
}

// ── Section card ──────────────────────────────────────────────────────────
function Card({ title, children, className = "" }: {
  title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-5 ${className}`}>
      <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
        <div className="w-1 h-4 bg-blue-500 rounded-full" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-400 text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function ResultChip({ label, value, unit = "", color = "blue" }: {
  label: string; value: string; unit?: string; color?: "blue" | "green" | "orange" | "red";
}) {
  const colors: Record<string, string> = {
    blue:   "bg-blue-500/10 border-blue-500/30 text-blue-400",
    green:  "bg-green-500/10 border-green-500/30 text-green-400",
    orange: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    red:    "bg-red-500/10 border-red-500/30 text-red-400",
  };
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm ${colors[color]}`}>
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold font-mono">{value}{unit}</span>
    </div>
  );
}

// ── Station name dialog ────────────────────────────────────────────────────
function StationNameDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(name.trim() || "未命名");
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl">
        <h3 className="text-white font-semibold text-base mb-1">保存记录</h3>
        <p className="text-slate-400 text-xs mb-4">输入搅拌站名称，保存后可随时复用</p>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          placeholder="请输入搅拌站公司名称"
          className="bg-slate-800 border-slate-700 text-white h-10 mb-4"
        />
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1 h-9 text-slate-400"
          >
            <X className="w-4 h-4 mr-1" /> 取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 h-9 bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>保存中…</>
            ) : (
              <>保存</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Module A ───────────────────────────────────────────────────────────────
function ModuleSingle({ data, onChange }: { data: MoistureData; onChange: (d: MoistureData) => void }) {
  const moisture = data.singleDry > 0
    ? (data.singleWet - data.singleDry) / data.singleDry
    : null;

  return (
    <Card title="单次砂含水率计算">
      <FieldGrid>
        <Field label="湿砂重量 (g)">
          <Input
            type="number"
            value={data.singleWet || ""}
            onChange={(e) => onChange({ ...data, singleWet: parseFloat(e.target.value) || 0 })}
            className="bg-slate-800/60 border-slate-700 text-white h-10 font-mono"
            placeholder="500"
          />
        </Field>
        <Field label="干砂重量 (g)">
          <Input
            type="number"
            value={data.singleDry || ""}
            onChange={(e) => onChange({ ...data, singleDry: parseFloat(e.target.value) || 0 })}
            className="bg-slate-800/60 border-slate-700 text-white h-10 font-mono"
            placeholder="干砂重量"
          />
        </Field>
      </FieldGrid>
      <div className="mt-4">
        <ResultChip label="含水率" value={fmtPct(moisture)} color="blue" />
      </div>
    </Card>
  );
}

// ── Module B ───────────────────────────────────────────────────────────────
function ModuleGauge({ data, onChange }: { data: MoistureData; onChange: (d: MoistureData) => void }) {
  const update = (id: string, dry: number) => {
    onChange({ ...data, gauges: { ...data.gauges, [id]: dry } });
  };

  return (
    <Card title="含水仪实测 — 砂样 500g">
      <div className="space-y-3">
        {GAUGE_CONFIGS.map((g, idx) => {
          const dry = data.gauges[g.id] ?? 0;
          const moisture = calcGaugeMoisture(g.fixedWet, dry);
          return (
            <div key={g.id} className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
              <span className="text-slate-300 text-sm font-medium w-16 shrink-0">含水仪 {idx + 1}</span>
              <div className="flex-1">
                <Input
                  type="number"
                  value={dry || ""}
                  onChange={(e) => update(g.id, parseFloat(e.target.value) || 0)}
                  placeholder="干砂重量 (g)"
                  className="bg-slate-900/60 border-slate-700 text-white h-10 text-sm font-mono"
                />
              </div>
              <span className={`text-base font-mono font-bold w-20 text-right shrink-0 ${moisture !== null && moisture > 0 ? "text-green-400" : "text-slate-500"}`}>
                {fmtPct(moisture)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Module C ───────────────────────────────────────────────────────────────
function ModuleCalibrate({ data, onChange }: { data: MoistureData; onChange: (d: MoistureData) => void }) {
  const update = (id: string, field: "system" | "coef", val: number) => {
    onChange({
      ...data,
      calibration: {
        ...data.calibration,
        [id]: { ...data.calibration[id], [field]: val },
      },
    });
  };

  // 当校准数据变化时，自动把 G × 标定含水率 回写到 actualRate
  const syncActualRate = () => {
    const newActualRate = { ...data.actualRate };
    for (const g of GAUGE_CONFIGS) {
      const dry = data.gauges[g.id] ?? 0;
      const f = calcGaugeMoisture(g.fixedWet, dry);
      const { system, coef } = data.calibration[g.id] ?? { system: 0, coef: 0 };
      const gVal = calcCalibrationFactor(system, coef, f ?? 0);
      const matId = g.id === "g1" || g.id === "g2" ? "sand1"
                  : g.id === "g3" || g.id === "g4" ? "sand2"
                  : g.id === "g5" || g.id === "g6" ? "sand3"
                  : "sand4";
      const stdRate = data.standardRate[matId] ?? 0;
      newActualRate[matId] = gVal != null && stdRate > 0 ? +(gVal * stdRate).toFixed(2) : newActualRate[matId] ?? 0;
    }
    onChange({ ...data, actualRate: newActualRate });
  };

  useEffect(() => { syncActualRate(); }, [data.calibration, data.gauges]);

  return (
    <Card title="校准系数计算">
      <div className="space-y-3">
        {GAUGE_CONFIGS.map((g, idx) => {
          const dry = data.gauges[g.id] ?? 0;
          const f = calcGaugeMoisture(g.fixedWet, dry);
          const { system, coef } = data.calibration[g.id] ?? { system: 0, coef: 0 };
          const gVal = calcCalibrationFactor(system, coef, f ?? 0);

          const diff = gVal != null ? Math.abs(gVal - 1.0) : null;
          const color: "green" | "orange" | "red" | "blue" = diff == null ? "blue"
            : diff <= 0.05 ? "green"
            : diff <= 0.2 ? "orange"
            : "red";

          return (
            <div key={g.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm font-medium">含水仪 {idx + 1}</span>
                <span className={`text-base font-mono font-bold ${color === "green" ? "text-green-400" : color === "orange" ? "text-orange-400" : color === "red" ? "text-red-400" : "text-slate-500"}`}>
                  {gVal != null ? (gVal * 100).toFixed(2) + "%" : "—"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 w-20">含水率实测:</span>
                <span className="font-mono text-green-400 font-semibold">{fmtPct(f)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-500 text-xs">系统界面显示含水 (%)</Label>
                  <Input type="number" step="0.01" value={system || ""}
                    onChange={(e) => update(g.id, "system", parseFloat(e.target.value) || 0)}
                    className="bg-slate-900/60 border-slate-700 text-white h-9 text-sm font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-500 text-xs">系统设置含水校准系数 (%)</Label>
                  <Input type="number" step="0.01" value={coef || ""}
                    onChange={(e) => update(g.id, "coef", parseFloat(e.target.value) || 0)}
                    className="bg-slate-900/60 border-slate-700 text-white h-9 text-sm font-mono" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Module D ───────────────────────────────────────────────────────────────
function ModuleMix({ data, onChange }: { data: MoistureData; onChange: (d: MoistureData) => void }) {
  const updateRatio = (id: string, v: number) =>
    onChange({ ...data, mixRatio: { ...data.mixRatio, [id]: v } });
  const updateStdRate = (id: string, v: number) =>
    onChange({ ...data, standardRate: { ...data.standardRate, [id]: v } });
  const updateActRate = (id: string, v: number) =>
    onChange({ ...data, actualRate: { ...data.actualRate, [id]: v } });

  const waterRows = MATERIALS.map((m) => {
    const ratio = data.mixRatio[m.id] ?? 0;
    const stdRate = data.standardRate[m.id] ?? 0;
    const actRate = data.actualRate[m.id] ?? 0;
    const stdWater = ratio * stdRate / 100;
    const actWater = ratio * actRate / 100;
    const diff = actWater - stdWater;
    return { ...m, ratio, stdRate, actRate, stdWater, actWater, diff };
  });

  const totalStdWater = waterRows.reduce((s, r) => s + r.stdWater, 0);
  const totalActWater = waterRows.reduce((s, r) => s + r.actWater, 0);
  const totalDiff = totalActWater - totalStdWater;
  const newWater = calcNewWaterUse(data.baseWater, totalActWater, totalStdWater);

  return (
    <div className="space-y-4">
      <Card title="生产配合比用水量">
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">生产配合比用水量 (kg/m³)</Label>
          <Input
            type="number"
            value={data.baseWater || ""}
            onChange={(e) => onChange({ ...data, baseWater: parseFloat(e.target.value) || 0 })}
            className="bg-slate-800/60 border-slate-700 text-white h-10 font-mono"
            placeholder="0"
          />
        </div>
      </Card>

      <Card title="配合比含水率">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="text-left py-2 pr-2 font-medium">材料</th>
                <th className="text-right py-2 px-2 font-medium">配合比</th>
                <th className="text-right py-2 px-2 font-medium">标定含水率 (%)</th>
                <th className="text-right py-2 px-2 font-medium">实际含水率 (%)</th>
                <th className="text-right py-2 pl-2 font-medium">用水量差 (kg)</th>
              </tr>
            </thead>
            <tbody>
              {waterRows.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/50 last:border-0">
                  <td className="py-2 pr-2 text-slate-300 font-medium">{r.label}</td>
                  <td className="py-1 px-1">
                    <Input type="number" value={r.ratio || ""}
                      onChange={(e) => updateRatio(r.id, parseFloat(e.target.value) || 0)}
                      className="bg-slate-800/60 border-slate-700 text-white h-8 font-mono text-right w-20"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <Input type="number" step="0.01" value={r.stdRate > 0 ? r.stdRate : ""}
                      onChange={(e) => updateStdRate(r.id, parseFloat(e.target.value) || 0)}
                      className="bg-slate-800/60 border-slate-700 text-white h-8 font-mono text-right w-full"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <Input type="number" step="0.01" value={r.actRate > 0 ? r.actRate : ""}
                      onChange={(e) => updateActRate(r.id, parseFloat(e.target.value) || 0)}
                      className="bg-slate-800/60 border-slate-700 text-white h-8 font-mono text-right w-full"
                    />
                  </td>
                  <td className={`py-2 pl-2 text-right font-mono font-semibold ${r.diff > 0 ? "text-red-400" : r.diff < 0 ? "text-green-400" : "text-slate-500"}`}>
                    {r.ratio > 0 ? (r.diff > 0 ? "+" : "") + r.diff.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="用水量计算">
        <div className="space-y-2">
          <ResultChip label="标定总用水量" value={totalStdWater.toFixed(2)} unit=" kg" color="blue" />
          <ResultChip label="实际总用水量" value={totalActWater.toFixed(2)} unit=" kg" color="blue" />
          <ResultChip label="总用水量差" value={`${totalDiff > 0 ? "+" : ""}${totalDiff.toFixed(2)}`} unit=" kg"
            color={totalDiff > 0 ? "orange" : totalDiff < 0 ? "green" : "blue"} />
          <div className="bg-green-500/10 border border-green-500/40 rounded-xl px-3 py-3">
            <div className="flex items-center justify-between">
              <span className="text-green-400 font-semibold text-sm">新配合比用水量调整</span>
              <span className="text-green-400 font-bold text-xl font-mono">
                {newWater != null ? newWater.toFixed(2) : "—"} kg/m³
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-1 font-mono">
              = {data.baseWater} + ({totalActWater.toFixed(2)} − {totalStdWater.toFixed(2)})
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Module E: History ─────────────────────────────────────────────────────
function ModuleHistory() {
  const [records, setRecords] = useState<ReturnType<typeof loadHistory>>([]);

  useEffect(() => {
    setRecords(loadHistory());
  }, []);

  const handleRestore = (rec: ReturnType<typeof loadHistory>[number]) => {
    const event = new CustomEvent("restore_history", { detail: rec.data });
    window.dispatchEvent(event);
  };

  const handleDownloadPDF = async (rec: ReturnType<typeof loadHistory>[number]) => {
    await downloadMoisturePDF(rec.data, rec.stationName);
  };

  const handleDelete = () => {
    if (!confirm("确定清空所有历史记录？")) return;
    localStorage.removeItem("cc_moisture_history");
    setRecords([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">历史记录</h3>
        {records.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs">
            <Trash2 className="w-3 h-3 mr-1" /> 清空
          </Button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">暂无历史记录</div>
      ) : (
        <div className="space-y-2">
          {records.map((rec) => (
            <div key={rec.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-xs">
                  {new Date(rec.timestamp).toLocaleString("zh-CN", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadPDF(rec)}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 px-2 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" /> 下载PDF
                </Button>
              </div>
              <p className="text-slate-400 text-xs font-medium mb-1">{rec.stationName}</p>
              <p className="text-slate-300 text-sm">{rec.summary}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRestore(rec)}
                className="mt-2 text-slate-400 hover:text-white hover:bg-slate-800 h-7 text-xs"
              >
                <Check className="w-3 h-3 mr-1" /> 恢复此记录
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("single");
  const [data, setData] = useState<MoistureData>(INITIAL_DATA);
  const [saved, setSaved] = useState(false);
  const [showStationDialog, setShowStationDialog] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    setData(loadMoistureData());
  }, []);

  // Listen for history restore
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<MoistureData>;
      setData(custom.detail);
      setActiveTab("single");
    };
    window.addEventListener("restore_history", handler);
    return () => window.removeEventListener("restore_history", handler);
  }, []);

  const handleChange = useCallback((newData: MoistureData) => {
    setData(newData);
    setSaved(false);
  }, []);

  const handleSaveConfirm = (stationName: string) => {
    setShowStationDialog(false);
    saveMoistureData(data);
    addHistoryRecord(data, stationName);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (!confirm("确定重置所有数据？")) return;
    setData(INITIAL_DATA);
    saveMoistureData(INITIAL_DATA);
  };

  return (
    <div
      className="flex flex-col bg-slate-950"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {/* Station name dialog */}
      <StationNameDialog
        open={showStationDialog}
        onConfirm={handleSaveConfirm}
        onCancel={() => setShowStationDialog(false)}
      />

      {/* Page header */}
      <div className="shrink-0 sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-white font-semibold text-base">砂含水调整计算器</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-2 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={() => setShowStationDialog(true)}
              className={`h-8 px-3 text-xs font-medium rounded-lg transition-all ${
                saved
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {saved ? (
                <><Check className="w-3.5 h-3.5 mr-1" /> 已保存</>
              ) : (
                <><Save className="w-3.5 h-3.5 mr-1" /> 保存</>
              )}
            </Button>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content — scrollable */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto overscroll-contain"
        style={{ minHeight: 0 }}
      >
        {activeTab === "single" && <ModuleSingle data={data} onChange={handleChange} />}
        {activeTab === "gauge" && <ModuleGauge data={data} onChange={handleChange} />}
        {activeTab === "calibrate" && <ModuleCalibrate data={data} onChange={handleChange} />}
        {activeTab === "mix" && <ModuleMix data={data} onChange={handleChange} />}
        {activeTab === "history" && <ModuleHistory />}
      </div>
    </div>
  );
}
