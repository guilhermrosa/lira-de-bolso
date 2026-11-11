# Lira de Bolso

Lira de cordas dedilhadas sintetizada no navegador, sem nenhum arquivo de áudio. O timbre vai de lira orgânica a chiptune, com escalas de sonoridade antiga e música gerada na hora.

**Tocar:** https://guilhermrosa.github.io/lira-de-bolso/ (depois de ativar o GitHub Pages, veja abaixo)

## O que dá para fazer

- **Tocar as cordas:** 15 cordas, de Ré grave a Ré agudo. Toque uma, ou arraste o dedo para dedilhar várias. No computador, as teclas Z a P também tocam.
- **Ajustar o timbre:** presets Ruína, Lira, Lira 8-bit, Harpa clara e Chip puro, mais os controles Caráter (orgânico ↔ chiptune), Brilho, Sustentação e Eco.
- **Escolher a escala:** Dórico, Frígio, Mixolídio ou Pentatônica.
- **Música contínua:** melodia gerada na hora, sempre diferente.

Os ajustes ficam salvos no aparelho.

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
| `css/style.css` | Estilo (claro e escuro) |
| `js/app.js` | Cordas, controles, música e ajustes salvos |
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
