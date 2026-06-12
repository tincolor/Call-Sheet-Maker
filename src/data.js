import { uid } from './utils.js';

// ---- default schedule columns ----
// "time" is structural (hosts time+duration and drives auto-calc) and is
// always first; the rest can be renamed, resized, added and removed.
export function SCHED_COLUMNS() {
  return [
    { key: 'time', label: 'Time', width: 9 },
    { key: 'task', label: 'Task', width: 18 },
    { key: 'loc',  label: 'Location', width: 24 },
    { key: 'cast', label: 'Cast / Extras', width: 15 },
    { key: 'note', label: 'Notes', width: 34 },
  ];
}

// ---- default day (placeholder call sheet) ----
export function DEFAULT_DAY() {
  return {
    id: uid(),
  meta: {
    company: 'Company Name',
    address: 'Company Address Line 1\nCompany Address Line 2',
    project: 'Project Title',
    client:  'Client Name',
    mainLocation: 'Main Location',
    date:    'Shoot Date',
    day:     'Shoot Day Number',
    shootCall: 'Shoot Call Time',
    emergency: 'Emergency Contact Name and Phone',
    weatherCallout: 'Weather Summary',
    headerNote: 'Header Note',
    sunrise: 'Sunrise Time',
    sunset:  'Sunset Time',
    crewRoles: [
      { id: uid(), role: 'Producer', names: 'Producer Name' },
      { id: uid(), role: 'US Producer', names: 'Production Contact Name' },
      { id: uid(), role: 'Director', names: 'Director Name' },
      { id: uid(), role: 'DOP', names: 'Director of Photography Name' },
    ],
    'crew.director': 'Director Name',
    'crew.dop':      'Director of Photography Name',
    'crew.lp':       'Producer Name',
    'crew.usprod':   'Production Contact Name',
  },
  logos: [
    { label: 'Logo Label', dataUrl: '' },
  ],
  pageBreaks: [], // array of position markers: { before: sectionId } or { beforeRow: {sectionId, idx} }
  sections: [
    {
      id: uid(), type: 'schedule', title: 'Schedule',
      columns: SCHED_COLUMNS(), autoTime: true,
      data: [
        { type:'row',  time:'Start Time', dur:'Duration', task:'Schedule Item', loc:'Location', cast:'Cast / Extras', note:'Notes' },
        { type:'row',  time:'Start Time', dur:'Duration', task:'Scene or Activity', loc:'Location', cast:'Cast / Extras', note:'Notes' },
        { type:'span', time:'Time', dur:'Duration', text:'Meal Break or Company Move' },
        { type:'row',  time:'Start Time', dur:'Duration', task:'Scene or Activity', loc:'Location', cast:'Cast / Extras', note:'Notes' },
        { type:'span', time:'Time', dur:'',   text:'Wrap or End of Day' },
      ],
    },
    {
      id: uid(), type: 'contacts', title: 'Client Contacts',
      data: [
        { role:'Role / Department', name:'Contact Name',  phone:'Phone or Email' },
        { role:'Role / Department', name:'Contact Name', phone:'Phone or Email' },
      ],
    },
    {
      id: uid(), type: 'contacts', title: 'Location Contacts',
      data: [
        { role:'Location Contact', name:'Contact Name', phone:'Phone or Email' },
        { role:'Site Contact', name:'Contact Name', phone:'Phone or Email' },
      ],
    },
    {
      id: uid(), type: 'contacts', title: 'Production Contacts',
      data: [
        { role:'Producer', name:'Contact Name', phone:'Phone or Email' },
        { role:'Coordinator', name:'Contact Name', phone:'Phone or Email' },
      ],
    },
    {
      id: uid(), type: 'contacts', title: 'Crew Contacts',
      data: [
        { role:'Producer',     name:'Crew Member Name', phone:'Phone or Email' },
        { role:'Director',     name:'Crew Member Name', phone:'Phone or Email' },
        { role:'Director of Photography', name:'Crew Member Name', phone:'Phone or Email' },
        { role:'Camera Assistant', name:'Crew Member Name', phone:'Phone or Email' },
        { role:'Lighting', name:'Crew Member Name', phone:'Phone or Email' },
        { role:'Sound', name:'Crew Member Name', phone:'Phone or Email' },
        { role:'Production Assistant', name:'Crew Member Name', phone:'Phone or Email' },
      ],
    },
    {
      id: uid(), type: 'hospital', title: 'Nearest Hospital',
      data: {
        name: 'Hospital Name',
        addr: 'Hospital Address',
        phone: 'Hospital Phone',
        hours: 'Hospital Hours',
        dist:  'Distance / Travel Time',
      },
    },
    {
      id: uid(), type: 'basecamp', title: 'Parking / Basecamp',
      data: {
        name: 'Basecamp Name',
        addr: 'Basecamp Address',
        parking:  'Parking Instructions',
        restroom: 'Restroom Location',
        catering: 'Catering Location',
      },
    },
    {
      id: uid(), type: 'equipment', title: 'Equipment Checklist',
      data: [
        'Camera Equipment Item',
        'Lens or Filter Item',
        'Support Equipment Item',
        'Lighting Equipment Item',
        'Sound Equipment Item',
        'Media / Battery Item',
        'Rental Equipment Item',
        'Additional Equipment Item',
      ].map(t => ({ text: t, done: false })),
    },
    {
      id: uid(), type: 'notes', title: 'Notes',
      data: { text: 'Production notes, safety notes, or special instructions.' },
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
    crewRoles: [
      { id: uid(), role: 'Producer', names: '' },
      { id: uid(), role: 'US Producer', names: '' },
      { id: uid(), role: 'Director', names: '' },
      { id: uid(), role: 'DOP', names: '' },
    ],
    'crew.director': '', 'crew.dop': '', 'crew.lp': '', 'crew.usprod': '',
  },
  logos: [],
  pageBreaks: [],
  sections: [
    { id: uid(), type: 'schedule', title: 'Schedule', columns: SCHED_COLUMNS(), autoTime: true, data: [] },
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
