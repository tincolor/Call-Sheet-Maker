import { Fragment } from 'preact';
import { ContentEditable } from './ContentEditable.jsx';
import { Logos } from './Header.jsx';
import { storeSignal } from '../signals.js';
import { save } from '../store.js';
import { confirmDel, uid } from '../utils.js';

export function SheetHeader() {
  const store = storeSignal.value;
  const state = store?.days?.find(d => d.id === store.currentDayId) || store?.days[0];
  if (!state) return null;

  const m = (key) => state.meta?.[key] ?? '';
  const set = (key) => (val) => { state.meta[key] = val; save(); };

  return (
    <Fragment>
      <div class="hd">
        <div class="hd-company">
          <div class="logo-slot-wrap">
            <Logos />
          </div>
          <ContentEditable value={m('company')} onCommit={set('company')} multiline className="name" placeholder="Company" tagName="div" />
          <ContentEditable value={m('address')} onCommit={set('address')} multiline className="addr" placeholder="Address" tagName="div" />
          <div style={{ flex: 1 }} />
          <HeaderCrewRoles state={state} />
        </div>

        <div class="hd-meta-col">
          <div>
            <div class="lbl">Project <span class="jp">作品</span></div>
            <ContentEditable value={m('project')} onCommit={set('project')} multiline className="meta-project" placeholder="Project" tagName="div" />
          </div>
          <div>
            <div class="lbl">Client <span class="jp">クライアント</span></div>
            <ContentEditable value={m('client')} onCommit={set('client')} multiline className="meta-client" placeholder="Client" tagName="div" />
          </div>
          <div>
            <div class="lbl">Location <span class="jp">ロケ地</span></div>
            <ContentEditable value={m('mainLocation')} onCommit={set('mainLocation')} multiline className="meta-loc" placeholder="Main location" tagName="div" />
          </div>
        </div>

        <div class="hd-title">
          <div class="title-row">CALL SHEET<span class="jp jp-only">/ 香盤表</span></div>
          <div class="kv">
            <div class="k">Date</div>
            <ContentEditable value={m('date')} onCommit={set('date')} className="v" placeholder="YYYY.MM.DD (DAY)" />
          </div>
          <div class="kv">
            <div class="k">Day</div>
            <ContentEditable value={m('day')} onCommit={set('day')} className="v" placeholder="#" />
          </div>
          <div class="shoot-call">
            <span class="lbl">Shoot Call <span class="jp">撮影開始</span></span>
            <ContentEditable value={m('shootCall')} onCommit={set('shootCall')} className="time" placeholder="00:00" />
            <ContentEditable value={m('headerNote')} onCommit={set('headerNote')} multiline className="header-note" placeholder="Header note" tagName="div" />
          </div>
        </div>
      </div>

      <div class="hd2">
        <div class="emergency">
          <div class="lbl">Emergency <span class="jp">緊急連絡</span></div>
          <ContentEditable value={m('emergency')} onCommit={set('emergency')} multiline className="v" placeholder="Emergency contact" tagName="div" />
        </div>
        <div class="weather">
          <span class="lbl weather-lbl">Weather <span class="jp">天気</span></span>
          <ContentEditable value={m('weatherCallout')} onCommit={set('weatherCallout')} multiline placeholder="Weather callout" />
        </div>
        <div class="sun">
          <span><span class="k">☀ Rise</span><ContentEditable value={m('sunrise')} onCommit={set('sunrise')} className="v" placeholder="—" /></span>
          <span><span class="k">☾ Set</span><ContentEditable value={m('sunset')} onCommit={set('sunset')} className="v" placeholder="—" /></span>
        </div>
      </div>
    </Fragment>
  );
}

function HeaderCrewRoles({ state }) {
  if (!state.meta.crewRoles) state.meta.crewRoles = [];

  const focusRole = (id) => {
    requestAnimationFrame(() => {
      document.querySelector(`[data-crew-role-id="${id}"] .crew-role-field`)?.focus();
    });
  };

  const addRole = (afterIdx = state.meta.crewRoles.length - 1) => {
    const role = { id: uid(), role: 'Role', names: 'Name' };
    state.meta.crewRoles.splice(afterIdx + 1, 0, role);
    save();
    focusRole(role.id);
  };

  const removeRole = async (idx, anchor) => {
    if (!(await confirmDel('Delete this role?', anchor))) return;
    state.meta.crewRoles.splice(idx, 1);
    save();
  };

  const updateRole = (idx, key, val) => {
    state.meta.crewRoles[idx][key] = val;
    save();
  };

  const handleRoleKeyDown = (idx) => (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    addRole(idx);
  };

  return (
    <div class="hd-crew" id="headerCrew">
      {state.meta.crewRoles.map((item, idx) => (
        <div class="crew-role-row" data-crew-role-id={item.id} key={item.id}>
          <button class="crew-role-del" title="Delete role" onClick={(e) => removeRole(idx, e.currentTarget)}>×</button>
          <ContentEditable
            value={item.role}
            onCommit={(val) => updateRole(idx, 'role', val)}
            onKeyDown={handleRoleKeyDown(idx)}
            className="role crew-role-field"
            placeholder="Role"
          />
          <span class="role-colon">:</span>
          <ContentEditable
            value={item.names}
            onCommit={(val) => updateRole(idx, 'names', val)}
            multiline
            className="crew-name-field"
            placeholder="Name"
            tagName="span"
          />
        </div>
      ))}
      <button class="crew-role-add" title="Add role" onClick={() => addRole()}>+ Add role</button>
    </div>
  );
}
