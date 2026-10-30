export default function ProjectOverview() {
  return (
    <section className="overview-section" aria-labelledby="overview-heading">
      {/* Hero */}
      <div className="hero-section">
        <div className="hero-badge">About Mentor Connect</div>
        <h1 id="overview-heading" className="hero-title">
          Empowering Students Through Meaningful Mentorship
        </h1>
        <p className="hero-subtitle">
          A centralized platform bridging ADYPU students with experienced mentors.
          Discover academic guidance, career insights, and scheduled 1-on-1 mentorship.
        </p>
      </div>

      {/* Intro Cards */}
      <div className="overview-intro-grid">
        <article className="overview-intro-card">
          <h2 className="overview-kicker">Project Introduction</h2>
          <p>
            Mentor Connect is the ADYPU capstone mentorship platform. It helps students
            find academic and industry mentors, review detailed profiles, and request
            structured 1-on-1 sessions from a single, focused workspace.
          </p>
        </article>
        <article className="overview-intro-card">
          <h2 className="overview-kicker">What This Milestone Demonstrates</h2>
          <p>
            Discovery, profile details, and a booking demo are live in the interface.
            Collaborative messaging and video meetings remain on the roadmap for a
            later milestone.
          </p>
        </article>
      </div>

      {/* Objectives */}
      <div className="objectives-section">
        <h2 className="section-title">Project Objectives</h2>
        <div className="objectives-grid">
          <article className="objective-card">
            <span className="objective-index">01</span>
            <h3>Discover the right mentor</h3>
            <p>Filter mentors by department, skills, and topics to find your ideal guide.</p>
          </article>
          <article className="objective-card">
            <span className="objective-index">02</span>
            <h3>Review credentials in context</h3>
            <p>Open a detailed view of mentor bio, expertise, and schedule preview.</p>
          </article>
          <article className="objective-card">
            <span className="objective-index">03</span>
            <h3>Request a structured session</h3>
            <p>View availability and schedule a mentorship appointment seamlessly.</p>
          </article>
          <article className="objective-card">
            <span className="objective-index">04</span>
            <h3>Collaborate after matching</h3>
            <p>Engage via direct messaging and integrated virtual video calls.</p>
          </article>
        </div>
      </div>

      {/* Milestone Timeline */}
      <div className="timeline-section">
        <h2 className="section-title">Milestone Timeline</h2>
        <ol className="milestone-timeline">
          <li className="timeline-item is-complete">
            <div className="timeline-marker" aria-hidden="true" />
            <div className="timeline-body">
              <div className="timeline-meta">
                <strong>Milestone 3A</strong>
                <span className="pillar-tag in-progress">Complete</span>
              </div>
              <h3>Mentor Discovery</h3>
              <p>Filter mentors by department, skills, and topics.</p>
              <div className="progress-track" aria-label="Progress: 100%" aria-hidden="true">
                <span className="progress-fill is-full" />
              </div>
            </div>
          </li>

          <li className="timeline-item is-complete">
            <div className="timeline-marker" aria-hidden="true" />
            <div className="timeline-body">
              <div className="timeline-meta">
                <strong>Milestone 3B</strong>
                <span className="pillar-tag in-progress">Complete</span>
              </div>
              <h3>Profile Details</h3>
              <p>Detailed view of mentor bio, credentials, expertise, and schedule preview.</p>
              <div className="progress-track" aria-label="Progress: 100%" aria-hidden="true">
                <span className="progress-fill is-full" />
              </div>
            </div>
          </li>

          <li className="timeline-item is-current">
            <div className="timeline-marker" aria-hidden="true" />
            <div className="timeline-body">
              <div className="timeline-meta">
                <strong>Milestone 3C</strong>
                <span className="pillar-tag">In Progress</span>
              </div>
              <h3>Appointment Booking</h3>
              <p>View real-time availability calendars and schedule structured sessions.</p>
              <div className="progress-track" aria-label="Progress: 62%" aria-hidden="true">
                <span className="progress-fill is-partial" />
              </div>
            </div>
          </li>

          <li className="timeline-item">
            <div className="timeline-marker" aria-hidden="true" />
            <div className="timeline-body">
              <div className="timeline-meta">
                <strong>Milestone 4</strong>
                <span className="pillar-tag">Planned</span>
              </div>
              <h3>Collaborative Meetings</h3>
              <p>Engage via direct messaging and integrated virtual video calls.</p>
              <div className="progress-track" aria-label="Progress: 0%" aria-hidden="true">
                <span className="progress-fill" />
              </div>
            </div>
          </li>
        </ol>
      </div>

      {/* Platform Architecture */}
      <div className="pillars-section">
        <h2 className="section-title">Platform Architecture &amp; Roadmap</h2>
        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon" aria-hidden="true">01</div>
            <h3>Mentor Discovery</h3>
            <p>Filter mentors by department, skills, and topics with real-time search.</p>
            <span className="pillar-tag in-progress">Milestone 3A • Complete</span>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" aria-hidden="true">02</div>
            <h3>Profile Details</h3>
            <p>Detailed view of mentor bio, credentials, expertise, and schedule preview.</p>
            <span className="pillar-tag in-progress">Milestone 3B • Complete</span>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" aria-hidden="true">03</div>
            <h3>Appointment Booking</h3>
            <p>View real-time availability calendars and schedule structured sessions.</p>
            <span className="pillar-tag">Milestone 3C • In Progress</span>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" aria-hidden="true">04</div>
            <h3>Collaborative Meetings</h3>
            <p>Engage via direct messaging and integrated virtual video calls.</p>
            <span className="pillar-tag">Milestone 4 • Planned</span>
          </div>
        </div>
      </div>
    </section>
  );
}
