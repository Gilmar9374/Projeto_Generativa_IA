const mensagensContainer =
    document.getElementById("mensagens");

const mensagemInput =
    document.getElementById("mensagemInput");

const botaoEnviar =
    document.getElementById("enviar");

const botaoNovaConversa =
    document.getElementById("novaConversa");

const formulario =
    document.getElementById("formulario");

const botaoTema =
    document.getElementById("tema");

const contador =
    document.getElementById("contador");


// ==========================================
// CONFIGURAÇÕES
// ==========================================

const STORAGE_KEY = "academia_brother_gil_history";
const THEME_KEY = "academia_brother_gil_theme";


// Histórico enviado para a IA

let messages = [];


// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    carregarTema();

    carregarHistorico();

    atualizarContador();

    if (messages.length === 0) {

        adicionarMensagemInicial();

    } else {

        renderizarHistorico();

    }

    mensagemInput.focus();

});


// ==========================================
// MENSAGEM INICIAL
// ==========================================

function adicionarMensagemInicial() {

    const mensagemInicial = {

        role: "assistant",

        content:
            "Olá! 👋 Sou o Gilmar, seu personal trainer virtual.\n\n" +
            "Posso ajudar com **treinos, exercícios, execução de movimentos, " +
            "equipamentos, nutrição esportiva** e informações sobre academias " +
            "em **Carapicuíba - SP**.\n\n" +
            "Como posso ajudar você hoje? 🏋️"

    };

    messages.push(mensagemInicial);

    salvarHistorico();

    renderizarHistorico();

}


// ==========================================
// ENVIAR MENSAGEM
// ==========================================

async function enviarMensagem() {

    const texto =
        mensagemInput.value.trim();


    if (!texto) {

        return;

    }


    if (botaoEnviar.disabled) {

        return;

    }


    // Adiciona usuário ao histórico

    messages.push({

        role: "user",

        content: texto

    });


    // Limpa campo

    mensagemInput.value = "";


    salvarHistorico();

    renderizarHistorico();


    // Desativa botão

    botaoEnviar.disabled = true;


    // Mostra loading

    mostrarLoading();


    try {

        /*
         * O backend espera:
         *
         * {
         *   messages: [
         *      { role: "user", content: "..." },
         *      { role: "assistant", content: "..." }
         *   ]
         * }
         */

        const resposta =
            await fetch("/chat", {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    messages: messages.map(
                        mensagem => ({

                            role: mensagem.role,

                            content: mensagem.content

                        })
                    )

                })

            });


        let dados;

        try {

            dados = await resposta.json();

        } catch {

            throw new Error(
                "O servidor retornou uma resposta inválida."
            );

        }


        if (!resposta.ok) {

            throw new Error(
                dados.error ||
                dados.response ||
                "Erro na comunicação com o servidor."
            );

        }


        const respostaIA =
            dados.response;


        if (!respostaIA) {

            throw new Error(
                "O servidor não retornou uma resposta da IA."
            );

        }


        // Remove loading

        removerLoading();


        // Adiciona resposta da IA

        messages.push({

            role: "assistant",

            content: respostaIA

        });


        salvarHistorico();

        renderizarHistorico();

    }


    catch (erro) {

        console.error(
            "Erro ao enviar mensagem:",
            erro
        );


        removerLoading();


        adicionarMensagemErro(
            "⚠️ Não foi possível conectar ao assistente. " +
            "Verifique se o servidor está funcionando e tente novamente."
        );

    }


    finally {

        botaoEnviar.disabled = false;

        mensagemInput.focus();

    }

}


// ==========================================
// FORMULÁRIO
// ==========================================

formulario.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        enviarMensagem();

    }
);


// ==========================================
// NOVA CONVERSA
// ==========================================

botaoNovaConversa.addEventListener(
    "click",
    () => {

        const confirmar =
            confirm(
                "Deseja iniciar uma nova conversa? " +
                "O histórico atual será apagado."
            );


        if (!confirmar) {

            return;

        }


        messages = [];

        salvarHistorico();

        adicionarMensagemInicial();

        mensagemInput.focus();

    }
);


// ==========================================
// TEMA
// ==========================================

botaoTema.addEventListener(
    "click",
    () => {

        const modoClaro =
            document.body.classList.toggle(
                "light-mode"
            );


        if (modoClaro) {

            localStorage.setItem(
                THEME_KEY,
                "light"
            );

            botaoTema.textContent = "☀️";

        } else {

            localStorage.setItem(
                THEME_KEY,
                "dark"
            );

            botaoTema.textContent = "🌙";

        }

    }
);


function carregarTema() {

    const tema =
        localStorage.getItem(THEME_KEY);


    if (tema === "light") {

        document.body.classList.add(
            "light-mode"
        );

        botaoTema.textContent = "☀️";

    } else {

        document.body.classList.remove(
            "light-mode"
        );

        botaoTema.textContent = "🌙";

    }

}


// ==========================================
// RENDERIZAR HISTÓRICO
// ==========================================

function renderizarHistorico() {

    mensagensContainer.innerHTML = "";


    messages.forEach(
        mensagem => {

            adicionarMensagemNaTela(
                mensagem.content,
                mensagem.role
            );

        }
    );


    atualizarContador();

}


// ==========================================
// ADICIONAR MENSAGEM NA TELA
// ==========================================

function adicionarMensagemNaTela(
    texto,
    role
) {

    const mensagem =
        document.createElement("div");


    mensagem.classList.add(
        "mensagem",
        role === "user"
            ? "usuario"
            : "ia"
    );


    const avatar =
        document.createElement("div");


    avatar.classList.add(
        "avatar"
    );


    avatar.textContent =
        role === "user"
            ? "👤"
            : "🤖";


    const conteudo =
        document.createElement("div");


    conteudo.classList.add(
        "conteudo"
    );


    if (
        role === "assistant" &&
        typeof marked !== "undefined"
    ) {

        conteudo.innerHTML =
            marked.parse(texto);

    } else {

        // textContent evita HTML enviado pelo usuário

        conteudo.textContent =
            texto;

    }


    mensagem.appendChild(avatar);

    mensagem.appendChild(conteudo);

    mensagensContainer.appendChild(
        mensagem
    );


    scrollParaFinal();

}


// ==========================================
// LOADING
// ==========================================

function mostrarLoading() {

    removerLoading();


    const mensagem =
        document.createElement("div");


    mensagem.id = "loading";

    mensagem.classList.add(
        "mensagem",
        "ia",
        "loading"
    );


    const avatar =
        document.createElement("div");


    avatar.classList.add(
        "avatar"
    );


    avatar.textContent =
        "🤖";


    const conteudo =
        document.createElement("div");


    conteudo.classList.add(
        "conteudo"
    );


    conteudo.innerHTML = `
        <span>Gilmar está pensando</span>

        <span class="dots">
            <span></span>
            <span></span>
            <span></span>
        </span>
    `;


    mensagem.appendChild(avatar);

    mensagem.appendChild(conteudo);


    mensagensContainer.appendChild(
        mensagem
    );


    scrollParaFinal();

}


// ==========================================
// REMOVER LOADING
// ==========================================

function removerLoading() {

    const loading =
        document.getElementById(
            "loading"
        );


    if (loading) {

        loading.remove();

    }

}


// ==========================================
// ERRO
// ==========================================

function adicionarMensagemErro(
    texto
) {

    const mensagemErro = {

        role: "assistant",

        content: texto

    };


    /*
     * Não adicionamos o erro ao histórico
     * enviado para a IA.
     */

    adicionarMensagemNaTela(
        mensagemErro.content,
        mensagemErro.role
    );

}


// ==========================================
// LOCAL STORAGE
// ==========================================

function salvarHistorico() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages)
    );

}


function carregarHistorico() {

    try {

        const historico =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!historico) {

            messages = [];

            return;

        }


        const dados =
            JSON.parse(historico);


        if (!Array.isArray(dados)) {

            messages = [];

            return;

        }


        /*
         * Aceita somente mensagens
         * com roles válidas.
         */

        messages =
            dados.filter(
                mensagem =>
                    mensagem &&
                    (
                        mensagem.role === "user" ||
                        mensagem.role === "assistant"
                    ) &&
                    typeof mensagem.content === "string"
            );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar histórico:",
            erro
        );

        messages = [];

    }

}


// ==========================================
// CONTADOR
// ==========================================

function atualizarContador() {

    /*
     * Conta somente mensagens enviadas
     * pelo usuário.
     */

    const quantidade =
        messages.filter(
            mensagem =>
                mensagem.role === "user"
        ).length;


    contador.textContent =
        `Mensagens: ${quantidade}`;

}


// ==========================================
// SCROLL
// ==========================================

function scrollParaFinal() {

    requestAnimationFrame(
        () => {

            mensagensContainer.scrollTop =
                mensagensContainer.scrollHeight;

        }
    );

}
