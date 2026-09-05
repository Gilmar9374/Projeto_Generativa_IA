const mensagensContainer =
    document.getElementById("mensagens");

const mensagemInput =
    document.getElementById("mensagemInput");

const botaoEnviar =
    document.getElementById("enviar");

const botaoNovaConversa =
    document.getElementById("novaConversa");


// Histórico da conversa

let messages = [];


// Função para adicionar mensagem na tela

function adicionarMensagem(texto, tipo) {

    const mensagem =
        document.createElement("div");

    mensagem.classList.add("mensagem", tipo);


    const avatar =
        document.createElement("div");

    avatar.classList.add("avatar");


    if (tipo === "usuario") {
        avatar.textContent = "👤";
    } else {
        avatar.textContent = "🤖";
    }


    const conteudo =
        document.createElement("div");

    conteudo.classList.add("conteudo");

    conteudo.textContent = texto;


    mensagem.appendChild(avatar);

    mensagem.appendChild(conteudo);


    mensagensContainer.appendChild(mensagem);


    mensagensContainer.scrollTop =
        mensagensContainer.scrollHeight;
}


// Indicador de carregamento

function mostrarLoading() {

    const loading =
        document.createElement("div");

    loading.classList.add(
        "mensagem",
        "ia",
        "loading"
    );

    loading.id = "loading";

    loading.textContent =
        "🤖 FitAI está pensando...";


    mensagensContainer.appendChild(loading);


    mensagensContainer.scrollTop =
        mensagensContainer.scrollHeight;
}


// Remover loading

function removerLoading() {

    const loading =
        document.getElementById("loading");

    if (loading) {
        loading.remove();
    }
}


// Enviar mensagem

async function enviarMensagem() {

    const texto =
        mensagemInput.value.trim();


    if (texto === "") {
        return;
    }


    // Mostrar mensagem do usuário

    adicionarMensagem(
        texto,
        "usuario"
    );


    // Adicionar ao histórico

    messages.push({
        role: "user",
        content: texto
    });


    mensagemInput.value = "";


    botaoEnviar.disabled = true;


    mostrarLoading();


    try {

        const resposta =
            await fetch(
                "http://localhost:3000/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        mensagem: texto,

                        historico: messages
                    })
                }
            );


        if (!resposta.ok) {
            throw new Error(
                "Erro na comunicação com a API"
            );
        }


        const dados =
            await resposta.json();


        removerLoading();


        adicionarMensagem(
            dados.response,
            "ia"
        );


        // Adicionar resposta da IA ao histórico

        messages.push({
            role: "assistant",
            content: dados.response
        });

    }

    catch (erro) {

        console.error(erro);


        removerLoading();


        adicionarMensagem(
            "⚠️ Não foi possível conectar ao assistente. Tente novamente.",
            "ia"
        );

    }

    finally {

        botaoEnviar.disabled = false;

        mensagemInput.focus();

    }

}


// Clique no botão

botaoEnviar.addEventListener(
    "click",
    enviarMensagem
);


// Enviar com Enter

mensagemInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            enviarMensagem();

        }

    }
);


// Nova conversa

botaoNovaConversa.addEventListener(
    "click",
    function() {

        messages = [];


        mensagensContainer.innerHTML = "";


        adicionarMensagem(
            "Olá! 👋 Nova conversa iniciada. Como posso ajudar no seu treino hoje? 💪",
            "ia"
        );

    }
);