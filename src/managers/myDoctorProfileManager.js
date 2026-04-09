import { getIsoDateWithOffset } from '../utils/dateUtils';

const doctorProfile = {
  id: 'd1',
  firstName: 'Dr. Olena',
  lastName: 'Shevchenko',
  email: 'shevchenko@gmail.com',
  phone: '+380987654321',
  dateOfBirth: '11.08.1975',
  gender: 'Female',
  specialization: 'common.specs.general', // Or simply 'General Practitioner' but we'll use translations
  experience: '15 years',
  education: 'Kyiv Medical University',
  license: 'Valid',
  workplace: 'HealthyLive Clinic',
  aboutMe: "A specialist in interpreting test results and correcting deficiencies. I'll help you understand what's going on and what to do next.",
  preferences: {
    language: 'English',
    consultationFormat: 'Online (video)',
    acceptingNewPatients: true
  },
  privacy: { faceId: true },
  avatarUrl: 'https://i.pravatar.cc/150?u=d1',
  profitThisMonth: 360,
  consultationsToday: 3
};

const mockConsultations = [
  {
    id: 'c1',
    patient: {
      id: 'p1',
      firstName: 'Olga',
      lastName: 'Golovko',
      age: 34,
      avatarUrl: 'https://i.pravatar.cc/150?u=p1',
      symptoms: 'New symptoms uploaded.',
      analyses: [
        { id: 'a1', title: 'Ferritin', value: '18 ng/ml', status: 'low', shared: true, icon: 'drops', iconColor: 'sCoral' },
        { id: 'a2', title: 'Cholesterol', value: '6.1 mmol/l', status: 'high', shared: true, icon: 'blood-analys', iconColor: 'sYell' }
      ],
      aiSummary: {
        title: 'Ferritin',
        status: 'Low',
        value: '18 ng/ml',
        normalRange: '30-400 ng/ml',
        description: 'is an important indicator of iron levels in the body.',
        insight: 'Low ferritin levels may indicate iron deficiency.',
        bullets: [
          'Iron is needed for oxygen delivery in the blood, energy, and immunity.',
          '18 ng/ml is below normal (30-400 ng/ml is normal).'
        ],
        reasons: [
          { id: 'r1', text: 'Iron deficiency (low meat, legumes, greens)', icon: 'Droplet' },
          { id: 'r2', text: 'Blood loss (menstruation, frequent blood donations)', icon: 'Droplet' },
          { id: 'r3', text: 'Pregnancy or chronic illnesses', icon: 'Droplet' }
        ]
      },
      keyPoints: ['Thyroid markers', 'Table of values']
    },
    date: getIsoDateWithOffset(0),
    time: '15:00',
    type: 'Online',
    status: 'scheduled'
  },
  {
    id: 'c2',
    patient: {
      id: 'p2',
      firstName: 'Anna',
      lastName: 'Chernova',
      age: 28,
      avatarUrl: 'https://i.pravatar.cc/150?u=p2',
    },
    date: getIsoDateWithOffset(0),
    time: '18:30',
    type: 'Online',
    status: 'scheduled'
  },
  {
    id: 'c3',
    patient: {
      id: 'p3',
      firstName: 'Petr',
      lastName: 'Dashko',
      age: 45,
      avatarUrl: 'https://i.pravatar.cc/150?u=p3',
    },
    date: getIsoDateWithOffset(0),
    time: '20:00',
    type: 'Online',
    status: 'scheduled'
  },
  {
    id: 'c4',
    patient: {
      id: 'p4',
      firstName: 'Mark',
      lastName: 'Stenko',
      age: 31,
      avatarUrl: 'https://i.pravatar.cc/150?u=p4',
    },
    date: getIsoDateWithOffset(1),
    time: '10:00',
    type: 'Online',
    status: 'scheduled'
  },
  {
    id: 'c5',
    patient: {
      id: 'p5',
      firstName: 'ALex',
      lastName: 'Repnov',
      age: 39,
      avatarUrl: 'https://i.pravatar.cc/150?u=p5',
    },
    date: getIsoDateWithOffset(1),
    time: '12:00',
    type: 'Online',
    status: 'scheduled'
  }
];

class MyDoctorProfileManager {
  constructor() {
    this.profile = doctorProfile;
    this.consultations = mockConsultations;
  }

  getDashboardData() {
    return {
      profile: this.profile,
      nextConsultation: this.consultations[0],
      consultationsTodayCount: this.profile.consultationsToday,
      profit: this.profile.profitThisMonth
    };
  }

  getGroupedConsultations() {
    const today = getIsoDateWithOffset(0).split('T')[0];
    const tomorrow = getIsoDateWithOffset(1).split('T')[0];
    
    return [
      {
        title: 'common.today',
        data: this.consultations.filter(c => c.date.startsWith(today))
      },
      {
        title: 'common.tomorrow',
        data: this.consultations.filter(c => c.date.startsWith(tomorrow))
      }
    ];
  }

  getConsultationById(id) {
    return this.consultations.find(c => c.id === id);
  }
}

export const myDoctorProfileManager = new MyDoctorProfileManager();
