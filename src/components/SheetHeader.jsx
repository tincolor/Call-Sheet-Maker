import { Fragment } from 'preact';
import { ContentEditable } from './ContentEditable.jsx';
import { Logos } from './Header.jsx';
import { storeSignal } from '../signals.js';
import { save } from '../store.js';

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
          <div class="hd-crew" id="headerCrew">
            <div><span class="role">Producer :</span><ContentEditable value={m('crew.lp')} onCommit={set('crew.lp')} placeholder="Name" /></div>
            <div><span class="role">US Producer :</span><ContentEditable value={m('crew.usprod')} onCommit={set('crew.usprod')} placeholder="Name" /></div>
            <div><span class="role">Director :</span><ContentEditable value={m('crew.director')} onCommit={set('crew.director')} placeholder="Name" /></div>
            <div><span class="role">DOP :</span><ContentEditable value={m('crew.dop')} onCommit={set('crew.dop')} placeholder="Name" /></div>
          </div>
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
