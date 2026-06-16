import { useState, useEffect } from 'react'
import './InterviewScheduler.css'

export default function InterviewScheduler({ 
  userType = 'candidato', 
  onScheduleInterview,
  existingInterviews = []
}) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [interviewType, setInterviewType] = useState('video')
  const [participants, setParticipants] = useState([])
  const [notes, setNotes] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [scheduledInterviews, setScheduledInterviews] = useState(existingInterviews)
  const [activeView, setActiveView] = useState('calendar')

  useEffect(() => {
    loadAvailableSlots()
  }, [selectedDate])

  const loadAvailableSlots = async () => {
    setLoadingSlots(true)
    try {
      // Simular carregamento de horários disponíveis
      const slots = generateAvailableSlots(selectedDate)
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Erro ao carregar horários:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  const generateAvailableSlots = (date) => {
    const slots = []
    const dayOfWeek = date.getDay()
    
    // Horários de trabalho (9h - 18h)
    const workHours = {
      0: [], // Domingo - não trabalha
      6: [], // Sábado - meio período
      1: [9, 10, 11, 14, 15, 16, 17, 18], // Segunda
      2: [9, 10, 11, 14, 15, 16, 17, 18], // Terça
      3: [9, 10, 11, 14, 15, 16, 17, 18], // Quarta
      4: [9, 10, 11, 14, 15, 16, 17, 18], // Quinta
      5: [9, 10, 11, 14, 15, 16, 17, 18], // Sexta
    }

    const hours = workHours[dayOfWeek] || []
    
    hours.forEach(hour => {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: Math.random() > 0.3, // 70% de disponibilidade
        type: 'standard'
      })
      
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:30`,
        available: Math.random() > 0.4, // 60% de disponibilidade
        type: 'standard'
      })
    })

    return slots
  }

  const handleDateChange = (date) => {
    setSelectedDate(new Date(date))
    setSelectedTime('')
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
  }

  const handleSchedule = () => {
    if (!selectedTime) {
      alert('Por favor, selecione um horário')
      return
    }

    const interview = {
      id: Date.now(),
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      duration: selectedDuration,
      type: interviewType,
      participants: participants,
      notes: notes,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    }

    setScheduledInterviews(prev => [...prev, interview])
    
    if (onScheduleInterview) {
      onScheduleInterview(interview)
    }

    // Reset form
    setSelectedTime('')
    setParticipants([])
    setNotes('')
  }

  const handleCancel = (interviewId) => {
    setScheduledInterviews(prev => 
      prev.map(interview => 
        interview.id === interviewId 
          ? { ...interview, status: 'cancelled' }
          : interview
      )
    )
  }

  const handleReschedule = (interviewId) => {
    const interview = scheduledInterviews.find(i => i.id === interviewId)
    if (interview) {
      setSelectedDate(new Date(interview.date))
      setSelectedTime(interview.time)
      setSelectedDuration(interview.duration)
      setInterviewType(interview.type)
      setParticipants(interview.participants || [])
      setNotes(interview.notes || '')
      
      // Remove do calendário para reagendar
      setScheduledInterviews(prev => 
        prev.filter(i => i.id !== interviewId)
      )
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Adicionar dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Adicionar dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  }

  const hasInterviewsOnDate = (day) => {
    const dateStr = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    return scheduledInterviews.some(interview => 
      interview.date === dateStr && interview.status !== 'cancelled'
    )
  }

  const formatDuration = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
    }
    return `${minutes}min`
  }

  const getInterviewTypeLabel = (type) => {
    const types = {
      video: '📹 Videoconferência',
      phone: '📞 Telefone',
      inperson: '🏢 Presencial',
      technical: '💻 Teste Técnico'
    }
    return types[type] || type
  }

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#22c55e',
      completed: '#3b82f6',
      cancelled: '#ef4444',
      pending: '#f97316'
    }
    return colors[status] || '#6b7280'
  }

  return (
    <div className="interview-scheduler">
      <div className="scheduler-header">
        <h2>📅 Agendamento de Entrevistas</h2>
        <p>Agende entrevistas de forma simples e organizada</p>
      </div>

      <div className="scheduler-tabs">
        <button 
          className={`tab-btn ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveView('calendar')}
        >
          📆 Calendário
        </button>
        <button 
          className={`tab-btn ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => setActiveView('list')}
        >
          📋 Lista
        </button>
        <button 
          className={`tab-btn ${activeView === 'new' ? 'active' : ''}`}
          onClick={() => setActiveView('new')}
        >
          ➕ Nova Entrevista
        </button>
      </div>

      {activeView === 'calendar' && (
        <div className="calendar-view">
          <div className="calendar-header">
            <button 
              className="nav-btn"
              onClick={() => {
                const newDate = new Date(selectedDate)
                newDate.setMonth(newDate.getMonth() - 1)
                handleDateChange(newDate)
              }}
            >
              ‹
            </button>
            
            <h3>
              {selectedDate.toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
            
            <button 
              className="nav-btn"
              onClick={() => {
                const newDate = new Date(selectedDate)
                newDate.setMonth(newDate.getMonth() + 1)
                handleDateChange(newDate)
              }}
            >
              ›
            </button>
          </div>

          <div className="calendar-grid">
            <div className="weekdays">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            
            <div className="days">
              {getDaysInMonth(selectedDate).map((day, index) => (
                <div 
                  key={index}
                  className={`day-cell ${day ? 'valid' : 'empty'} ${
                    day === selectedDate.getDate() ? 'selected' : ''
                  } ${hasInterviewsOnDate(day) ? 'has-interviews' : ''}`}
                  onClick={() => day && handleDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                >
                  {day && (
                    <>
                      <span className="day-number">{day}</span>
                      {hasInterviewsOnDate(day) && (
                        <div className="interview-indicator"></div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="selected-date-info">
            <h4>
              {selectedDate.toLocaleDateString('pt-BR', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h4>
            
            {loadingSlots ? (
              <div className="loading-slots">
                <div className="spinner"></div>
                <span>Carregando horários...</span>
              </div>
            ) : (
              <div className="time-slots">
                <h5>Horários Disponíveis:</h5>
                <div className="slots-grid">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      className={`slot-btn ${
                        !slot.available ? 'unavailable' : ''
                      } ${selectedTime === slot.time ? 'selected' : ''}`}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                    >
                      {slot.time}
                      {!slot.available && ' (Indisponível)'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'list' && (
        <div className="list-view">
          <div className="interviews-list">
            {scheduledInterviews.length === 0 ? (
              <div className="no-interviews">
                <div className="no-interviews-icon">📅</div>
                <h3>Nenhuma entrevista agendada</h3>
                <p>Clique em "Nova Entrevista" para agendar sua primeira entrevista</p>
              </div>
            ) : (
              scheduledInterviews
                .filter(interview => interview.status !== 'cancelled')
                .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
                .map(interview => (
                  <div key={interview.id} className="interview-card">
                    <div className="interview-header">
                      <div className="interview-datetime">
                        <h4>
                          {new Date(interview.date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </h4>
                        <span className="time">{interview.time}</span>
                        <span className="duration">{formatDuration(interview.duration)}</span>
                      </div>
                      
                      <div className="interview-type">
                        {getInterviewTypeLabel(interview.type)}
                      </div>
                    </div>
                    
                    <div className="interview-details">
                      {interview.participants && interview.participants.length > 0 && (
                        <div className="participants">
                          <strong>Participantes:</strong>
                          <div className="participant-list">
                            {interview.participants.map((participant, index) => (
                              <span key={index} className="participant">
                                {participant.name || participant}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {interview.notes && (
                        <div className="notes">
                          <strong>Notas:</strong>
                          <p>{interview.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="interview-actions">
                      <button className="reschedule-btn" onClick={() => handleReschedule(interview.id)}>
                        🔄 Reagendar
                      </button>
                      <button className="cancel-btn" onClick={() => handleCancel(interview.id)}>
                        ❌ Cancelar
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {activeView === 'new' && (
        <div className="new-interview-view">
          <div className="interview-form">
            <div className="form-section">
              <h3>📅 Data e Horário</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group">
                  <label>Horário</label>
                  <select 
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  >
                    <option value="">Selecione um horário</option>
                    {availableSlots
                      .filter(slot => slot.available)
                      .map((slot, index) => (
                        <option key={index} value={slot.time}>
                          {slot.time}
                        </option>
                      ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Duração</label>
                  <select 
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                  >
                    <option value={30}>30 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1 hora e 30 minutos</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Tipo</label>
                  <select 
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                  >
                    <option value="video">Videoconferência</option>
                    <option value="phone">Telefonica</option>
                    <option value="inperson">Presencial</option>
                    <option value="technical">Teste Técnico</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>👥 Participantes</h3>
              <div className="participants-input">
                {userType === 'empresa' && (
                  <div className="form-group">
                    <label>Candidatos</label>
                    <input
                      type="text"
                      placeholder="Adicione emails dos candidatos"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          setParticipants(prev => [...prev, { name: e.target.value.trim(), type: 'candidate' }])
                          e.target.value = ''
                        }
                      }}
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Outros Participantes</label>
                  <input
                    type="text"
                    placeholder="Adicione emails dos participantes"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        setParticipants(prev => [...prev, { name: e.target.value.trim(), type: 'other' }])
                        e.target.value = ''
                      }
                    }}
                  />
                </div>
                
                {participants.length > 0 && (
                  <div className="participants-list">
                    {participants.map((participant, index) => (
                      <div key={index} className="participant-tag">
                        <span>{participant.name}</span>
                        <button 
                          onClick={() => setParticipants(prev => prev.filter((_, i) => i !== index))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3>📝 Notas</h3>
              <div className="form-group">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione notas ou informações importantes sobre esta entrevista..."
                  rows={4}
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="schedule-btn"
                onClick={handleSchedule}
                disabled={!selectedTime}
              >
                📅 Agendar Entrevista
              </button>
              <button className="cancel-btn" onClick={() => {
                setSelectedTime('')
                setParticipants([])
                setNotes('')
              }}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
