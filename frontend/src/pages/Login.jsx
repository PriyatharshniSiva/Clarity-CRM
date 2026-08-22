import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './RobotLogin.css';

const Login = () => {
  const { user, login, logout } = useAuth();
  const { companyLogo } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const emailRef = useRef(null);
  const passRef = useRef(null);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    // The Vanilla JS animation logic
    const $ = (s) => document.querySelector(s);

    const robot = $('#robot');
    const eyes = $('#eyes');
    const bubble = $('#bubble');
    const bubbleText = $('#bubbleText');
    const meter = $('#meter');
    const meterBars = meter ? [...meter.children] : [];
    const panelLabel = $('#panelLabel');
    const emailI = $('#email');
    const passI = $('#password');
    const peekBtn = $('#togglePass');
    const btn = $('#loginBtn');
    const btnLabel = $('#btnLabel');

    if (!robot || !emailI || !passI) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    let done = false;
    let lastSaid = '';

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    function setMood(mood) {
      if (!done && robot) robot.dataset.mood = mood;
    }

    function say(text) {
      if (text === lastSaid) return;
      lastSaid = text;
      if (bubbleText) bubbleText.textContent = text;
      if (bubble) {
        bubble.classList.remove('pop');
        void bubble.offsetWidth;
        bubble.classList.add('pop');
      }
    }

    function look(x, y) {
      if (eyes) {
        eyes.style.setProperty('--lx', `${x}px`);
        eyes.style.setProperty('--ly', `${y}px`);
      }
    }

    const head3d = document.querySelector('.head3d');
    function tilt(ry, rx) {
      if (head3d) {
        head3d.style.setProperty('--ry', `${ry}deg`);
        head3d.style.setProperty('--rx', `${rx}deg`);
      }
    }

    function followTyping(input) {
      const ratio = Math.min(input.value.length / 22, 1);
      look(-6 + 12 * ratio, 5);
      tilt(-5 + 10 * ratio, -8);
    }

    function turnAway(on) {
      if (robot) robot.classList.toggle('is-turned', on);
    }

    // email
    const onEmailFocus = () => {
      turnAway(false);
      setMood('watching');
      say('User ID / Email next. I don\'t do spam.');
      followTyping(emailI);
    };
    const onEmailInput = () => {
      followTyping(emailI);
      const v = emailI.value.trim();
      if (v.length > 3) {
        setMood('happy');
        say(pick(['Now that is a proper ID.', 'Valid ID detected.']));
      } else {
        setMood('watching');
      }
    };
    emailI.addEventListener('focus', onEmailFocus);
    emailI.addEventListener('input', onEmailInput);

    // password
    const onPassFocus = () => {
      setMood('shy');
      turnAway(true);
      look(0, 0);
      tilt(0, 0);
      say("A secret? Say no more. *turns around*");
      if (panelLabel) panelLabel.textContent = 'NOT LOOKING';
    };
    const onPassBlur = (e) => {
      if (e.relatedTarget === peekBtn) return;
      turnAway(false);
    };
    const onPassInput = () => {
      const v = passI.value;
      let score = 0;
      if (v.length >= 4) score++;
      if (v.length >= 8) score++;
      if (/\d/.test(v) && /[a-zA-Z]/.test(v)) score++;
      if (/[^a-zA-Z0-9]/.test(v)) score++;
      if (v.length > 0 && score === 0) score = 1;

      if (meter) meter.dataset.lvl = score;
      meterBars.forEach((bar, i) => bar.classList.toggle('on', i < score));
      if (panelLabel) {
        panelLabel.textContent = v.length === 0
          ? 'NOT LOOKING'
          : ['NOT LOOKING', 'TOO SHORT', 'GETTING THERE', 'STRONG', 'FORT KNOX'][score];
      }
    };
    passI.addEventListener('focus', onPassFocus);
    passI.addEventListener('blur', onPassBlur);
    passI.addEventListener('input', onPassInput);

    // peek button
    const onPeekClick = () => {
      const show = passI.type === 'password';
      passI.type = show ? 'text' : 'password';
      if (peekBtn) {
        peekBtn.setAttribute('aria-pressed', String(show));
        peekBtn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      }
      if (show) say('Revealing it? Good thing I\'m facing the wall.');
      passI.focus();
    };
    if (peekBtn) peekBtn.addEventListener('click', onPeekClick);

    // button hover
    function hype(on) {
      if (done) return;
      if (on && robot.classList.contains('is-pressed')) return;
      robot.classList.toggle('is-hyped', on);
      if (on) {
        turnAway(false);
        setMood('excited');
        say(pick(['Ooh. Do it. Press it.', 'This is my favorite part.']));
      } else {
        setMood('idle');
        say('The button misses you already.');
      }
    }
    const onBtnEnter = () => hype(true);
    const onBtnLeave = () => hype(false);
    const onBtnFocus = () => hype(true);
    const onBtnBlur = () => hype(false);
    
    if (btn) {
      btn.addEventListener('mouseenter', onBtnEnter);
      btn.addEventListener('mouseleave', onBtnLeave);
      btn.addEventListener('focus', onBtnFocus);
      btn.addEventListener('blur', onBtnBlur);
    }

    let pressTimer;
    const onBtnDown = () => {
      clearTimeout(pressTimer);
      if (robot) {
        robot.classList.add('is-pressed');
        robot.dataset.mood = 'pressed';
      }
      say(pick(['Ahh. That’s the stuff.', 'Mmm. Satisfying.', 'Beep. Do that again.']));
    };
    function releasePress() {
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => {
        if (robot) {
          robot.classList.remove('is-pressed');
          if (robot.dataset.mood === 'pressed') {
            robot.dataset.mood = done ? 'success' : 'excited';
          }
        }
      }, 340);
    }
    const onBtnUp = releasePress;
    const onBtnCancel = releasePress;
    const onBtnPointerLeave = () => {
      if (robot && robot.classList.contains('is-pressed')) releasePress();
    };
    
    if (btn) {
      btn.addEventListener('pointerdown', onBtnDown);
      btn.addEventListener('pointerup', onBtnUp);
      btn.addEventListener('pointercancel', onBtnCancel);
      btn.addEventListener('pointerleave', onBtnPointerLeave);
    }

    // blinking + follow the mouse
    let blinkTimeout;
    function blinkLoop() {
      blinkTimeout = setTimeout(() => {
        if (robot && robot.dataset.mood !== 'success' && !robot.classList.contains('is-turned')) {
          if (eyes) {
            eyes.classList.add('blink');
            setTimeout(() => eyes.classList.remove('blink'), 150);
          }
        }
        blinkLoop();
      }, 2600 + Math.random() * 2600);
    }
    blinkLoop();

    let rafPending = false;
    const onMouseMove = (e) => {
      const active = document.activeElement;
      if (done || (active && active.tagName === 'INPUT')) return;
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        if (!robot) return;
        const rect = robot.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 260));
        const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 260));
        look(dx * 7, dy * 6);
        if (!robot.classList.contains('is-turned')) tilt(dx * 12, -dy * 9);
      });
    };
    document.addEventListener('mousemove', onMouseMove);

    // cleanup
    return () => {
      emailI.removeEventListener('focus', onEmailFocus);
      emailI.removeEventListener('input', onEmailInput);
      passI.removeEventListener('focus', onPassFocus);
      passI.removeEventListener('blur', onPassBlur);
      passI.removeEventListener('input', onPassInput);
      if (peekBtn) peekBtn.removeEventListener('click', onPeekClick);
      if (btn) {
        btn.removeEventListener('mouseenter', onBtnEnter);
        btn.removeEventListener('mouseleave', onBtnLeave);
        btn.removeEventListener('focus', onBtnFocus);
        btn.removeEventListener('blur', onBtnBlur);
        btn.removeEventListener('pointerdown', onBtnDown);
        btn.removeEventListener('pointerup', onBtnUp);
        btn.removeEventListener('pointercancel', onBtnCancel);
        btn.removeEventListener('pointerleave', onBtnPointerLeave);
      }
      clearTimeout(blinkTimeout);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // Form submission handled React-way
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login attempt triggered - HMR forced update');
    
    const emailI = emailRef.current;
    const passI = passRef.current;
    const form = e.currentTarget;
    const robot = document.querySelector('#robot');
    const bubbleText = document.querySelector('#bubbleText');
    const bubble = document.querySelector('#bubble');
    const btn = document.querySelector('#loginBtn');
    const btnLabel = document.querySelector('#btnLabel');
    const eyes = document.querySelector('#eyes');
    const head3d = document.querySelector('.head3d');

    const say = (text) => {
      if (bubbleText) bubbleText.textContent = text;
      if (bubble) {
        bubble.classList.remove('pop');
        void bubble.offsetWidth;
        bubble.classList.add('pop');
      }
    };
    const setMood = (mood) => {
      if (robot) robot.dataset.mood = mood;
    };
    const turnAway = (on) => {
      if (robot) robot.classList.toggle('is-turned', on);
    };

    const emailVal = emailI?.value?.trim();
    const passVal = passI?.value;

    const complaints = [];
    if (!emailVal) complaints.push(['User ID or Email is required.', emailI]);
    else if (!passVal) complaints.push(['A password would help.', passI]);

    if (complaints.length > 0) {
      const [msg, field] = complaints[0];
      setTimeout(() => { say(msg); setMood('watching'); }, 380);
      form.classList.remove('shake');
      void form.offsetWidth;
      form.classList.add('shake');
      if (field) field.focus();
      return;
    }

    setLoading(true);
    setError('');
    
    // Call backend login
    const res = await login(emailVal, passVal);
    
    if (res.success) {
      if (res.role === 'ADMIN' || res.role === 'SUPER_ADMIN') {
        logout();
        setMood('error');
        say("Admins must use the Admin Portal.");
        if (form) {
          form.classList.remove('shake');
          void form.offsetWidth;
          form.classList.add('shake');
        }
        setLoading(false);
        setTimeout(() => {
          navigate('/admin-login');
        }, 2500);
        return;
      }

      // Success animation
      turnAway(false);
      if (robot) robot.classList.remove('is-hyped');
      
      setTimeout(() => {
        if (robot) robot.dataset.mood = 'success';
        say(`Access granted. Welcome.`);
        if (btn) btn.classList.add('is-success');
        if (btnLabel) btnLabel.textContent = 'ACCESS GRANTED ✓';
        
        if (eyes) {
          eyes.style.setProperty('--lx', `0px`);
          eyes.style.setProperty('--ly', `0px`);
        }
        if (head3d) {
          head3d.style.setProperty('--ry', `0deg`);
          head3d.style.setProperty('--rx', `0deg`);
        }

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduceMotion && robot) {
          robot.classList.add('is-spinning');
          setTimeout(() => robot.classList.remove('is-spinning'), 950);
          confetti();
        }
      }, 420);

      // Navigate after animation
      setTimeout(() => {
        setLoading(false);
        navigate('/');
      }, 2500);

    } else {
      setLoading(false);
      setError(res.message);
      
      // Error animation
      setTimeout(() => { say("Login failed. Try again."); setMood('watching'); }, 380);
      form.classList.remove('shake');
      void form.offsetWidth;
      form.classList.add('shake');
      if (passI) passI.focus();
    }
  };

  function confetti() {
    const btn = document.querySelector('#loginBtn');
    const host = document.querySelector('.scene');
    if (!btn || !host) return;

    const colors = ['#ff6b4b', '#2ec4b6', '#ffc53d', '#23252d', '#fffdf8'];
    const origin = btn.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const ox = origin.left - hostRect.left + origin.width / 2;
    const oy = origin.top - hostRect.top;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    for (let i = 0; i < 70; i++) {
      const bit = document.createElement('span');
      bit.className = 'confetti';
      bit.style.background = pick(colors);
      if (Math.random() > .5) bit.style.borderRadius = '50%';
      host.appendChild(bit);

      const angle = -Math.PI / 2 + (Math.random() - .5) * 1.6;
      const speed = 240 + Math.random() * 380;
      const tx = Math.cos(angle) * speed;
      const ty = Math.sin(angle) * speed;

      bit.animate(
        [
          { transform: `translate(${ox}px, ${oy}px) rotate(0deg) scale(1)`, opacity: 1 },
          { transform: `translate(${ox + tx}px, ${oy + ty + 320}px) rotate(${540 * (Math.random() > .5 ? 1 : -1)}deg) scale(.6)`, opacity: 0 }
        ],
        { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(.15,.6,.35,1)' }
      ).onfinish = function () { bit.remove(); };
    }
  }

  return (
    <div className="robot-login-container">
      <div className="scene">
        <main className="stage" id="stage">
          <div className="robot" id="robot" data-mood="idle">
            <div className="bubble" id="bubble" role="status" aria-live="polite">
              <span id="bubbleText">Hi. I'm Volt. I guard this form.</span>
            </div>

            <div className="antenna" aria-hidden="true">
              <span className="antenna-rod"></span>
              <span className="antenna-tip"></span>
            </div>

            <div className="head3d" aria-hidden="true">
              <div className="head" id="head">
                <span className="ear ear--l"></span>
                <span className="ear ear--r"></span>

                <div className="face face--front">
                  <div className="visor">
                    <div className="eyes" id="eyes">
                      <span className="eye eye--l"></span>
                      <span className="eye eye--r"></span>
                    </div>
                    <span className="cheek cheek--l"></span>
                    <span className="cheek cheek--r"></span>
                    <span className="mouth"></span>
                  </div>
                </div>

                <div className="face face--back">
                  <div className="panel">
                    <span className="panel-lights"><i></i><i></i><i></i></span>
                    <div className="meter" id="meter">
                      <i></i><i></i><i></i><i></i>
                    </div>
                    <p className="panel-label" id="panelLabel">NOT LOOKING</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form className="card" id="form" noValidate onSubmit={handleSubmit}>
            <span className="hand hand--l" aria-hidden="true"></span>
            <span className="hand hand--r" aria-hidden="true"></span>

            <div className="flex justify-center mb-6">
              <img src={companyLogo || '/logo.png'} alt="Clarity Logo" className="h-28 w-auto mix-blend-multiply opacity-80" onError={(e) => e.target.style.display='none'} />
            </div>

            {error && (
              <div className="error-alert">
                {error}
              </div>
            )}

            <label className="field">
              <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm8 7.3L4.4 7h15.2L12 12.3ZM4 9.2V17h16V9.2l-8 5.3-8-5.3Z" />
              </svg>
              <input id="email" ref={emailRef} type="text" placeholder="Your User ID or Email" autoComplete="username" aria-label="Your email" />
            </label>

            <label className="field">
              <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3H9Zm3 4a2 2 0 0 1 1 3.7V19h-2v-1.3a2 2 0 0 1 1-3.7Z" />
              </svg>
              <input id="password" ref={passRef} type="password" placeholder="Super secret password" autoComplete="current-password"
                aria-label="Password" />
              <button className="peek" id="togglePass" type="button" aria-label="Show password" aria-pressed="false">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 5c-5 0-9.3 3.1-11 7.5C2.7 16.9 7 20 12 20s9.3-3.1 11-7.5C21.3 8.1 17 5 12 5Zm0 12.5a5 5 0 1 1 5-5 5 5 0 0 1-5 5Zm0-8a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z" />
                </svg>
              </button>
            </label>

            <button className="btn" id="loginBtn" type="submit" disabled={loading}>
              <span className="btn-bolt" aria-hidden="true">⚡</span>
              <span className="btn-label" id="btnLabel">{loading ? 'LOGGING IN...' : 'LOG ME IN'}</span>
            </button>

            <span className="foot foot--l" aria-hidden="true"></span>
            <span className="foot foot--r" aria-hidden="true"></span>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Login;
