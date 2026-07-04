import { useState } from 'react'
import { submitInquiry } from '../../services/publicApi'
import instituteHero from './institute-hero.jpg'
import founderImg from './founder.jpg'

const CONTACT_NUMBER = '9354126619'
const WHATSAPP_NUMBER = '919354126619' // country code + number, no + or spaces
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi JSS! I'd like to know more about your coaching programs."
)
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

const courseGroups = [
  {
    title: 'School Classes',
    items: ['Nursery to Class 5 (Primary)', 'Class 6 to 8', 'Class 9 & 10 (Foundation)', 'Class 11 & 12 (All Subjects)'],
  },
  {
    title: '11th & 12th PCMB',
    items: ['Physics', 'Chemistry', 'Maths', 'Biology'],
  },
  {
    title: 'Entrance Exams',
    items: ['JEE Mains', 'JEE Advanced', 'NEET', 'IPU CET', 'AIIMS'],
  },
  {
    title: 'Other Major Exams',
    items: ['NTSE', 'NIOS', 'Olympiads', 'Scholarship Tests'],
  },
]

const features = [
  {
    title: 'Small, Focused Batches',
    desc: 'Low student-to-teacher ratio so every child gets individual attention, not lost in a crowd.',
    icon: '👥',
  },
  {
    title: 'Regular Tests & Analytics',
    desc: 'Weekly tests with detailed performance reports so you always know exactly where you stand.',
    icon: '📊',
  },
  {
    title: 'Doubt-Clearing Support',
    desc: 'Dedicated doubt sessions with subject teachers — no question goes unanswered.',
    icon: '💬',
  },
  {
    title: 'Attendance & Progress Updates',
    desc: 'Parents get regular updates on attendance and performance — full transparency, always.',
    icon: '📅',
  },
  {
    title: 'Structured Study Material',
    desc: 'Curated notes, practice sheets, and mock papers designed around the latest exam patterns.',
    icon: '📚',
  },
  {
    title: 'Experienced Mentorship',
    desc: 'Learn directly from mentors with real subject expertise and years of teaching experience.',
    icon: '🎯',
  },
]

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
    <div className="font-sans text-slate-800">
      {/* HERO */}
      {/* HERO */}
<section className="relative overflow-hidden">
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: `url(${instituteHero})` }}
  />
  <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-blue-900/80 to-orange-600/70" />

  <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-28 text-center">
    <span className="inline-flex items-center gap-2 bg-orange-500 text-white text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide">
      JSS &middot; JAI SHREE SHYAM COACHING INSTITUTE
    </span>
    <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
      Where toppers<br className="hidden sm:block" /> are made.
    </h1>
    <p className="text-blue-50 text-base sm:text-lg mb-8 max-w-xl mx-auto">
      Nursery to Class 12, Board Exams &amp; every major entrance &mdash; JEE, NEET, IPU, AIIMS, NTSE, NIOS and more, since 2008.
    </p>
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
      <a
        href="#inquiry"
        className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-900/30"
      >
        Enquire now
      </a>
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-600" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.05c-.24.68-1.4 1.3-1.93 1.38-.49.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.93 0-1.4.73-2.08 1-2.37.24-.28.53-.34.71-.34h.5c.16 0 .38-.03.58.44.24.57.79 1.98.86 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.16-.29.36-.42.48-.14.14-.28.29-.12.56.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.19-.28.37-.23.62-.14.26.09 1.62.76 1.9.9.28.14.46.21.53.33.07.13.07.72-.17 1.4z"/>
        </svg>
        WhatsApp 
      </a>
    </div>
  </div>
</section>

      {/* STATS */}
      

      {/* ABOUT */}
      <section id="about" className="max-w-6xl mx-auto py-16 px-6 sm:px-8">
  {/* Header Section */}
  <div className="text-center md:text-left mb-12">
    <span className="text-orange-500 font-semibold uppercase tracking-wider text-sm bg-orange-50 px-3 py-1 rounded-full inline-block mb-3">
      Who We Are
    </span>
    <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 tracking-tight">
      Welcome to Jai Shree Shyam (JSS) Coaching Institute
    </h2>
    <p className="mt-4 text-lg text-slate-600 max-w-3xl leading-relaxed">
      Looking for the perfect guide for your academic journey? Whether you are in Primary school or preparing for high-stakes entrance exams, JSS is your partner in excellence. <span className="font-semibold text-blue-900">We don't just teach; we mentor.</span>
    </p>
  </div>

  {/* Grid Layout for Features */}
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
    {/* Card 1 */}
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-orange-200 transition-all duration-300">
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-900 font-bold text-lg mb-4">
        01
      </div>
      <h3 className="text-xl font-bold text-blue-900 mb-2">Foundation</h3>
      <p className="text-slate-600 text-sm leading-relaxed">
        Nursery to Class 10th. Building rock-solid concepts in all subjects from the very beginning.
      </p>
    </div>

    {/* Card 2 */}
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-orange-200 transition-all duration-300">
      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-bold text-lg mb-4">
        02
      </div>
      <h3 className="text-xl font-bold text-blue-900 mb-2">Senior Secondary</h3>
      <p className="text-slate-600 text-sm leading-relaxed">
        Classes 11th & 12th. Complete core preparation for Physics, Chemistry, Maths, and Biology (PCMB).
      </p>
    </div>

    {/* Card 3 */}
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-orange-200 transition-all duration-300">
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-900 font-bold text-lg mb-4">
        03
      </div>
      <h3 className="text-xl font-bold text-blue-900 mb-2">Entrance Mastery</h3>
      <p className="text-slate-600 text-sm leading-relaxed">
        Dedicated target batches to crack high-stakes exams like JEE, NEET, IPU, and AIIMS.
      </p>
    </div>

    {/* Card 4 */}
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-orange-200 transition-all duration-300">
      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-bold text-lg mb-4">
        04
      </div>
      <h3 className="text-xl font-bold text-blue-900 mb-2">Specialized Support</h3>
      <p className="text-slate-600 text-sm leading-relaxed">
        Expert, tailored guidance for NIOS (Open Schooling) and competitive NTSE preparation.
      </p>
    </div>
  </div>

  {/* Bottom Callout */}
  {/* Bottom Callout */}
<div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 rounded-2xl text-center shadow-md">
  <p className="text-lg font-medium">
    Join <span className="text-orange-400 font-bold underline decoration-wavy decoration-orange-400">Abhay Sir</span> at JSS — where every student gets the personal attention they deserve and every dream gets the right direction.
  </p>
</div>
</section>

      {/* FOUNDER */}
      <section id="founder" className="bg-blue-900 py-20 px-6 relative overflow-hidden">
  {/* Optional: Subtle decorative background gradient for depth */}
  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-950 to-blue-900 opacity-50 pointer-events-none" />

  <div className="relative max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-10 text-center md:text-left">
    
    
    <div className="flex-shrink-0 relative group">
      <div className="absolute inset-0 bg-orange-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300" />
      
      {/* Zoom fix: Added 'overflow-hidden' so the zoomed image stays inside the circle */}
      <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-orange-500 shadow-xl overflow-hidden relative">
        <img
  src={founderImg}
  alt="Abhay Sir, Founder"
  className="w-full h-full object-cover object-[center_6%] scale-150 transition duration-350"
/>
      </div>
    </div>

    {/* Content Container */}
    <div className="flex-1">
      <span className="inline-block bg-orange-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4 shadow-sm">
        Meet Our Founder
      </span>
      
      <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
        Abhay Sir
      </h2>
      
      {/* Quick Stats / Qualifications Badge Row */}
      <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6 text-sm">
        <span className="bg-blue-800/60 text-blue-200 px-3 py-1 rounded-md border border-blue-700/50">
          <strong>Edu:</strong> B.Sc. MLT
        </span>
        <span className="bg-blue-800/60 text-blue-200 px-3 py-1 rounded-md border border-blue-700/50">
          VMMC & Safdarjung Hospital, New Delhi
        </span>
        <span className="bg-blue-800/60 text-blue-200 px-3 py-1 rounded-md border border-blue-700/50">
          <strong>Exp:</strong> 7+ Years Mentorship
        </span>
      </div>

      {/* Quote Section */}
      <div className="relative">
        <span className="absolute -top-6 -left-4 text-6xl text-blue-700/30 font-serif select-none hidden sm:inline">
          “
        </span>
        
        <p className="text-blue-100/90 leading-relaxed text-base sm:text-lg max-w-2xl italic pl-0 sm:pl-4 border-none sm:border-l-2 sm:border-orange-500/40">
          "At Jai Shree Shyam (JSS) Coaching Institute, we don’t just teach—we build medical and engineering aspirants from the ground up. Founded by Abhay Sir, who brings 7+ years of teaching experience and a strong healthcare background from VMMC & Safdarjung Hospital, JSS is built on scientific logic and personal mentorship. Having a medical stream expert at the helm ensures that our students (from Nursery to 12th, JEE, and NEET) receive the most accurate guidance, conceptual clarity, and the right strategy to crack major exams."
        </p>
      </div>
    </div>

  </div>
</section>

      
      {/* WHAT YOU GET (new section) */}
      <section id="features" className="max-w-6xl mx-auto py-16 px-6 sm:px-8">
        <div className="text-center mb-12">
          <span className="text-orange-500 font-semibold uppercase tracking-wider text-sm bg-orange-50 px-3 py-1 rounded-full inline-block mb-3">
            After You Join
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 tracking-tight">
            What you get at JSS
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Beyond the classroom — everything a student and parent need for a stress-free, transparent learning journey.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl mb-4">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">{f.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COURSES */}
      <section id="courses" className="max-w-5xl mx-auto py-16 px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2 text-center">Our courses</h2>
        <p className="text-slate-500 text-sm sm:text-base text-center mb-10">
          From Nursery to Class 12 and every major entrance exam
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {courseGroups.map((group, i) => (
            <div
              key={group.title}
              className={`rounded-2xl p-5 border ${
                i % 2 === 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'
              }`}
            >
              <h3 className="font-bold text-blue-900 mb-3">{group.title}</h3>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">&#9679;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT STRIP */}
      <section className="bg-gradient-to-r from-blue-900 to-orange-600 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-white font-semibold text-lg">Have questions? Message us directly.</p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-blue-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors whitespace-nowrap inline-flex items-center gap-2"
          >
            💬 WhatsApp {CONTACT_NUMBER}
          </a>
        </div>
      </section>

      {/* INQUIRY (functionality unchanged, colors updated) */}
      <section id="inquiry" className="py-16 px-6 bg-blue-50/40">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2 text-center">Book a free demo class</h2>
          <p className="text-slate-500 text-sm text-center mb-8">Fill the form and we will call you back</p>
          <div className="bg-white border border-blue-100 rounded-2xl p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Phone number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Course interested in</label>
                <select
                  value={form.targetCourse}
                  onChange={(e) => setForm({ ...form, targetCourse: e.target.value })}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">Select a course</option>

                
                <option value="Class 1-5">Class 1 - 5</option>
                <option value="Class 6-8">Class 6 - 8</option>
                <option value="Class 9-10">Class 9 - 10</option>
                <option value="Class 11-12">Class 11 - 12</option>

                
                <option value="JEE">JEE (Main & Advanced)</option>
                <option value="NEET">NEET</option>
                <option value="CUET">CUET</option>
                <option value="Other">Other</option>
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
                className="bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 mt-1"
              >
                {submitting ? 'Submitting...' : 'Submit enquiry'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-blue-950 text-blue-200 text-center py-6 px-6 text-sm">
        <p className="font-semibold text-white mb-1">JSS &mdash; Jai Shree Shyam Coaching Institute</p>
        <p>Founder: Abhay Sir &middot; Call: {CONTACT_NUMBER}</p>
      </footer>
    </div>
  )
}

export default LandingPage