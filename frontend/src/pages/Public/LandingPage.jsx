import { useState } from 'react'
import { submitInquiry } from '../../services/publicApi'

const LandingPage = () => {
  const [form, setForm] = useState({ name: '', phone: '', targetCourse: '' })
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus('')
    try {
      await submitInquiry(form)
      setStatus('success')
      setForm({ name: '', phone: '', targetCourse: '' })
    } catch {
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-50 to-emerald-50 py-20 px-6 text-center">
        <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full mb-4">
          Jai Shree Shyam Coaching Institute
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4 leading-tight">
          Where toppers<br />are made.
        </h1>
        <p className="text-gray-500 text-lg mb-8">JEE · NEET · Board Exam preparation since 2008</p>
        <div className="flex gap-4 justify-center">
          <a href="#inquiry" className="bg-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-800 transition-colors">
            Enquire now
          </a>
          <a href="#about" className="bg-white text-blue-700 border border-blue-200 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors">
            Learn more
          </a>
        </div>
      </section>

      <section className="grid grid-cols-3 border-b border-gray-200">
        {[
          { number: '2,400+', label: 'Students placed' },
          { number: '94%', label: 'Selection rate' },
          { number: '16 yrs', label: 'Of excellence' },
        ].map((stat) => (
          <div key={stat.label} className="py-10 text-center border-r border-gray-200 last:border-r-0">
            <div className="text-3xl font-bold text-blue-800">{stat.number}</div>
            <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      <section id="about" className="max-w-4xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About the institute</h2>
        <p className="text-gray-600 leading-relaxed">
          Jai Shree Shyam Coaching Institute has been preparing students for JEE, NEET, and Board exams
          since 2008. Our structured curriculum, experienced faculty, and personal attention to every
          student has produced hundreds of toppers across Uttar Pradesh.
        </p>
      </section>

      <section id="teachers" className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Our faculty</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Rajesh Kumar', subject: 'Physics', college: 'IIT Delhi' },
              { name: 'Sunita Mehta', subject: 'Chemistry', college: 'NIT Warangal' },
              { name: 'Amit Patel', subject: 'Mathematics', college: 'IIT Bombay' },
            ].map((teacher) => (
              <div key={teacher.name} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-sm mb-3">
                  {teacher.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                <p className="text-sm text-gray-500">{teacher.subject}</p>
                <p className="text-xs text-gray-400 mt-1">{teacher.college}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="inquiry" className="py-16 px-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Book a free demo class</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Fill the form and we will call you back</p>
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Phone number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Course interested in</label>
                <select
                  value={form.targetCourse}
                  onChange={(e) => setForm({ ...form, targetCourse: e.target.value })}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a course</option>
                  <option value="JEE Mains">JEE Mains</option>
                  <option value="JEE Advanced">JEE Advanced</option>
                  <option value="NEET">NEET</option>
                  <option value="Class 12 Boards">Class 12 Boards</option>
                  <option value="Class 11 Boards">Class 11 Boards</option>
                  <option value="Foundation">Foundation (Class 9-10)</option>
                </select>
              </div>
              {status === 'success' && (
                <p className="text-emerald-600 text-sm bg-emerald-50 px-3 py-2 rounded-lg">
                  Enquiry submitted! We will call you soon.
                </p>
              )}
              {status === 'error' && (
                <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                  Something went wrong. Please try again.
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 mt-1"
              >
                {submitting ? 'Submitting...' : 'Submit enquiry'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage