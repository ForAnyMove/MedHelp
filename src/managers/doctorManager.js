import { useState, useCallback } from 'react';

/**
 * Manager for Doctor Profiles and Booking Flow
 */
export default function doctorManager(consultationController, setAppLoading) {
  const [doctors, setDoctors] = useState([]);
  const [currentDoctorView, setCurrentDoctorView] = useState('list'); // 'list', 'profile', 'summary'
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({ dates: [], times: [] });
  const [selectedSlot, setSelectedSlot] = useState({ date: null, time: null });

  // Mock data for initial state
  const mockDoctors = [
    {
      id: 'd1',
      firstName: 'Bogdan',
      lastName: 'Rarog',
      specialization: 'specializations.cardiologist',
      description: 'A specialist in heart health and cardiovascular systems. Expert in managing hypertension and cholesterol.',
      rating: 4.8,
      reviewsCount: 120,
      experience: 10,
      price: 25,
      avatarUrl: null, // Should show initials B.R.
      isVip: true,
    },
    {
      id: 'd2',
      firstName: 'Olena',
      lastName: 'Shevchenko',
      specialization: 'specializations.general_practitioner',
      description: 'Experienced in family medicine and pediatric care. Focuses on preventative health and wellness.',
      rating: 4.8,
      reviewsCount: 120,
      experience: 10,
      price: 25,
      avatarUrl: null, // Should show O.S.
      isVip: false,
    },
    {
      id: 'd3',
      firstName: 'Maria',
      lastName: 'Chernenko',
      specialization: 'specializations.neurologist',
      description: 'Specializes in central nervous system disorders and chronic pain management.',
      rating: 4.9,
      reviewsCount: 20,
      experience: 10,
      price: 30,
      avatarUrl: null, // Should show M.C.
      isVip: false,
    },
    {
      id: 'd4',
      firstName: 'Petr',
      lastName: 'Gorenko',
      specialization: 'specializations.dermatologist',
      description: 'Expert in skin health, allergology and aesthetic dermatology.',
      rating: 4.7,
      reviewsCount: 201,
      experience: 12,
      price: 35,
      avatarUrl: null, // Should show P.G.
      isVip: false,
    }
  ];

  const fetchDoctors = useCallback(async () => {
    setAppLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setDoctors(mockDoctors);
    setAppLoading(false);
  }, [setAppLoading]);

  const getAvailableSlots = useCallback(async (doctorId) => {
    setAppLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const today = new Date();
    const dates = [];
    
    // Generate next 14 days
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      // Simulate non-working days (e.g., weekends for some doctors)
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (doctorId === 'd2' && isWeekend) continue; // Dr. Olena doesn't work weekends

      dates.push({
        id: `t${i}`,
        label: i === 0 ? 'common.today' : (i === 1 ? 'common.tomorrow' : null), // null label means use weekday formatting in component
        date: d.toISOString(),
        fullDate: d.toISOString().split('T')[0]
      });
    }
    
    const allTimes = [
      '09:00', '09:30', '10:00', '10:30', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00',
      '17:00', '18:00', '19:00', '20:00', '20:30'
    ];

    // Per-doctor / Per-day randomization of available times
    // In a real app, this comes filtered from the server
    const times = allTimes; // We'll filter these in the UI or here

    setAvailableSlots({ dates, times });
    setAppLoading(false);
  }, [setAppLoading]);

  const selectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentDoctorView('profile');
    getAvailableSlots(doctor.id);
  };

  const selectSlot = (date, time) => {
    setSelectedSlot({ date, time });
  };

  const navigateToSummary = () => {
    if (selectedSlot.date && selectedSlot.time) {
      setCurrentDoctorView('summary');
    }
  };

  const confirmBooking = async () => {
    setAppLoading(true);
    // Simulate API call to save booking
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const booking = {
      id: Math.random().toString(36).substr(2, 9),
      doctor: selectedDoctor,
      slot: selectedSlot,
      createdAt: new Date().toISOString(),
      status: 'upcoming'
    };

    // Save to consultation manager
    if (consultationController.addBooking) {
      consultationController.addBooking(booking);
    } else {
      console.log('Consultation manager does not have addBooking, saving locally for now', booking);
    }

    setAppLoading(false);
    setCurrentDoctorView('list');
    setSelectedDoctor(null);
    setSelectedSlot({ date: null, time: null });
  };

  const goBack = () => {
    if (currentDoctorView === 'summary') {
      setCurrentDoctorView('profile');
    } else if (currentDoctorView === 'profile') {
      setCurrentDoctorView('list');
      setSelectedDoctor(null);
    }
  };

  return {
    doctors,
    recommendedDoctors: doctors.filter(d => d.isVip),
    regularDoctors: doctors.filter(d => !d.isVip),
    currentDoctorView,
    selectedDoctor,
    availableSlots,
    selectedSlot,
    fetchDoctors,
    selectDoctor,
    selectSlot,
    navigateToSummary,
    confirmBooking,
    goBack,
  };
}
