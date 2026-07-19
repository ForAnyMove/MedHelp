import { useState } from 'react';

export default function doctorHistoryManager(setAppLoading, session, refreshSessionToken) {
    const [consultations, setConsultations] = useState([]);
    const [patients, setPatients] = useState([]);
    const [upcomingConsultations, setUpcomingConsultations] = useState([]);
    const [pastConsultations, setPastConsultations] = useState([]);
    const [loading, setLoading] = useState(false);

    const getConsultations = async () => {
        setLoading(true);
        try {
            const response = await fetchWithAuth('/doctor-history/consultations', { session });
            setConsultations(response);
        } catch (error) {
            console.error('Error fetching consultations:', error);
        } finally {
            setLoading(false);
        }
        return response;
    };

    const getAnalyses = async () => {
        setAppLoading(true);
        const response = await fetchWithAuth('/doctor-history/analyses', { session });
        setAppLoading(false);
        return response;
    };

    return {
        getConsultations,
        getAnalyses,
    };
}
