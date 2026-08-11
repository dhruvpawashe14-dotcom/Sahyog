import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as leadService from './services/leadService';

export default function PipelinePage() {
  const { user, profile, isAdmin } = useAuth();
  const [leads, setLeads] = useState([]);
  const [dragId, setDragId] = useState(null);
  const navigate = useNavigate();

  const load = () => leadService.listLeads({ userId: user.id, isAdmin }).then(setLeads);
  useEffect(() => { if (user) load(); }, [user, isAdmin]);

  const onDrop = async (stage) => {
    if (!dragId) return;
    await leadService.updateLeadStage(dragId, stage, user.id, profile.full_name);
    setDragId(null);
    load();
  };

  return (
    <div>
      <div className="page-hdr"><h1>Pipeline</h1><p>Drag a card to change its stage</p></div>
      <div className="pipeline-board">
        {leadService.STAGES.map((stage) => {
          const cards = leads.filter((l) => l.stage === stage);
          return (
            <div key={stage} className="pipeline-col" onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(stage)}>
              <div className="pipeline-col-hdr">{stage} <span className="dim">{cards.length}</span></div>
              {cards.map((c) => (
                <div key={c.id} className="pipeline-card" draggable onDragStart={() => setDragId(c.id)} onClick={() => navigate(`/leads/${c.id}`)}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.full_name}</div>
                  <div className="dim" style={{ fontSize: 11 }}>{c.mobile} · {c.product || '—'}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
