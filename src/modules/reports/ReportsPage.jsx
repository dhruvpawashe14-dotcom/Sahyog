import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import * as reportService from './services/reportService';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const COLORS = ['#1A4A8A', '#1A7A4A', '#5A2D82', '#B8730A', '#C0392B', '#0F6E56', '#854F0B', '#3C3489', '#B8960C', '#D4A017', '#F0C040'];

export default function ReportsPage() {
  const [stageData, setStageData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [conversion, setConversion] = useState(null);
  const [productivity, setProductivity] = useState([]);

  useEffect(() => {
    reportService.fetchLeadsByStage().then(setStageData);
    reportService.fetchProductMix().then(setProductData);
    reportService.fetchConversionStats().then(setConversion);
    reportService.fetchEmployeeProductivity().then(setProductivity);
  }, []);

  return (
    <div>
      <div className="page-hdr"><h1>Reports & Analytics</h1></div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Total Leads</div><div className="stat-value">{conversion?.total ?? '—'}</div></div>
        <div className="stat-card"><div className="stat-label">Won / Issued</div><div className="stat-value" style={{ color: 'var(--green)' }}>{conversion?.won ?? '—'}</div></div>
        <div className="stat-card"><div className="stat-label">Conversion Rate</div><div className="stat-value" style={{ color: 'var(--gold)' }}>{conversion?.rate ?? '—'}%</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card">
          <div className="card-title">Leads by Stage</div>
          {stageData && (
            <Bar data={{
              labels: Object.keys(stageData),
              datasets: [{ data: Object.values(stageData), backgroundColor: COLORS }],
            }} options={{ plugins: { legend: { display: false } } }} />
          )}
        </div>
        <div className="card">
          <div className="card-title">Product Mix</div>
          {productData && (
            <Doughnut data={{
              labels: Object.keys(productData),
              datasets: [{ data: Object.values(productData), backgroundColor: COLORS }],
            }} />
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">Employee Productivity</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Leads</th><th>Leads Won</th><th>Tickets</th><th>Tickets Closed</th><th>Claims</th><th>Claims Settled</th></tr></thead>
            <tbody>
              {productivity.length === 0 && <tr><td colSpan={7} className="table-empty">No data yet</td></tr>}
              {productivity.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td><td>{p.leads}</td><td>{p.leadsWon}</td>
                  <td>{p.tickets}</td><td>{p.ticketsClosed}</td>
                  <td>{p.claims}</td><td>{p.claimsSettled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
