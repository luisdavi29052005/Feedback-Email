import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GeneratedFeedback, Feedback } from '../types';

const generateProfilePicture = async (feedbackBody: string, senderName: string): Promise<string | null> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Com base no seguinte feedback do cliente e nome do remetente, crie uma foto de perfil adequada. 
- Se parecer uma pessoa (ex: feedback emocional sobre uma foto de família), crie uma foto de perfil realista, mas genérica e diversa (ex: um homem de 40 anos, uma jovem, uma pessoa idosa). Não faça parecer uma foto de banco de imagens.
- Se parecer uma empresa (ex: feedback sobre um logo ou banner), crie um logo simples, moderno e abstrato. O logo deve ser limpo e minimalista. **Não inclua nenhum texto no logo.**
- Nome do Remetente: "${senderName}"
- Feedback: "${feedbackBody}"

Gere uma única imagem quadrada.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating profile picture:", error);
    return null;
  }
};

const generateAttachmentImage = async (feedbackBody: string): Promise<{ url: string; name: string; } | null> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Você é um gerador de imagens de IA. Sua tarefa é criar uma foto plausível e com aparência amadora que um usuário anexaria ao seguinte e-mail.
Primeiro, analise o conteúdo do e-mail para entender o contexto.
- Se for uma solicitação B2C de edição de fotos (ex: menciona 'o rosto da minha esposa', 'minha barba', 'clarear'), gere uma foto pessoal e realista que seria o objeto de tais edições.
- Se for uma solicitação B2B (ex: menciona 'nosso site', 'o novo logo', 'fluxo de automação'), gere um ativo de negócio relevante. Para um logo, um rascunho simples. Para um site, um wireframe ou mockup básico. Para automação, um diagrama de fluxo simples. A imagem deve parecer um ponto de partida ou referência, não um produto final profissional.
- Se for uma mensagem de 'obrigado' e mencionar mostrar o resultado (ex: 'a foto restaurada na parede', 'nosso novo banner na loja'), gere uma imagem que mostre esse resultado final em contexto.

A imagem DEVE ser diretamente relevante aos detalhes específicos no e-mail. Não inclua texto ou bordas, a menos que faça parte do assunto (como em um wireframe).
Texto do e-mail: "${feedbackBody}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return { 
          url: `data:image/png;base64,${base64ImageBytes}`, 
          name: `attachment_${Date.now()}.png` 
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating attachment image:", error);
    return null;
  }
};


export const generateFeedbacks = async (
    count: number,
    b2bPercentage: number,
    requestPercentage: number,
    attachmentPercentage: number
  ): Promise<GeneratedFeedback[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const prompt = `
Você é um assistente de IA criando e-mails curtos e realistas de clientes reais para um negócio criativo chamado "Ferrer Studio".
Você precisa gerar dois tipos de e-mails em **PORTUGUÊS**: 
1. Uma resposta de agradecimento após a conclusão de um projeto. Deve ser uma resposta a um e-mail anterior.
2. Uma solicitação inicial de serviços que inclui um anexo. Este é um novo tópico de e-mail.

Seu objetivo é gerar ${count} e-mails únicos, distribuídos entre os serviços/contextos que o Ferrer Studio oferece.

**Diretrizes de Distribuição (CRÍTICO):**
- **Tipo de Cliente:** Aproximadamente **${b2bPercentage}%** dos e-mails devem ser de um contexto empresarial (B2B: Redesenho de Logo, Banners, Site, Automação) e o restante de um contexto pessoal/individual (B2C).
- **Tipo de E-mail:** Aproximadamente **${requestPercentage}%** devem ser "solicitações iniciais", e o restante deve ser "respostas de agradecimento".
- **Anexos:** Aproximadamente **${attachmentPercentage}%** do TOTAL de e-mails devem ter um anexo. "Solicitações iniciais" DEVEM ter anexos. Respostas de agradecimento podem ocasionalmente ter um se fizer sentido (ex: mostrando o resultado final em uso).

**Serviços e Contextos do Ferrer Studio:**

**Contexto B2C (Pessoal):**
1.  **Restauração de Fotos:**
    *   **Tipo:** Resposta de agradecimento.
    *   **Cenário:** Clientes emocionados com a restauração de fotos antigas e danificadas.
    *   **Foco:** Gratidão genuína, surpresa e conexão emocional.
2.  **Retratos da Era IA:**
    *   **Tipo:** Resposta de agradecimento.
    *   **Cenário:** Clientes recebem imagens geradas por IA de si mesmos em diferentes épocas. O feedback é divertido e apreciativo.
    *   **Foco:** Conexão pessoal, compartilhando a experiência com a família.
3.  **Solicitação de Edição de Foto:**
    *   **Tipo:** Solicitação inicial.
    *   **Cenário:** Um cliente envia uma foto com instruções para edições. O corpo do e-mail contém os pedidos de edição.
    *   **Foco:** O feedback deve consistir em instruções diretas e específicas.
    *   **Exemplo:** "Na foto 8, deixe minha barba mais branca. Na 10, o rosto da minha esposa não ficou bom. Talvez a foto anexa seja melhor? Na 9, clareie ambos os rostos. Estão muito sombreados."

**Contexto B2B (Empresarial):**
4.  **Redesenho de Logo:**
    *   **Tipo:** Resposta de agradecimento.
    *   **Cenário:** Donos de pequenas empresas que enviaram um esboço e estão maravilhados com o logo profissional.
    *   **Foco:** Entusiasmo e uso comercial imediato.
5.  **Banners e Artes Visuais:**
    *   **Tipo:** Resposta de agradecimento.
    *   **Cenário:** Empresas que precisam de material promocional e estão felizes com o resultado.
    *   **Foco:** Satisfação com o impacto do design.
6.  **Desenvolvimento de Site:**
    *   **Tipo:** Pode ser uma solicitação inicial ou um agradecimento.
    *   **Cenário:** Um negócio solicitando um novo site ou agradecendo pelo site recém-lançado.
    *   **Foco:** Necessidades de negócios, profissionalismo, resultados.
7.  **Automação de Processos:**
    *   **Tipo:** Resposta de agradecimento.
    *   **Cenário:** Uma empresa agradecendo pela implementação de uma automação que economizou tempo/dinheiro.
    *   **Foco:** Eficiência, gratidão pelo impacto nos negócios.

**Regras de Geração Estritas (Siga para TODOS os e-mails):**
-   **IDIOMA:** Todo o conteúdo gerado (nomes, assuntos, corpo) deve ser em **PORTUGUÊS do BRASIL**.
-   **SEM SAUDAÇÕES E SEM ASSINATURAS:** Não comece com "Oi Davi," ou termine com "Atenciosamente," "Obrigado,", etc. A mensagem deve começar e terminar com o conteúdo principal.
-   **LINGUAGEM NATURAL E HUMANA:** Mantenha-o curto (1-4 frases). Use frases coloquiais.
-   **VARIEDADE DE NOMES DE REMETENTE:** Gere nomes de remetente realistas (nomes completos, iniciais, apelidos, erros de digitação comuns).
-   **LINHAS DE ASSUNTO:** Crie um assunto de e-mail curto e plausível. Para respostas, DEVE começar com "Re: ".
-   **MENSAGENS CITADAS (Apenas Respostas):**
    *   Para os tipos "Resposta de agradecimento", você DEVE incluir um objeto \`quotedMessage\`.
    *   O remetente da mensagem citada deve ser "Ferrer Studio".
    *   Para os tipos "Solicitação inicial", \`quotedMessage\` DEVE ser nulo.
-   **IMPERFEIÇÕES E ANEXOS:**
    *   Siga as **Diretrizes de Distribuição** para anexos com precisão.
    *   Se um e-mail tiver anexos, defina \`attachmentCount.count\` para um número de 1 a 2. Caso contrário, defina como 0.
    *   Forneça também um plano para pequenas imperfeições humanas (erros de digitação, falhas de espaço).

**Formato de Saída:**
Retorne APENAS um único objeto JSON. O objeto deve ter uma chave "feedbacks" que é um array de ${count} objetos de feedback. Cada objeto deve seguir estritamente esta estrutura:
{
  "senderName": "Um nome de remetente realista.",
  "subject": "Um assunto de e-mail plausível. Deve começar com 'Re: ' para respostas.",
  "timestamp": "Um carimbo de data/hora realista e específico. Formato: 'Dia, Dia de Mês de Ano, H:MM AM/PM (tempo relativo)'. A data de hoje é ${formattedDate}. Todas as datas DEVEM ser no passado recente e não no futuro. O ano deve ser ${today.getFullYear()}.",
  "body": "O texto final do e-mail, seguindo todas as regras. O destinatário é Davi.",
  "attachmentCount": { "count": Um número de 0 a 2, com base no contexto. },
  "imperfectionsPlan": {
    "typos": { "count": Um número de 0 a 1 },
    "spaceGlitch": { "apply": um valor booleano }
  },
  "quotedMessage": { // Este campo é OBRIGATÓRIO. Deve ser NULO para solicitações iniciais.
    "sender": "Ferrer Studio",
    "date": "Uma data e hora um pouco antes do carimbo de data/hora principal.",
    "body": "Uma mensagem original curta e plausível do Ferrer Studio à qual o usuário está respondendo."
  }
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedbacks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  senderName: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  timestamp: { type: Type.STRING },
                  body: { type: Type.STRING },
                  attachmentCount: {
                    type: Type.OBJECT,
                    properties: {
                      count: { type: Type.INTEGER },
                    },
                    nullable: true,
                  },
                  imperfectionsPlan: {
                    type: Type.OBJECT,
                    properties: {
                      typos: {
                        type: Type.OBJECT,
                        properties: { count: { type: Type.INTEGER } },
                        nullable: true,
                      },
                      spaceGlitch: {
                        type: Type.OBJECT,
                        properties: { apply: { type: Type.BOOLEAN } },
                        nullable: true,
                      },
                    },
                    nullable: true,
                  },
                  quotedMessage: {
                    type: Type.OBJECT,
                    properties: {
                      sender: { type: Type.STRING },
                      date: { type: Type.STRING },
                      body: { type: Type.STRING },
                    },
                    nullable: true,
                  },
                },
                required: ["senderName", "timestamp", "body", "subject"],
              },
            },
          },
          required: ["feedbacks"],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (result.feedbacks && Array.isArray(result.feedbacks)) {
      const feedbacks: GeneratedFeedback[] = result.feedbacks;

      for (const fb of feedbacks) {
        // Generate profile picture for ~70% of feedbacks
        if (Math.random() < 0.7) { 
          const imageUrl = await generateProfilePicture(fb.body, fb.senderName);
          if (imageUrl) {
            fb.profilePictureUrl = imageUrl;
          }
        }
        
        // Generate attachments if specified
        const attachmentCount = fb.attachmentCount?.count ?? 0;
        if (attachmentCount > 0) {
          fb.attachments = [];
          for (let i = 0; i < attachmentCount; i++) {
            const attachment = await generateAttachmentImage(fb.body);
            if (attachment) {
              fb.attachments.push(attachment);
            }
          }
        }
      }
      
      return feedbacks;
    } else {
      console.error("Unexpected response structure:", result);
      throw new Error("Invalid response format from Gemini API.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate feedback from AI.");
  }
};

export const generateStoryCaption = async (feedback: Feedback): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
Você é o gerente de mídias sociais do "Ferrer Studio", um estúdio de design criativo.
Você recebeu o seguinte feedback de cliente, que será exibido como uma imagem em uma postagem de mídia social:
---
"${feedback.body.replace(/\n\n/g, ' ')}"
---
Com base neste feedback específico, escreva o texto para a postagem na mídia social. O texto DEVE ser em **PORTUGUÊS**.

**Instruções:**
- O tom deve ser de gratidão, profissional e humilde.
- Pode agradecer diretamente ao cliente se o nome dele estiver claro no feedback.
- Mantenha o texto conciso (1-2 frases).
- **Não** repita o conteúdo do feedback. Sua legenda deve adicionar contexto ou expressar gratidão.
- **Não** use hashtags ou emojis.
- Comece diretamente com o texto da legenda.

**Bom Exemplo:** "Muito feliz por podermos ajudar a trazer esta antiga memória de volta à vida. Momentos como este não têm preço."
**Outro Bom Exemplo:** "É por isso que eu amo o que faço. Muito obrigado por confiar no estúdio com seu projeto!"
**Outro Bom Exemplo referenciando um cliente:** "Obrigado, Dennis Siegel. Tenha um bom dia."
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API for caption:", error);
    throw new Error("Failed to generate story caption from AI.");
  }
};