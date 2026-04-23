import React from 'react'
import ReactDOM from 'react-dom/client'
import { getTodayAppointments } from './services/appointmentService'

// تجربة سريعة عشان تطمني إن شغلك في الـ Service صح
getTodayAppointments('ID_دكتور_حقيقي').then(data => {
    console.log("البيانات وصلت من Supabase:", data);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <h1> بجرب الـ Service </h1>
)