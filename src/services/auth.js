import api from './api';

export async function sendOtp(email, purpose = 'signin') {
    const res = await api.post('/auth/send-otp', { email, purpose });
    return res.data;
}

export async function verifyOtp(email, code, purpose = 'signin') {
    const res = await api.post('/auth/verify-otp', { email, code, purpose });
    return res.data;
}
