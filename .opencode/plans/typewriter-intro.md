# Typewriter intro — cambios necesarios

## 1. `src/style.css` — reemplazar bloque intro (líneas 1211–1339)

Reemplazar desde `/* --- Entradas escalonadas lentas --- */` hasta el final del archivo con:

```css
/* --- Entradas escalonadas lentas --- */
.story-intro__subtitle,
.story-intro__btn {
  opacity: 0;
  transform: translateY(24px);
}

.story-intro__subtitle {
  animation: intro-rise 1.2s cubic-bezier(0.16, 1, 0.3, 1) 3.2s forwards;
}

.story-intro__btn {
  animation: intro-rise 1s cubic-bezier(0.16, 1, 0.3, 1) 4.2s forwards;
}

@keyframes intro-rise {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Typewriter (solo desktop) --- */
.story-intro__title {
  margin: 0;
  font-size: clamp(1.8rem, 5vw, 3rem);
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  letter-spacing: -0.025em;

  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  border-right: 2px solid rgba(255, 255, 255, 0.7);

  opacity: 1;
  transform: none;
  animation: none;

  width: 0;
  animation:
    tw-expand 2.6s steps(30, end) 0.4s forwards,
    tw-cursor 0.65s step-end infinite;
}

.story-intro__title.tw-done {
  border-right-color: transparent;
  animation: none;
  width: 100%;
}

@keyframes tw-expand {
  from { width: 0; }
  to   { width: 100%; }
}

@keyframes tw-cursor {
  50% { border-right-color: transparent; }
}

/* Mobile: revertir a fade-in normal */
@media (max-width: 520px) {
  .story-intro__title {
    white-space: normal;
    overflow: visible;
    border-right: none;
    width: auto;
    animation: intro-rise 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
    opacity: 0;
    transform: translateY(24px);
  }
  .story-intro__subtitle {
    animation-delay: 1.8s;
  }
  .story-intro__btn {
    animation-delay: 2.8s;
  }
}
```

En `/* --- Accesibilidad --- */`, cambiar:
```css
@media (prefers-reduced-motion: reduce) {
  .story-intro__title,
  .story-intro__subtitle,
  .story-intro__btn {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .story-intro__title {
    white-space: normal;
    overflow: visible;
    border-right: none;
    width: auto;
  }
  .story-intro { transition: none; }
  .story-intro__btn::before { animation: none; }
}
```

## 2. `src/app.js` — línea 500

Reemplazar:
```js
    setTimeout(() => elBtn?.classList.add('btn-ready'), 3600);
```
por:
```js
    setTimeout(() => elTitle?.classList.add('tw-done'), 3100);
    setTimeout(() => elBtn?.classList.add('btn-ready'), 5300);
```
