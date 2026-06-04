import { uid } from './utils.js';
import { logoBbc, logoSa } from './logos.js';

// ---- default day (populated from Day 3 sheet) ----
export function DEFAULT_DAY() {
  return {
    id: uid(),
  meta: {
    company: 'Street Attack Japan K.K.',
    address: '2-13, Akasaka 9-chome, Minato-ku,\nTokyo 107-0052, Japan\nninetytwo13, #607',
    project: 'The Training Ground',
    client:  'Hyundai Motor Company × Boston Dynamics',
    mainLocation: 'Boston Dynamics HQ · Waltham, MA',
    date:    '2026.04.30 (THU)',
    day:     '3',
    shootCall: '07:00',
    emergency: 'Adrian Grey (Producer)  747-302-2379',
    weatherCallout: 'PARTLY CLOUDY · 64° / 45°F',
    headerNote: '',
    sunrise: '5:47',
    sunset:  '7:40',
    'crew.director': ' Tom Slemmons',
    'crew.dop':      ' Brandon Strack',
    'crew.lp':       ' Adrian Grey',
    'crew.usprod':   ' Brett Zaccardi',
  },
  logos: [
    { label: 'BBC StoryWorks', dataUrl: logoBbc },
    { label: 'Street Attack',  dataUrl: logoSa },
  ],
  pageBreaks: [], // array of position markers: { before: sectionId } or { beforeRow: {sectionId, idx} }
  sections: [
    {
      id: uid(), type: 'schedule', title: 'Schedule',
      data: [
        { type:'row',  time:'7:00',  dur:'1h', task:'LOAD IN', loc:'Boston Dynamics HQ — Waltham, MA', cast:'', note:'Crew call' },
        { type:'row',  time:'8:00',  dur:'4h', task:'SCENE 11 — END SHOT', loc:'Atlas Lab', cast:'Atlas; Reassembly engineers (hands only); Aya Durbin; Yeuhi Abe; HMC staff; Key BD staff (bg)', note:'' },
        { type:'span', time:'12:00', dur:'1h', text:'LUNCH BREAK — Cafeteria (TBC)' },
        { type:'row',  time:'13:00', dur:'4h', task:'SCENE 6 — Four Stages Montage (Manufacturing → Training)', loc:'Manufacturing room, Teleoperation / Training space', cast:'Manufacturing staff; Teleoperation operator', note:'Continues from Wed Apr 29 (Ideation + Programming)' },
        { type:'span', time:'17:00', dur:'',   text:'WRAP' },
      ],
    },
    {
      id: uid(), type: 'contacts', title: 'Hyundai Motor Company',
      data: [
        { role:'Client', name:'June Kim',  phone:'' },
        { role:'Client', name:'Yujin Lee', phone:'' },
      ],
    },
    {
      id: uid(), type: 'contacts', title: 'Boston Dynamics',
      data: [
        { role:'Client', name:'Nik Noel',       phone:'' },
        { role:'Client', name:'Vatche Arabian', phone:'' },
        { role:'Client', name:'Aya Durbin',     phone:'' },
        { role:'Client', name:'Yeuhi Abe',      phone:'' },
      ],
    },
    {
      id: uid(), type: 'contacts', title: 'BBC StoryWorks',
      data: [
        { role:'Agency', name:'Kome Tamilchelvam', phone:'Director, Production & Delivery' },
        { role:'Agency', name:'Hijanah Hernandez', phone:'Creative Strategist' },
      ],
    },
    {
      id: uid(), type: 'contacts', title: 'Crew Contacts',
      data: [
        { role:'Producer (SAJ Tokyo)',     name:'Adrian Grey',       phone:'747-302-2379' },
        { role:'US Producer (SA US)',      name:'Brett Zaccardi',    phone:'brett@streetattack.com' },
        { role:'Director (SAJ Tokyo)',     name:'Tom Slemmons',      phone:'tom@streetattack.jp' },
        { role:'DOP (SAJ Tokyo)',          name:'Brandon Strack',    phone:'brandon@streetattack.jp' },
        { role:'1st AC (Boston)',          name:'Asa Reed',          phone:'207-653-1170' },
        { role:'Lighting (Boston)',        name:'Ruben Alves',       phone:'rubenmalves05@gmail.com' },
        { role:'Lighting (Boston)',        name:'Tony Ventura',      phone:'774-930-7446' },
        { role:'Sound Op (Boston)',        name:'Justin Lacroix',    phone:'207-891-8268' },
        { role:'Art / Props Manager',      name:'Claudia Santiso',   phone:'claudiasantiso@gmail.com' },
        { role:'PA (Boston)',              name:'Winston Telesford', phone:'wtelesford@gmail.com' },
      ],
    },
    {
      id: uid(), type: 'hospital', title: 'Nearest Hospital',
      data: {
        name: 'Newton-Wellesley Hospital (nearest ER)',
        addr: '2014 Washington St, Newton, MA 02462',
        phone: '617-243-6000',
        hours: '24h / ER',
        dist:  '~6 mi / 15 min from BD Waltham',
      },
    },
    {
      id: uid(), type: 'basecamp', title: 'Parking / Basecamp',
      data: {
        name: 'Residence Inn Waltham (hotel basecamp)',
        addr: 'Waltham, MA',
        parking:  'On-site at BD HQ — confirm w/ Vatche',
        restroom: 'Inside BD HQ',
        catering: 'Cafeteria (TBC)',
      },
    },
    {
      id: uid(), type: 'equipment', title: 'Equipment Checklist',
      data: [
        'FX6 + rigging + batteries','FX3 + batteries','Sony 24–70mm lens','82mm ND filters',
        'DJI RS3 Pro + mounting kit','Tripod (Miller)','SmallHD 7','SmallHD 7 w/ RX',
        'Teradek Bolt 4K 750 LT/RX kit','Memory cards (+ extras?)',
        'RENTAL · Angenieux EZ-1 + EZ-2 zooms','RENTAL · Sony 16–35mm',
        'RENTAL · EasyRig + Stabil / Serene','RENTAL · Sachtler Video 20 tripod',
        'RENTAL · Losmandy Porta-Jib Standard','RENTAL · Matthews Doorway Dolly',
        'RENTAL · Extra monitors + wireless feed (TBC)','RENTAL · GF Multi-Jib larger crane (if needed)',
      ].map(t => ({ text: t, done: false })),
    },
    {
      id: uid(), type: 'notes', title: 'Notes',
      data: { text: '' },
    },
  ],
  };
}

// ---- blank day (for "+ New day") ----
export function BLANK_DAY() {
  return {
    id: uid(),
  meta: {
    company: '', address: '', project: '', client: '', mainLocation: '',
    date: '', day: '', shootCall: '',
    emergency: '', weatherCallout: '', headerNote: '', sunrise: '', sunset: '',
    'crew.director': '', 'crew.dop': '', 'crew.lp': '', 'crew.usprod': '',
  },
  logos: [],
  pageBreaks: [],
  sections: [
    { id: uid(), type: 'schedule', title: 'Schedule', data: [] },
    { id: uid(), type: 'contacts', title: 'Crew Contacts', data: [] },
    { id: uid(), type: 'hospital', title: 'Nearest Hospital',
      data: { name:'', addr:'', phone:'', hours:'', dist:'' } },
    { id: uid(), type: 'basecamp', title: 'Parking / Basecamp',
      data: { name:'', addr:'', parking:'', restroom:'', catering:'' } },
    { id: uid(), type: 'equipment', title: 'Equipment Checklist', data: [] },
    { id: uid(), type: 'notes', title: 'Notes', data: { text: '' } },
  ],
  };
}

export function DEFAULT_STORE() {
  const d = DEFAULT_DAY();
  return { days: [d], currentDayId: d.id, tweaks: { showLogo: true, paperSize: 'a4' } };
}
