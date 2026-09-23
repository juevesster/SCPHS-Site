<script>
// students-data.js
// Centralized, editable data for Student Portal
window.STUDENTS_DATA = {
  academics: {
    enrichment: [
      { id:'campus-journalism', name:'Campus Journalism', type:'Curricular', link:'#' },
      { id:'mathletes', name:'Math Enrichment / Contests', type:'Curricular', link:'#' }
    ],
    supports: [
      { id:'tutorials', name:'Peer Tutorials', type:'Support', link:'#' },
      { id:'guidance', name:'Guidance & Counseling', type:'Support', link:'#' }
    ]
  },
  organizations: [
    { id:'ssp', name:'Supreme Secondary Learners Government (SSLG)', type:'Leadership', category:'Non‑Academic', adviser:'TBA', about:'Student leadership and governance.',
      links:{ fb:'#', page:'#' } },
    { id:'yfc', name:'Youth for the Environment in Schools (YES-O)', type:'Environment', category:'Non‑Academic', adviser:'TBA', about:'Environmental awareness and action.',
      links:{ fb:'#' } },
    { id:'ssp-english', name:'English Communication Guild', type:'Academic', category:'Curricular', adviser:'TBA', about:'Debate, public speaking, and writing.',
      links:{} }
  ],
  activities: [
    { id:'founding-anniv', title:'Founding Anniversary Activities', date:'2026-02-10', category:'School‑wide', link:'#' },
    { id:'intramurals', title:'Intramurals', date:'2026-09-01', category:'Sports', link:'#' }
  ]
};
</script>