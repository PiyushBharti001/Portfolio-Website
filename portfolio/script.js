/* ════ BACKGROUND ANIMATION ════ */
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');
let W, H, stars = [], balls = [];
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize(); window.addEventListener('resize', resize);
for (let i = 0; i < 180; i++) stars.push({ x:Math.random()*3000, y:Math.random()*3000, r:Math.random()*1.3+0.2, alpha:Math.random(), spd:Math.random()*0.006+0.002, phase:Math.random()*Math.PI*2 });
for (let i = 0; i < 7; i++) balls.push({ x:Math.random()*1800, y:Math.random()*1200, r:Math.random()*130+70, vx:(Math.random()-0.5)*0.35, vy:(Math.random()-0.5)*0.35, a:Math.random()*0.045+0.015 });
let f = 0;
function drawBg() {
  ctx.clearRect(0,0,W,H); f++;
  balls.forEach(b => {
    b.x+=b.vx; b.y+=b.vy;
    if(b.x<-b.r)b.x=W+b.r; if(b.x>W+b.r)b.x=-b.r;
    if(b.y<-b.r)b.y=H+b.r; if(b.y>H+b.r)b.y=-b.r;
    const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
    g.addColorStop(0,`rgba(225,29,72,${b.a})`); g.addColorStop(1,`rgba(225,29,72,0)`);
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
  });
  stars.forEach(s => {
    const a=0.15+0.55*(0.5+0.5*Math.sin(f*s.spd+s.phase));
    ctx.beginPath(); ctx.arc(s.x%W,s.y%H,s.r,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${a})`; ctx.fill();
  });
  requestAnimationFrame(drawBg);
}
drawBg();

/* ════ SCROLL REVEAL ════ */
const ro = new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');}),{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>ro.observe(el));

/* ════ SKILL BARS ════ */
const bo = new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.querySelectorAll('.bar-fill').forEach(b=>b.style.transform='scaleX(1)');}),{threshold:0.3});
const ss=document.querySelector('#skills'); if(ss)bo.observe(ss);

/* ════ ACTIVE NAV ════ */
const secs=document.querySelectorAll('section[id]');
const nlinks=document.querySelectorAll('.nav-links a');
window.addEventListener('scroll',()=>{
  let cur=''; secs.forEach(s=>{if(window.scrollY>=s.offsetTop-130)cur=s.id;});
  nlinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+cur));
});

/* ════ FAQ ACCORDION ════ */
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* ════ CONTACT FORM — FORMSPREE ════ */
const contactForm = document.getElementById('contact-form');
const formStatus  = document.getElementById('form-status');
const submitBtn   = document.getElementById('submit-btn');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:#fff;flex-shrink:0"><path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/></svg> Sending...';
    formStatus.className = 'form-status'; formStatus.style.display='none';
    try {
      const res = await fetch(contactForm.action, {
        method:'POST', body:new FormData(contactForm),
        headers:{ 'Accept':'application/json' }
      });
      if (res.ok) {
        formStatus.textContent = '✅ Message sent! I will get back to you soon.';
        formStatus.className = 'form-status success';
        contactForm.reset();
      } else {
        throw new Error('Form error');
      }
    } catch {
      formStatus.textContent = '❌ Failed to send. Please email me directly.';
      formStatus.className = 'form-status error';
    }
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:#fff;flex-shrink:0"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> Send Message';
  });
}

/* ════ AI CHATBOT — GEMINI ════ */

// ✏️ PASTE YOUR GEMINI API KEY HERE (get it free from https://aistudio.google.com)
const GEMINI_KEY = 'AIzaSyDnQdTWfBSseKxHdCweTuzlEGDzJAzM_Vo';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

const SYSTEM_PROMPT = `You are a helpful AI assistant on Piyush Bharti's portfolio website.
Piyush is a 2nd year BCA (Hons) student who is passionate about Data Science, SQL, Python, and Web Development.
His skills include: Python, Pandas, NumPy, Matplotlib, SQL, MySQL, HTML, CSS, JavaScript, GitHub, and Canva.
He is open to internships, freelance projects, and collaborations.
Answer questions about Piyush's skills, projects, background, and how to contact him.
Keep answers concise, friendly, and helpful. If asked something unrelated to Piyush or tech, politely redirect.`;

const chatToggle = document.getElementById('chat-toggle');
const chatBox    = document.getElementById('chat-box');
const chatMsgs   = document.getElementById('chat-messages');
const chatInput  = document.getElementById('chat-input');
const chatSend   = document.getElementById('chat-send');

// Store conversation history for Gemini format
let chatHistory = [];

function getTime() {
  return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

function addMsg(text, role) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  // Sanitize text to prevent XSS
  const safe = text.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  div.innerHTML = `<div class="msg-bubble">${safe}</div><div class="msg-time">${getTime()}</div>`;
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  return div;
}

function addTyping() {
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'typing-msg';
  div.innerHTML = `<div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typing-msg');
  if (el) el.remove();
}

// Welcome message on load
addMsg("Hi! 👋 I'm Piyush's AI assistant. Ask me about his skills, projects, availability, or anything else!", 'bot');

// Toggle chat open/close
chatToggle.addEventListener('click', () => {
  chatToggle.classList.toggle('open');
  chatBox.classList.toggle('open');
  if (chatBox.classList.contains('open')) chatInput.focus();
});

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;

  // Check API key is set
  if (GEMINI_KEY === 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
    addMsg("⚠️ API key not set yet. Please add your Gemini API key in script.js", 'bot');
    return;
  }

  chatInput.value = '';
  chatInput.style.height = 'auto';
  addMsg(text, 'user');
  chatSend.disabled = true;
  addTyping();

  // Add user message to history in Gemini format
  chatHistory.push({ role: 'user', parts: [{ text }] });

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // System instruction tells Gemini who it is
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: chatHistory,
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
        }
      })
    });

    const data = await res.json();
    removeTyping();

    // Check for API errors
    if (data.error) {
      console.error('Gemini API error:', data.error);
      const errMsg = data.error.code === 400
        ? "Invalid API key. Please check your key in script.js."
        : data.error.code === 429
        ? "Too many requests. Please wait a moment and try again."
        : `API Error: ${data.error.message}`;
      addMsg(`⚠️ ${errMsg}`, 'bot');
      chatHistory.pop(); // remove failed message from history
    } else {
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        addMsg(reply, 'bot');
        // Add assistant reply to history
        chatHistory.push({ role: 'model', parts: [{ text: reply }] });
        // Keep last 10 exchanges to avoid token overflow
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
      } else {
        addMsg("I didn't get a response. Please try asking again!", 'bot');
        chatHistory.pop();
      }
    }

  } catch (err) {
    removeTyping();
    console.error('Fetch error:', err);
    addMsg("Network error. Please check your internet connection and try again.", 'bot');
    chatHistory.pop(); // remove failed message
  }

  chatSend.disabled = false;
  chatInput.focus();
}

chatSend.addEventListener('click', sendChat);

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChat();
  }
});

// Auto-resize textarea as user types
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 80) + 'px';
});
