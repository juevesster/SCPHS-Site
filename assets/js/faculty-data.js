// faculty-data.js
// ---------------------------------------------
// Fill this file with your real data. Do not change the structure.
// Safe to edit and redeploy anytime.
// ---------------------------------------------

window.FACULTY_DATA = {
  jhs: {
    subjects: [
      { id: 'english',  name: 'English',  teachers: [], sections: {} },
      { id: 'filipino', name: 'Filipino', teachers: [], sections: {} },
      { id: 'math',     name: 'Mathematics', teachers: [], sections: {} },
      { id: 'science',  name: 'Science', teachers: [], sections: {} },
      { id: 'ap',       name: 'Araling Panlipunan', teachers: [], sections: {} },
      { id: 'tle',      name: 'TLE', teachers: [], sections: {} },
      { id: 'mapeh',    name: 'MAPEH', teachers: [], sections: {} },
      { id: 'esp',      name: 'EsP', teachers: [], sections: {} }
    ]
  },
  shs: {
    tracks: {
      acad: {
        key: 'acad',
        name: 'Academic Track',
        specs: {
          STEM:  { teachers: [], sections: {} },
          ABM:   { teachers: [], sections: {} },
          HUMSS: { teachers: [], sections: {} },
          GAS:   { teachers: [], sections: {} }
        }
      },
      tvl: {
        key: 'tvl',
        name: 'TVL Track',
        specs: {
          ICT: { teachers: [], sections: {} },
          HE:  { teachers: [], sections: {} }, // Home Economics
          IA:  { teachers: [], sections: {} }, // Industrial Arts
          'Agri-Fishery': { teachers: [], sections: {} }
        }
      },
      arts: {
        key: 'arts',
        name: 'Arts & Design',
        specs: {
          'Arts & Design Production': { teachers: [], sections: {} }
        }
      },
      sports: {
        key: 'sports',
        name: 'Sports',
        specs: {
          'Sports Coaching': { teachers: [], sections: {} },
          'Fitness': { teachers: [], sections: {} }
        }
      }
    }
  }
};

/*
How to fill data:

// Example for JHS English
FACULTY_DATA.jhs.subjects.find(s => s.id==='english').teachers = [
  { name: 'Firstname Lastname', email: 'name@deped.gov.ph', advisory: '7-A' },
  { name: 'Firstname Lastname', email: '', advisory: '' }
];
FACULTY_DATA.jhs.subjects.find(s => s.id==='english').sections = {
  'Grade 7': ['7-A','7-B'],
  'Grade 8': ['8-A'],
  'Grade 9': [],
  'Grade 10': ['10-A']
};

// Example for SHS STEM
FACULTY_DATA.shs.tracks.acad.specs.STEM.teachers = [
  { name: 'Firstname Lastname', email: 'name@deped.gov.ph' }
];
FACULTY_DATA.shs.tracks.acad.specs.STEM.sections = {
  'Grade 11': ['STEM 11-A','STEM 11-B'],
  'Grade 12': ['STEM 12-A']
};
*/