import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Settings.css'; 

const FAQ = () => {
  const navigate = useNavigate();
  
  // State to track which FAQ dropdown is currently open
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    // If clicking the one that is already open, close it. Otherwise, open the new one.
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Exact text extracted from your mockup
  const faqs = [
    {
      question: "How do I create an account?",
      answer: <p>A: To create an account, click on the "Sign Up" button on the home screen, enter your Full Name, Birthdate, Username, Email, Mobile number and Password, and follow the prompts to complete the registration.</p>
    },
    {
      question: "Didn't receive the confirmation email?",
      answer: <p>A: Check your spam or junk folder. If you still don't see the email, try resending it from the app or contact our support team.</p>
    },
    {
      question: "Change personal information?",
      answer: <p>Currently, you can only change your password. Other personal details like your name, birth date, and email cannot be changed after registration.</p>
    },
    {
      question: "What personal information do app collect?",
      answer: <p>We collect your Full Name, Birthdate, Username, Email, and Password during registration. This information is used to provide you with a personalized experience and to ensure the security of your account.</p>
    },
    {
      question: "How is data protected?",
      answer: <p>We use advanced encryption and security measures to protect your data. Additionally, we do not share your personal information with third parties without your consent, except for necessary legal purposes.</p>
    },
    {
      question: "What are Stars and Suns",
      answer: (
        <>
          <p style={{ marginBottom: '10px' }}>Stars and Suns are the currency used inside JuanCast. This is the currency to be used to vote for polls. Suns are used for major polls while Stars are used for minor polls.</p>
          <p style={{ marginBottom: '5px' }}>A: Stars are given in two ways.:</p>
          <ol style={{ paddingLeft: '20px', marginBottom: '10px' }}>
            <li style={{ marginBottom: '5px' }}>By watching ads through the JuanCast Store. Select Store {'>'} Ads {'>'} Select from the 4 boxes to opt-in. There is a 1-minute timer for every ads watched. You will be given 30 Stars for every ad that you opted in.</li>
            <li>By purchasing in the JuanCast Store. Select Store{'>'} Stars. There are packages to select from with the equivalent amount in peso. The stars will automatically be credited to your account.</li>
          </ol>
          <p>A: Convert 1 Sun into 1,800 Stars in the JuanCast Market. Select Market {'>'} Suns to convert your existing balance.</p>
        </>
      )
    }
  ];

  return (
    <div className="settings-page-wrapper" style={{ 
      height: 'calc(100vh - 100px)', 
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      boxSizing: 'border-box'
    }}>
      <div className="settings-container" style={{ 
        maxWidth: '800px', 
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '20px'
      }}>
        
        <div className="section-header" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#1e88e5' }}
          >
            ←
          </button>
          <h2 style={{ margin: 0 }}>Frequently Asked Questions</h2>
        </div>

        <div style={{ position: 'relative', width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div 
            className="settings-card hide-scrollbar" 
            style={{ 
              flexGrow: 1,
              overflowY: 'auto', 
              overscrollBehavior: 'contain',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <div 
                    className="faq-question" 
                    onClick={() => toggleAccordion(index)}
                  >
                    <span>{faq.question}</span>
                    <span className={`faq-chevron ${activeIndex === index ? 'open' : ''}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </div>
                  
                  {/* The answer is only rendered if this index matches the activeIndex */}
                  {activeIndex === index && (
                    <div className="faq-answer">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FAQ;