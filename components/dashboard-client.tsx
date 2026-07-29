'use client';
// ============================================================
// Anima Pulse — Dashboard client component (interactive)
// Handles clock-in/out mutations, renders scorecard + attendance
// ============================================================
import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { User, Role, Attendance, Submission } from '@/lib/repo/types';
import { apiPost } from '@/lib/client';
import { fmtDateWIB, fmtTimeWIB, fmtNum } from '@/lib/format';
import { avgOf, trendDelta } from '@/lib/er';
import {
  Button,
  Sparkline,
  StatusPill,
  TrendDelta,
  Toast,
  PlatformBadge,
} from '@/components/widgets';
import { I } from '@/components/icons';

interface Props {
  user: User;
  role: Role;
  todayAttendance: Attendance | null;
  attPct: { ontime: number; late: number; absent: number };
  erHistory: number[];
  avgER: number;
  erTarget: { value: number; label: string };
  totalContent: number;
  bestContent: Submission | null;
  isOwnDashboard?: boolean;
}

export function DashboardClient({
  user,
  role,
  todayAttendance: initialAttendance,
  attPct,
  erHistory,
  avgER,
  erTarget,
  totalContent,
  bestContent,
  isOwnDashboard = true,
}: Props) {
  const [attendance, setAttendance] = useState<Attendance | null>(initialAttendance);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const isClockedIn = Boolean(attendance?.clockInAt);
  const target = erTarget.value;

  // RAG indicator per US-003
  const erRag =
    avgER >= target ? 'positive' : avgER >= target * 0.9 ? 'warning' : 'danger';
  const erRagLabel =
    avgER >= target ? 'On target' : avgER >= target * 0.9 ? 'Mendekati target' : 'Di bawah target';

  const subText = !isOwnDashboard
    ? `Ini ringkasan performa konten dan kehadiran ${user.name} bulan ini.`
    : role === 'staff' || role === 'creator'
    ? 'Ini ringkasan performa konten dan kehadiran kamu minggu ini.'
    : role === 'manager'
    ? 'Ini ringkasan performa tim media sosial Anima Companion hari ini.'
    : 'Ini bird’s-eye view operasional Anima Companion.';

  const handleClockIn = useCallback(() => {
    if (isClockedIn) return;
    setLoading(true);

    if (!navigator.geolocation) {
      setToast('Geolocation tidak didukung browser ini.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const rec = await apiPost<Attendance>('/attendance/clock-in', { lat, lng });
          setAttendance(rec);
          setToast(`Clock-in berhasil pada ${fmtTimeWIB(rec.clockInAt)} WIB`);
        } catch (e) {
          const code = e instanceof Error ? e.message : 'error';
          if (code === 'outside_radius') {
            setToast('Anda berada di luar radius lokasi absen yang diizinkan.');
          } else if (code === 'already_clocked_in') {
            setToast('Kamu sudah clock-in hari ini.');
          } else {
            setToast('Clock-in gagal. Coba lagi.');
          }
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setToast('Gagal mendapatkan lokasi GPS. Pastikan izin lokasi aktif.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [isClockedIn]);

  const trend = trendDelta(erHistory);

  return (
    <div className="screen screen-dashboard">
      <Toast message={toast} onDone={() => setToast('')} />

      {!isOwnDashboard && (
        <Link href="/team" className="back-link" style={{ marginBottom: 'var(--space-2)', display: 'inline-block' }}>
          ← KEMBALI KE PERFORMA TIM
        </Link>
      )}

      <header className="screen-head">
        <div>
          <div className="eyebrow">{fmtDateWIB()} · WIB</div>
          <h1 className="screen-title">
            {isOwnDashboard ? `Halo, ${user.name.split(' ')[0]}.` : user.name}
          </h1>
          <p className="screen-sub">{subText}</p>
        </div>
        {isOwnDashboard && (
          <div className="head-actions">
            <Button variant="ghost" icon={I.bell}>Notifikasi</Button>
          </div>
        )}
      </header>

      {/* TOP ROW: clock-in widget + ER card */}
      <div className="grid-2">
        {/* Clock-in card */}
        <article className={'card card-clock ' + (isClockedIn ? 'is-in' : '')}>
          <div className="card-clock-left">
            <div className="eyebrow">{isClockedIn ? 'Sudah clock-in' : 'Belum clock-in'}</div>
            <div className="card-clock-time">
              {isClockedIn ? (
                <>
                  <span className="mono-num">{fmtTimeWIB(attendance?.clockInAt)}</span>
                  <span className="card-clock-sub">
                    {attendance?.status === 'late' ? 'Terlambat dari 09:30' : 'Tepat waktu'}
                  </span>
                </>
              ) : (
                <>
                  <span className="mono-num">--:--</span>
                  <span className="card-clock-sub">Server time WIB · timestamp otomatis</span>
                </>
              )}
            </div>
            {isClockedIn ? (
              <StatusPill tone={attendance?.status === 'late' ? 'warning' : 'positive'}>
                {attendance?.status === 'late' ? 'Terlambat' : 'Tepat waktu'}
              </StatusPill>
            ) : isOwnDashboard ? (
              <Button
                variant="primary"
                size="lg"
                icon={I.clock}
                onClick={handleClockIn}
                disabled={loading}
              >
                Clock-in sekarang
              </Button>
            ) : (
              <StatusPill tone="neutral">Belum clock-in</StatusPill>
            )}
          </div>
          <div className="card-clock-right">
            <div className="att-bar">
              <div
                className="att-seg att-ontime"
                style={{ flex: attPct.ontime }}
                title={`Tepat waktu ${attPct.ontime}%`}
              />
              <div
                className="att-seg att-late"
                style={{ flex: attPct.late }}
                title={`Terlambat ${attPct.late}%`}
              />
              <div
                className="att-seg att-absent"
                style={{ flex: attPct.absent }}
                title={`Absen ${attPct.absent}%`}
              />
            </div>
            <div className="att-legend">
              <span>
                <span className="dot dot-ontime" /> Tepat{' '}
                <b className="mono-num">{attPct.ontime}%</b>
              </span>
              <span>
                <span className="dot dot-late" /> Telat{' '}
                <b className="mono-num">{attPct.late}%</b>
              </span>
              <span>
                <span className="dot dot-absent" /> Absen{' '}
                <b className="mono-num">{attPct.absent}%</b>
              </span>
            </div>
            <div className="card-clock-foot">Kehadiran bulan ini</div>
          </div>
        </article>

        {/* ER Scorecard */}
        <article className="card card-er">
          <div className="er-head">
            <div className="eyebrow">Engagement Rate · 4 minggu</div>
            <StatusPill tone={erRag}>{erRagLabel}</StatusPill>
          </div>
          <div className="er-big">
            <span className="mono-num er-value">{avgER.toFixed(2)}</span>
            <span className="er-unit">%</span>
            <TrendDelta value={trend} />
          </div>
          <div className="er-target">
            Target {target.toFixed(1)}% · {erTarget.label}
          </div>
          <div className="er-chart">
            <Sparkline data={erHistory} width={420} height={64} target={target} />
          </div>
          <div className="er-foot">
            <span>8 minggu lalu</span>
            <span>Minggu ini</span>
          </div>
        </article>
      </div>

      {/* KPI strip */}
      <div className="kpi-strip">
        <div className="kpi">
          <div className="eyebrow">Konten bulan ini</div>
          <div className="kpi-value mono-num">{totalContent}</div>
        </div>
        <div className="kpi">
          <div className="eyebrow">Avg ER</div>
          <div className="kpi-value mono-num">
            {avgER.toFixed(2)}
            <span className="kpi-unit">%</span>
          </div>
          <div className="kpi-foot">
            <TrendDelta value={trend} /> vs sebelumnya
          </div>
        </div>
        <div className="kpi">
          <div className="eyebrow">Best konten ER</div>
          <div className="kpi-value mono-num">
            {bestContent ? bestContent.er.toFixed(2) : '—'}
            {bestContent && <span className="kpi-unit">%</span>}
          </div>
          <div className="kpi-foot">
            {bestContent ? bestContent.title.slice(0, 32) + '…' : '—'}
          </div>
        </div>
        <div className="kpi">
          <div className="eyebrow">Status ER</div>
          <div className="kpi-value mono-num">
            {erRag === 'positive' ? '🟢' : erRag === 'warning' ? '🟡' : '🔴'}
          </div>
          <div className="kpi-foot">{erRagLabel}</div>
        </div>
      </div>

      {/* Best content card */}
      {bestContent && (
        <article className="card card-recent">
          <div className="card-head">
            <div>
              <div className="eyebrow">Konten terbaik · ER tertinggi</div>
              <h3 className="card-h">{bestContent.title}</h3>
            </div>
            <PlatformBadge platform={bestContent.platform} />
          </div>
          <div className="sub-list">
            <div className="sub-row">
              <PlatformBadge platform={bestContent.platform} />
              <div className="sub-title">
                <div className="sub-title-text">{bestContent.title}</div>
              </div>
              <div className="sub-metric">
                <span className="mono-num">{fmtNum(bestContent.views)}</span>
                <span className="metric-lbl">views</span>
              </div>
              <div className="sub-metric">
                <span className="mono-num">{fmtNum(bestContent.likes)}</span>
                <span className="metric-lbl">likes</span>
              </div>
              <div className="sub-metric">
                <span className="mono-num er-pct">{bestContent.er.toFixed(2)}%</span>
                <span className="metric-lbl">ER</span>
              </div>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
