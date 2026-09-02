const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const loadingElement = document.getElementById('loading');
const themeBtn = document.getElementById('theme-btn');
const clearBtn = document.getElementById('clear-btn');
const msgCounter = document.getElementById('msg-counter');

// Substitua as variáveis de histórico por:
let conversationHistory = [];
let totalMessages = 0;

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  renderHistory();
  updateCounter();
  
  // Mensagem inicial se o histórico estiver vazio
 // Mensagem inicial se o histórico estiver vazio
if (conversationHistory.length === 0) {
  const defaultMsg = {
    role: 'assistant',
    content: `Bora treinar! 
    
    Eu sou o Gilmar da Academia Brother Gil. 
    Como posso te ajudar com treinos ou academias em Carapicuíba - SP?`,
    time: getCurrentTime()
  };
    conversationHistory.push(defaultMsg);
    saveToLocalStorage();
    renderHistory();
  }
});

// SUBMIT / ENVIAR MENSAGEM (Com Enter ou clique)
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const messageText = userInput.value.trim();
  if (!messageText) return;

  const userMsg = { role: 'user', content: messageText, time: getCurrentTime() };
  conversationHistory.push(userMsg);
  totalMessages++;
  
  userInput.value = '';
  saveToLocalStorage();
  renderHistory();

  loadingElement.classList.remove('hidden');
  scrollToBottom();

  try {
    const apiPayload = conversationHistory.map(m => ({ role: m.role, content: m.content }));
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiPayload })
    });

    const data = await response.json();
    const botText = data.response || 'Não consegui obter uma resposta.';

    const botMsg = { role: 'assistant', content: botText, time: getCurrentTime() };
    conversationHistory.push(botMsg);
    totalMessages++;

    saveToLocalStorage();
    renderHistory();
  } catch (error) {
    console.error(error);
  } finally {
    loadingElement.classList.add('hidden');
    scrollToBottom();
  }
});

// RENDERIZAR MENSAGENS E MARKDOWN
function renderHistory() {
  chatMessages.querySelectorAll('.message').forEach(el => el.remove());

  conversationHistory.forEach((msg) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', msg.role);

    // Suporte a Markdown para o assistente
    const parsedContent = msg.role === 'assistant' ? marked.parse(msg.content) : msg.content;

    messageDiv.innerHTML = `
      <div class="msg-content">${parsedContent}</div>
      <div class="msg-footer">
        <span>${msg.time || ''}</span>
        ${msg.role === 'assistant' ? `<button class="copy-btn" onclick="copyText(\`${escapeQuotes(msg.content)}\`)">Copiar</button>` : ''}
      </div>
    `;

    chatMessages.insertBefore(messageDiv, loadingElement);
  });

  updateCounter();
  scrollToBottom();
}

// MODO CLARO / ESCURO
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  themeBtn.innerText = isLight ? '☀️' : '🌙';
});

// LIMPAR CONVERSA
clearBtn.addEventListener('click', () => {
  if (confirm('Deseja limpar todo o histórico de conversa?')) {
    conversationHistory = [];
    totalMessages = 0;
    localStorage.removeItem('chat_history');
    localStorage.removeItem('msg_count');
    location.reload();
  }
});

// BÔNUS & UTILITÁRIOS
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateCounter() {
  msgCounter.innerText = `Mensagens: ${totalMessages}`;
}

function saveToLocalStorage() {
  localStorage.setItem('chat_history', JSON.stringify(conversationHistory));
  localStorage.setItem('msg_count', totalMessages.toString());
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function copyText(text) {
  navigator.clipboard.writeText(text);
  alert('Mensagem copiada para a área de transferência!');
}

function escapeQuotes(str) {
  return str.replace(/`/g, '\\`').replace(/"/g, '&quot;');
}