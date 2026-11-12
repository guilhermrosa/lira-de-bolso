# Lira de Bolso

Lira de cordas dedilhadas sintetizada no navegador, sem nenhum arquivo de áudio. O timbre vai de lira orgânica a chiptune, com escalas de sonoridade antiga e música gerada na hora.

**Tocar:** https://guilhermrosa.github.io/lira-de-bolso/ (depois de ativar o GitHub Pages, veja abaixo)

## O que dá para fazer

- **Tocar:** 15 cordas, de Ré grave a Ré agudo. Toque uma ou arraste o dedo para dedilhar várias; no computador, as teclas Z a P também tocam. Ajuste o timbre (presets e controles de caráter, brilho, sustentação e eco) e escolha a escala (Dórico, Frígio, Mixolídio, Pentatônica ou Jônio).
- **Gravar em camadas:** grave uma melodia para criar um loop e grave novas camadas por cima, ouvindo as anteriores. Dá para silenciar camadas, desfazer, limpar, salvar gravações com nome no aparelho e **baixar como arquivo de áudio** (no celular, abre o compartilhar, para mandar pelo WhatsApp, por exemplo).
- **Relaxar:** música calma gerada na hora, com timer que diminui o volume no último minuto.
- **Memória:** jogo de memória musical; a frase cresce uma nota a cada acerto.
- **Canções:** melodias de domínio público e as suas gravações salvas, para ouvir ou tocar junto, com a próxima corda acesa.

Os ajustes e as gravações ficam salvos no aparelho.

## Instalar como app

- **Android (Chrome):** menu ⋮ → "Instalar app" ou "Adicionar à tela inicial".
- **iPhone (Safari):** Compartilhar → "Adicionar à Tela de Início".

Depois de instalado, funciona offline.

## Como o som é feito

Cada nota é uma corda simulada pelo algoritmo Karplus–Strong: um ruído curto circula num buffer do tamanho de um período da nota e é suavizado a cada volta, como uma corda que perde energia. O controle Caráter mistura o ruído com uma onda quadrada e reduz a taxa de amostragem e a resolução do som, o que dá o tom de videogame antigo. O eco passa por um filtro para soar como pedra, e não como metal.

## Estrutura

| Arquivo | O que faz |
| --- | --- |
| `index.html` | Página |
| `css/style.css` | Estilo (identidade "Cerâmica de figuras negras") |
| `docs/direcoes-visuais.md` | As três direções visuais desenhadas, com cores e fontes |
| `js/app.js` | Abas, controles de timbre e escala |
| `js/core.js` | Som, cordas na tela e ajustes salvos |
| `js/looper.js` | Gravação em camadas |
| `js/relax.js` | Modo relaxamento com timer |
| `js/learn.js` | Jogo de memória |
| `js/songs.js` | Canções para ouvir e tocar junto |
| `js/export.js` | Gera o arquivo de áudio de uma gravação |
| `js/lyre.js` | Motor de som (compartilhado com o repositório `corredor-invertido`) |
| `sw.js` | Service worker (offline) |
| `manifest.webmanifest` | Dados do app instalável |
| `tools/make_icons.py` | Gera os ícones (`python3 tools/make_icons.py`, requer Pillow) |

## Rodar localmente

```bash
python3 -m http.server 8000
```

Depois abra http://localhost:8000.

## Publicar (GitHub Pages)

Uma vez só: em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`. Cada push na `main` publica a nova versão. Ao lançar uma versão, aumente `VERSION` em `sw.js`.
