Codigo para enviar notificaciones push: 
fetch('http://localhost:5000/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '69763b06fb27d7b2521b5672',
    title: '🎉 ¡Notificación de Prueba!',
    body: '¡Las notificaciones funcionan! 💪',
    url: '/'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Resultado:', d))
.catch(e => console.error('❌ Error:', e));