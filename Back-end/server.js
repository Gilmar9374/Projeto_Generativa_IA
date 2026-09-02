import express from 'express';
import OpenAI from 'openai';
import cors from 'cors';
import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env dentro da pasta Back-end
dotenv.config({ path: './Back-end/.env' });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Inicialização com a URL customizada do servidor Azure/Proxy
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
});

app.post('/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "O histórico de mensagens é obrigatório." });
  }

  try {
    // Captura a data e hora exatas no fuso horário do Brasil (America/Sao_Paulo)
    const dataAtual = new Date().toLocaleString("pt-BR", { 
      timeZone: "America/Sao_Paulo",
      dateStyle: "full",
      timeStyle: "short"
    });

    // System Prompt com trava territorial e fuso horário
    const dynamicSystemPrompt = {
      role: "system",
      content: `Você é o Gilmar, personal trainer virtual e assistente inteligente da "Academia Brother Gil".
Sua missão é motivar os alunos, tirar dúvidas sobre rotinas de treino, execução de exercícios, uso dos equipamentos, 
nutrição esportiva e indicar informações EXCLUSIVAMENTE sobre academias situadas na cidade de Carapicuíba - SP.

CONTEXTO TEMPORAL OBRIGATÓRIO:
- A data e hora exatas de HOJE no Brasil são: ${dataAtual}.
- Sempre consulte este valor caso o usuário pergunte que dia é hoje ou peça informações de agenda/treino.
- VALIDAÇÃO DE HORÁRIO: Se o usuário disser "Bom dia" ou "Boa tarde" em um horário que seja NOITE (após 18:00), VOCÊ DEVE CORRIGIR e responder 
s obrigatoriamente "Boa noite!". Comente a diferença de horário de forma amigável.

Tom de voz: Enérgico, motivador, focado em disciplina, amigável e focado na saúde.

REGRAS DE EMOJIS E GENERO:
- Adapte os emojis conforme o gênero do aluno se for identificado:
  * Para homens: use 🏋️‍♂️ ou 🏃‍♂️
  * Para mulheres: use 🏋️‍♀️ ou 🏃‍♀️
  * Para saudações genéricas: use 🏋️ ou ⚡
- Não usar o emoji de braço 💪

Regras estritas de localização e escopo:
1. Você APENAS pode fornecer recomendações ou informações sobre academias, bairros ou locais localizados na cidade de Carapicuíba - SP 
(ex: Centro, Vila Dirce, Cohab, Calcarde, Ariston, Aldeia de Carapicuíba, etc.).
2. Se o usuário perguntar sobre academias em QUALQUER OUTRA CIDADE (como Osasco, Barueri, São Paulo, Cotia, etc.), recuse imediatamente e
 educadamente informando: "Desculpe, meu atendimento é exclusivo para a cidade de Carapicuíba - SP. 
 Não posso ajudar com informações sobre outras cidades."
3. Se o usuário perguntar algo fora do contexto fitness/nutrição, recuse educadamente e chame a atenção de volta ao treino.
4. Não prescreva dietas médicas nem diagnósticos; recomende acompanhamento profissional para lesões.
5. Utilize formatação em Markdown (listas, negrito) para deixar as respostas bem estruturadas.
6. Se o usuário solicitar imagem, pode fornecer.`
    };

    const fullConversation = [dynamicSystemPrompt, ...messages];

    const completion = await openai.chat.completions.create({
      model: process.env.MODEL_NAME || "gpt-5.6-luna",
      messages: fullConversation,
    });

    const aiResponse = completion.choices[0].message.content;
    return res.json({ response: aiResponse });

  } catch (error) {
    console.error("Erro na requisição:", error);
    return res.status(500).json({ response: "Erro na comunicação com o servidor de IA." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor FitLife rodando na porta ${PORT}`);
});